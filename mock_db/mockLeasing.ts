import {
  ApplicationStatus,
  LeaseType,
  LeaseStatus,
  OccupantType,
  PaymentMethod,
  MaintenanceCategory,
  MaintenanceStatus,
  MaintenancePriority,
} from '../generated/prisma';

// ============================================
// APPLICATIONS (25 total — varied statuses)
// Students userId 1–30, staff starts at 31
// ============================================
export const mockApplications = [
  // --- Original applications ---
  { userId: 1, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 1, submissionDate: new Date('2025-06-10') },
  { userId: 2, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 1, submissionDate: new Date('2025-06-05') },
  { userId: 3, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 2, submissionDate: new Date('2025-06-08') },
  { userId: 4, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 1, submissionDate: new Date('2025-06-12') },
  { userId: 5, term: 'Fall 2025', status: ApplicationStatus.UNDER_REVIEW, preferredPropertyId: 3, submissionDate: new Date('2026-02-15') },
  { userId: 6, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 3, submissionDate: new Date('2025-06-06') },
  { userId: 7, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 5, submissionDate: new Date('2025-06-09') },
  // --- New approved applications (residents with leases) ---
  { userId: 8, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 1, submissionDate: new Date('2025-06-02') },
  { userId: 9, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 2, submissionDate: new Date('2025-06-03') },
  { userId: 10, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 4, submissionDate: new Date('2025-06-04') },
  { userId: 12, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 5, submissionDate: new Date('2025-06-07') },
  { userId: 13, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 6, submissionDate: new Date('2025-06-08') },
  { userId: 14, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 7, submissionDate: new Date('2025-06-09') },
  { userId: 15, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 1, submissionDate: new Date('2025-06-10') },
  { userId: 17, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 3, submissionDate: new Date('2025-06-11') },
  { userId: 18, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 2, submissionDate: new Date('2025-06-12') },
  { userId: 19, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 4, submissionDate: new Date('2025-06-13') },
  { userId: 20, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 6, submissionDate: new Date('2025-06-14') },
  { userId: 22, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 7, submissionDate: new Date('2025-06-15') },
  { userId: 23, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 1, submissionDate: new Date('2025-06-16') },
  { userId: 24, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 5, submissionDate: new Date('2025-06-17') },
  { userId: 26, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 3, submissionDate: new Date('2025-06-18') },
  { userId: 27, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 2, submissionDate: new Date('2025-06-19') },
  { userId: 28, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 7, submissionDate: new Date('2025-06-20') },
  { userId: 29, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 6, submissionDate: new Date('2025-06-21') },
  // --- Pending / under-review / rejected ---
  { userId: 11, term: 'Fall 2025', status: ApplicationStatus.UNDER_REVIEW, preferredPropertyId: 4, submissionDate: new Date('2026-01-05') },
  { userId: 16, term: 'Fall 2025', status: ApplicationStatus.SUBMITTED, preferredPropertyId: 5, submissionDate: new Date('2026-01-08') },
  { userId: 21, term: 'Fall 2025', status: ApplicationStatus.SUBMITTED, preferredPropertyId: 7, submissionDate: new Date('2026-01-10') },
  { userId: 25, term: 'Fall 2025', status: ApplicationStatus.UNDER_REVIEW, preferredPropertyId: 6, submissionDate: new Date('2026-01-12') },
  { userId: 30, term: 'Fall 2025', status: ApplicationStatus.REJECTED, preferredPropertyId: 1, submissionDate: new Date('2025-11-28') },
  // --- Spring 2026 early applications ---
  { userId: 2, term: 'Spring 2026', status: ApplicationStatus.SUBMITTED, preferredPropertyId: 1, submissionDate: new Date('2026-02-01') },
  { userId: 3, term: 'Spring 2026', status: ApplicationStatus.SUBMITTED, preferredPropertyId: 2, submissionDate: new Date('2026-02-05') },
  { userId: 8, term: 'Spring 2026', status: ApplicationStatus.UNDER_REVIEW, preferredPropertyId: 3, submissionDate: new Date('2026-02-10') },
  { userId: 39, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 2, submissionDate: new Date('2025-06-01') },
  { userId: 40, term: 'Fall 2025', status: ApplicationStatus.APPROVED, preferredPropertyId: 2, submissionDate: new Date('2025-06-02') },
];

