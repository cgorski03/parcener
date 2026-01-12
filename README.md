# Parcener - Collaborative Receipt Splitting

[![CI](https://github.com/cgorski03/parcener/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/cgorski03/parcener/actions/workflows/ci.yml)
[![CI](https://github.com/cgorski03/parcener/actions/workflows/ci.yml/badge.svg?branch=staging)](https://github.com/cgorski03/parcener/actions/workflows/ci.yml)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-Vitest-blue)]()
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-Playwright-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)]()
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)]()

Parcener is a web application that allows users to upload receipt photos, automatically processes them using AI, and creates collaborative rooms where friends can split expenses in real-time.

The application is designed to be used on-the-spot and as such UI design is heavily mobile-first. It looks sort of strange on desktop. Usable, but kind of like when they first came out with the iPad, and there were a ton of apps not designed for it and there was that little button in the corner to zoom in on an iPhone app and it led to a strange UI.

## Tech Stack

### Frontend

- **Framework**: React 19.2.0
- **Routing**: TanStack Start 1.132.0 (file-based routing)
- **State Management**: TanStack Query 5.90.7
- **Styling**: Tailwind CSS 4.0.6
- **UI Components**: Radix UI primitives (shadcn/ui)
- **Icons**: Lucide React

### Backend

- **Runtime**: Cloudflare Workers
- **ORM**: Drizzle ORM 0.44.7
- **Database**: PostgreSQL with Cloudflare Hyperdrive
- **AI**: Google Gemini Flash (gemini-3-flash-preview)
- **Auth**: Better Auth 1.4.7 with guest support
- **Observability**: Sentry 10.32.1

### Infrastructure

- **Storage**: Cloudflare R2 (receipt images)
- **Queue**: Cloudflare Queues (async processing)
- **Deployment**: Cloudflare Workers with custom domains

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Runtime                  │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │   Frontend (React)  │    │   Backend (Services)       │  │
│  │   - TanStack Router │    │   - RPC Endpoints          │  │
│  │   - TanStack Query  │    │   - Business Logic         │  │
│  │   - Components      │    │   - Middleware             │  │
│  └──────────┬──────────┘    └──────────┬─────────────────┘  │
│             │                          │                    │
│  ┌──────────┴──────────────────────────┴──────────┐         │
│  │              Cloudflare Services               │         │
│  │  - PostgreSQL (via Hyperdrive)                 │         │
│  │  - R2 (image storage)                          │         │
│  │  - Queues (async processing)                   │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘

Data Flow:
React Components → Custom Hooks → RPC → Service Layer → Drizzle ORM → PostgreSQL
                                    ↓ (async jobs)
                            Cloudflare Queue → AI Processing (Gemini)
```

### Directory Structure

The project follows a **Vertical Slice Architecture** where features are self-contained modules with their own components, hooks, server logic, and tests.

#### Features (`src/features/`)

Each feature is a complete vertical slice containing everything it needs:

```
src/features/{feature-name}/
├── components/           # Feature-specific UI components
├── hooks/                # Feature-specific React hooks
├── routes/               # Feature-specific route files
├── server/               # Feature-specific backend logic
│   ├── *.service.ts      # Business logic (pure functions)
│   ├── *.service.test.ts # Service unit tests
│   ├── *.rpc.ts          # RPC endpoints (TanStack Router)
│   ├── internal.ts       # Server-to-server APIs (cross-feature)
│   └── dtos.ts           # Feature DTOs/schemas
└── *.e2e.ts              # Feature E2E tests
```

**Available Features:**

- `account/` - User account management and rate limits
- `auth/` - Authentication routes (login, signup)
- `dashboard/` - Recent activity widgets and lists
- `invitations/` - Invite creation, acceptance, and management
- `landing/` - Landing page with interactive demo
- `payment-methods/` - Venmo payment method management
- `receipt-review/` - Receipt editing, item management, settlement
- `room/` - Collaborative room features, claims, membership
- `upload-receipt/` - Receipt upload, AI processing, queue handling

#### Shared (`src/shared/`)

Cross-cutting concerns used across features:

```
src/shared/
├── auth/           # Auth configuration, middleware, schemas
├── components/     # Shared UI components
│   ├── ui/         # shadcn/ui primitives
│   ├── layout/     # App shells, headers, navigation
│   ├── common/     # Share buttons, QR codes
│   └── item-card/  # Receipt item cards (shared across features)
├── dto/            # Shared DTOs, mappers, and types
├── hooks/          # Shared hooks (use-user, use-mobile, use-receipt-settlement)
├── lib/            # Shared utilities
│   ├── money-math.test.ts  # Financial calculations with precision
│   ├── validation.test.ts  # Zod validation schemas
│   ├── auth-client.ts      # Better Auth client
│   ├── query-client.ts     # React Query setup
│   ├── utils.ts            # General utilities
│   └── sentry-client.ts    # Frontend error tracking
├── observability/  # Logger, Sentry integration
│   ├── logger.ts
│   ├── sentry-client.ts
│   ├── sentry-events.ts
│   └── server/sentry-middleware.ts
└── server/         # Shared server code
    ├── db/         # Database schema, connection, Drizzle config
    ├── responses/  # Standardized error responses
    └── utils/      # Time utilities
