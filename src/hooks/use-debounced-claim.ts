import { useState, useRef } from 'react'
import { useClaimItem } from './useClaims'

export function useDebouncedClaim(
  initialQuantity: number,
  roomId: string,
  memberId: string,
  itemId: string,
) {
  const [localQuantity, setLocalQuantity] = useState(initialQuantity)
  const { mutate: claimItem } = useClaimItem(memberId)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  // 5. The Handler
  const updateQuantity = (newQuantity: number) => {
    // A. Update UI Instantly
    setLocalQuantity(newQuantity)

    // B. Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // C. Set new timer (Debounce 500ms)
    timeoutRef.current = setTimeout(() => {
      claimItem({
        roomId,
        receiptItemId: itemId,
        quantity: newQuantity,
      })
    }, 500)
  }

  return {
    quantity: localQuantity,
    updateQuantity,
  }
}
