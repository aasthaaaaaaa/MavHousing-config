import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { HousingService } from '../housing/housing.service';
import { EmailService } from '../../../comms-server/src/email/email.service';
const PDFDocument = require('pdfkit');
import { Buffer } from 'buffer';

@Processor('occupancy-report')
export class OccupancyReportProcessor extends WorkerHost {
  private readonly logger = new Logger(OccupancyReportProcessor.name);

  constructor(
    private readonly housingService: HousingService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Generating occupancy report...`);

    try {
      const stats = await this.housingService.getOccupancyStats();
      const now = new Date();
      
      // Format: YYYY-MM-DD
      const dateStr = now.toISOString().split('T')[0];
      // Format: HH-mm-ss
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      
      const filename = `Occupancy_${dateStr}_${timeStr}_admin.pdf`;

      // Generate PDF in memory
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // PDF Content
        doc.fontSize(20).text('MavHousing Occupancy Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${now.toLocaleString()}`);
        doc.moveDown();

        // System Overview
        doc.fontSize(16).text('System Overview', { underline: true });
        doc.fontSize(12);
        doc.text(`Total Capacity: ${stats.overview.totalCapacity}`);
        doc.text(`Occupied Beds: ${stats.overview.occupiedBeds}`);
        doc.text(`Vacant Beds: ${stats.overview.vacantBeds}`);
        doc.text(`Vacancy Rate: ${stats.overview.vacancyRate}%`);
        doc.moveDown();

        // Property Breakdown
        doc.fontSize(16).text('Property Breakdown', { underline: true });
        doc.moveDown();

        stats.properties.forEach((prop) => {
          doc.fontSize(14).text(prop.propertyName);
          doc.fontSize(10);
          doc.text(`Type: ${prop.propertyType}`);
          doc.text(`Capacity: ${prop.totalCapacity}`);
          doc.text(`Occupied: ${prop.occupiedBeds}`);
          doc.text(`Vacant: ${prop.vacantBeds}`);
          doc.text(`Vacancy Rate: ${prop.vacancyRate}%`);
          doc.moveDown(0.5);
        });

        doc.end();
      });

      // Email the PDF
      const emailResult = await this.emailService.sendEmailWithAttachment(
        'axjh03@gmail.com',
        `Occupancy Report - ${dateStr}`,
        `<p>Please find the attached occupancy report generated on ${now.toLocaleString()}.</p>`,
        {
          filename,
          content: pdfBuffer,
        },
      );

      this.logger.log(`Report generated and emailed: ${emailResult.message}`);
      return { filename, emailStatus: emailResult.success };
    } catch (error) {
      this.logger.error(`Failed to generate occupancy report: ${error.message}`);
      throw error;
    }
  }
}