```

#### Routes (`src/routes/`)

File-based routing using TanStack Router:

- `__root.tsx` - Root route with HTML shell and meta tags
- `index.tsx` - Landing page (delegates to `features/landing`)
- `login.tsx` - Google OAuth login (delegates to `features/auth`)
- `_authed/` - Protected routes
  - `account.tsx` - Account management (`features/account`)
  - `upload.tsx` - Receipt upload (`features/upload-receipt`)
  - `receipt.review.$receiptId.tsx` - Receipt review (`features/receipt-review`)
  - `acceptInvite.tsx` - Accept invitation (`features/invitations`)
- `receipt/parce/$roomId.tsx` - Collaborative room (guest access, `features/room`)

#### Test Infrastructure (`src/test/`)

Comprehensive testing setup:

```
src/test/
├── setup.ts                   # Vitest setup (DB reset, env stubbing)
├── env.d.ts                   # TypeScript declarations for test env
├── e2e/
│   ├── global-setup.ts        # E2E global setup (DB reset)
│   ├── fixtures.ts            # Auth fixtures (authenticateAs, etc.)
│   ├── db.ts                  # E2E database connection
│   ├── helpers.ts             # E2E test helpers
│   └── *.e2e.ts               # Feature E2E tests
├── factories/
│   ├── index.ts
│   ├── user.ts                # User factory
│   ├── room.ts                # Room factory
│   └── receipt.ts             # Receipt factory
├── fixtures/
│   └── ai-responses/          # Mock AI responses for testing
└── helpers/
    └── truncate-tables.ts     # Proper CASCADE truncation order
```

### API Architecture

**RPC-First Architecture** with middleware chain:

```typescript
export const getUserInviteRateLimitRpc = createServerFn({ method: 'GET' })
  .middleware([
    nameTransaction('getUserInviteRateLimit'),
    protectedFunctionMiddleware,
    canUploadMiddleware,
  ])
  .handler(async ({ context }) => {
    return await getUserInviteRateLimit(context.db, context.user);
  });
```

**Middleware Chain:**

1. `nameTransaction()` - Sentry transaction naming
2. `protectedFunctionMiddleware` - Authentication guard
3. Feature-specific middleware (e.g., `canUploadMiddleware`, `canInviteMiddleware`)

**RPC Endpoints by Feature:**

- **Account**: getUser, getUserRecentReceipts, getUserRecentRooms, createInvite, acceptInvite
- **Auth**: signIn, signUp, signOut
- **Invitations**: createInvite, acceptInvite, getInvites
- **Payment Methods**: getPaymentMethods, addPaymentMethod, removePaymentMethod
- **Processing**: uploadReceipt (enqueues to Cloudflare Queue)
- **Receipt**: getReceipt, getReceiptIsValid, editReceiptItem, createReceiptItem, deleteReceiptItem
- **Room**: getRoomAndMembership, getRoomPulse, createRoom, joinRoom, claimItem, upgradeGuestToUser
- **Upload**: uploadReceipt, checkRateLimit

### Cross-Feature Dependencies (Exceptions to Vertical Slice)

While the codebase aims for pure vertical slices, some cross-feature dependencies are unavoidable. These are explicitly documented in `internal.ts` files within each feature's `server/` directory.

**The Internal Pattern:**

```typescript
// src/features/{feature}/server/internal.ts
/**
 * INTERNAL SERVER API - {Feature} Feature
 *
 * These functions are for server-to-server calls ONLY.
 * Client code should use RPCs from *.rpc.ts.
 *
 * Consumers:
 * - features/{other-feature}
 */
