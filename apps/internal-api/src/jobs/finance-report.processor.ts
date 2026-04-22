import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';
import { EmailService } from '../../../comms-server/src/email/email.service';
import PDFDocument = require('pdfkit');
import { Buffer } from 'buffer';

interface FinanceJobData {
  netId?: string;
  sortBy?: 'person' | 'date';
}

@Processor('finance-reports')
export class FinanceReportProcessor extends WorkerHost {
  private readonly logger = new Logger(FinanceReportProcessor.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<FinanceJobData, any, string>): Promise<any> {
    const { netId, sortBy } = job.data || {};
    this.logger.log(`Generating Financial Summary report... Options: NetID=${netId || 'ALL'}, SortBy=${sortBy || 'date'}`);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `FinancialReport_${netId || 'all'}_${dateStr}_admin.pdf`;

    try {
      let payments = netId 
        ? await this.paymentService.getPaymentsByNetId(netId)
        : await this.paymentService.getAllPayments();

      const stats = await this.paymentService.getPaymentStats();

      // --- 1. SORTING LOGIC ---
      if (sortBy === 'person') {
        payments = (payments as any[]).sort((a, b) => {
          const nameA = `${a.lease.user.lName}, ${a.lease.user.fName}`;
          const nameB = `${b.lease.user.lName}, ${b.lease.user.fName}`;
          return nameA.localeCompare(nameB);
        });
      } else {
        // Default: newest first
        payments = (payments as any[]).sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
      }

      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Colors
        const primary = '#0064B1';
        const gray = '#F3F4F6';

        // Header
        doc.rect(0, 0, doc.page.width, 70).fill(primary);
        doc.fillColor('white').fontSize(22).text('MAV HOUSING ADMIN', 40, 20);
        const subtitle = netId ? `FINANCIAL AUDIT: ${netId}` : 'GENERAL FINANCIAL SUMMARY';
        doc.fontSize(9).text(subtitle.toUpperCase(), 42, 50);
        doc.fontSize(8).text(`Generated: ${now.toLocaleString()}`, doc.page.width - 180, 25, { align: 'right', width: 140 });

        // Stats Card (Only for "All" reports normally, but helpful either way)
        doc.rect(40, 90, 515, 60).fill(gray);
        doc.fillColor(primary).fontSize(10).font('Helvetica-Bold').text(`PAYMENTS`, 60, 105);
        
        let statsText = `Collection Rate: ${stats.collectionRate}% | Total Transactions: ${stats.totalPayments}`;
        if (netId && payments.length > 0) {
            const totalPaid = (payments as any[]).reduce((sum, p) => sum + Number(p.amountPaid), 0);
            statsText = `Student: ${payments[0].lease.user.fName} ${payments[0].lease.user.lName} | Total Paid: $${totalPaid.toFixed(2)}`;
        }
        doc.fillColor('#374151').fontSize(12).font('Helvetica').text(statsText, 60, 125);

        // Transaction Table
        let y = 170;
        doc.rect(40, y, 515, 20).fill(primary);
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
        doc.text('DATE', 50, y + 6);
        doc.text('STUDENT (NETID)', 130, y + 6);
        doc.text('AMOUNT', 280, y + 6);
        doc.text('METHOD', 360, y + 6);
        doc.text('STATUS', 460, y + 6);
        
        y += 20;
        doc.font('Helvetica');

        payments.forEach((p: any, i) => {
          if (y > 750) { doc.addPage(); y = 40; }
          
          if (i % 2 === 0) doc.rect(40, y, 515, 18).fill('#F9FAFB');
          
          doc.fillColor('#374151').fontSize(7);
          doc.text(p.transactionDate.toLocaleDateString(), 50, y + 5);
          doc.text(`${p.lease.user.fName} ${p.lease.user.lName} (${p.lease.user.netId})`, 130, y + 5);
          doc.text(`$${p.amountPaid}`, 280, y + 5);
          doc.text(p.method, 360, y + 5);
          
          doc.fillColor(p.isSuccessful ? '#059669' : '#EF4444')
             .font('Helvetica-Bold')
             .text(p.isSuccessful ? 'SUCCESS' : 'FAILED', 460, y + 5);
          doc.font('Helvetica');

          y += 18;
        });

        if (payments.length === 0) {
            doc.fillColor('#6B7280').text('No payment records found for this criteria.', 40, y + 20);
        }

        doc.end();
      });

      await this.emailService.sendEmailWithAttachment(
        'dev@mavhousing.xyz',
        `Admin Report: FINANCIAL AUDIT - ${netId || 'ALL'}`,
        `<p>Attached is the requested financial report. </p>
         <p><strong>Parameters:</strong><br>
         - Target Student: ${netId || 'Every Student'}<br>
         - Sorted By: ${sortBy || 'Transaction Date'}</p>`,
        { filename, content: pdfBuffer },
      );

      return { success: true, filename };
    } catch (error) {
      this.logger.error(`Failed to generate financial report: ${error.message}`);
      throw error;
    }
  }
}
