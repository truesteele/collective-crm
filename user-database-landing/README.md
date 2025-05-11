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
   Edit `.env.local` with your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   **Important for Local Development (Authentication):**
   - In your Supabase project dashboard (Authentication > URL Configuration), set the **Site URL** to `http://localhost:3000`.
   - This is crucial for authentication cookies to be set correctly. Remember to change this to your production URL when deploying.

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

## Authentication Setup & Troubleshooting

This project utilizes `@supabase/ssr` for robust authentication with Next.js. If you experience login loops or issues where authentication doesn't persist (i.e., you're continually redirected to the login page):

1.  **Verify `.env.local` and Supabase Site URL**:
    *   Ensure your `.env.local` file contains the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These are used by the client-side Supabase instance.
    *   Crucially, confirm the **Site URL** in your Supabase project dashboard (Authentication > URL Configuration section) is set to **`http://localhost:3000`** for local development. If this URL doesn't match your local environment (e.g., it's set to your production HTTPS URL), authentication cookies will not be set correctly by the browser for `localhost`.

2.  **Client-Side Supabase Initialization (The Key Fix)**:
    *   A common cause for authentication issues in Next.js projects using `@supabase/ssr` is an incorrect client-side Supabase initialization. The client-side instance must use `createBrowserClient` from `@supabase/ssr`.
    *   The fix applied in this project was to update `lib/supabase.ts`:
        ```typescript
        // Path: lib/supabase.ts

        // Ensure this import is used for the client-side instance:
        import { createBrowserClient } from "@supabase/ssr";
        // ...
        // And the client is initialized like this:
        export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
        ```
    *   This replaced an older initialization that might have used `createClient` from the generic `@supabase/supabase-js` package. Using `createBrowserClient` ensures that authentication cookies are correctly managed in a way that's compatible with the server-side rendering and middleware features of `@supabase/ssr`. This was the primary solution to the auth token not being set in `document.cookie` and thus not being recognized by the server-side middleware.

3.  **Clear Browser Data**: After making any changes to environment variables, Supabase settings, or client initialization code, it's always a good practice to thoroughly clear your browser's cookies and cache for `localhost:3000` to ensure you are testing with a completely fresh state.

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