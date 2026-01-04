# Vertical Slice Architecture Refactor Plan

## Overview

You've already started vertical slice migration! This plan completes the refactored architecture.

### Current State

**✅ Already Done**:

- `features/account/` - complete
- `features/invitations/` - complete
- `features/landing/` - complete
- `features/payment-methods/` - complete
- `features/receipt-review/` - complete
- `features/room/` - complete
- `features/upload-receipt/` - complete
- `shared/*` - complete (auth, dto, hooks, lib, observability, server)

**🔴 Urgent Issues**:

- 60+ import errors from broken paths
- `src/components/` still exists (~35 files not moved)
- Cross-feature dependencies not using internal API pattern

---

## Phase 0: Fix Critical Import Errors (DO FIRST)

**Time**: 30-60 minutes | **Risk**: Medium

### Current Issues

1. `features/landing/routes/index.tsx` imports from `@/lib/auth-client` (should be `@/shared/lib/auth-client`)
2. `features/landing/routes/index.tsx` imports from `@/components/landing/*` (should be `@/features/landing/components/*`)
3. `routes/_authed/account.tsx` imports from `@/lib/*` (should be `@/shared/lib/*`)
4. `routes/_authed/account.tsx` imports from `@/components/account/*` (should be `@/features/account/components/*`)
5. `features/receipt-review/server/edit-receipt-service.ts` uses relative `../db/schema` (should be `@/shared/server/db/schema`)
6. `features/room/server/room-service.ts` uses relative imports incorrectly

### Files to Update

**File: `src/features/landing/routes/index.tsx`**

```typescript
// Line 13: OLD
import { authClient } from '@/lib/auth-client'
// Line 13: NEW
import { authClient } from '@/shared/lib/auth-client'

// Lines 16-21: OLD
import { BaseReceiptItemCard } from '@/components/item-card/base-receipt-item-card'
import { PriceBreakdown } from '@/components/price-breakdown'
import { VimConfigCard } from '@/components/landing/vim-config-card'
import { InteractiveDemo } from '@/components/landing/interactive-demo'
import { RealtimeSimulation } from '@/components/landing/realtime-simulation'
import { AccessCTA } from '@/components/landing/acess-cta'
import { Logo } from '@/components/layout/logo'
// Lines 16-21: NEW
import { BaseReceiptItemCard } from '@/shared/components/item-card/base-receipt-item-card'
import { PriceBreakdown } from '@/shared/components/price-breakdown'
import { VimConfigCard } from '@/features/landing/components/vim-config-card'
import { InteractiveDemo } from '@/features/landing/components/interactive-demo'
import { RealtimeSimulation } from '@/features/landing/components/realtime-simulation'
import { AccessCTA } from '@/features/landing/components/acess-cta'
import { Logo } from '@/shared/components/layout/logo'
```

**File: `src/routes/_authed/account.tsx`**

```typescript
// Line 1: OLD
import { PaymentMethodsSection } from '@/components/account/payment-method-section'
import { RecentRooms } from '@/components/account/recent-rooms'
import { RecentUploads } from '@/components/account/recent-uploads'
import { AccountUploadsSection } from '@/components/account/upload-section'
import { AppHeader } from '@/components/layout/app-header'
// Line 1: NEW
import { PaymentMethodsSection } from '@/features/account/components/payment-method-section'
import { RecentRooms } from '@/features/account/components/recent-rooms'
import { RecentUploads } from '@/features/account/components/recent-uploads'
import { AccountUploadsSection } from '@/features/account/components/upload-section'
import { AppHeader } from '@/shared/components/layout/app-header'

// Lines 6-9: OLD
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { logger } from '@/lib/logger'
import { SENTRY_EVENTS } from '@/lib/sentry-events'
// Lines 6-9: NEW
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { authClient } from '@/shared/lib/auth-client'
import { logger } from '@/shared/observability/logger'
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events'
```

**File: `src/features/receipt-review/server/edit-receipt-service.ts`**

