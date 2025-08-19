# GreenHouseV2

A comprehensive Progressive Web App (PWA) for greenhouse management, built with Next.js 14, TypeScript, and Prisma ORM.

## Features

- **Progressive Web App (PWA)** - Installable and works offline
- **Authentication** - NextAuth.js integration
- **Database** - PostgreSQL with Prisma ORM
- **Modern UI** - Tailwind CSS with responsive design
- **TypeScript** - Full type safety

## Entity Structure

The application manages the following entities:

- **Customer** - Customer information and relationships
- **Tunnel** - Greenhouse tunnels and their status
- **CustomerInventory** - Customer-specific inventory
- **MainInventory** - Main inventory management
- **Item** - Individual items with SKUs
- **Schedule** - Maintenance and task schedules
- **Task** - Individual tasks and their status

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **PWA**: next-pwa
- **Package Manager**: pnpm

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database (Neon, Supabase, or local)

## Getting Started

### 1. Clone and Install

```bash
cd greenhousev2
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/greenhousev2"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

### 4. Development

```bash
# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Providers

### Neon (Recommended for Vercel)
1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to your `.env` file

### Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string to your `.env` file

### Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database named `greenhousev2`
3. Update the `DATABASE_URL` in your `.env` file

## PWA Features

The application is configured as a Progressive Web App with:

- **Installable** - Can be installed on mobile and desktop
- **Offline Support** - Service worker for offline functionality
- **App-like Experience** - Full-screen mode and native feel
- **Push Notifications** - Ready for push notification implementation

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Project Structure

```
greenhousev2/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   └── auth/       # NextAuth.js routes
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── lib/                # Utility functions
│   │   ├── auth.ts         # NextAuth.js config
│   │   └── prisma.ts       # Prisma client
│   └── components/         # Reusable components
├── prisma/
│   └── schema.prisma       # Database schema
├── public/
│   ├── manifest.json       # PWA manifest
│   └── icons/              # PWA icons
├── next.config.ts          # Next.js config
└── package.json
```

## Development

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma` and run migrations
2. **API Routes**: Add new routes in `src/app/api/`
3. **Components**: Create reusable components in `src/components/`
4. **Pages**: Add new pages in `src/app/`

### Code Style

- Use TypeScript for all files
- Follow Next.js 14 conventions
- Use Tailwind CSS for styling
- Implement proper error handling
- Add TypeScript types for all data structures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
"# greenhousev2" 