export { functionName } from './service-name';
```

**Known Cross-Feature Dependencies:**

1. **Room → Receipt-Review**
   - **Dependency:** `getReceiptState()` from `receipt-review/server/internal`
   - **Used in:** `room/server/room-service.ts` - `createRoom()`
   - **Purpose:** Validates receipt is ready before creating a room (checks processing status, ownership)

   ```typescript
   const response = await getReceiptState(db, receiptId, userId);
   if (response.status !== 'valid') {
     return { success: false, error: 'receipt_not_valid' };
   }
   ```

2. **Room → Payment-Methods**
   - **Dependency:** `getPaymentMethodSecure()` from `payment-methods/server/internal`
   - **Used in:** `room/server/room-service.ts` - `createRoom()`
   - **Purpose:** Verifies payment method belongs to user and is valid

   ```typescript
   const method = await getPaymentMethodSecure(db, userId, paymentMethodId);
   if (!method) {
     return { success: false, error: 'invalid_payment_method' };
   }
   ```

3. **Receipt-Review → Room**
   - **Dependencies:** `touchRoomFromReceipt()`, `pruneExcessClaimsHelper()` from `room/server/internal`
   - **Used in:** `receipt-review/server/edit-receipt-service.ts`
   - **Purpose:**
     - `touchRoomFromReceipt()` - Updates room `updatedAt` when receipt is edited (triggers polling refresh)
     - `pruneExcessClaimsHelper()` - Handles edge case where item quantity is reduced below claimed amount

   ```typescript
   // When editing an item, sync the room timestamp
   await touchRoomFromReceipt(tx, item.receiptId);

   // Handle quantity reduction edge case
   await pruneExcessClaimsHelper(tx, item.receiptItemId, item.quantity);
   ```

**Why These Dependencies Exist:**

- **Receipt-Review → Room**: A receipt and its room are logically coupled. Editing a receipt should notify the room. The quantity pruning requires accessing claim data that lives in the room domain.

- **Room → Receipt-Review**: Rooms are created from receipts. Validation of receipt readiness must happen in the room creation flow, requiring access to receipt processing status.

- **Room → Payment-Methods**: Room creation optionally accepts a payment method, requiring verification that the method belongs to the creating user.

**Design Notes:**

- These are strictly server-to-server calls. Client code always goes through RPCs.
- The `internal.ts` file serves as a clear API boundary and documentation point.
- Cross-feature dependencies should be minimized - prefer RPCs where possible.
- When adding new features, first try to solve the problem via RPC. Only create `internal.ts` exports when RPC would create circular dependencies or unacceptable performance overhead.

**Service Layer Pattern:**

Pure business logic functions with injected dependencies:

```typescript
export async function createUploadInvitation(
  db: DbType, // Injected database
  appUser: AppUser, // Injected user
) {
  // Business logic - no framework dependencies
}
```

## Features

### Implemented

- **Receipt Processing**: AI-powered receipt parsing with Google Gemini Flash
  - Upload images (max 5MB)
  - Automatic extraction of items, prices, and totals
  - Processing via Cloudflare Queues (async)
  - Distributed tracing with Sentry

- **Collaborative Rooms**: Real-time expense splitting with friends
  - Polling-based real-time updates (3-second intervals)
  - Delta sync (only fetch changes since last poll)
  - Shareable room links
  - QR code generation for easy sharing

- **Guest Support**: Anonymous users can join and participate
  - Cookie-based identity persistence
  - Seamless guest → authenticated user upgrade
  - Full feature parity with authenticated users

- **Manual Editing**: Fix AI mistakes with intuitive UI
  - Add, edit, delete receipt items
  - Validate totals (subtotal + tax + tip = grand total)
  - Edit receipt totals before finalizing

- **Flexible Claims**: Split items by quantity
  - Claim partial quantities (e.g., "I had 2 of 4 tacos")
  - Real-time claim synchronization
  - Optimistic UI updates
  - Debounced updates to reduce server load

- **Settlement Calculation**: Automatic payment breakdown
  - Proportional tax and tip distribution
  - Per-person totals
  - Clear settlement overview

- **Rate Limiting**: Fair usage enforcement
  - 3 uploads per day
  - 3 invitations per day
  - Invitation system for new users

- **Payment Methods**: Venmo integration
  - Add/remove payment methods
  - View payment information in settlement

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test -- --reporter verbose

# Watch mode
pnpm test:watch
```

**Test Coverage:**

- `money-math.test.ts` - Financial calculations with precision
- `validation.test.ts` - Zod validation schemas
- Service tests for all major features
- Auth helper tests

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run with Playwright UI
pnpm test:e2e:ui