```typescript
// Lines 2, 7-20: OLD - Remove all these relative imports:
import { and, eq, exists } from 'drizzle-orm'
import { receipt, receiptItem } from '../db/schema'
import { CreateReceiptItemDto, ReceiptItemDto, ReceiptTotalsDto } from '../dtos'
import { getReceiptWithItems } from '../get-receipt/get-receipt-service'
import { isFailed, receiptNotFound, isProcessing } from '@/lib/receipt-utils'
import {
  RECEIPT_PROCESSING_FAILED,
  NOT_FOUND,
  RECEIPT_PROCESSING,
  NotFoundResponse,
  ReceiptProcessingFailedResponse,
  ReceiptProcessingResponse,
  ReceiptGrandTotalMismatchResponse,
  ReceiptSubtotalMismatchResponse,
} from '../response-types'
import { calculateItemTotal, moneyValuesEqual } from '../money-math'
import { DbTxType, DbType } from '../db'
import { touchRoomFromReceipt } from '../room/room-service'
import { pruneExcessClaimsHelper } from '../room/room-claims-service'
import { receiptItemEntityToDtoHelper } from '../dto-mappers'

// Lines 2, 7-20: NEW - Use absolute imports:
import { and, eq, exists } from 'drizzle-orm'
import { receipt, receiptItem } from '@/shared/server/db/schema'
import {
  CreateReceiptItemDto,
  ReceiptItemDto,
  ReceiptTotalsDto,
} from '@/shared/dto'
import { getReceiptWithItems } from './get-receipt-service'
import { isFailed, receiptNotFound, isProcessing } from './lib/receipt-utils'
import {
  RECEIPT_PROCESSING_FAILED,
  NOT_FOUND,
  RECEIPT_PROCESSING,
  NotFoundResponse,
  ReceiptProcessingFailedResponse,
  ReceiptProcessingResponse,
  ReceiptGrandTotalMismatchResponse,
  ReceiptSubtotalMismatchResponse,
} from '@/shared/server/responses/errors'
import {
  calculateItemTotal,
  moneyValuesEqual,
} from '@/shared/server/utils/money-math'
import { DbTxType, DbType } from '@/shared/server/db'
import { touchRoomFromReceipt } from '../room/room-service' // Keep for now, update in Phase 4
import { pruneExcessClaimsHelper } from '../room/room-claims-service'
import { receiptItemEntityToDtoHelper } from '@/shared/dto/dto-mappers'
```

**File: `src/features/room/server/room-service.ts`**

```typescript
// Lines 2-8: OLD - Remove relative imports
import { eq, and } from 'drizzle-orm'
import { DbTxType, DbType, room, roomMember } from '@/shared/server/db'
import { getReceiptIsValid } from '../get-receipt/get-receipt-service'
import { ROOM_EXISTS_ERROR } from '../response-types'
import { RoomMemberDto } from '../dtos'
import { getRoomMembership } from './room-member-service'
import { RoomIdentity } from '../auth/room-identity'
import { getPaymentMethodSecure } from '../account/payment-method-service'

// Lines 2-8: NEW
import { eq, and } from 'drizzle-orm'
import { DbTxType, DbType, room, roomMember } from '@/shared/server/db'
import { getReceiptIsValid } from '@/features/receipt-review/server/get-receipt-service'
import { ROOM_EXISTS_ERROR } from '@/shared/server/responses/errors'
import { RoomMemberDto } from '@/shared/dto'
import { getRoomMembership } from './room-member-service'
import { RoomIdentity } from '@/shared/auth/server/room-identity'
import { getPaymentMethodSecure } from '../account/payment-method-service' // Keep for now, update in Phase 4
```

### Verification

```bash
pnpm type-check
```

Should pass with 0 errors.

---

## Phase 1: Move Components to Shared (Low Risk)

**Time**: 20-30 minutes | **Risk**: Low

### Commands

```bash
# Create directories
mkdir -p src/shared/components/layout
mkdir -p src/shared/components/common
mkdir -p src/shared/components/item-card
mkdir -p src/shared/components/icons

# Move files
mv src/components/ui/* src/shared/components/ui/
mv src/components/layout/* src/shared/components/layout/
mv src/components/common/* src/shared/components/common/
mv src/components/item-card/* src/shared/components/item-card/
mv src/components/icons/* src/shared/components/icons/
mv src/components/price-breakdown.tsx src/shared/components/
```

### Files Moved

- `src/components/ui/*` → `src/shared/components/ui/` (~20 files)
- `src/components/layout/*` → `src/shared/components/layout/` (~6 files)
- `src/components/common/*` → `src/shared/components/common/` (~3 files)
- `src/components/item-card/*` → `src/shared/components/item-card/` (~4 files)
- `src/components/icons/*` → `src/shared/components/icons/` (~1 file)
- `src/components/price-breakdown.tsx` → `src/shared/components/price-breakdown.tsx`

### Files Already Correct

- `src/components/account/*` → Already in `src/features/account/components/` ✅

### Verification

```bash
pnpm type-check
```

---

## Phase 2: Create Internal API Pattern (High Value)

**Time**: 30-45 minutes | **Risk**: Medium

### Create Internal API Files

**File: `src/features/room/server/internal.ts`**

```typescript
/**
 * INTERNAL SERVER API
 *
 * These functions are for server-to-server calls ONLY.
 * Client code should use RPCs from index.ts.
 * Breaking changes here affect multiple features.
 */

export { touchRoomId } from './room-service'
export {
  GetFullRoomInfo,
  joinRoomAction,
  updateRoomPaymentInformation,
} from './room-service'
export {
  getRoomMembership,
  editRoomMemberDisplayName,
} from './room-member-service'
export {
  getRoomClaimsForRoom,
  pruneExcessClaimsHelper,
} from './room-claims-service'

// Explicitly DO NOT export:
// - RPC functions (createRoomRpc, joinRoomRpc, etc.)
// - Internal helper functions
```

**File: `src/features/receipt-review/server/internal.ts`**

