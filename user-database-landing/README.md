# Outdoorithm Collective CRM

A modern CRM designed specifically for the outdoor industry's unique network and relationship needs.

## Features

- **Contact Management**: Organize all your industry contacts with custom categorization
- **Advanced Search**: Find contacts with powerful search and filtering
- **Network Analytics**: Gain insights into your professional network
- **Data Integration**: Import/export data in multiple formats
- **Organization Tracking**: Keep track of industry organizations
- **Data Security**: Secure and protected contact information

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or pnpm package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd user-database-landing
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Configure environment variables
```bash
cp .env.example .env.local
```
Edit .env.local with your Supabase credentials

4. Start the development server
```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

```bash
npm run build
# or
pnpm build
```

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Project Structure

- `/app` - Next.js app router pages
- `/components` - Reusable UI components
- `/lib` - Utility functions and API clients
- `/public` - Static assets
- `/styles` - Global styles

## License

This project is proprietary software of Outdoorithm Collective. 