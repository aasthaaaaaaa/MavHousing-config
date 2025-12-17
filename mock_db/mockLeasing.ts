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

export const mockApplications = [
  // Students applying for housing
  {
    userId: 1, // Aalok
    term: 'Fall 2025',
    status: ApplicationStatus.SUBMITTED,
    preferredPropertyId: 1, // Meadow Run - North Tower
    submissionDate: new Date('2024-12-10'),
  },
  {
    userId: 2, // John
    term: 'Fall 2025',
    status: ApplicationStatus.APPROVED,
    preferredPropertyId: 1,
    submissionDate: new Date('2024-12-05'),
  },
  {
    userId: 3, // Emily
    term: 'Fall 2025',
    status: ApplicationStatus.APPROVED,
    preferredPropertyId: 2, // Meadow Run - South Tower
    submissionDate: new Date('2024-12-08'),
  },
  {
    userId: 4, // Michael (ADA)
    term: 'Fall 2025',
    status: ApplicationStatus.APPROVED,
    preferredPropertyId: 1, // Meadow Run with ADA units
    submissionDate: new Date('2024-12-12'),
  },
  {
    userId: 5, // Sophia
    term: 'Fall 2025',
    status: ApplicationStatus.UNDER_REVIEW,
    preferredPropertyId: 3, // Meadow Run - Community Center
    submissionDate: new Date('2024-12-15'),
  },
  {
    userId: 6, // Christopher
    term: 'Fall 2025',
    status: ApplicationStatus.APPROVED,
    preferredPropertyId: 4, // Timber Brooks - East Wing
    submissionDate: new Date('2024-12-06'),
  },
  {
    userId: 7, // Alicia
    term: 'Fall 2025',
    status: ApplicationStatus.APPROVED,
    preferredPropertyId: 5, // Timber Brooks - West Wing
    submissionDate: new Date('2024-12-09'),
  },
];

export const mockLeases = [
  // ============================================
  // MEADOW RUN (BY_UNIT LEASES)
  // One lease per unit, multiple occupants
  // ============================================
  {
    userId: 2, // John - Lease Holder
    leaseType: LeaseType.BY_UNIT,
    assignedUnitId: 1, // Meadow Run North - Unit 101
    assignedRoomId: null,
    assignedBedId: null,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 36000.0,
    dueThisMonth: 9000.0,
    status: LeaseStatus.SIGNED,
  },
  {
    userId: 3, // Emily - Lease Holder
    leaseType: LeaseType.BY_UNIT,
    assignedUnitId: 2, // Meadow Run North - Unit 102
    assignedRoomId: null,
    assignedBedId: null,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 36000.0,
    dueThisMonth: 9000.0,
    status: LeaseStatus.SIGNED,
  },
  {
    userId: 4, // Michael (ADA) - Lease Holder
    leaseType: LeaseType.BY_UNIT,
    assignedUnitId: 3, // Meadow Run North - Unit 103 (ADA)
    assignedRoomId: null,
    assignedBedId: null,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 36000.0,
    dueThisMonth: 9000.0,
    status: LeaseStatus.SIGNED,
  },
  {
    userId: 5, // Sophia - Lease Holder
    leaseType: LeaseType.BY_UNIT,
    assignedUnitId: 5, // Meadow Run South - Unit 101
    assignedRoomId: null,
    assignedBedId: null,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 36000.0,
    dueThisMonth: 9000.0,
    status: LeaseStatus.SIGNED,
  },

  // ============================================
  // HEIGHTS ON PECAN (BY_ROOM LEASES)
  // Room-based leases - assignedRoomId only, no beds
  // ============================================
  {
    userId: 6, // Christopher - Lease Holder
    leaseType: LeaseType.BY_ROOM,
    assignedUnitId: null,
    assignedRoomId: 1, // Heights on Pecan East - Unit 101 - Room A
    assignedBedId: null,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 18000.0,
    dueThisMonth: 4500.0,
    status: LeaseStatus.SIGNED,
  },
  {
    userId: 7, // Alicia - Lease Holder
    leaseType: LeaseType.BY_ROOM,
    assignedUnitId: null,
    assignedRoomId: 2, // Heights on Pecan East - Unit 101 - Room B
    assignedBedId: null,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 18000.0,
    dueThisMonth: 4500.0,
    status: LeaseStatus.SIGNED,
  },
  {
    userId: 1, // Aalok - Lease Holder
    leaseType: LeaseType.BY_ROOM,
    assignedUnitId: null,
    assignedRoomId: 3, // Heights on Pecan East - Unit 102 - Room A
    assignedBedId: null,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 18000.0,
    dueThisMonth: 4500.0,
    status: LeaseStatus.SIGNED,
  },
  {
    userId: 2, // John (2nd lease) - Lease Holder
    leaseType: LeaseType.BY_ROOM,
    assignedUnitId: null,
    assignedRoomId: 4, // Heights on Pecan West - Unit 101 - Room A
    assignedBedId: null,
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 18000.0,
    dueThisMonth: 4500.0,
    status: LeaseStatus.PENDING_SIGNATURE,
  },

  // ============================================
  // TIMBER BROOKS (BY_BED LEASES)
  // One lease per bed, one occupant per lease
  // ============================================
  {
    userId: 3, // Emily (2nd lease) - Lease Holder
    leaseType: LeaseType.BY_BED,
    assignedUnitId: 1, // Timber Brooks East - Unit 1A
    assignedRoomId: 1, // Room A
    assignedBedId: 1, // Bed L
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 9000.0,
    dueThisMonth: 2250.0,
    status: LeaseStatus.SIGNED,
  },
  {
    userId: 4, // Michael (2nd lease) - Lease Holder
    leaseType: LeaseType.BY_BED,
    assignedUnitId: 1, // Timber Brooks East - Unit 1A
    assignedRoomId: 1, // Room A
    assignedBedId: 2, // Bed R
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 9000.0,
    dueThisMonth: 2250.0,
    status: LeaseStatus.SIGNED,
  },
  {
    userId: 5, // Sophia (2nd lease) - Lease Holder
    leaseType: LeaseType.BY_BED,
    assignedUnitId: 1, // Timber Brooks East - Unit 1A
    assignedRoomId: 2, // Room B
    assignedBedId: 3, // Bed 1
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 9000.0,
    dueThisMonth: 2250.0,
    status: LeaseStatus.SIGNED,
  },
  {
    userId: 6, // Christopher (2nd lease) - Lease Holder
    leaseType: LeaseType.BY_BED,
    assignedUnitId: 2, // Timber Brooks East - Unit 1B
    assignedRoomId: 3, // Room A
    assignedBedId: 5, // Bed L
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 9000.0,
    dueThisMonth: 2250.0,
    status: LeaseStatus.SIGNED,
  },
  {
    userId: 7, // Alicia (2nd lease) - Lease Holder
    leaseType: LeaseType.BY_BED,
    assignedUnitId: 3, // Timber Brooks East - Unit 2A (ADA)
    assignedRoomId: 5, // Room A
    assignedBedId: 9, // Bed 1
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 9000.0,
    dueThisMonth: 2250.0,
    status: LeaseStatus.SIGNED,
  },
  {
    userId: 1, // Aalok (2nd lease) - Lease Holder
    leaseType: LeaseType.BY_BED,
    assignedUnitId: 4, // Timber Brooks West - Unit 1A
    assignedRoomId: 7, // Room A
    assignedBedId: 13, // Bed 1
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-05-15'),
    totalDue: 9200.0,
    dueThisMonth: 2300.0,
    status: LeaseStatus.SIGNED,
  },
];