# Install browsers and run (CI)
pnpm test:e2e:ci
```

**E2E Test Fixtures:**

- `authenticateAs(user)` - Creates and authenticates a user
- `authenticateAsUploader()` - User with upload permissions
- `authenticateAsRestrictedUser()` - User awaiting invite

**E2E Tests:**

- `invite-system.e2e.ts` - Full invite creation and acceptance flow
- `upload-receipt.e2e.ts` - Upload to settlement flow
- `payment-methods.e2e.ts` - Payment method management
- `room-basic-states.e2e.ts` - Room lifecycle and states

### Test Utilities

**Factories** (`src/test/factories/`):

- `user.ts` - Create test users with various states
- `room.ts` - Create rooms with members and claims
- `receipt.ts` - Create receipts with items and processing status

**Test Images** (`public/test-images/`):

- `valid-receipt.jpg` - Properly formatted receipt
- `invalid.pdf` - Invalid file format
- `large-receipt.jpg` - Large file test (6MB)

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm package manager
- Cloudflare account (for Workers, R2, Queues, Hyperdrive)
- PostgreSQL database (local or managed)
- Google Cloud API key (for Gemini AI)
- Google OAuth credentials (for authentication)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database and API keys

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Development Scripts

```bash
# Development
pnpm dev              # Start dev server (port 3000)
pnpm dev:test         # Start dev server with test env
pnpm build            # Build for production
pnpm preview          # Preview production build locally

# Testing
pnpm test             # Run unit tests (Vitest)
pnpm test:e2e         # Run E2E tests (Playwright)
pnpm test:e2e:ui      # Run E2E tests with UI
pnpm test:e2e:ci      # Install browsers and run E2E (CI)

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations (uses .env.local)
pnpm db:migrate:dev   # Run migrations (dev environment)
pnpm db:migrate:prod  # Run migrations (production environment)
pnpm db:migrate:test  # Run migrations (test database)

# Code Quality
pnpm type-check       # TypeScript type checking (no emit)
pnpm lint             # Run ESLint
pnpm format           # Run Prettier
pnpm check            # Format + lint in one command

# Cloudflare
pnpm cf-typegen       # Generate Cloudflare Worker types

