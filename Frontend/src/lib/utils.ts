import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusionne des classes Tailwind proprement. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