// ============================================
// LEASES (18 total — varied units, rents, statuses)
// Spread across all 7 properties
// ============================================
export const mockLeases = [
  // --- Meadow Run North Tower (BY_UNIT, unitIds 1-4) ---
  // Lease 1: Alok + John → Unit 101 ($950/mo) - ACTIVE
  { userId: 1, leaseType: LeaseType.BY_UNIT, assignedUnitId: 1, assignedRoomId: null, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 11400.00, dueThisMonth: 950.00, status: LeaseStatus.ACTIVE },
  // Lease 2: Emily + Christopher → Unit 102 ($950/mo) - ACTIVE
  { userId: 3, leaseType: LeaseType.BY_UNIT, assignedUnitId: 2, assignedRoomId: null, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 11400.00, dueThisMonth: 950.00, status: LeaseStatus.ACTIVE },
  // Lease 3: Michael (ADA) → Unit 103 ($1050/mo) - ACTIVE
  { userId: 4, leaseType: LeaseType.BY_UNIT, assignedUnitId: 3, assignedRoomId: null, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 12600.00, dueThisMonth: 1050.00, status: LeaseStatus.ACTIVE },
  // Lease 4: Ryan + Lauren → Unit 201 ($925/mo) - SIGNED
  { userId: 8, leaseType: LeaseType.BY_UNIT, assignedUnitId: 4, assignedRoomId: null, assignedBedId: null, startDate: new Date('2026-08-15'), endDate: new Date('2027-07-31'), totalDue: 11100.00, dueThisMonth: 925.00, status: LeaseStatus.SIGNED },

  // --- Meadow Run South Tower (BY_UNIT, unitIds 5-10) ---
  // Lease 5: Sophia + Alicia → Unit 101 ($950/mo) - ACTIVE
  { userId: 5, leaseType: LeaseType.BY_UNIT, assignedUnitId: 5, assignedRoomId: null, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 11400.00, dueThisMonth: 950.00, status: LeaseStatus.ACTIVE },
  // Lease 6: Daniel + James → Unit 102 ($950/mo) - COMPLETED
  { userId: 10, leaseType: LeaseType.BY_UNIT, assignedUnitId: 6, assignedRoomId: null, assignedBedId: null, startDate: new Date('2024-08-15'), endDate: new Date('2025-07-31'), totalDue: 11400.00, dueThisMonth: 0.00, status: LeaseStatus.COMPLETED },
  // Lease 7: Tyler + Natalie → Unit 201 ($900/mo) - ACTIVE
  { userId: 18, leaseType: LeaseType.BY_UNIT, assignedUnitId: 7, assignedRoomId: null, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 10800.00, dueThisMonth: 900.00, status: LeaseStatus.ACTIVE },
  // Lease 8: Ethan solo → Unit 202 ADA ($1075/mo) - ACTIVE
  { userId: 20, leaseType: LeaseType.BY_UNIT, assignedUnitId: 8, assignedRoomId: null, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 12900.00, dueThisMonth: 1075.00, status: LeaseStatus.ACTIVE },
  // Lease 9: Olivia + William → Unit 301 ($875/mo) - ACTIVE
  { userId: 27, leaseType: LeaseType.BY_UNIT, assignedUnitId: 9, assignedRoomId: null, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 10500.00, dueThisMonth: 875.00, status: LeaseStatus.ACTIVE },
  // Lease 10: atiq → Unit 302 ($875/mo) - ACTIVE
  { userId: 39, leaseType: LeaseType.BY_UNIT, assignedUnitId: 10, assignedRoomId: null, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 10500.00, dueThisMonth: 875.00, status: LeaseStatus.ACTIVE },

  // --- Heights on Pecan East (BY_ROOM, unitIds 11-13, roomIds 1-6) ---
  // Lease 11: Kayla → Room A in Unit 101 ($725/mo) - ACTIVE
  { userId: 17, leaseType: LeaseType.BY_ROOM, assignedUnitId: 11, assignedRoomId: 1, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 8700.00, dueThisMonth: 725.00, status: LeaseStatus.ACTIVE },
  // Lease 12: Megan → Room B in Unit 101 ($725/mo) - ACTIVE
  { userId: 13, leaseType: LeaseType.BY_ROOM, assignedUnitId: 11, assignedRoomId: 2, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 8700.00, dueThisMonth: 725.00, status: LeaseStatus.ACTIVE },

  // --- Heights on Pecan West (BY_ROOM, unitIds 14-16, roomIds 7-12) ---
  // Lease 13: Rachel → Room A in Unit 101 ($725/mo) - ACTIVE
  { userId: 19, leaseType: LeaseType.BY_ROOM, assignedUnitId: 14, assignedRoomId: 7, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 8700.00, dueThisMonth: 725.00, status: LeaseStatus.ACTIVE },

  // --- Timber Brooks East Wing (BY_BED, unitIds 15-17, roomIds 13-18, bedIds 1-12) ---
  // Lease 14: Jason → Bed L in Room A of Unit 1A ($625/mo) - TERMINATED
  { userId: 22, leaseType: LeaseType.BY_BED, assignedUnitId: 15, assignedRoomId: 13, assignedBedId: 1, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 7500.00, dueThisMonth: 0.00, status: LeaseStatus.TERMINATED },
  // Lease 15: Victoria → Bed R in Room A of Unit 1A ($625/mo) - ACTIVE
  { userId: 23, leaseType: LeaseType.BY_BED, assignedUnitId: 15, assignedRoomId: 13, assignedBedId: 2, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 7500.00, dueThisMonth: 625.00, status: LeaseStatus.ACTIVE },
  // Lease 16: David → Bed 1 in Room B of Unit 1A ($625/mo) - ACTIVE
  { userId: 24, leaseType: LeaseType.BY_BED, assignedUnitId: 15, assignedRoomId: 14, assignedBedId: 3, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 7500.00, dueThisMonth: 625.00, status: LeaseStatus.ACTIVE },

  // --- Arlington Hall (BY_BED, unitIds 21-24, roomIds 28-36, bedIds 40-60) ---
  // Lease 17: Adrian → Bed L in Room A of Unit A1 ($575/mo) - ACTIVE
  { userId: 28, leaseType: LeaseType.BY_BED, assignedUnitId: 21, assignedRoomId: 28, assignedBedId: 40, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 6900.00, dueThisMonth: 575.00, status: LeaseStatus.ACTIVE },
  // Lease 18: Isabella → Bed R in Room A of Unit A1 ($575/mo)   — COMPLETED (moved out early)
  { userId: 29, leaseType: LeaseType.BY_BED, assignedUnitId: 21, assignedRoomId: 28, assignedBedId: 41, startDate: new Date('2025-08-15'), endDate: new Date('2025-12-15'), totalDue: 2300.00, dueThisMonth: 0.00, status: LeaseStatus.COMPLETED },

  // --- Talha (userId 40) - Meadow Run South Tower Unit 302 ($875/mo) ---
  // Lease 19: Talha solo -> Unit 10 ($875/mo) - ACTIVE
  { userId: 40, leaseType: LeaseType.BY_UNIT, assignedUnitId: 10, assignedRoomId: null, assignedBedId: null, startDate: new Date('2025-08-15'), endDate: new Date('2026-07-31'), totalDue: 10500.00, dueThisMonth: 875.00, status: LeaseStatus.ACTIVE },

];

