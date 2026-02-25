/**
 * Shared role - color-class mapping for role badges.
 * Supports both uppercase ("ADMIN") and lowercase ("admin") role strings.
 */
const roleColorMap: Record<string, string> = {
  admin:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  staff:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  student:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
};

/** Returns Tailwind classes for a given role string. */
export function getRoleBadgeClass(role: string): string {
  return roleColorMap[role.toLowerCase()] ?? "";
}
