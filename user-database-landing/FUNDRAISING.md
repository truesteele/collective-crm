# Fundraising Pipeline Feature

This document provides instructions for setting up and using the Fundraising Pipeline feature, which mimics the deal flow functionality of Pipedrive but designed for nonprofit fundraising.

## Overview

The Fundraising Pipeline allows you to:

- Track both individual giving and institutional giving
- Visually manage fundraising deals using a Kanban board
- Create custom pipeline stages to match your fundraising process
- Associate organizations and people with fundraising deals
- Move deals between stages using drag-and-drop
- Track amounts and details for each deal

## Database Setup

Before using the feature, you need to set up the required database tables in Supabase:

1. Navigate to your Supabase dashboard and select your project
2. Go to the SQL Editor
3. Copy the contents of the `supabase-fundraising-schema.sql` file from this project
4. Run the SQL script to create the necessary tables, policies, and indexes

## Features

### Pipeline Management

- Create multiple fundraising pipelines (e.g., one for institutional donors, another for individual donors)
- Customize pipeline stages for each pipeline
- Add/edit/delete stages as needed

### Deal Management

- Create deals with titles, amounts, and organization associations
- Drag and drop deals between pipeline stages
- Update deal status by moving them across the board
- Delete deals when no longer needed

## Default Pipeline Stages

Based on the Pipedrive example, the following default stages are included:

1. Qualified Prospect
2. Outreach Sent
3. Contact Made
4. Meeting Scheduled
5. Long-Term Cultivation
6. Holding for Grant Cycle
7. Grant In Progress (LOI)
8. Grant In Progress (Full)
9. Grant Submitted (Online)
10. Grant Submitted (In Person)
11. Declined

These stages can be customized by adding, editing, or removing stages to match your specific fundraising workflow.

## Usage Guide

### Creating a New Pipeline

1. Navigate to the Fundraising Pipelines page from the sidebar
2. Click "New Pipeline"
3. Enter a name for your pipeline (e.g., "Institutional Funders", "Individual Donors", etc.)
4. The pipeline will be created with the default stages

### Customizing Pipeline Stages

1. Open a pipeline by clicking on it from the Fundraising Pipelines page
2. Use the "Add Stage" button to add a new stage
3. Click the menu icon on any stage to edit or delete it

### Adding Deals

1. Click "Add Deal" in any pipeline stage
2. Enter deal details, including title and organization 
3. Optionally add an amount
4. Submit to create the deal

### Managing Deals

- **Move a deal**: Drag and drop a deal card from one stage to another
- **Delete a deal**: Click the menu icon on a deal card and select "Delete"

## Technical Architecture

The feature is built with the following components:

- **Database Tables**:
  - `fundraising_pipelines`: Stores pipeline metadata
  - `pipeline_stages`: Stores the stages for each pipeline
  - `fundraising_deals`: Stores the individual deals

- **UI Components**:
  - Drag-and-drop Kanban board using `@hello-pangea/dnd`
  - Modal dialogs for adding/editing
  - Dropdown menus for actions

- **Key Files**:
  - `/app/dashboard/fundraising/page.tsx`: Main pipelines listing
  - `/app/dashboard/fundraising/new/page.tsx`: New pipeline creation
  - `/app/dashboard/fundraising/[id]/page.tsx`: Individual pipeline view (Kanban board)
  - `/lib/supabase.ts`: Data models and API functions 