# Parcener - Collaborative Receipt Splitting

Parcener is a web application that allows users to upload receipt photos, automatically processes them using AI, and creates collaborative rooms where friends can split expenses in real-time.

The application is designed to be used on-the-spot and as such UI design is heavily mobile-first. It looks sort of strange on desktop. Usable, but kind of like when they first came out with the iPad, and there were a ton of apps not designed for it and there was that little button in the corner to zoom in on an iPhone app and it led to a strange UI.

## Tech Stack

- **Frontend**: React, TanStack Start, TanStack Query, Tailwind
- **Backend**: Cloudflare Workers, Drizzle ORM, PostgreSQL
- **AI**: Google Gemini 2.5 Flash for receipt processing
- **Auth**: Better Auth with guest support
- **Deployment**: Cloudflare Pages/Workers

## Architecture Overview

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Runtime                   │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │   Frontend (Vite)   │    │   Backend (Workers)        │  │
│  │   React + Router    │    │   Services + API           │  │
│  └──────────┬──────────┘    └──────────┬─────────────────┘  │
│             │                          │                        │
│  ┌──────────┴──────────────────────────┴──────────┐          │
│  │              PostgreSQL (Drizzle ORM)          │          │
│  └────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

#### Frontend Layer (`src/`)

- `routes/` - TanStack Start file-based routing
- `components/` - React components (atomic design)
- `hooks/` - Custom React hooks, React Query wrappers
- `lib/` - Frontend utilities

#### Backend Services Layer (`src/server/`)

- `entry.ts` - Cloudflare Worker entry point
- `router.tsx` - API routing configuration
- `db/` - Database schema and connection
- `processing/` - AI receipt processing pipeline
- `room/` - Collaborative room services
- `auth/` - Authentication layer
- `get-receipt/` - get receipt layer
- `edit-receipt/` - edit receipt layer

### API Architecture

**Current**: RPC-first with thin wrappers  
**Future**: REST API migration planned. I kind of think RPC was a mistake in general but wanted to get this moving quick. RPC calls are intentionally thin and wrapped in custom hooks + React Query for easy transition

## Features

### Implemented

- **Receipt Processing**: AI-powered receipt parsing with Google Gemini
- **Collaborative Rooms**: Real-time expense splitting with friends
- **Guest Support**: Anonymous users can join and participate
- **Manual Editing**: Fix AI mistakes with intuitive UI
- **Flexible Claims**: Split items by quantity (e.g., "I had 2 of 4 tacos")

### Doing right now

- **Deployment**: Deploy to cloudflare, then pay off tech debt in Review Receipt Page need to have ab etter separation of client and server state

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account (for deployment)
- PostgreSQL database

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
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm test         # Run tests

# Database
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations

# Code Quality
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
pnpm check        # Format + lint
```

## Architecture Details

### Data Flow

```
User → React Component → Hook → RPC/REST → Service → Database
     ↓                                                    ↑
Browser ← UI Update ← Cache Update ← Response ← Query ← Drizzle
```

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

- `receipt` - Main receipt data
- `receipt_item` - Individual line items
- `room` - Collaborative sessions
- `room_member` - Participants (users + guests)
- `claim` - Item ownership claims
- `receipt_processing_information` - AI processing metadata

## Deployment

### Cloudflare Stack

- **Pages**: Frontend hosting
- **Workers**: Backend services
- **R2**: Image storage
- **Queue**: Processing jobs
- **PostgreSQL**: Database

### Environment Setup

```bash
# Deploy to Cloudflare
pnpm deploy

# Preview build
pnpm preview
```

## Contributing

This project is in active development. The architecture is designed to be:

- **Modular**: Easy to swap RPC for REST
- **Scalable**: Edge-first design
- **Maintainable**: Type-safe end-to-end

## License

MIT License
