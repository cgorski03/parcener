import { createClientOnlyFn } from '@tanstack/react-start';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}
/*
 * This should be used only for generating ids, across platforms
 * in somewhere like an optimistic updatee
 */
export const generateIdNotCryptographicallySecure = createClientOnlyFn(() => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
});
