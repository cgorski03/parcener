# Feature: Complete Room Lifecycle (Lock Room + Payment Tracking)

## Decisions Made

| Question                 | Decision                                                  |
| ------------------------ | --------------------------------------------------------- |
| Lock vs Payment tracking | **Separate features** - independent of each other         |
| Payment UX               | **Host marks paid** - simple checklist, trust-based       |
| Partial payments         | **No** - binary paid/not-paid only                        |
| Lock permissions         | **Creator only** - only receipt uploader can lock/unlock  |
| Creator in payment list  | **Exclude** - only show other members who owe the creator |

---

## Problem Statement

The current lifecycle has a gap after settlement:

```
Receipt Upload → OCR Processing → Review/Edit → Create Room → Join/Claim → Settlement View → ???
```

**What's missing:**

1. No way to mark a room as "done" / locked
2. No tracking of who has paid whom
3. Rooms exist forever in an ambiguous state
4. No closure or finalization

---

## Feature 1: Lock Room

### Behavior

- **Only the room creator** (person who uploaded the receipt) can lock/unlock
- Locking prevents accidental changes after everyone has settled
- Can lock regardless of payment status (separate features)

### What Locking Does

- Disables item claiming UI (read-only mode)
- Shows clear "Locked" / "Finalized" indicator
- Still allows viewing settlement breakdown
- Still allows marking payments (if that feature is enabled)

### Unlock Flow

- Only creator sees unlock option
- Confirmation dialog: "This will reopen the room for editing"
- Use case: Someone realized they claimed the wrong item

---

## Feature 2: Payment Tracking

### Behavior

- **Host marks paid** - simple checkbox per member
- Binary: paid or not paid (no partial amounts)
- Works independently of lock status
- Trust-based (host is assumed honest)

### Who is the "Host"?

- The room creator (same as lock permissions)
- They typically paid the bill upfront and collect from others
- **Creator is excluded from the "who owes" list** - they don't owe themselves

### What Members See

- Their payment status: "Awaiting Payment" or "Marked as Paid"
- Venmo button still available regardless of status

---

## Data Model Changes

### Room Table Additions

```sql
ALTER TABLE room ADD COLUMN status TEXT DEFAULT 'active'; -- 'active' | 'locked'
ALTER TABLE room ADD COLUMN lockedAt TIMESTAMP;
```

Note: `createdBy` already exists and identifies the creator who has lock/unlock permissions.

### New: Room Member Payment Status

Option A - Add to existing `roomMember` table:

```sql
ALTER TABLE roomMember ADD COLUMN isPaid BOOLEAN DEFAULT false;
ALTER TABLE roomMember ADD COLUMN paidAt TIMESTAMP;
```

Option B - Separate payment table (more flexible for future):

```sql
CREATE TABLE roomPayment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roomId UUID REFERENCES room(id) ON DELETE CASCADE,
  memberId UUID REFERENCES roomMember(id) ON DELETE CASCADE,
  isPaid BOOLEAN DEFAULT false,
  paidAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(roomId, memberId)
);
```

**Recommendation:** Option A (simpler, payment is 1:1 with member)

---

## UI/UX Flow

### Settlement View - Creator/Host View

```
┌─────────────────────────────────────────┐
│ Collecting Payments                     │
│ ─────────────────────────────────────── │
│                                         │
│ ☐ Alice        $25.50                   │
│ ☑ Bob          $18.75  ✓ Paid           │
│ ☐ Carol        $31.00                   │
│                                         │
│ Collected: $18.75 of $75.25             │
│                                         │
│ ─────────────────────────────────────── │
│ [Lock Room]                             │
└─────────────────────────────────────────┘
```

### Settlement View - Member View

```
┌─────────────────────────────────────────┐
│ Your Share                              │
│ ─────────────────────────────────────── │
│                                         │
│ Total: $25.50                           │
│ Status: ⏳ Awaiting Payment             │
│    or: ✓ Marked as Paid                 │
│                                         │
│ [Pay $25.50 on Venmo]                   │
└─────────────────────────────────────────┘
```

### Locked Room Banner

```
┌─────────────────────────────────────────┐
│ 🔒 This room has been finalized         │
│                                         │
│ [Read-only view of items/settlement]    │
│                                         │
│ (Creator only sees: [Unlock Room])      │
└─────────────────────────────────────────┘
```

### Items View When Locked

- Item cards are non-interactive (no claim buttons)
- Visual indication: grayed out or subtle lock icons
- Can still see who claimed what

---

## Implementation Plan

### Phase 1: Lock Room

1. **Schema**: Add `status` (enum: 'active' | 'locked') and `lockedAt` to room table
2. **Migration**: Create drizzle migration
3. **Service**: Add `lockRoom` and `unlockRoom` functions in room-service.ts
4. **API**: Add server functions for lock/unlock
5. **UI - Banner**: Create `LockedRoomBanner` component
6. **UI - Items**: Disable claiming when room is locked
7. **UI - Settlement**: Add "Lock Room" button for creator
8. **UI - Header**: Show lock status indicator

### Phase 2: Payment Tracking

1. **Schema**: Add `isPaid` and `paidAt` to roomMember table
2. **Migration**: Create drizzle migration
3. **Service**: Add `markMemberPaid` function
4. **API**: Add server function for marking payments
5. **UI - Settlement**: Add payment checkboxes for host
6. **UI - Settlement**: Show payment status for members
7. **UI - Settlement**: Show collection progress for host

### Phase 3: Polish (Optional/Future)

- Dashboard: Filter by active/locked rooms
- Dashboard: Show "X of Y paid" on room cards
- Notifications: Alert when room is locked
- History: Show when payments were marked

---

## Files to Modify

### Schema & Database

- `src/shared/server/db/schema.ts` - Add status, lockedAt to room; isPaid, paidAt to roomMember

### Services

- `src/features/room/server/room-service.ts` - Add lockRoom(), unlockRoom()
- `src/features/room/server/room-member-service.ts` - Add markMemberPaid()

### API/Server Functions

- `src/features/room/server/room.api.ts` - Add lock/unlock endpoints
- Or create new file for payment endpoints

### UI Components

- `src/features/room/components/settlement-view.tsx` - Payment checkboxes, lock button
- `src/features/room/components/active-room-screen.tsx` - Locked state handling
- `src/features/room/components/collaborative-room-header.tsx` - Lock status indicator
- New: `src/features/room/components/locked-room-banner.tsx`

### Hooks

- `src/features/room/hooks/use-room.ts` - Add useLockRoom, useUnlockRoom mutations
- `src/features/room/hooks/use-room.ts` - Add useMarkPaid mutation

### Types/DTOs

- `src/shared/dto/types.ts` - Update room DTOs to include status, payment info
