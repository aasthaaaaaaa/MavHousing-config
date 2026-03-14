import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTerm(term: string | undefined | null) {
  if (!term) return '';
  return term
    .split('_')
    .map((word, index) => {
      // Typically, season is the first word and year is the second
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function getErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";
  if (typeof error === 'string') return error;
  
  if (typeof error === 'object') {
    // Handle Axios/Fetch error responses
    const data = error.response?.data || error;
    const msg = data.message;
    
    if (msg) {
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg)) return msg[0];
      if (typeof msg === 'object' && msg.message) {
        return typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message);
      }
    }
    if (data.error && typeof data.error === 'string') return data.error;
    if (error.message && typeof error.message === 'string') return error.message;
  }
  
  return "An unexpected error occurred.";
}
