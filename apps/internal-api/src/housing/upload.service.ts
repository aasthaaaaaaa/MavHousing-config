import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GoogleGenerativeAI } from '@google/generative-ai';
const sharp = require('sharp');
import * as faceapi from '@vladmandic/face-api';
import { Canvas, Image, ImageData } from 'canvas';
import * as path from 'path';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IdCardOcrDto } from './dto/id-card-ocr.dto';
import { ImageProcessorService } from '@libs/common';

// Patch Node.js environment for face-api
faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as any);

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client;
  private genAI: GoogleGenerativeAI;

  constructor(
    private configService: ConfigService,
    private imageProcessor: ImageProcessorService,
  ) {
    const accountId = this.configService.get<string>('R3_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R3_SECRET_ACCESS_KEY',
    );

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
      forcePathStyle: true,
    });

    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(geminiApiKey as string);
  }

  async onModuleInit() {
    try {
      const modelsPath = path.join(process.cwd(), 'apps/internal-api/models');
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
      this.logger.log('Face detection models loaded successfully');
    } catch (e) {
      this.logger.error('Failed to load face-api models', e);
    }
  }

  async uploadFileToR2(
    fileBuffer: Buffer,
    fileName: string,
    bucket: string,
    contentType: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      // Generate a presigned URL for GETting the file
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: fileName,
      });
      const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn: 3600 * 24 * 7,
      }); // 1 week
      return signedUrl;
    } catch (error) {
      this.logger.error(`Error uploading to R2: ${error.message}`);
      throw new HttpException(
        'Failed to upload file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async processIdCard(file: Express.Multer.File, netId: string) {
    try {
      // 0. Pre-process: Compress the image early in the pipeline
      // This saves memory and speeds up Gemini/Face-api processing
      const optimizedBuffer = await this.imageProcessor.compress(
        file.buffer,
        80,
      );

      // 1. Send optimized image to Gemini for OCR and bounding box
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      const prompt = `
        Analyze this ID card.
        1. Extract the "First Name" and "Last Name"
        2. Extract the 10-digit "Student ID" (utaId)
        3. Extract an "Email" address if present (usually looks like @mavs.uta.edu or @uta.edu)
        4. Extract a "Phone Number" if present
        
        Respond STRICTLY in JSON format:
        {
          "fName": "John",
          "lName": "Doe",
          "utaId": "1001234567",
          "email": "jd1234@mavs.uta.edu",
          "phone": "817-555-1234"
        }
        
        Rules:
        - If a field is not found, use null for everything except fName, lName, utaId.
        - The utaId should be exactly 10 digits.
        - Ensure JSON is valid.
      `;

      const imagePart = {
        inlineData: {
          data: optimizedBuffer.toString('base64'),
          mimeType: file.mimetype,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      let text = response.text();

      // Robust JSON extraction
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.error('No JSON found in Gemini response', text);
        throw new Error('OCR API failed to return valid JSON');
      }
      text = jsonMatch[0];

      let ocrData: any;
      try {
        ocrData = JSON.parse(text);

        // Validate OCR data using DTO
        const ocrInstance = plainToInstance(IdCardOcrDto, ocrData);
        const errors = await validate(ocrInstance);

        if (errors.length > 0) {
          this.logger.warn('Gemini returned invalid data structure', errors);
          // We can still try to proceed with what we have or throw error
        }

        if (ocrData.fName) {
          ocrData.fName =
            ocrData.fName.charAt(0).toUpperCase() +
            ocrData.fName.slice(1).toLowerCase();
        }
        if (ocrData.lName) {
          ocrData.lName =
            ocrData.lName.charAt(0).toUpperCase() +
            ocrData.lName.slice(1).toLowerCase();
        }
      } catch (e) {
        this.logger.error('Failed to parse or validate Gemini JSON', text);
        throw new Error('OCR API failed to return valid data');
      }

      const nameSlug = `${ocrData.fName || ''}${ocrData.lName || ''}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const userIdentifier = nameSlug || netId.toLowerCase() || 'unknown';
      const timestamp = Date.now();
      const dateStr = new Date().toISOString().split('T')[0];

      const docFileName = `${userIdentifier}_${dateStr}_${timestamp}_id.${file.mimetype.split('/')[1] || 'jpg'}`;

      // 2. Upload the already optimized document to "documents" bucket
      const docUrl = await this.uploadFileToR2(
        optimizedBuffer,
        docFileName,
        'documents',
        file.mimetype,
      );

      // 3. Crop face using face-api using optimized buffer
      let profilePicUrl = '';
      try {
        const img = new Image();
        img.src = optimizedBuffer;

        // Ensure models are loaded before inference
        if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
          const modelsPath = path.join(
            process.cwd(),
            'apps/internal-api/models',
          );
          this.logger.log(
            'Face-api models not loaded, attempting to load now...',
          );
          await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
        }

        const detections = await faceapi.detectSingleFace(img as any);

        if (detections) {
          const { x, y, width, height } = detections.box;

          // Add some padding to the crop
          const padding = 20;
          const metadata = await sharp(optimizedBuffer).metadata();
          const cropLeft = Math.max(0, Math.floor(x - padding));
          const cropTop = Math.max(0, Math.floor(y - padding));
          const cropWidth = Math.min(
            metadata.width - cropLeft,
            Math.floor(width + padding * 2),
          );
          const cropHeight = Math.min(
            metadata.height - cropTop,
            Math.floor(height + padding * 2),
          );

          const croppedBuffer = await sharp(optimizedBuffer)
            .extract({
              left: cropLeft,
              top: cropTop,
              width: cropWidth,
              height: cropHeight,
            })
            .toBuffer();

          const picFileName = `${userIdentifier}_${dateStr}_${timestamp}_profile.jpg`;
          const compressedPic = await this.imageProcessor.compress(
            croppedBuffer,
            85,
            400,
          ); // Smaller for profile
          profilePicUrl = await this.uploadFileToR2(
            compressedPic,
            picFileName,
            'userpic',
            'image/jpeg',
          );
        } else {
          // fall back to full image if no face detected
          this.logger.warn(
            'No face detected by face-api, uploading full image',
          );
          profilePicUrl = await this.uploadFileToR2(
            optimizedBuffer,
            `${userIdentifier}_${dateStr}_${timestamp}_profile.jpg`,
            'userpic',
            file.mimetype,
          );
        }
      } catch (e) {
        this.logger.error('Failed to crop face with face-api', e);
        // Fallback to full image
        profilePicUrl = await this.uploadFileToR2(
          file.buffer,
          `${netId}_${dateStr}_profile.jpg`,
          'userpic',
          file.mimetype,
        );
      }

      return {
        fName: ocrData.fName,
        lName: ocrData.lName,
        fullName: `${ocrData.fName} ${ocrData.lName}`.trim(),
        studentId: ocrData.utaId,
        utaId: ocrData.utaId,
        email: ocrData.email,
        phone: ocrData.phone,
        docUrl,
        profilePicUrl,
      };
    } catch (error) {
      this.logger.error('Error processing ID card', error);
      throw new HttpException(
        'Failed to process ID card',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
