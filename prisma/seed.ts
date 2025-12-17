import { PrismaClient } from '../generated/prisma';
import { mockUsers } from '../mock_db/mockUsers';
import { mockProperties } from '../mock_db/mockProperties';
import { mockUnits } from '../mock_db/mockUnits';
import { mockRooms } from '../mock_db/mockRooms';
import { mockBeds } from '../mock_db/mockBeds';
import { mockApplications } from '../mock_db/mockLeasing';
import { mockLeases } from '../mock_db/mockLeasing';
import { mockOccupants } from '../mock_db/mockLeasing';
import { mockPayments } from '../mock_db/mockLeasing';
import { mockMaintenanceRequests } from '../mock_db/mockLeasing';

import 'dotenv/config';

const prisma = new PrismaClient({});

async function main() {
  console.log('🌱 Starting comprehensive database seed...\n');

  try {
    // Clear existing data and reset sequences
    console.log('🗑️  Clearing existing data and resetting sequences...');
    const tablenames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
    }
    console.log('   ✅ Database cleared\n');

    // 1. Create Users
    console.log('👥 Creating users (7 students + 5 staff + 1 admin)...');
    const users = await Promise.all(
      mockUsers.map((user) => prisma.user.create({ data: user }))
    );
    console.log(
      `   ✅ Created ${users.length} users\n`
    );

    // 2. Create Properties
    console.log(
      '🏢 Creating properties (Meadow Run & Timber Brooks)...'
    );
    const properties = await Promise.all(
      mockProperties.map((prop) =>
        prisma.property.create({ data: prop })
      )
    );
    console.log(`   ✅ Created ${properties.length} properties`);
    properties.forEach((prop) => console.log(`      - ${prop.name}`));
    console.log();

    // 3. Create Units
    console.log('🏠 Creating units...');
    const units = await Promise.all(
      mockUnits.map((unit) => prisma.unit.create({ data: unit }))
    );
    console.log(`   ✅ Created ${units.length} units\n`);

    // 4. Create Rooms
    console.log('🚪 Creating rooms...');
    const rooms = await Promise.all(
      mockRooms.map((room) => prisma.room.create({ data: room }))
    );
    console.log(`   ✅ Created ${rooms.length} rooms\n`);

    // 5. Create Beds
    console.log('🛏️  Creating beds...');
    const beds = await Promise.all(
      mockBeds.map(({ unitId, ...bed }) => prisma.bed.create({ data: bed }))
    );
    console.log(`   ✅ Created ${beds.length} beds\n`);

    // 6. Create Applications
    console.log('📝 Creating applications...');
    const applications = await Promise.all(
      mockApplications.map((app) =>
        prisma.application.create({ data: app })
      )
    );
    console.log(`   ✅ Created ${applications.length} applications`);
    console.log('      Status breakdown:');
    console.log(
      `      - SUBMITTED: ${applications.filter((a) => a.status === 'SUBMITTED').length}`
    );
    console.log(
      `      - APPROVED: ${applications.filter((a) => a.status === 'APPROVED').length}`
    );
    console.log(
      `      - UNDER_REVIEW: ${applications.filter((a) => a.status === 'UNDER_REVIEW').length}\n`
    );

    // 7. Create Leases
    console.log('📋 Creating leases (mixed types)...');
    const leases = await Promise.all(
      mockLeases.map((lease) => prisma.lease.create({ data: lease }))
    );
    console.log(`   ✅ Created ${leases.length} leases`);
    console.log('      Lease type breakdown:');
    console.log(
      `      - BY_BED: ${leases.filter((l) => l.leaseType === 'BY_BED').length}`
    );
    console.log(
      `      - BY_ROOM: ${leases.filter((l) => l.leaseType === 'BY_ROOM').length}`
    );
    console.log(
      `      - BY_UNIT: ${leases.filter((l) => l.leaseType === 'BY_UNIT').length}\n`
    );

    // 8. Create Occupants
    console.log('👫 Creating occupants...');
    const occupants = await Promise.all(
      mockOccupants.map((occupant) =>
        prisma.occupant.create({ data: occupant })
      )
    );
    console.log(`   ✅ Created ${occupants.length} occupants`);
    console.log('      Occupant type breakdown:');
    console.log(
      `      - LEASE_HOLDER: ${occupants.filter((o) => o.occupantType === 'LEASE_HOLDER').length}`
    );
    console.log(
      `      - OCCUPANT: ${occupants.filter((o) => o.occupantType === 'OCCUPANT').length}\n`
    );

    // 9. Create Payments
    console.log('💳 Creating payments...');
    const payments = await Promise.all(
      mockPayments.map((payment) =>
        prisma.payment.create({ data: payment })
      )
    );
    console.log(`   ✅ Created ${payments.length} payments`);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    console.log(`      Total revenue: $${totalPaid.toFixed(2)}\n`);

    // 10. Create Maintenance Requests
    console.log('🔧 Creating maintenance requests...');
    const maintenance = await Promise.all(
      mockMaintenanceRequests.map((req) =>
        prisma.maintenanceRequest.create({ data: req })
      )
    );
    console.log(`   ✅ Created ${maintenance.length} maintenance requests`);
    console.log('      Status breakdown:');
    console.log(
      `      - OPEN: ${maintenance.filter((m) => m.status === 'OPEN').length}`
    );
    console.log(
      `      - IN_PROGRESS: ${maintenance.filter((m) => m.status === 'IN_PROGRESS').length}`
    );
    console.log(
      `      - RESOLVED: ${maintenance.filter((m) => m.status === 'RESOLVED').length}`
    );
    console.log('      Category breakdown:');
    console.log(
      `      - PLUMBING: ${maintenance.filter((m) => m.category === 'PLUMBING').length}`
    );
    console.log(
      `      - HVAC: ${maintenance.filter((m) => m.category === 'HVAC').length}`
    );
    console.log(
      `      - INTERNET: ${maintenance.filter((m) => m.category === 'INTERNET').length}`
    );
    console.log(
      `      - APPLIANCE: ${maintenance.filter((m) => m.category === 'APPLIANCE').length}`
    );
    console.log(
      `      - ELECTRICAL: ${maintenance.filter((m) => m.category === 'ELECTRICAL').length}`
    );
    console.log(
      `      - STRUCTURAL: ${maintenance.filter((m) => m.category === 'STRUCTURAL').length}\n`
    );

    console.log('✨ Database seeding completed successfully!');
    console.log('\n📊 SUMMARY:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Properties: ${properties.length}`);
    console.log(`   Units: ${units.length}`);
    console.log(`   Rooms: ${rooms.length}`);
    console.log(`   Beds: ${beds.length}`);
    console.log(`   Applications: ${applications.length}`);
    console.log(`   Leases: ${leases.length}`);
    console.log(`   Occupants: ${occupants.length}`);
    console.log(`   Payments: ${payments.length}`);
    console.log(`   Maintenance Requests: ${maintenance.length}`);
    console.log('\n🚀 Ready to go! Try: npx prisma studio');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
