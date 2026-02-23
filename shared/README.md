# @inspectos/shared

Shared application code used by web, mobile, and server.

## Structure

```
/shared/
  /api/            - Shared API client primitives
  /query/          - Shared query keys and defaults
  /types/          - API response/request types
  /validations/    - Zod validation schemas
  /utils/          - Pure utility functions
  /constants/      - Enums, statuses, roles
```

## What Goes Here

### Types (`/types`)
TypeScript interfaces for API responses and requests.

### API (`/api`)
Runtime-agnostic API client primitives (errors, retry policy, HTTP methods).

### Query (`/query`)
Shared query key factories and default TanStack query options.

**Example:**
```typescript
export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
};
```

### Validations (`/validations`)
Zod schemas for validating API requests.

**Example:**
```typescript
import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  company: z.string().optional(),
});
```

### Utils (`/utils`)
Pure functions that don't depend on framework or environment.

**Example:**
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
```

### Constants (`/constants`)
Shared enums and constant values.

**Example:**
```typescript
export const ORDER_STATUSES = [
  'pending',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];
```

## Usage

### In Web App

```typescript
import type { Client } from '@inspectos/shared/types';
import { createClientSchema } from '@inspectos/shared/validations';
import { formatCurrency } from '@inspectos/shared/utils';
import { ORDER_STATUSES } from '@inspectos/shared/constants';
```

### In API Server

```typescript
import type { Client } from '@inspectos/shared/types';
import { createClientSchema } from '@inspectos/shared/validations';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = createClientSchema.safeParse(body);

  if (!validation.success) {
    return badRequest(validation.error.message);
  }

  // ... create client
}
```

### In Mobile App

```typescript
import type { Client } from '@inspectos/shared/types';
import { formatCurrency } from '@inspectos/shared/utils';
```

## Migration TODO

Move existing code from `apps/web/lib` and `apps/server/lib`:

- [ ] Move types from `apps/web/lib/types` and `apps/server/lib/types`
- [ ] Move validations from `apps/web/lib/validations` and `apps/server/lib/validations`
- [ ] Move utilities from `apps/web/lib/utils` and `apps/server/lib/utils`
- [ ] Move constants from `apps/web/lib/constants`
- [ ] Update imports in web app
- [ ] Update imports in server app
- [ ] Add imports to mobile app
