import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { HousingService } from '../housing/housing.service';
import { EmailService } from '../../../comms-server/src/email/email.service';
import PDFDocument = require('pdfkit');
import { Buffer } from 'buffer';

@Processor('property-reports')
export class PropertyReportProcessor extends WorkerHost {
  private readonly logger = new Logger(PropertyReportProcessor.name);

  constructor(
    private readonly housingService: HousingService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Generating detailed Property Assignments report...`);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `PropertyAssignments_${dateStr}_admin.pdf`;

    try {
      const hierarchy = await this.housingService.getHierarchy();
      
      // Calculate Stats
      let totalUnits = 0;
      let totalOccupants = 0;
      hierarchy.forEach(p => {
        totalUnits += p.units.length;
        p.units.forEach(u => {
          u.leases.forEach(l => totalOccupants += l.occupants.length);
          u.rooms.forEach(r => {
            r.leases.forEach(l => totalOccupants += l.occupants.length);
            r.beds.forEach(b => b.leases.forEach(l => totalOccupants += l.occupants.length));
          });
        });
      });

      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        const doc = new PDFDocument({ 
            margin: 30, 
            size: 'A4',
            info: { Title: 'Property Assignments Report' } 
        });
        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // --- Colors ---
        const primary = '#0064B1';
        const secondary = '#F58025';
        const gray = '#F3F4F6';
        const border = '#E5E7EB';

        // --- Header ---
        doc.rect(0, 0, doc.page.width, 70).fill(primary);
        doc.fillColor('white').fontSize(22).text('MAV HOUSING ADMIN', 40, 20);
        doc.fontSize(9).text('PROPERTY ASSIGNMENTS & RESIDENT ROSTER', 42, 50);
        doc.fontSize(8).text(`Date: ${now.toLocaleString()}`, doc.page.width - 180, 25, { align: 'right', width: 140 });

        // --- Summary Block ---
        doc.rect(40, 90, 515, 60).fill(gray);
        doc.fillColor(primary).fontSize(10).text('SYSTEM OVERVIEW', 60, 105);
        doc.fillColor('#374151').fontSize(14).text(`${hierarchy.length} Properties | ${totalUnits} Units | ${totalOccupants} Active Residents`, 60, 125);

        let y = 170;

        hierarchy.forEach((property, pIdx) => {
          // Property Section Header
          if (y > 700) { doc.addPage(); y = 40; }
          
          doc.rect(40, y, 515, 25).fill(primary);
          doc.fillColor('white').fontSize(12).font('Helvetica-Bold').text(property.name.toUpperCase(), 55, y + 7);
          doc.fontSize(8).font('Helvetica').text(`Type: ${property.propertyType} | Address: ${property.address || 'N/A'}`, 350, y + 8, { align: 'right', width: 190 });
          
          y += 25;

          // Unit Table Header
          doc.rect(40, y, 515, 18).fill('#E5E7EB');
          doc.fillColor(primary).fontSize(8).font('Helvetica-Bold');
          doc.text('UNIT #', 50, y + 5);
          doc.text('RESIDENTS', 120, y + 5);
          doc.text('CAPACITY', 420, y + 5);
          doc.text('STATUS', 490, y + 5);
          
          y += 18;
          doc.font('Helvetica');

          property.units.forEach((unit, uIdx) => {
            const residents: { name: string, sub: string }[] = [];
            unit.leases.forEach(l => l.occupants.forEach(o => residents.push({ name: `${o.user.fName} ${o.user.lName}`, sub: `Holder (${o.user.netId})` })));
            unit.rooms.forEach(r => {
              r.leases.forEach(l => l.occupants.forEach(o => residents.push({ name: `${o.user.fName} ${o.user.lName}`, sub: `Room ${r.roomLetter} (${o.user.netId})` })));
              r.beds.forEach(b => b.leases.forEach(l => l.occupants.forEach(o => residents.push({ name: `${o.user.fName} ${o.user.lName}`, sub: `Bed ${b.bedLetter} (${o.user.netId})` }))));
            });

            const rowH = Math.max(30, 10 + residents.length * 15);
            
            // Page check
            if (y + rowH > 780) {
              doc.addPage();
              y = 40;
              // Redraw header for continuity
              doc.rect(40, y, 515, 18).fill('#E5E7EB');
              doc.fillColor(primary).fontSize(8).text('CONTINUED: ' + property.name, 50, y + 5);
              y += 18;
            }

            if (uIdx % 2 === 0) doc.rect(40, y, 515, rowH).fill('#F9FAFB');
            
            doc.fillColor('#374151').fontSize(8);
            doc.font('Helvetica-Bold').text(unit.unitNumber, 50, y + 10);
            doc.font('Helvetica');
            
            let ry = y + 8;
            residents.forEach(res => {
              doc.fillColor('#111827').fontSize(8).text(res.name, 120, ry);
              doc.fillColor('#6B7280').fontSize(7).text(res.sub, 210, ry);
              ry += 15;
            });

            doc.fillColor('#4B5563').fontSize(8).text(unit.maxOccupancy ? `${residents.length} / ${unit.maxOccupancy}` : residents.length.toString(), 420, y + 10);
            
            const isFull = unit.maxOccupancy && residents.length >= unit.maxOccupancy;
            doc.fillColor(isFull ? '#EF4444' : (residents.length > 0 ? '#059669' : '#6B7280'));
            doc.fontSize(7).text(isFull ? 'FULL' : (residents.length > 0 ? 'OCCUPIED' : 'VACANT'), 490, y + 10);

            y += rowH;
          });

          y += 20; // Space between properties
        });

        doc.end();
      });

      await this.emailService.sendEmailWithAttachment(
        'axjh03@gmail.com',
        `Admin Report: PROPERTY ASSIGNMENTS READY - ${dateStr}`,
        `<html>
           <body style="font-family: Arial, sans-serif;">
             <h2 style="color: #0064B1;">MavHousing Property Assignments</h2>
             <p>Attached is the updated property roster. It includes:</p>
             <ul>
               <li><strong>Property-level grouping</strong> with detailed addresses.</li>
               <li><strong>Unit occupancy tracking</strong> (Full/Occupied/Vacant stats).</li>
               <li><strong>Direct resident identification</strong> with NetIDs.</li>
             </ul>
             <p>Generated automatically via BullMQ.</p>
           </body>
         </html>`,
        { filename, content: pdfBuffer },
      );

      return { success: true, filename };
    } catch (error) {
      this.logger.error(`Failed to generate beautiful property report: ${error.message}`);
      throw error;
    }
  }
}
