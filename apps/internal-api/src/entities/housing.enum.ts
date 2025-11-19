export enum UnitLeaseType {
  ROOM_BASED = 'room_based',
  UNIT_BASED = 'unit_based',
  HYBRID = 'hybrid',
}

export enum OccupantType {
  LEASE_HOLDER = 'lease_holder',
  CO_LEASE_HOLDER = 'co_lease_holder',
  OCCUPANT = 'occupant',
  PENDING = 'pending',
  FORMER = 'former',
}

export enum UnitStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  PARTIALLY_OCCUPIED = 'partially_occupied',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
}

export enum RoomType {
  PRIVATE = 'private',
  SHARED = 'shared',
  MASTER = 'master',
  BEDSPACE = 'bedspace',
}

export enum RoomGenderRestriction {
  MALE = 'male',
  FEMALE = 'female',
  COED = 'coed',
  ANY = 'any',
}

export enum LeaseStatus {
  ACTIVE = 'active',
  TERMINATED = 'terminated',
  EXPIRED = 'expired',
  PENDING_SIGNATURE = 'pending_signature',
  CANCELLED = 'cancelled',
}

export enum PaymentSchedule {
  MONTHLY = 'monthly',
  SEMESTER = 'semester',
  YEARLY = 'yearly',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PAST_DUE = 'past_due',
  WAIVED = 'waived',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK = 'bank',
  CASH = 'cash',
  CHECK = 'check',
  ONLINE_PORTAL = 'online_portal',
}

export enum MaintenanceCategory {}

export enum MaintenancePriority {}
export enum MaintenanceStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
export enum NotificationType {
  MAINTENANCE = 'maintenance',
  PAYMENT = 'payment',
  ASSIGNMENT = 'assignment',
  LEASE = 'lease',
  SYSTEM = 'system',
  REMINDER = 'reminder',
}

export enum NotificationHist {
  NEW = 'new',
  OLD = 'old',
}

export enum DocumentType {
  ID_CARD = "id_card",
  PASSPORT = "passport",
  VACCINATION = "vaccination",
  LEASE_PDF = "lease_pdf",
  MAINTENANCE_IMAGE = "maintenance_image",
  PROFILE_IMAGE = "profile_image",
  OTHER = "other",
}

export enum ApplicationStatus {
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  WAITLISTED = "waitlisted",
  CANCELLED = "cancelled",
}