// ============================================
// OCCUPANTS (26 total)
// ============================================
export const mockOccupants = [
  // Lease 1: Alok + John
  { leaseId: 1, userId: 1, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  { leaseId: 1, userId: 2, occupantType: OccupantType.OCCUPANT, moveInDate: new Date('2025-08-15') },
  // Lease 2: Emily + Christopher
  { leaseId: 2, userId: 3, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-14') },
  { leaseId: 2, userId: 6, occupantType: OccupantType.ROOMMATE, moveInDate: new Date('2025-08-15') },
  // Lease 3: Michael (ADA solo)
  { leaseId: 3, userId: 4, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  // Lease 4: Ryan + Lauren (Lease signed for future)
  { leaseId: 4, userId: 8, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2026-08-15') },
  { leaseId: 4, userId: 9, occupantType: OccupantType.ROOMMATE, moveInDate: new Date('2026-08-16') },
  // Lease 5: Sophia + Alicia
  { leaseId: 5, userId: 5, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  { leaseId: 5, userId: 7, occupantType: OccupantType.ROOMMATE, moveInDate: new Date('2025-08-16') },
  // Lease 6: Daniel + James (Completed)
  { leaseId: 6, userId: 10, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2024-08-15'), moveOutDate: new Date('2025-07-31') },
  { leaseId: 6, userId: 12, occupantType: OccupantType.ROOMMATE, moveInDate: new Date('2024-08-15'), moveOutDate: new Date('2025-07-31') },
  // Lease 7: Tyler + Natalie
  { leaseId: 7, userId: 18, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  { leaseId: 7, userId: 15, occupantType: OccupantType.ROOMMATE, moveInDate: new Date('2025-08-16') },
  // Lease 8: Ethan solo
  { leaseId: 8, userId: 20, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  // Lease 9: Olivia + William
  { leaseId: 9, userId: 27, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  { leaseId: 9, userId: 26, occupantType: OccupantType.ROOMMATE, moveInDate: new Date('2025-08-16') },
  // Lease 10: atiq solo
  { leaseId: 10, userId: 39, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  // Lease 11: Kayla solo (room)
  { leaseId: 11, userId: 17, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  // Lease 12: Megan solo (room)
  { leaseId: 12, userId: 13, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  // Lease 13: Rachel solo (room)
  { leaseId: 13, userId: 19, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  // Lease 14: Jason (bed) - EVICTED/TERMINATED
  { leaseId: 14, userId: 22, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15'), moveOutDate: new Date('2025-12-31') },
  // Lease 15: Victoria (bed)
  { leaseId: 15, userId: 23, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  // Lease 16: David (bed)
  { leaseId: 16, userId: 24, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  // Lease 17: Adrian (bed)
  { leaseId: 17, userId: 28, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
  // Lease 18: Isabella (bed — moved out early)
  { leaseId: 18, userId: 29, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15'), moveOutDate: new Date('2025-12-15') },
  // Lease 19: Talha solo
  { leaseId: 19, userId: 40, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-08-15') },
];

// ============================================
// PAYMENTS (78 total — multi-month history, varied methods, some failures)
// Dates span Oct 2025 → Mar 2026 for a realistic 6-month spread
// Staff userId 31–37 (staffId: 31=sxr5555, 32=rxb6666, 33=jxg7777, 34=txk8888, 35=dxl9999, 36=pxw3636, 37=mxd3737)
// ============================================
export const mockPayments = [
  // === LEASE 1 (John, $950/mo) — Paid Oct–Mar, all successful ===
  { leaseId: 1, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-10-02') },
  { leaseId: 1, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-11-01') },
  { leaseId: 1, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-12-03') },
  { leaseId: 1, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-01-02') },
  { leaseId: 1, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-02-03') },
  { leaseId: 1, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-03-01') },

  // === LEASE 2 (Emily, $950/mo) — Paid Oct–Feb, March NOT YET PAID ===
  { leaseId: 2, amountPaid: 950.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-10-05') },
  { leaseId: 2, amountPaid: 950.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-11-04') },
  { leaseId: 2, amountPaid: 950.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-12-05') },
  { leaseId: 2, amountPaid: 950.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-01-03') },
  { leaseId: 2, amountPaid: 950.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-02-04') },
  // March: not paid yet

  // === LEASE 3 (Michael ADA, $1050/mo) — Paid Oct–Mar, one failed attempt in Dec ===
  { leaseId: 3, amountPaid: 1050.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2025-10-01') },
  { leaseId: 3, amountPaid: 1050.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2025-11-03') },
  { leaseId: 3, amountPaid: 1050.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: false, transactionDate: new Date('2025-12-01') },  // FAILED
  { leaseId: 3, amountPaid: 1050.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2025-12-05') },  // retried OK
  { leaseId: 3, amountPaid: 1050.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2026-01-04') },
  { leaseId: 3, amountPaid: 1050.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2026-02-01') },
  { leaseId: 3, amountPaid: 1050.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2026-03-03') },

  // === LEASE 4 (Ryan, $925/mo) — Paid Oct–Jan, Feb FAILED, March not paid ===
  { leaseId: 4, amountPaid: 925.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2025-10-03') },
  { leaseId: 4, amountPaid: 925.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2025-11-02') },
  { leaseId: 4, amountPaid: 925.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2025-12-04') },
  { leaseId: 4, amountPaid: 925.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2026-01-05') },
  { leaseId: 4, amountPaid: 925.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: false, transactionDate: new Date('2026-02-02') }, // FAILED

  // === LEASE 5 (Sophia, $950/mo) — Paid Oct–Mar on time ===
  { leaseId: 5, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-10-01') },
  { leaseId: 5, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-11-01') },
  { leaseId: 5, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-12-01') },
  { leaseId: 5, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-01-01') },
  { leaseId: 5, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-02-01') },
  { leaseId: 5, amountPaid: 950.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-03-02') },

  // === LEASE 6 (Daniel, $950/mo) — Paid Oct–Feb, missed Mar ===
  { leaseId: 6, amountPaid: 950.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-10-04') },
  { leaseId: 6, amountPaid: 950.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-11-05') },
  { leaseId: 6, amountPaid: 950.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-12-02') },
  { leaseId: 6, amountPaid: 950.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-01-06') },
  { leaseId: 6, amountPaid: 950.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-02-05') },

  // === LEASE 7 (Tyler, $900/mo) — Paid Oct–Mar, two methods ===
  { leaseId: 7, amountPaid: 900.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-10-02') },
  { leaseId: 7, amountPaid: 900.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-11-03') },
  { leaseId: 7, amountPaid: 900.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-12-01') },
  { leaseId: 7, amountPaid: 900.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-01-02') },
  { leaseId: 7, amountPaid: 900.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-02-03') },
  { leaseId: 7, amountPaid: 900.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-03-04') },

  // === LEASE 8 (Ethan, $1075/mo) — Paid Oct, failed Nov, paid Dec–Mar ===
  { leaseId: 8, amountPaid: 1075.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2025-10-05') },
  { leaseId: 8, amountPaid: 1075.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: false, transactionDate: new Date('2025-11-02') }, // FAILED
  { leaseId: 8, amountPaid: 1075.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-11-08') }, // retried OK
  { leaseId: 8, amountPaid: 1075.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-12-03') },
  { leaseId: 8, amountPaid: 1075.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-01-04') },
  { leaseId: 8, amountPaid: 1075.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-02-02') },
  { leaseId: 8, amountPaid: 1075.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-03-05') },

  // === LEASE 9 (Olivia, $875/mo) — Paid Oct–Mar ===
  { leaseId: 9, amountPaid: 875.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2025-10-03') },
  { leaseId: 9, amountPaid: 875.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2025-11-04') },
  { leaseId: 9, amountPaid: 875.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2025-12-02') },
  { leaseId: 9, amountPaid: 875.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2026-01-03') },
  { leaseId: 9, amountPaid: 875.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2026-02-04') },
  { leaseId: 9, amountPaid: 875.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2026-03-03') },

  // === LEASE 10 (atiq, $875/mo) — Paid Oct–Mar, used CASH once ===
  { leaseId: 10, amountPaid: 875.00, method: PaymentMethod.CASH, isSuccessful: true, transactionDate: new Date('2025-10-01') },
  { leaseId: 10, amountPaid: 875.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-11-01') },
  { leaseId: 10, amountPaid: 875.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-12-01') },
  { leaseId: 10, amountPaid: 875.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-01-02') },
  { leaseId: 10, amountPaid: 875.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-02-01') },
  { leaseId: 10, amountPaid: 875.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-03-02') },

  // === LEASE 11 (Kayla, $725/mo) — Paid Oct–Jan, failed Feb+Mar ===
  { leaseId: 11, amountPaid: 725.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-10-02') },
  { leaseId: 11, amountPaid: 725.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-11-03') },
  { leaseId: 11, amountPaid: 725.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-12-04') },
  { leaseId: 11, amountPaid: 725.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-01-05') },
  { leaseId: 11, amountPaid: 725.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: false, transactionDate: new Date('2026-02-02') }, // FAILED
  { leaseId: 11, amountPaid: 725.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: false, transactionDate: new Date('2026-03-01') }, // FAILED

  // === LEASE 12 (Megan, $725/mo) — Paid Oct–Mar ===
  { leaseId: 12, amountPaid: 725.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2025-10-04') },
  { leaseId: 12, amountPaid: 725.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2025-11-05') },
  { leaseId: 12, amountPaid: 725.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2025-12-03') },
  { leaseId: 12, amountPaid: 725.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2026-01-02') },
  { leaseId: 12, amountPaid: 725.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2026-02-03') },
  { leaseId: 12, amountPaid: 725.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2026-03-04') },

  // === LEASE 13 (Rachel, $725/mo) — Paid Oct–Feb, missed Mar ===
  { leaseId: 13, amountPaid: 725.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-10-01') },
  { leaseId: 13, amountPaid: 725.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-11-02') },
  { leaseId: 13, amountPaid: 725.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-12-01') },
  { leaseId: 13, amountPaid: 725.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-01-03') },
  { leaseId: 13, amountPaid: 725.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-02-02') },

  // === LEASE 14 (Jason, $625/mo) — Only paid Oct–Dec, then stopped ===
  { leaseId: 14, amountPaid: 625.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-10-03') },
  { leaseId: 14, amountPaid: 625.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-11-04') },
  { leaseId: 14, amountPaid: 625.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-12-02') },

  // === LEASE 15 (Victoria, $625/mo) — Paid Oct–Mar, all good ===
  { leaseId: 15, amountPaid: 625.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-10-02') },
  { leaseId: 15, amountPaid: 625.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-11-01') },
  { leaseId: 15, amountPaid: 625.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-12-03') },
  { leaseId: 15, amountPaid: 625.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-01-02') },
  { leaseId: 15, amountPaid: 625.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-02-03') },
  { leaseId: 15, amountPaid: 625.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-03-01') },

  // === LEASE 16 (David, $625/mo) — Paid Oct–Feb, March failed ===
  { leaseId: 16, amountPaid: 625.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2025-10-05') },
  { leaseId: 16, amountPaid: 625.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2025-11-03') },
  { leaseId: 16, amountPaid: 625.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2025-12-04') },
  { leaseId: 16, amountPaid: 625.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2026-01-05') },
  { leaseId: 16, amountPaid: 625.00, method: PaymentMethod.CHECK, isSuccessful: true, transactionDate: new Date('2026-02-04') },
  { leaseId: 16, amountPaid: 625.00, method: PaymentMethod.CHECK, isSuccessful: false, transactionDate: new Date('2026-03-02') }, // FAILED

  // === LEASE 17 (Adrian, $575/mo) — Paid Oct–Mar ===
  { leaseId: 17, amountPaid: 575.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2025-10-01') },
  { leaseId: 17, amountPaid: 575.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2025-11-02') },
  { leaseId: 17, amountPaid: 575.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2025-12-01') },
  { leaseId: 17, amountPaid: 575.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2026-01-03') },
  { leaseId: 17, amountPaid: 575.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2026-02-01') },
  { leaseId: 17, amountPaid: 575.00, method: PaymentMethod.DEBIT_CARD, isSuccessful: true, transactionDate: new Date('2026-03-03') },

  // === LEASE 18 (Isabella, $575/mo — COMPLETED, only Oct–Mar before move-out) ===
  { leaseId: 18, amountPaid: 575.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-10-02') },
  { leaseId: 18, amountPaid: 575.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-11-03') },
  { leaseId: 18, amountPaid: 575.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2025-12-01') },
  { leaseId: 18, amountPaid: 575.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-01-02') },
  { leaseId: 18, amountPaid: 575.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-02-03') },
  { leaseId: 18, amountPaid: 575.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: true, transactionDate: new Date('2026-03-01') },

  // === LEASE 19 (Talha, $875/mo) — Paid Oct–Mar, bank transfer ===
  { leaseId: 19, amountPaid: 875.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-10-01') },
  { leaseId: 19, amountPaid: 875.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-11-03') },
  { leaseId: 19, amountPaid: 875.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2025-12-02') },
  { leaseId: 19, amountPaid: 875.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-01-04') },
  { leaseId: 19, amountPaid: 875.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-02-01') },
  { leaseId: 19, amountPaid: 875.00, method: PaymentMethod.CREDIT_CARD, isSuccessful: false, transactionDate: new Date('2026-03-02') }, // FAILED
  { leaseId: 19, amountPaid: 875.00, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true, transactionDate: new Date('2026-03-05') }, // retried OK
];

// ============================================
// MAINTENANCE REQUESTS (20 total — varied statuses, categories, priorities)
// ============================================
export const mockMaintenanceRequests = [
  // --- Original 4 ---
  { leaseId: 1, createdByUserId: 2, assignedStaffId: 31, category: MaintenanceCategory.PLUMBING, description: 'Leaky shower head in Unit 101', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.MEDIUM },
  { leaseId: 2, createdByUserId: 3, assignedStaffId: 32, category: MaintenanceCategory.HVAC, description: 'AC not cooling properly in Unit 102', status: MaintenanceStatus.IN_PROGRESS, priority: MaintenancePriority.HIGH },
  { leaseId: 5, createdByUserId: 5, assignedStaffId: 31, category: MaintenanceCategory.ELECTRICAL, description: 'Light fixture flickering in South Unit 101', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.LOW },
  { leaseId: 3, createdByUserId: 4, assignedStaffId: 31, category: MaintenanceCategory.APPLIANCE, description: 'Microwave not heating in Unit 103 (ADA)', status: MaintenanceStatus.RESOLVED, priority: MaintenancePriority.MEDIUM, resolvedAt: new Date('2025-11-20') },

  // --- New maintenance requests ---
  { leaseId: 4, createdByUserId: 8, assignedStaffId: 32, category: MaintenanceCategory.INTERNET, description: 'WiFi dropping frequently in Unit 201 — unable to attend virtual classes', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.HIGH },
  { leaseId: 6, createdByUserId: 10, assignedStaffId: 37, category: MaintenanceCategory.PLUMBING, description: 'Toilet running constantly in Unit 102 South Tower', status: MaintenanceStatus.IN_PROGRESS, priority: MaintenancePriority.MEDIUM },
  { leaseId: 7, createdByUserId: 18, assignedStaffId: 31, category: MaintenanceCategory.HVAC, description: 'Heater making loud banging noise at night in Unit 201', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.HIGH },
  { leaseId: 8, createdByUserId: 20, assignedStaffId: 33, category: MaintenanceCategory.STRUCTURAL, description: 'Crack in bedroom wall near window in Unit 202 (ADA)', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.EMERGENCY },
  { leaseId: 9, createdByUserId: 27, assignedStaffId: 32, category: MaintenanceCategory.APPLIANCE, description: 'Dishwasher not draining properly in Unit 301', status: MaintenanceStatus.RESOLVED, priority: MaintenancePriority.LOW, resolvedAt: new Date('2025-12-15') },
  { leaseId: 10, createdByUserId: 39, assignedStaffId: 37, category: MaintenanceCategory.ELECTRICAL, description: 'Bathroom outlet sparking when plugging in hair dryer', status: MaintenanceStatus.IN_PROGRESS, priority: MaintenancePriority.EMERGENCY },
  { leaseId: 11, createdByUserId: 17, assignedStaffId: 31, category: MaintenanceCategory.PLUMBING, description: 'Kitchen faucet dripping in Room A, HoP East Unit 101', status: MaintenanceStatus.RESOLVED, priority: MaintenancePriority.LOW, resolvedAt: new Date('2026-01-10') },
  { leaseId: 12, createdByUserId: 13, assignedStaffId: 32, category: MaintenanceCategory.INTERNET, description: 'Ethernet port not working in Room B, HoP East Unit 101', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.MEDIUM },
  { leaseId: 13, createdByUserId: 19, assignedStaffId: 37, category: MaintenanceCategory.HVAC, description: 'Room is extremely cold even with heat on max — HoP West', status: MaintenanceStatus.IN_PROGRESS, priority: MaintenancePriority.HIGH },
  { leaseId: 14, createdByUserId: 22, assignedStaffId: 33, category: MaintenanceCategory.APPLIANCE, description: 'Washing machine vibrating excessively in Timber Brooks East', status: MaintenanceStatus.RESOLVED, priority: MaintenancePriority.MEDIUM, resolvedAt: new Date('2026-02-01') },
  { leaseId: 15, createdByUserId: 23, assignedStaffId: 31, category: MaintenanceCategory.STRUCTURAL, description: 'Bedroom door frame damaged — door doesn\'t close properly', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.MEDIUM },
  { leaseId: 16, createdByUserId: 24, assignedStaffId: 32, category: MaintenanceCategory.ELECTRICAL, description: 'Ceiling fan light flickering in Room B, Timber Brooks East', status: MaintenanceStatus.CLOSED, priority: MaintenancePriority.LOW, resolvedAt: new Date('2025-11-28') },
  { leaseId: 17, createdByUserId: 28, assignedStaffId: 37, category: MaintenanceCategory.OTHER, description: 'Pest control needed — saw cockroach in Arlington Hall kitchen', status: MaintenanceStatus.IN_PROGRESS, priority: MaintenancePriority.HIGH },
  { leaseId: 1, createdByUserId: 1, assignedStaffId: 31, category: MaintenanceCategory.APPLIANCE, description: 'Refrigerator making loud humming noise in Meadow Run North 101', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.LOW },
  { leaseId: 5, createdByUserId: 7, assignedStaffId: 33, category: MaintenanceCategory.PLUMBING, description: 'Low water pressure in shower — Meadow Run South 101', status: MaintenanceStatus.RESOLVED, priority: MaintenancePriority.MEDIUM, resolvedAt: new Date('2026-01-25') },
  { leaseId: 2, createdByUserId: 6, assignedStaffId: 37, category: MaintenanceCategory.INTERNET, description: 'Smart TV unable to connect to ResNet WiFi in Unit 102 North', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.LOW },
  // --- Talha's maintenance request ---
  { leaseId: 19, createdByUserId: 40, assignedStaffId: 32, category: MaintenanceCategory.HVAC, description: 'AC unit not turning on at all in Meadow Run South Unit 302', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.HIGH },
];