```typescript
/**
 * INTERNAL SERVER API
 */

export {
  editReceiptItem,
  createReceiptItem,
  deleteReceiptItem,
  finalizeReceiptTotals,
} from './edit-receipt-service'
export { getReceiptWithItems, getReceiptIsValid } from './get-receipt-service'

// Explicitly DO NOT export RPC functions
```

**File: `src/features/account/server/internal.ts`**

```typescript
/**
 * INTERNAL SERVER API
 */

export { getPaymentMethodSecure } from './account-rpc'
// Export other functions as needed for cross-feature calls

// Explicitly DO NOT export RPC functions
```

### Update Cross-Feature Imports

**File: `src/features/receipt-review/server/edit-receipt-service.ts`**

```typescript
// Line 22: OLD
import { touchRoomFromReceipt } from '../room/room-service';

// Line 22: NEW
import { touchRoomId } from '@/features/room/server/internal';

// Update function call (line 68, 106, 206):
await touchRoomFromReceipt(tx, receiptId) → await touchRoomId(tx, receiptId)
```

**File: `src/features/room/server/room-service.ts`**

```typescript
// Line 8: OLD
import { getPaymentMethodSecure } from '../account/payment-method-service'

// Line 8: NEW
import { getPaymentMethodSecure } from '@/features/account/server/internal'
```

### Verification

```bash
pnpm type-check
```

---

## Phase 3: Verify Routes (Low Risk)

**Time**: 15-20 minutes | **Risk**: Low

### Check Each Route File

**Already Correct**:

- `routes/__root.tsx` ✅
- `routes/index.tsx` ✅ (re-exports from features/landing)
- `routes/_authed/route.tsx` ✅ (auth wrapper)

**Check These**:

**File: `routes/login.tsx`**

```typescript
// Should be a thin re-export:
export { default } from '@/features/landing/routes/login' // Or create auth/routes/login.tsx
```

**File: `routes/_authed/upload.tsx`**

```typescript
// Check imports are using @/shared/components/ui/* and @/features/upload-receipt/components/*
```

**File: `routes/_authed/receipt.review.$receiptId.tsx`**

```typescript
// Check imports are using @/shared/components/* and @/features/receipt-review/components/*
```

**File: `routes/_authed/acceptInvite.tsx`**

```typescript
// Check imports are using @/shared/components/* and @/features/invitations/components/*
```

**File: `routes/receipt/parce/$roomId.tsx`**

```typescript
// Check imports are using @/shared/components/* and @/features/room/components/*
```

**File: `routes/receipt/parce/route.tsx`**

```typescript
// Check this file exists and is correct
```

### Verification

```bash
pnpm type-check
```

---

## Phase 4: Clean Up (Low Risk)

**Time**: 5 minutes | **Risk**: Very Low

### Delete Old Components Folder

```bash
# After all imports are verified working
rm -rf src/components
```

### Verification

```bash
# Run full check suite
pnpm type-check
pnpm lint
pnpm build
```

---

## Optional Phases (Can Skip)

### Phase 5: Create Auth Feature (Optional)

**Status**: Already exists in `features/landing/`
**Decision**: Current approach (landing page in landing/) is fine. Can create dedicated `features/auth/` if desired.

---

### Phase 6: Complete Recent Activity (Optional)

**Status**: Only has server/ folder
**Task**: Check if this feature needs UI. If not, can leave as-is or remove.

---

## TypeScript Path Configuration

After completing Phases 0-4, update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/features/*": ["./src/features/*"]
    }
  }
}
```

---

## Testing After Each Phase

1. **Phase 0**: `pnpm type-check` (must have 0 errors)
2. **Phase 1**: `pnpm type-check` + `pnpm build`
3. **Phase 2**: `pnpm type-check` + `pnpm build`
4. **Phase 3**: `pnpm type-check` + `pnpm build`
5. **Phase 4**: `pnpm type-check` + `pnpm lint` + `pnpm build`

---

## Manual Testing Checklist

After all phases, test these flows:

- [ ] Login works
- [ ] Account page loads correctly
- [ ] Upload receipt works
- [ ] Receipt review/edit works
- [ ] Room creation works
- [ ] Room joining works (as user and guest)
- [ ] Item claiming works
- [ ] Settlement calculation works

---

## Summary

**Total Estimated Time**: 1.5-2.5 hours
**Files Created**: ~5 (internal.ts files)
**Files Moved**: ~35
**Files Updated**: ~15-20
**Files Deleted**: 1 (src/components/)

**Risks**:

- 🔴 Phase 0: Medium (many import changes)
- 🟢 Phase 1: Low (file moves)
- 🟡 Phase 2: Medium (cross-feature dependencies)
- 🟢 Phase 3: Low (verification)
- 🟢 Phase 4: Very Low (delete folder)

---

## Approval Needed

Please review this plan and confirm:

- [ ] Approve Phase 0 (Fix imports)
- [ ] Approve Phase 1 (Move components)
- [ ] Approve Phase 2 (Internal APIs)
- [ ] Approve Phase 3 (Verify routes)
- [ ] Approve Phase 4 (Cleanup)

Once approved, I will execute phases sequentially, testing after each phase.