# Deployment
pnpm deploy           # Deploy to production
pnpm deploy:staging   # Deploy to staging
```

## Architecture Details

### Data Flow

```
User Interaction
↓
React Component
↓
Custom Hook (use-*.ts)
├─> React Query Cache (optimistic update)
│ ↓
│ UI Update (instant)
│
└─> RPC Call (via TanStack Router)
↓
Middleware (auth, rate limiting, tracing)
↓
Service Layer
↓
Database (Drizzle ORM + Hyperdrive)
↓
Response
↓
React Query Cache Update
↓
Component Re-render
```

### Polling Strategy

- **Receipt Processing**: 2-second polling until status != "processing"
- **Room Updates**: 3-second polling with delta sync (since timestamp)
- Only fetches changed data to minimize bandwidth

### Key Services

#### Receipt Processing Pipeline

1. **Upload**: User uploads receipt image
2. **Storage**: Image stored in Cloudflare R2
3. **Queue**: Processing job queued
4. **AI**: Google Gemini extracts items and totals
5. **Validation**: Manual review and editing
6. **Room Creation**: Shareable room generated

#### Room Management

- **Real-time Updates**: Live claim synchronization
- **Guest Support**: Cookie-based identity persistence
- **Flexible Membership**: Users and guests can coexist
- **Identity Upgrades**: Seamless guest → user transition

### Database Schema

**Core Tables:**

- `user` - User accounts (auth via Better Auth)
- `session` - User sessions (auth)
- `account` - User account data (Venmo, rate limits)
- `invite` - Shareable invitations (create/redeem tracking)
- `receipt` - Receipt headers (subtotal, tax, tip, grand_total)
- `receipt_item` - Line items (name, price, quantity, interpreted_text)
- `receipt_processing_information` - AI metadata (status, model, tokens, errors)
- `room` - Collaborative rooms (linked 1:1 with receipts)
- `room_member` - Room participants (users OR guests)
- `claim` - Item ownership claims (member_id, receipt_item_id, quantity)
- `payment_method` - User payment methods (Venmo)

**Relationships:**

- User → Receipt (1:N)
- Receipt → ReceiptItem (1:N)
- Receipt → Room (1:1)
- Room → RoomMember (1:N)
- RoomMember → Claim (1:N)
- Claim → ReceiptItem (N:1)
- User → Invite (as creator, 1:N)
- User → Invite (as redeemer, 1:N)

**Unique Constraints:**

- RoomMember: (room_id, user_id) or (room_id, guest_uuid)
- Claim: (room_id, member_id, receipt_item_id)
- Room: (receipt_id)

## Deployment

### Cloudflare Stack

- **Workers**: Compute (frontend + backend unified)
- **Custom Domains**: parcener.app, www.parcener.app
- **R2**: Receipt image storage (parcener-receipt-images bucket)
- **Queues**: Async job processing (parcener-receipt-queue)
- **Hyperdrive**: PostgreSQL connection pooling and acceleration
- **PostgreSQL**: Primary database (managed separately)

### Environments

- **Production**: parcener.app
  - R2 bucket: parcener-receipt-images
  - Queue: parcener-receipt-queue

- **Staging**: staging.parcener.app
  - R2 bucket: parcener-receipt-images-staging
  - Queue: parcener-receipt-queue-staging

### CI/CD Pipeline

The project uses GitHub Actions with a simplified two-job pipeline:

**Jobs:**

1. **`tests`** - Runs all checks in parallel on ubuntu-latest with PostgreSQL service
   - Unit tests (Vitest)
   - Type checking (TypeScript)
   - Linting (ESLint)
   - E2E tests (Playwright) - conditional:
     - Always on push to main/staging
     - On PRs to main
     - On workflow_dispatch with `run_e2e: true`

2. **`deploy`** - Runs after tests pass
   - Deploys to production on push to `main`
   - Deploys to staging on push to `staging`

**Workflow Triggers:**

- Push to `main` or `staging`
- PRs to `main` or `staging`
- Manual dispatch (with option to run E2E tests)

## Architecture Patterns

### Component Architecture

- **Composition Pattern**: Components use slots (headerElement, rightElement, footerElement)
- **Variant Pattern**: Base components accept `variant` prop for different states (default, active, dimmed)
- **Sheet/Modal Pattern**: Heavy use of bottom sheets for editing actions
- **Loading State Pattern**: Dedicated loading components with skeleton states

### Data Management

- **React Query for Server State**: No Redux/Context needed
- **Optimistic Updates**: Instant UI feedback before server confirmation
- **Polling for Real-time**: Delta sync reduces bandwidth
- **Targeted Invalidation**: Only relevant queries invalidated on mutations
- **Cache Seeding**: Recent lists seed individual item caches

### Backend Architecture

- **Vertical Slice Organization**: Features are self-contained modules
- **Middleware Chain**: Auth → rate limit → transaction naming → service
- **Identity Merging**: Seamless guest → user transition
- **Distributed Tracing**: Sentry traces flow from HTTP → Queue → Processing
- **Transaction Safety**: All writes wrapped in DB transactions with room "touch" pattern
- **Validation Everywhere**: Zod schemas at DTO layer, calculation validation in business logic

### Error Handling

- **Discriminated Union Responses**: Consistent error types (NOT_FOUND, PROCESSING, FAILED, etc.)
- **Error Boundaries**: Graceful fallbacks
- **Sentry Integration**: Automatic error tracking with context

## Technical Decisions & Notes

### Why Vertical Slice Architecture?

- Clear feature boundaries reduce cognitive load
- Self-contained features are easier to test and maintain
- Reduced merge conflicts when working on different features
- Easier to understand feature ownership

### Why RPC over REST?

- Thin wrappers make future REST migration easy
- All RPCs wrapped in React Query hooks for clean separation
- Consistent middleware pattern across all endpoints
- First-class TypeScript support

### Why Polling over WebSockets?

- Simpler implementation for current needs
- Delta sync reduces bandwidth overhead
- 3-second polling sufficient for bill-splitting use case
- Cloudflare Workers have WebSocket limitations

### Why Mobile-First?

- Use case is on-the-spot at restaurants
- Most users on mobile devices
- Desktop usable but not primary focus

### Why Cloudflare Workers?

- Edge deployment for low latency
- Unified runtime for frontend + backend
- Tight integration with R2, Queues, Hyperdrive
- Global CDN with custom domains

### Why Vitest + Playwright?

- **Vitest**: First-class TypeScript support, fast, Cloudflare Workers pool for testing worker-specific features
- **Playwright**: Reliable E2E testing, great debugging experience, cross-browser support
- Co-located tests with features for better DX

## Contributing

### Code Quality

- All code is type-safe with TypeScript
- ESLint for linting
- Prettier for formatting
- `pnpm check` runs both

### Adding a New Feature

1. Create `src/features/your-feature/`
2. Add `components/`, `hooks/`, `routes/`, `server/` directories as needed
3. Add tests alongside implementation (`.test.ts`, `.e2e.ts`)
4. Update this README with feature documentation

## License

MIT License
