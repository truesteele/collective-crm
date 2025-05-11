# Collective CRM Scripts

This directory contains utility scripts for the Collective CRM system.

## Pipedrive Integration

### `pipedrive-sync.js`

This script synchronizes data between Pipedrive and the Collective CRM database in Supabase. 

#### Features:
- Syncs deals from Pipedrive to Supabase
- Maps Pipedrive pipeline stages to CRM pipeline stages
- Updates existing deals or creates new ones as needed
- Maintains proper relationships between deals, organizations, and contact persons

#### Prerequisites:
- Ensure you have a `.env` file in the parent directory with the following keys:
  - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
  - `SUPABASE_SERVICE_KEY`: Your Supabase service role key (for bypassing RLS)
  - `PIPEDRIVE_API_TOKEN`: Your Pipedrive API token

#### Usage:
```bash
node pipedrive-sync.js
```

#### Pipeline Stage Mapping:
The script maps Pipedrive stages to CRM stages as follows:

| Pipedrive Stage ID | Pipedrive Stage Name | CRM Stage |
|-------------------|----------------------|-----------|
| 1 | Qualified Prospect | Qualified Prospect |
| 13 | Outreach Sent | Outreach Sent |
| 2 | Contact Made | Contact Made |
| 6 | Meeting Scheduled | Meeting Scheduled |
| 9 | Long-Term Cultivation | Long-Term Cultivation |
| 8 | Holding for Grant Cycle | Holding for Grant Cycle |
| 10 | Grant In Progress (Open) | Grant In Progress (LOI) |
| 11 | Grant In Progress (Invite) | Grant In Progress (Full) |
| 3 | Grant Submitted (Open) | Grant Submitted (Online) |
| 12 | Grant Submitted (Invite) | Grant Submitted (In Person) |
| 20 | Declined | Declined |

#### Output:
The script provides detailed logs of each deal being processed, including:
- Organization matching
- Contact person matching
- Stage mapping
- Creation or update status

At the end, it provides a summary of how many deals were:
- Created (new deals)
- Updated (existing deals)
- Skipped (due to missing organization, etc.)
- Failed (due to errors)

It also shows a distribution of deals across stages.

### Other Files

- `create-initial-pipeline.sql`: SQL script to create the initial fundraising pipeline and stages
- `check-orgs.js`: Script to check organization data in Supabase
- `import-pipedrive-deals.ts`: TypeScript version of the deal import script (deprecated, use pipedrive-sync.js instead)

## Setup

1. Install dependencies:
   ```bash
   cd scripts
   npm install
   ```

2. Make sure your parent directory's `.env` file contains these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   PIPEDRIVE_API_KEY=your_pipedrive_api_key
   ```

   If you want to use a service role key (recommended for security):
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   - The Supabase URL and keys can be found in your Supabase dashboard under Project Settings > API
   - The Pipedrive API key can be found in your Pipedrive account under Settings > Personal preferences > API

## Running the Scripts

1. The initial pipeline has already been created via migration.

2. Import your Pipedrive deals:
   ```bash
   cd scripts
   npm run import-deals
   ```

## Troubleshooting

- If you're getting authentication errors with Supabase, check your API keys in the `.env` file.
- If no organizations are being found, check that your Pipedrive organization IDs are correctly synchronized in your Supabase database (`pipedrive_org_id` field in the `organizations` table).
- If the stage mapping is not working correctly, you may need to adjust the `stageMapping` object in the `import-pipedrive-deals.ts` file to match your Pipedrive stage names.

## Stage Mapping

The script tries to map Pipedrive stage names to your new fundraising pipeline stages using keyword matching. You may need to adjust the mapping in the `import-pipedrive-deals.ts` file:

```typescript
const stageMapping: Record<string, string> = {
  'qualified': 'Qualified Prospect',
  'outreach': 'Outreach Sent',
  'contact': 'Contact Made',
  'meeting': 'Meeting Scheduled',
  'cultivation': 'Long-Term Cultivation',
  'holding': 'Holding for Grant Cycle',
  'loi': 'Grant In Progress (LOI)',
  'full': 'Grant In Progress (Full)',
  'online': 'Grant Submitted (Online)',
  'in person': 'Grant Submitted (In Person)',
  'declined': 'Declined'
};
```

Update the keys on the left to match the keywords in your Pipedrive stage names. 