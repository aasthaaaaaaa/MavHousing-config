/**
 * Shared status & priority color classes for all badge/pill elements.
 * Always pair with Badge variant="outline" when used with the Badge component.
 *
 * Semantic palette:
 *   green  → positive / active / approved / resolved
 *   blue   → in-flight / submitted / signed / in-progress
 *   amber  → pending / waiting / open / under-review
 *   red    → negative / rejected / terminated / failed / emergency
 *   orange → high-priority warning
 *   muted  → neutral / draft / completed / closed
 */

const green =
  'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
const blue =
  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
const amber =
  'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
const red =
  'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
const orange =
  'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
const muted = 'bg-muted text-muted-foreground border-border';
const purple =
  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';

// ─── Application statuses ──────────────────────────────────────────────────
const applicationStatusMap: Record<string, string> = {
  DRAFT: muted,
  SUBMITTED: blue,
  UNDER_REVIEW: amber,
  APPROVED: green,
  REJECTED: red,
};

export function getApplicationStatusClass(status: string): string {
  return applicationStatusMap[status] ?? muted;
}

// ─── Lease statuses ────────────────────────────────────────────────────────
const leaseStatusMap: Record<string, string> = {
  DRAFT: muted,
  PENDING_SIGNATURE: amber,
  SIGNED: blue,
  ACTIVE: green,
  COMPLETED: muted,
  TERMINATED: red,
};

/** Human-readable label for lease status (handles underscores). */
export const leaseStatusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_SIGNATURE: 'Pending Signature',
  SIGNED: 'Signed',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  TERMINATED: 'Terminated',
};

export function getLeaseStatusClass(status: string): string {
  return leaseStatusMap[status] ?? muted;
}

// ─── Maintenance statuses ──────────────────────────────────────────────────
const maintenanceStatusMap: Record<string, string> = {
  OPEN: amber,
  IN_PROGRESS: blue,
  RESOLVED: green,
  CLOSED: muted,
};

export function getMaintenanceStatusClass(status: string): string {
  return maintenanceStatusMap[status] ?? muted;
}

// ─── Priorities ────────────────────────────────────────────────────────────
const priorityMap: Record<string, string> = {
  LOW: green,
  MEDIUM: amber,
  HIGH: orange,
  EMERGENCY: red,
};

export function getPriorityClass(priority: string): string {
  return priorityMap[priority] ?? muted;
}

// ─── Payment status ────────────────────────────────────────────────────────
export function getPaymentStatusClass(isSuccessful: boolean): string {
  return isSuccessful ? green : red;
}

// ─── Occupant / lease-role types ──────────────────────────────────────────
const occupantTypeMap: Record<string, string> = {
  LEASE_HOLDER: blue,
  ROOMMATE: purple,
  OCCUPANT: green,
};

export function getOccupantTypeClass(type: string): string {
  return occupantTypeMap[type] ?? muted;
}
