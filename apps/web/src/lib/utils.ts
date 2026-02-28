import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTerm(term: string | undefined | null) {
  if (!term) return "";
  return term
    .split("_")
    .map((word, index) => {
      // Typically, season is the first word and year is the second
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
