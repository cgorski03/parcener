Option A Server Structure
Proposed Structure
src/
├── features/                     # VERTICAL SLICES (Features own their server code)
│   ├── account/
│   │   ├── server/
│   │   │   ├── index.ts                # Public API for this feature
│   │   │   ├── account-rpc.ts
│   │   │   ├── account-service.ts
│   │   │   ├── invitation-service.ts
│   │   │   └── rate-limit-service.ts
│   │   └── ...
│   ├── room/
│   │   ├── server/
│   │   │   ├── index.ts                # Public API
│   │   │   ├── room-rpc.ts
│   │   │   ├── room-service.ts
│   │   │   ├── room-claims-service.ts
│   │   │   └── room-member-service.ts
│   │   └── ...
│   └── receipt-review/              # MERGED: edit-receipt + get-receipt
│       ├── server/
│       │   ├── index.ts                # Public API
│       │   ├── edit-receipt-service.ts
│       │   ├── get-receipt-service.ts
│       │   ├── rpc-put-receipt.ts
│       │   └── rpc-get-receipt.ts
│       └── ...
│
├── shared/                       # SHARED INFRASTRUCTURE (No business logic)
│   ├── server/
│   │   ├── db/
│   │   │   ├── index.ts             # Database connection
│   │   │   ├── schema.ts            # All tables
│   │   │   └── migrations/          # Migration files
│   │   ├── auth/
│   │   │   ├── index.ts             # Auth instance factory
│   │   │   ├── get-server-session.ts
│   │   │   ├── protected-function.ts # Reusable middleware
│   │   │   └── room-identity.ts     # Reusable middleware
│   │   ├── dto/
│   │   │   ├── dtos.ts              # All DTO schemas
│   │   │   ├── dto-mappers.ts       # Conversion logic
│   │   │   └── response-types.ts    # Error types
│   │   ├── utils/
│   │   │   ├── money-math.ts         # Shared calculations
│   │   │   └── validation.ts        # Shared validation
│   │   ├── observability/
│   │   │   └── sentry-middleware.ts
│   │   ├── entry.ts                 # Cloudflare Worker entry
│   │   └── router-config.ts         # RPC router assembly
│   │
│   └── lib/                        # Client utilities
│       ├── auth-client.ts
│       ├── query-client.ts
│       └── ...
│
└── router.tsx                       # Root: TanStack Router client config
