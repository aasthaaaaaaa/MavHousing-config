import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { HousingService } from '../housing/housing.service';
import { EmailService } from '../../../comms-server/src/email/email.service';
import PDFDocument = require('pdfkit');
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
    this.logger.log(`Generating beautiful occupancy report...`);

    try {
      const stats = await this.housingService.getOccupancyStats();
      const now = new Date();
      
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `Occupancy_${dateStr}_${timeStr}_admin.pdf`;

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: 'Occupancy Report',
            Author: 'MavHousing System',
          }
        });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // Colors
        const primaryColor = '#0064B1'; // UTA Blue
        const secondaryColor = '#F58025'; // UTA Orange
        const grayColor = '#F3F4F6';
        const textGray = '#4B5563';

        // --- Header Section ---
        doc.rect(0, 0, 595.28, 80).fill(primaryColor);
        doc.fillColor('white')
           .fontSize(24)
           .text('MAV HOUSING', 50, 25, { characterSpacing: 2 })
           .fontSize(10)
           .text('OCCUPANCY & CAPACITY REPORT', 52, 55, { characterSpacing: 1 });
        
        doc.fillColor('white')
           .fontSize(10)
           .text(`Period: ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`, 400, 35, { align: 'right' });

        doc.moveDown(4);

        // --- Summary Cards ---
        const startX = 50;
        const cardWidth = 150;
        const cardHeight = 70;
        const spacing = 20;

        const summaryItems = [
          { label: 'TOTAL CAPACITY', value: stats.overview.totalCapacity, color: primaryColor },
          { label: 'OCCUPIED BEDS', value: stats.overview.occupiedBeds, color: '#10B981' }, // Green
          { label: 'VACANCY RATE', value: `${stats.overview.vacancyRate}%`, color: secondaryColor },
        ];

        summaryItems.forEach((item, i) => {
          const x = startX + i * (cardWidth + spacing);
          const y = 110;
          
          doc.rect(x, y, cardWidth, cardHeight).fill(grayColor);
          doc.fillColor(item.color).fontSize(18).text(item.value.toString(), x + 15, y + 15);
          doc.fillColor(textGray).fontSize(8).text(item.label, x + 15, y + 45);
        });

        doc.moveDown(6);

        // --- Vacancy Rate Graph ---
        doc.fillColor(primaryColor).fontSize(16).text('Vacancy Rates by Property (%)', 50, 210);
        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, 230).lineTo(545, 230).stroke();
        
        const chartY = 380;
        const chartHeight = 130;
        const barWidth = 40;
        const chartSpacing = 30;

        stats.properties.forEach((prop, i) => {
          const x = 70 + i * (barWidth + chartSpacing);
          const barH = (prop.vacancyRate / 100) * chartHeight;
          const cappedBarH = Math.max(2, barH); // Min height 2px

          // Draw Bar
          doc.rect(x, chartY - cappedBarH, barWidth, cappedBarH).fill(secondaryColor);
          
          // Label inside bar if enough space, else above
          doc.fillColor(textGray).fontSize(8).text(`${prop.vacancyRate}%`, x, chartY - cappedBarH - 12, { width: barWidth, align: 'center' });
          
          // Property Name (Rotated)
          doc.save();
          doc.translate(x + barWidth/2, chartY + 10);
          doc.rotate(45);
          doc.fillColor(textGray).fontSize(7).text(prop.propertyName, 0, 0, { width: 80 });
          doc.restore();
        });

        doc.moveDown(15);

        // --- Detailed Table ---
        doc.fillColor(primaryColor).fontSize(16).text('Detailed Breakdown', 50, 480);
        doc.moveDown(1);

        // Table Header
        const tableY = 510;
        doc.rect(50, tableY, 495, 20).fill(primaryColor);
        doc.fillColor('white').fontSize(9);
        doc.text('PROPERTY NAME', 60, tableY + 6);
        doc.text('TYPE', 220, tableY + 6);
        doc.text('CAPACITY', 320, tableY + 6);
        doc.text('OCCUPIED', 400, tableY + 6);
        doc.text('VACANT', 480, tableY + 6);

        // Table Rows
        let rowY = tableY + 20;
        stats.properties.forEach((prop, i) => {
          if (i % 2 === 0) {
            doc.rect(50, rowY, 495, 20).fill('#F9FAFB');
          }
          doc.fillColor(textGray).fontSize(8);
          doc.text(prop.propertyName, 60, rowY + 6);
          doc.text(prop.propertyType, 220, rowY + 6);
          doc.text(prop.totalCapacity.toString(), 320, rowY + 6);
          doc.text(prop.occupiedBeds.toString(), 400, rowY + 6);
          doc.text(prop.vacantBeds.toString(), 480, rowY + 6);
          rowY += 20;
        });

        // --- Footer ---
        const pageCount = doc.bufferedPageRange().count;
        doc.fontSize(8).fillColor('#9CA3AF').text(`© ${now.getFullYear()} MavHousing Administrative Services - Confidiential Report`, 50, 780, { align: 'center' });

        doc.end();
      });

      // Email the PDF
      const emailResult = await this.emailService.sendEmailWithAttachment(
        'axjh03@gmail.com',
        `Monthly Occupancy Report - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        `<html>
           <body style="font-family: Arial, sans-serif; color: #333;">
             <h2 style="color: #0064B1;">MavHousing Occupancy Report</h2>
             <p>Hello Admin,</p>
             <p>Attached is the beautiful automated occupancy report for <strong>${now.toLocaleString('default', { month: 'long', year: 'numeric' })}</strong>.</p>
             <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
               <p style="margin: 5px 0;"><strong>System Vacancy:</strong> ${stats.overview.vacancyRate}%</p>
               <p style="margin: 5px 0;"><strong>Total Beds:</strong> ${stats.overview.totalCapacity}</p>
             </div>
             <p>You can also view real-time stats anytime in the <a href="http://localhost:3000/admin/occupancy">Admin Dashboard</a>.</p>
             <br/>
             <p style="font-size: 12px; color: #666;">This is an automated report generated by BullMQ.</p>
           </body>
         </html>`,
        {
          filename,
          content: pdfBuffer,
        },
      );

      this.logger.log(`Beautiful report generated and emailed: ${emailResult.message}`);
      return { filename, emailStatus: emailResult.success };
    } catch (error) {
      this.logger.error(`Failed to generate occupancy report: ${error.message}`);
      throw error;
    }
  }
}
