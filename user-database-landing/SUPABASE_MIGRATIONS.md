# Supabase Migration Guide

This document explains how to properly work with Supabase database migrations using the Supabase CLI. Following these steps will help you implement schema changes correctly and avoid common errors.

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Access to your Supabase project

## Project Reference

Your Supabase project reference can typically be found in:
- Supabase dashboard URL: `https://app.supabase.com/project/your-project-ref`
- Auth tokens: `sb-your-project-ref-auth-token`
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`

For this project, the reference is: `bbibzoifpslvqhccvqol`

## Working with Migrations

### 1. Linking Your Project

Before you can push migrations, you need to link your local project to your remote Supabase instance:

```bash
supabase link --project-ref your-project-ref
```

Example:
```bash
supabase link --project-ref bbibzoifpslvqhccvqol
```

You may be prompted for your database password.

### 2. Creating a New Migration

To create a new migration file:

```bash
supabase migration new migration_name
```

Example:
```bash
supabase migration new create_fundraising_tables
```

This creates a new timestamped SQL file in the `supabase/migrations/` directory.

### 3. Writing SQL Migrations

You can either:
- Write SQL directly in the created migration file
- Create separate SQL files and copy them to the migration file:

```bash
cat your-schema.sql > supabase/migrations/TIMESTAMP_migration_name.sql
```

#### SQL Best Practices

- Use `IF NOT EXISTS` when creating tables
- Quote reserved keywords (like `"order"`, `"user"`, `"group"`)
- Use explicit schemas (e.g., `public.your_table`)
- Add proper indexes for foreign keys
- Setup Row Level Security (RLS) policies

### 4. Pushing Migrations

Push your migrations to the remote database:

```bash
supabase db push
```

### 5. Handling Migration Conflicts

If you encounter conflicts between local and remote migrations:

1. Check migration status:
```bash
supabase migration list
```

2. Repair inconsistent migrations:
```bash
supabase migration repair --status reverted TIMESTAMP_ID
```

Example:
```bash
supabase migration repair --status reverted 20250420180640 20250420183148 20250420190000
```

3. Then try pushing again:
```bash
supabase db push
```

## Common Issues and Solutions

### "Cannot find project ref" Error

Make sure you've linked your project:
```bash
supabase link --project-ref your-project-ref
```

### SQL Syntax Error with Reserved Keywords

Many SQL errors occur when using reserved keywords as column names. Always quote reserved keywords:

```sql
-- Incorrect:
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  order INTEGER NOT NULL
);

-- Correct:
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  "order" INTEGER NOT NULL
);
```

### Migration Conflicts

If remote migrations exist that aren't in your local repository:

1. Mark conflicting remote migrations as reverted:
```bash
supabase migration repair --status reverted TIMESTAMP_ID
```

2. Pull the latest schema:
```bash
supabase db pull
```

### Database Connection Issues

If you have trouble connecting to the database:

1. Ensure you have the correct database URL and credentials
2. Try specifying the password explicitly:
```bash
supabase db push -p your-password
```

## Complete Workflow Example

Here's a complete workflow for adding a new feature that requires database changes:

```bash
# 1. Link your project
supabase link --project-ref bbibzoifpslvqhccvqol

# 2. Create a new migration
supabase migration new create_fundraising_tables

# 3. Write your SQL or copy from a file
cat supabase-fundraising-schema.sql > supabase/migrations/TIMESTAMP_create_fundraising_tables.sql

# 4. If there are conflicts with remote migrations
supabase migration repair --status reverted CONFLICTING_MIGRATION_IDS

# 5. Push the migration
supabase db push
```

## Useful Commands

- `supabase migration list` - List all migrations and their status
- `supabase db reset` - Reset local database to current migrations
- `supabase db pull` - Pull schema from remote database
- `supabase db execute < file.sql` - Execute SQL against local database 