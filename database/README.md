# @inspectos/database

Centralized database configuration, client, types, and migrations for all apps.

## Structure

```
/database/
  /client/       - Supabase client configuration
  /types/        - Generated database types from Supabase schema
  /migrations/   - SQL migrations (47 files)
  /.supabase/    - Supabase CLI metadata (gitignored)
  config.toml    - Supabase CLI configuration
```

## Usage

### In Web App

```typescript
import { createSupabaseClient } from '@inspectos/database/client';

const supabase = createSupabaseClient({
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
});
```

### In API Server

```typescript
import { createSupabaseClient, createServiceClient } from '@inspectos/database/client';

// User client (respects RLS)
const userClient = createSupabaseClient({
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
  accessToken: request.headers.authorization?.replace('Bearer ', ''),
});

// Service client (bypasses RLS - admin only)
const serviceClient = createServiceClient({
  url: process.env.SUPABASE_URL!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
});
```

### In Mobile App

```typescript
import { createSupabaseClient } from '@inspectos/database/client';
import { Preferences } from '@capacitor/preferences';

const storage = {
  async getItem(key: string) {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  },
  async setItem(key: string, value: string) {
    await Preferences.set({ key, value });
  },
  async removeItem(key: string) {
    await Preferences.remove({ key });
  }
};

const supabase = createSupabaseClient({
  url: import.meta.env.VITE_SUPABASE_URL!,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
  storage, // Persist session in mobile
});
```

## Working with Migrations

### Running Migrations

```bash
cd database
npx supabase db push
```

### Creating a New Migration

```bash
cd database
npx supabase migration new your_migration_name
# Edit the generated file in migrations/
```

### Reset Database (Local Development)

```bash
cd database
npx supabase db reset
```

## Generating Database Types

After making schema changes, regenerate TypeScript types:

```bash
cd database
npx supabase gen types typescript --project-id wcafvfhvgjjijwxlgdzy > types/database.ts
```

Then export them in `database/types/index.ts`:

```typescript
export * from './database';
```

**Or use the shortcut:**

```bash
cd database
npm run generate-types
```

Add this script to `database/package.json`:

```json
{
  "scripts": {
    "generate-types": "supabase gen types typescript --project-id wcafvfhvgjjijwxlgdzy > types/database.ts"
  }
}
```
