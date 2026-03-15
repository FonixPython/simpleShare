# Database Migration System

This project uses a versioned migration system to manage database schema changes.

## How it works

- Migration files are stored in `/backend/migrations/` directory
- Each migration file is named with a numeric prefix (e.g., `001_create_users_table.sql`)
- The migration runner tracks applied migrations in the `migrations` table
- Migrations are applied automatically when the server starts

## Migration files

The following migration files have been created:

1. `001_create_users_table.sql` - Creates the users table
2. `002_create_settings_table.sql` - Creates the settings table  
3. `003_create_session_tokens_table.sql` - Creates the session_tokens table
4. `004_create_file_index_table.sql` - Creates the file_index table
5. `005_create_file_groups_table.sql` - Creates the file_groups table

## Adding new migrations

To add a new migration:

1. Create a new SQL file in `/backend/migrations/` with the next sequential number
2. Name it descriptively (e.g., `006_add_new_column.sql`)
3. Add your schema changes to the file
4. The migration will be applied automatically on next server startup

## Fresh database setup

For a fresh database setup:

1. Ensure your database exists and is empty
2. Configure your `.env` file with database connection details
3. Start the server - migrations will run automatically

## Migration runner

The migration runner (`/backend/src/migration-runner.ts`) handles:
- Creating the migrations tracking table if it doesn't exist
- Reading migration files in order
- Applying only pending migrations
- Tracking which migrations have been applied
- Rolling back on errors
