# Parcener

A modern web application for splitting restaurant receipts with friends using AI-powered receipt parsing.

## 📖 Project Overview

Parcener (a play on "parser" + "dinner") is a receipt-splitting application that helps groups of people fairly divide restaurant bills. Upload a receipt photo, and the app uses Google's Gemini AI to automatically extract line items, prices, tax, and tip. Users can then review, edit, and create a collaborative room where each person can claim items they purchased.

### Current Status

This project is in **active development**. Core features are functional but the collaborative splitting experience is still being built out.

## ✨ Features

### ✅ Implemented
- **AI-Powered Receipt Parsing**: Upload receipt images and automatically extract:
  - Individual line items with prices and quantities
  - Subtotal, tax, and tip amounts
  - Grand total
- **Receipt Review & Editing**: 
  - View parsed receipt items in a clean interface
  - Edit item names, prices, and quantities
  - Add custom items manually
  - Adjust tax, tip, and total amounts
  - Validation to ensure totals match
- **Authentication**: Google OAuth integration via Better Auth
- **Database Persistence**: PostgreSQL with Drizzle ORM for type-safe queries
- **Receipt Processing Tracking**: Error handling and retry support for AI parsing failures

### 🚧 In Progress
- **Split Rooms**: Collaborative splitting interface (basic structure exists)
  - Room creation from reviewed receipts
  - Member joining via unique room links
  - Guest support (no account required)
- **Claiming System**: Allow users to claim items they ordered
- **Settlement Calculation**: Automatic calculation of who owes whom

### 📋 Planned
- Mobile-optimized UI improvements
- Receipt history and management
- Payment integration (Venmo, PayPal, etc.)
- Group presets for frequent dining groups
- Receipt photo storage and retrieval

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TanStack Router** - File-based routing with type safety
- **TanStack Query** - Server state management
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Vite** - Build tool and dev server

### Backend
- **TanStack Start** - Full-stack React framework with SSR
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database queries and migrations
- **Better Auth** - Authentication library with OAuth support

### AI & Processing
- **Vercel AI SDK** - AI model integration
- **Google Gemini 2.5 Pro** - Vision model for receipt parsing
- **Zod** - Runtime schema validation

### Development
- **TypeScript** - Type safety across the stack
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Testing framework
- **Docker Compose** - Local PostgreSQL setup

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Docker and Docker Compose (for local database)
- Google Cloud account with Gemini API access
- Google OAuth credentials (for authentication)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/cgorski03/parcener.git
cd parcener
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following:
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=split
DB_USER=colin
DB_PASSWORD=secure_password

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Better Auth
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

4. Start the PostgreSQL database:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
pnpm db:generate
pnpm db:migrate
```

6. Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## 📝 Available Scripts

```bash
pnpm dev          # Start development server on port 3000
pnpm build        # Build for production
pnpm serve        # Preview production build
pnpm test         # Run tests
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
pnpm check        # Format and lint (auto-fix)
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run database migrations
```

## 📂 Project Structure

```
src/
├── components/        # Reusable React components
│   ├── ui/           # Base UI components (buttons, cards, etc.)
│   ├── receipt-*.tsx # Receipt-specific components
│   └── ...
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and clients
├── routes/           # File-based routing (TanStack Router)
│   ├── index.tsx     # Home/login page
│   ├── upload.tsx    # Receipt upload page
│   ├── receipt/      # Receipt review pages
│   └── parce/        # Split room pages (in progress)
├── server/           # Server-side code
│   ├── auth/         # Authentication logic
│   ├── db/           # Database schema and client
│   ├── processing/   # AI receipt processing
│   ├── room/         # Room/splitting logic
│   ├── get-receipt/  # Receipt retrieval
│   └── edit-receipt/ # Receipt editing
└── styles.css        # Global styles
```

## 🗄️ Database Schema

### Core Tables
- **receipt**: Stores parsed receipt information (totals, tax, tip)
- **receipt_item**: Individual line items from receipts
- **receipt_processing_information**: Tracks AI parsing attempts and errors
- **room**: Collaborative splitting sessions
- **room_member**: Users/guests in a room
- **claim**: Tracks which items each member claimed
- **user/session/account**: Authentication tables (Better Auth)

## 🤖 AI Processing

Receipt parsing uses Google's Gemini 2.5 Pro vision model with structured prompting to extract:
- Line item text and prices
- Quantities (when detectable)
- Subtotal, tax, tip, and grand total

The system includes:
- Error handling and retry logic
- Token usage tracking
- Validation against Zod schemas
- Fallback for unclear or invalid receipts

## 🔐 Authentication

Uses Better Auth with Google OAuth. Supports:
- Authenticated users (full features)
- Guest users in split rooms (via UUID cookies)

## 🧪 Testing

Testing infrastructure is set up with Vitest, though comprehensive tests are not yet implemented.

```bash
pnpm test  # Run all tests
```

## 🎨 Styling

The project uses Tailwind CSS 4 with:
- Custom color scheme defined in configuration
- Radix UI for accessible components
- Custom component variants via class-variance-authority
- Responsive design utilities

## 🔧 Development Notes

### Database Migrations
When changing the database schema:
1. Update schemas in `src/server/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:migrate`

### Adding Routes
TanStack Router uses file-based routing. Add files to `src/routes/` and the router configuration is automatically generated.

### Code Quality
Run `pnpm check` before committing to format and lint all files.

## 🐛 Known Issues

- Split room interface is incomplete (basic structure only)
- No receipt history/management UI yet
- Mobile UI needs optimization
- Guest session handling could be more robust
- No payment integration

## 📄 License

This project is currently private and not licensed for public use.

## 👤 Author

Colin Gorski (@cgorski03)
