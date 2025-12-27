# Parcener - Collaborative Receipt Splitting

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
│                    Cloudflare Edge Runtime                   │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │   Frontend (React)  │    │   Backend (Services)      │  │
│  │   - TanStack Router │    │   - RPC Endpoints         │  │
│  │   - TanStack Query  │    │   - Business Logic        │  │
│  │   - Components      │    │   - Middleware            │  │
│  └──────────┬──────────┘    └──────────┬─────────────────┘  │
│             │                          │                     │
│  ┌──────────┴──────────────────────────┴──────────┐          │
│  │              Cloudflare Services               │          │
│  │  - PostgreSQL (via Hyperdrive)                 │          │
│  │  - R2 (image storage)                          │          │
│  │  - Queues (async processing)                   │          │
│  └────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘

Data Flow:
React Components → Custom Hooks → RPC → Service Layer → Drizzle ORM → PostgreSQL
                                    ↓ (async jobs)
                            Cloudflare Queue → AI Processing (Gemini)
```

### Directory Structure

#### Frontend (`src/`)

**Routes** (`src/routes/`):

- `__root.tsx` - Root route with HTML shell and meta tags
- `index.tsx` - Landing page
- `login.tsx` - Google OAuth login
- `_authed/` - Protected routes (account, upload, review, acceptInvite)
- `receipt/parce/$roomId` - Collaborative room (guest access)

**Components** (`src/components/`):

- `account/` - Dashboard components (recent lists, upload section)
- `common/` - Shared components (QR code, share button)
- `icons/` - Icon components
- `item-card/` - Receipt item variants (base, review, collab)
- `landing/` - Landing page components (demo, CTA)
- `layout/` - Layout shells (branded, receipt, headers)
- `review/` - Receipt review UI (views, sheets, headers)
- `room/` - Room collaboration UI (screens, settlement, member avatars)
- `ui/` - shadcn/ui primitives
- `upload/` - Upload components

**Hooks** (`src/hooks/`):

- `use-user.ts` - Current user authentication
- `use-get-receipt.ts` - Receipt fetching with processing polling
- `use-room.ts` - Room data with delta sync polling
- `use-edit-receipt.ts` - Receipt CRUD mutations
- `use-claims.ts` - Item claiming with optimistic updates
- `use-debounced-claim.ts` - Debounced claim updates
- `use-account.ts` - Rate limits and invitations
- `use-upload-receipt.ts` - Receipt upload handling
- `use-receipt-settlement.ts` - Settlement calculation

**Utilities** (`src/lib/`):

- `auth-client.ts` - Better Auth client configuration
- `query-client.ts` - React Query setup
- `receipt-utils.ts` - Receipt data helpers
- `sentry-client.ts` - Frontend error tracking
- `logger.ts` - Logging utilities
- `utils.ts` - General utilities
- `validation.ts` - Zod validation schemas

#### Backend (`src/server/`)

**Entry**:

- `entry.ts` - Cloudflare Worker entry point (fetch + queue handlers)
- `router.tsx` - TanStack Router configuration

**Services**:

- `account/` - User data, rate limits, invitations (account-rpc.ts, account-service.ts)
- `auth/` - Authentication layer (Better Auth integration, middleware)
- `db/` - Database schema, connection, Drizzle config
- `processing/` - AI receipt parsing pipeline (async queue, Gemini integration)
- `room/` - Collaborative room services (membership, claiming, polling)
- `get-receipt/` - Receipt retrieval with validation
- `edit-receipt/` - Receipt CRUD operations
- `observability/` - Sentry middleware and tracing

**Shared Backend**:

- `dtos.ts` - Zod schemas for all DTOs
- `dto-mappers.ts` - Entity-to-DTO conversion
- `response-types.ts` - Standardized error responses
- `money-math.ts` - Financial calculations with precision

### API Architecture

**Current**: RPC-first architecture

- All endpoints are RPC calls exposed via TanStack Router
- Thin wrapper functions in service layer
- Wrapped in custom React hooks for data fetching
- Optimistic updates for instant UI feedback

**RPC Endpoints**:

- **Account**: getUser, getUserRecentReceipts, getUserRecentRooms, createInvite, acceptInvite
- **Processing**: uploadReceipt (enqueues to Cloudflare Queue)
- **Receipt**: getReceipt, getReceiptIsValid
- **Edit**: editReceiptItem, createReceiptItem, deleteReceiptItem, finalizeReceiptTotals
- **Room**: getRoomAndMembership, getRoomPulse, createRoom, joinRoom, claimItem, upgradeGuestToUser

**Middleware**:

- `protectedFunction` - Authentication guard
- `canUpload` - Rate limit validation (3 uploads/day)
- `roomContext` - Room membership verification
- `nameTransaction` - Sentry transaction naming

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

## Getting Started

### Prerequisites

- Node.js 18+ (v20+ recommended)
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
pnpm build            # Build for production
pnpm test             # Run tests (Vitest)
pnpm type-check       # TypeScript type checking (no emit)

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations (uses .env.local)
pnpm db:migrate:dev   # Run migrations (dev environment)
pnpm db:migrate:prod  # Run migrations (production environment)

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Run Prettier
pnpm check            # Format + lint in one command

# Deployment
pnpm deploy           # Deploy to production
pnpm deploy:staging   # Deploy to staging
pnpm preview          # Preview production build locally

# Cloudflare
pnpm cf-typegen       # Generate Cloudflare Worker types
```

## Architecture Details

### Data Flow

```

User Interaction
↓
React Component
↓
Custom Hook (use-\*.ts)
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

**Core Tables**:

- `user` - User accounts (auth via Better Auth)
- `session` - User sessions (auth)
- `receipt` - Receipt headers (subtotal, tax, tip, grand_total)
- `receipt_item` - Line items (name, price, quantity, interpreted_text)
- `receipt_processing_information` - AI metadata (status, model, tokens, errors)
- `room` - Collaborative rooms (linked 1:1 with receipts)
- `room_member` - Room participants (users OR guests)
- `claim` - Item ownership claims (member_id, receipt_item_id, quantity)
- `invite` - Shareable invitations (create/redeem tracking)

**Relationships**:

- User → Receipt (1:N)
- Receipt → ReceiptItem (1:N)
- Receipt → Room (1:1)
- Room → RoomMember (1:N)
- RoomMember → Claim (1:N)
- Claim → ReceiptItem (N:1)
- User → Invite (as creator, 1:N)
- User → Invite (as redeemer, 1:N)

**Unique Constraints**:

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

### Deployment Commands

```bash
# Deploy to production
pnpm deploy

# Deploy to staging
pnpm deploy:staging

# Preview local build
```

## Architecture Patterns

This project follows several key patterns:

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

### Why RPC over REST?

- Chosen for initial speed of development
- Thin wrappers make future REST migration easy
- All RPCs wrapped in React Query hooks for clean separation

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

## Contributing

### Code Quality

- All code is type-safe with TypeScript
- ESLint for linting
- Prettier for formatting
- `pnpm check` runs both

## License

MIT License
