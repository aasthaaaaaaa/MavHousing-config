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
    preferredPropertyId: 3, // Heights on Pecan - East Building
    submissionDate: new Date('2024-12-15'),
  },
  {
    userId: 6, // Christopher
    term: 'Fall 2025',
    status: ApplicationStatus.APPROVED,
    preferredPropertyId: 3, // Heights on Pecan - East Building
    submissionDate: new Date('2024-12-06'),
  },
  {
    userId: 7, // Alicia
    term: 'Fall 2025',
    status: ApplicationStatus.APPROVED,
    preferredPropertyId: 5, // Timber Brooks - East Wing
    submissionDate: new Date('2024-12-09'),
  },
];

export const mockLeases = [
  // ============================================
  // consolidated leases
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
];

export const mockOccupants = [
  // Lease 1: John's unit (John + Aalok)
  {
    leaseId: 1,
    userId: 2, // John
    occupantType: OccupantType.LEASE_HOLDER,
    moveInDate: new Date('2025-01-15'),
  },
  {
    leaseId: 1,
    userId: 1, // Aalok
    occupantType: OccupantType.OCCUPANT,
    moveInDate: new Date('2025-01-14'),
  },
  // Lease 2: Emily's unit (Emily + Christopher)
  {
    leaseId: 2,
    userId: 3, // Emily
    occupantType: OccupantType.LEASE_HOLDER,
    moveInDate: new Date('2025-01-14'),
  },
  {
    leaseId: 2,
    userId: 6, // Christopher
    occupantType: OccupantType.ROOMMATE,
    moveInDate: new Date('2025-01-15'),
  },
  // Lease 3: Sophia's unit (Sophia + Alicia)
  {
    leaseId: 3,
    userId: 5, // Sophia
    occupantType: OccupantType.LEASE_HOLDER,
    moveInDate: new Date('2025-01-15'),
  },
  {
    leaseId: 3,
    userId: 7, // Alicia
    occupantType: OccupantType.ROOMMATE,
    moveInDate: new Date('2025-01-16'),
  },
  // Lease 4: Michael's solo unit
  {
    leaseId: 4,
    userId: 4, // Michael
    occupantType: OccupantType.LEASE_HOLDER,
    moveInDate: new Date('2025-01-15'),
  },
];

export const mockPayments = [
  // LEASE 1
  {
    leaseId: 1,
    amountPaid: 9000.0,
    method: PaymentMethod.BANK_TRANSFER,
    isSuccessful: true,
  },
  // LEASE 2
  {
    leaseId: 2,
    amountPaid: 9000.0,
    method: PaymentMethod.CREDIT_CARD,
    isSuccessful: true,
  },
  // LEASE 3
  {
    leaseId: 3,
    amountPaid: 9000.0,
    method: PaymentMethod.BANK_TRANSFER,
    isSuccessful: true,
  },
  // LEASE 4
  {
    leaseId: 4,
    amountPaid: 9000.0,
    method: PaymentMethod.CHECK,
    isSuccessful: true,
  },
];

export const mockMaintenanceRequests = [
  {
    leaseId: 1,
    createdByUserId: 2, // John
    assignedStaffId: 8,
    category: MaintenanceCategory.PLUMBING,
    description: 'Leaky shower head in Unit 101',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.MEDIUM,
  },
  {
    leaseId: 2,
    createdByUserId: 3, // Emily
    assignedStaffId: 9,
    category: MaintenanceCategory.HVAC,
    description: 'AC not cooling properly in Unit 102',
    status: MaintenanceStatus.IN_PROGRESS,
    priority: MaintenancePriority.HIGH,
  },
  {
    leaseId: 3,
    createdByUserId: 5, // Sophia
    assignedStaffId: 8,
    category: MaintenanceCategory.ELECTRICAL,
    description: 'Light fixture flickering in South Unit 101',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.LOW,
  },
  {
    leaseId: 4,
    createdByUserId: 4, // Michael
    assignedStaffId: 8,
    category: MaintenanceCategory.APPLIANCE,
    description: 'Microwave not heating in Unit 103 (ADA)',
    status: MaintenanceStatus.RESOLVED,
    priority: MaintenancePriority.MEDIUM,
  },
];
