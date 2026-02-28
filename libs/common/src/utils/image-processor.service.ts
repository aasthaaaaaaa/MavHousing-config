import { Injectable } from '@nestjs/common';
const sharp = require('sharp');

@Injectable()
export class ImageProcessorService {
  /**
   * Compresses an image buffer
   * @param buffer The image buffer to compress
   * @param quality Quality of the compression (1-100)
   * @param maxWidth Optional maximum width
   * @returns Compressed image buffer
   */
  async compress(
    buffer: Buffer,
    quality: number = 80,
    maxWidth: number = 1200,
  ): Promise<Buffer> {
    let pipeline = sharp(buffer);
    const metadata = await pipeline.metadata();

    // Resize if it's too large
    if (metadata.width && metadata.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth);
    }

    // Compress based on format
    if (metadata.format === 'png') {
      return pipeline.png({ quality, compressionLevel: 8 }).toBuffer();
    } else if (metadata.format === 'webp') {
      return pipeline.webp({ quality }).toBuffer();
    } else {
      // Default to JPEG for others
      return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    }
  }

  /**
   * Compresses and converts to a specific format
   */
  async compressToFormat(
    buffer: Buffer,
    format: 'jpeg' | 'png' | 'webp',
    quality: number = 80,
  ): Promise<Buffer> {
    const pipeline = sharp(buffer);

    switch (format) {
      case 'png':
        return pipeline.png({ quality, compressionLevel: 8 }).toBuffer();
      case 'webp':
        return pipeline.webp({ quality }).toBuffer();
      default:
        return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    }
  }
}
