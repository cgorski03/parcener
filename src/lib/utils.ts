import { createClientOnlyFn } from '@tanstack/react-start'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/*
 * This should be used only for generating ids, across platforms
    * in somewhere like an optimistic updatee
    */
export const generateIdNotCryptographicallySecure = createClientOnlyFn(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
});