export const mockOccupants = [
  // ============================================
  // MEADOW RUN (BY_UNIT LEASES - multiple occupants per lease)
  // ============================================
  // Lease 1: Unit 101
  { leaseId: 1, userId: 2, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // Lease 2: Unit 102
  { leaseId: 2, userId: 3, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // Lease 3: Unit 103 (ADA)
  { leaseId: 3, userId: 4, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // Lease 4: South Unit 101
  { leaseId: 4, userId: 5, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // ============================================
  // HEIGHTS ON PECAN (BY_ROOM LEASES - 1 occupant per room)
  // ============================================
  // Lease 5: East Unit 101 Room A
  { leaseId: 5, userId: 6, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // Lease 6: East Unit 101 Room B
  { leaseId: 6, userId: 7, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // Lease 7: East Unit 102 Room A
  { leaseId: 7, userId: 1, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // Lease 8: East Unit 201 Room A
  { leaseId: 8, userId: 2, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // ============================================
  // TIMBER BROOKS (BY_BED LEASES - 1 occupant per bed)
  // ============================================
  // Lease 9: East Unit 1A Room A Bed L
  { leaseId: 9, userId: 3, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // Lease 10: East Unit 1A Room A Bed R
  { leaseId: 10, userId: 4, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // Lease 11: East Unit 1A Room B Bed 1
  { leaseId: 11, userId: 5, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // Lease 12: East Unit 1B Room A Bed L
  { leaseId: 12, userId: 6, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // Lease 13: East Unit 2A Room A Bed 1 (ADA)
  { leaseId: 13, userId: 7, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },

  // Lease 14: West Unit 1A Room A Bed 1
  { leaseId: 14, userId: 1, occupantType: OccupantType.LEASE_HOLDER, moveInDate: new Date('2025-01-15') },
];

export const mockPayments = [
  // MEADOW RUN (BY_UNIT)
  { leaseId: 1, amountPaid: 9000.0, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true },
  { leaseId: 2, amountPaid: 9000.0, method: PaymentMethod.CREDIT_CARD, isSuccessful: true },
  { leaseId: 3, amountPaid: 9000.0, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true },
  { leaseId: 4, amountPaid: 9000.0, method: PaymentMethod.CHECK, isSuccessful: true },

  // HEIGHTS ON PECAN (BY_ROOM)
  { leaseId: 5, amountPaid: 4500.0, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true },
  { leaseId: 6, amountPaid: 4500.0, method: PaymentMethod.CREDIT_CARD, isSuccessful: true },
  { leaseId: 7, amountPaid: 4500.0, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true },
  { leaseId: 8, amountPaid: 4500.0, method: PaymentMethod.CHECK, isSuccessful: true },

  // TIMBER BROOKS (BY_BED)
  { leaseId: 9, amountPaid: 2250.0, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true },
  { leaseId: 10, amountPaid: 2250.0, method: PaymentMethod.CREDIT_CARD, isSuccessful: true },
  { leaseId: 11, amountPaid: 2250.0, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true },
  { leaseId: 12, amountPaid: 2250.0, method: PaymentMethod.CHECK, isSuccessful: true },
  { leaseId: 13, amountPaid: 2250.0, method: PaymentMethod.BANK_TRANSFER, isSuccessful: true },
  { leaseId: 14, amountPaid: 2300.0, method: PaymentMethod.CREDIT_CARD, isSuccessful: true },
];

export const mockMaintenanceRequests = [
  // MEADOW RUN (BY_UNIT - Leases 1-4)
  {
    leaseId: 1,
    createdByUserId: 2,
    assignedStaffId: 8,
    category: MaintenanceCategory.PLUMBING,
    description: 'Leaky shower head in Unit 101',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.MEDIUM,
  },
  {
    leaseId: 2,
    createdByUserId: 3,
    assignedStaffId: 9,
    category: MaintenanceCategory.HVAC,
    description: 'AC not cooling properly in Unit 102',
    status: MaintenanceStatus.IN_PROGRESS,
    priority: MaintenancePriority.HIGH,
  },
  {
    leaseId: 3,
    createdByUserId: 4,
    assignedStaffId: 8,
    category: MaintenanceCategory.APPLIANCE,
    description: 'Microwave not heating in Unit 103 (ADA)',
    status: MaintenanceStatus.RESOLVED,
    priority: MaintenancePriority.MEDIUM,
  },
  {
    leaseId: 4,
    createdByUserId: 5,
    assignedStaffId: 9,
    category: MaintenanceCategory.ELECTRICAL,
    description: 'Light fixture flickering in South Unit 101',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.LOW,
  },

  // HEIGHTS ON PECAN (BY_ROOM - Leases 5-8)
  {
    leaseId: 5,
    createdByUserId: 6,
    assignedStaffId: 10,
    category: MaintenanceCategory.OTHER,
    description: 'Ant infestation in East Unit 101',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.EMERGENCY,
  },
  {
    leaseId: 6,
    createdByUserId: 7,
    assignedStaffId: 8,
    category: MaintenanceCategory.APPLIANCE,
    description: 'Microwave not heating properly',
    status: MaintenanceStatus.IN_PROGRESS,
    priority: MaintenancePriority.MEDIUM,
  },
  {
    leaseId: 7,
    createdByUserId: 1,
    assignedStaffId: 11,
    category: MaintenanceCategory.PLUMBING,
    description: 'Low water pressure in shower',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.HIGH,
  },
  {
    leaseId: 8,
    createdByUserId: 2,
    assignedStaffId: 9,
    category: MaintenanceCategory.OTHER,
    description: 'Loose door handle needing adjustment',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.LOW,
  },

  // TIMBER BROOKS (BY_BED - Leases 9-14)
  {
    leaseId: 9,
    createdByUserId: 3,
    assignedStaffId: 10,
    category: MaintenanceCategory.ELECTRICAL,
    description: 'Faulty outlet near bed area',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.HIGH,
  },
  {
    leaseId: 10,
    createdByUserId: 4,
    assignedStaffId: 8,
    category: MaintenanceCategory.HVAC,
    description: 'Ventilation fan not working properly',
    status: MaintenanceStatus.IN_PROGRESS,
    priority: MaintenancePriority.MEDIUM,
  },
  {
    leaseId: 11,
    createdByUserId: 5,
    assignedStaffId: 9,
    category: MaintenanceCategory.OTHER,
    description: 'Bed frame squeaking',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.LOW,
  },
  {
    leaseId: 12,
    createdByUserId: 6,
    assignedStaffId: 11,
    category: MaintenanceCategory.APPLIANCE,
    description: 'Mini fridge compressor failure',
    status: MaintenanceStatus.RESOLVED,
    priority: MaintenancePriority.MEDIUM,
  },
  {
    leaseId: 13,
    createdByUserId: 7,
    assignedStaffId: 10,
    category: MaintenanceCategory.PLUMBING,
    description: 'Clogged sink drain',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.HIGH,
  },
  {
    leaseId: 14,
    createdByUserId: 1,
    assignedStaffId: 8,
    category: MaintenanceCategory.OTHER,
    description: 'Spider web removal and prevention',
    status: MaintenanceStatus.RESOLVED,
    priority: MaintenancePriority.LOW,
  },
];
