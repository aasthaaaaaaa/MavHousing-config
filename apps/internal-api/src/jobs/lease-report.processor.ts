import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { LeaseService } from '../lease/lease.service';
import { EmailService } from '../../../comms-server/src/email/email.service';
import PDFDocument = require('pdfkit');
import { Buffer } from 'buffer';

@Processor('lease-reports')
export class LeaseReportProcessor extends WorkerHost {
  private readonly logger = new Logger(LeaseReportProcessor.name);

  constructor(
    private readonly leaseService: LeaseService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Generating Detailed Lease Inventory report...`);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `LeaseInventory_${dateStr}_admin.pdf`;

    try {
      let leases = await this.leaseService.getAllLeases();

      // --- 1. SORTING ---
      // Sort by Property Name, then Unit, then Start Date
      leases = (leases as any[]).sort((a, b) => {
        const propA = a.unit?.property?.name || '';
        const propB = b.unit?.property?.name || '';
        if (propA !== propB) return propA.localeCompare(propB);

        const unitA = a.unit?.unitNumber || '';
        const unitB = b.unit?.unitNumber || '';
        if (unitA !== unitB) return unitA.localeCompare(unitB);

        return a.startDate.getTime() - b.startDate.getTime();
      });

      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.rect(0, 0, doc.page.width, 60).fill('#0064B1');
        doc.fillColor('white').fontSize(18).text('MAV HOUSING ADMIN', 40, 15);
        doc.fontSize(8).text('DETAILED LEASE INVENTORY REPORT (SORTED BY PROPERTY)', 40, 40);
        doc.text(`Generated: ${now.toLocaleString()}`, doc.page.width - 160, 25, { align: 'right', width: 120 });

        // Table Header
        const tableTop = 80;
        doc.rect(30, tableTop, 782, 25).fill('#0064B1');
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
        
        let x = 35;
        doc.text('ID', x, tableTop + 9, { width: 30 }); x += 35;
        doc.text('PROPERTY & UNIT', x, tableTop + 9, { width: 130 }); x += 135;
        doc.text('RESIDENT info', x, tableTop + 9, { width: 120 }); x += 125;
        doc.text('OCCUPANTS / ROOMMATES', x, tableTop + 9, { width: 180 }); x += 185;
        doc.text('STATUS', x, tableTop + 9, { width: 80 }); x += 85;
        doc.text('DATES (START - END)', x, tableTop + 9, { width: 110 }); x += 115;
        doc.text('FINANCIALS', x, tableTop + 9, { width: 60 }); x += 65;
        doc.text('TKTS', x, tableTop + 9, { width: 30 });

        let y = tableTop + 25;
        doc.font('Helvetica');

        leases.forEach((lease: any, i) => {
          // Determine row height based on number of occupants
          const occupantsList = lease.occupants.map((o: any) => `• ${o.user.fName} ${o.user.lName} (${o.occupantType})`);
          const rowHeight = Math.max(35, 10 + occupantsList.length * 10);

          // Page break check
          if (y + rowHeight > 550) {
            doc.addPage({ layout: 'landscape' });
            y = 40;
            // Redraw header on new page if needed (skipped for simplicity here)
          }

          if (i % 2 === 0) doc.rect(30, y, 782, rowHeight).fill('#F9FAFB');
          
          doc.fillColor('#374151').fontSize(7);
          
          let cx = 35;
          // ID
          doc.text(lease.leaseId.toString(), cx, y + 5); cx += 35;
          
          // Property & Unit
          const location = `${lease.unit?.property?.name || 'N/A'}\nUnit ${lease.unit?.unitNumber || ''} ${lease.room?.roomLetter || ''} ${lease.bed?.bedLetter || ''}`;
          doc.text(location, cx, y + 5, { width: 130 }); cx += 135;

          // Primary Resident
          const resident = `${lease.user.fName} ${lease.user.lName}\n${lease.user.email}\n${lease.user.netId}`;
          doc.text(resident, cx, y + 5, { width: 120 }); cx += 125;

          // Occupants
          doc.text(occupantsList.join('\n'), cx, y + 5, { width: 180 }); cx += 185;

          // Status
          doc.fillColor(lease.status === 'ACTIVE' ? '#059669' : '#4B5563');
          doc.text(lease.status, cx, y + 5, { width: 80 }); cx += 85;
          doc.fillColor('#374151');

          // Dates
          const dates = `${lease.startDate.toLocaleDateString()} -\n${lease.endDate.toLocaleDateString()}`;
          doc.text(dates, cx, y + 5, { width: 110 }); cx += 115;

          // Financials
          const financials = `Total: $${lease.totalDue}\nDue: $${lease.dueThisMonth}`;
          doc.text(financials, cx, y + 5, { width: 60 }); cx += 65;

          // Tickets
          const tickets = (lease.maintenanceRequests?.length || 0).toString();
          doc.text(tickets, cx, y + 5, { width: 30 });

          y += rowHeight;
        });

        doc.end();
      });

      await this.emailService.sendEmailWithAttachment(
        'dev@mavhousing.xyz',
        `Admin Report: COMPREHENSIVE LEASE INVENTORY - ${dateStr}`,
        `<p>Please find attached the requested <strong>detailed lease inventory</strong> report generated on ${now.toLocaleString()}.</p>
         <p>This report includes sorting by property, all occupants per lease, and maintenance ticket counts.</p>`,
        { filename, content: pdfBuffer },
      );

      return { success: true, filename };
    } catch (error) {
      this.logger.error(`Failed to generate detailed lease report: ${error.message}`);
      throw error;
    }
  }
}
