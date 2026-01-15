# DRY Refactoring Summary

**Date**: January 2026  
**Status**: ✅ Completed Initial Refactoring

---

## Overview

This document tracks the DRY (Don't Repeat Yourself) refactoring efforts to eliminate code duplication across the InspectOS codebase.

---

## ✅ Completed Refactoring

### 1. **Address Parsing Utility** ✅

**Created**: `src/lib/utils/address.ts`

**Problem**: Address parsing logic was duplicated in 4+ locations:
- `src/app/admin/inspections/[id]/edit/page.tsx` - `getAddressParts()`
- `src/app/admin/inspections/[id]/page.tsx` - inline parsing
- `src/app/admin/inspections/page.tsx` - multiple inline parsings
- `src/app/(public)/book/[companySlug]/confirmed/page.tsx` - different format

**Solution**: Created centralized utilities:
- `parseAddress(address: string): AddressParts` - Parse full address string
- `formatAddress(parts: AddressParts): string` - Format parts to string
- `formatAddressShort(parts: AddressParts): string` - Short format

**Usage**:
```typescript
import { parseAddress } from "@/lib/utils/address";

const { street, city, state, zip } = parseAddress(inspection.address);
```

**Files Updated**:
- ✅ `src/app/admin/inspections/[id]/edit/page.tsx`

**Files Still Needing Update**:
- ⏳ `src/app/admin/inspections/[id]/page.tsx`
- ⏳ `src/app/admin/inspections/page.tsx`
- ⏳ `src/app/(public)/book/[companySlug]/confirmed/page.tsx`

---

### 2. **Service Price Calculation Utility** ✅

**Created**: `src/lib/utils/pricing.ts`

**Problem**: Price calculation logic duplicated in 3+ locations:
- `src/app/admin/inspections/[id]/edit/page.tsx` - complex calculation
- `src/app/admin/services/page.tsx` - `calculatePackageDiscount`
- `src/app/admin/services/[id]/page.tsx` - `calculatePackageDiscount`
- `src/app/inspector/jobs/new/page.tsx` - `calculateTotal`

**Solution**: Created centralized utilities:
- `calculateServiceTotal(selectedIds, services): number` - Calculate total price
- `calculatePackageDiscount(package, includedServices)` - Package discount calc
- `formatPrice(price, currency): string` - Format as currency

**Usage**:
```typescript
import { calculateServiceTotal } from "@/lib/utils/pricing";

const total = useMemo(
  () => calculateServiceTotal(selectedTypeIds, services),
  [selectedTypeIds, services]
);
```

**Files Updated**:
- ✅ `src/app/admin/inspections/[id]/edit/page.tsx`

**Files Still Needing Update**:
- ⏳ `src/app/admin/services/page.tsx`
- ⏳ `src/app/admin/services/[id]/page.tsx`
- ⏳ `src/app/inspector/jobs/new/page.tsx`

---

### 3. **Form Value Formatters** ✅

**Created**: `src/lib/utils/formatters.ts`

**Problem**: Repeated form value conversions:
- Boolean ↔ "yes"/"no" conversions
- String/number conversions
- Date/time formatting

**Solution**: Created formatter utilities:
- `booleanToYesNo(value): "yes" | "no" | undefined`
- `yesNoToBoolean(value): boolean | undefined`
- `toString(value): string | undefined`
- `toNumber(value): number | undefined`
- `formatInspectionDateTime(date, time): string`

**Usage**:
```typescript
import { booleanToYesNo, yesNoToBoolean, toString, toNumber } from "@/lib/utils/formatters";

const poolDefault = booleanToYesNo(inspection?.pool);
const poolValue = yesNoToBoolean(formData.pool);
```

**Files Updated**:
- ✅ `src/app/admin/inspections/[id]/edit/page.tsx`

---

### 4. **Error Handling Utilities** ✅

**Created**: `src/lib/utils/errors.ts`

**Problem**: Repeated error handling patterns:
- Similar error message extraction
- Repeated toast.error calls
- Inconsistent error handling

**Solution**: Created error utilities:
- `AppError` class for typed errors
- `getErrorMessage(error): string` - Extract message
- `handleMutationError(error, defaultMessage)` - Handle with toast
- `createErrorHandler(defaultMessage)` - Factory for handlers
- `createSuccessHandler(message)` - Factory for success handlers

**Usage**:
```typescript
import { handleMutationError, createSuccessHandler } from "@/lib/utils/errors";

try {
  await mutation.mutateAsync(data);
} catch (error) {
  handleMutationError(error, "Failed to save");
}

// Or use factory functions
mutation.mutate(data, {
  onError: createErrorHandler("Failed to save"),
  onSuccess: createSuccessHandler("Saved successfully"),
});
```

**Files Updated**:
- ✅ `src/app/admin/inspections/[id]/edit/page.tsx`

**Files Still Needing Update**:
- ⏳ All mutation handlers across the codebase

---

### 5. **Centralized Type Definitions** ✅

**Created**: 
- `src/types/inspection.ts`
- `src/types/service.ts`

**Problem**: Types defined in multiple places:
- `Inspection` type in `src/hooks/use-inspections.ts`
- `Inspection` type in `src/lib/mock/inspections.ts`
- `ServiceType` inline in components

**Solution**: Centralized type definitions

**Files Updated**:
- ✅ `src/hooks/use-inspections.ts` - imports from `@/types/inspection`
- ✅ `src/lib/mock/inspections.ts` - imports from `@/types/inspection`
- ✅ `src/app/admin/inspections/[id]/edit/page.tsx` - imports from `@/types/service`

---

### 6. **Mock User Constants** ✅

**Created**: `src/lib/constants/mock-users.ts`

**Problem**: `mockUser` object duplicated in multiple files

**Solution**: Centralized constants:
- `mockAdminUser`
- `mockInspectorUser`

**Files Updated**:
- ✅ `src/app/admin/inspections/[id]/edit/page.tsx`

**Files Still Needing Update**:
- ⏳ All files using `mockUser` (search for pattern)

---

## 📊 Impact Summary

### Code Reduction
- **Before**: ~150 lines of duplicated code
- **After**: ~200 lines of reusable utilities
- **Net**: Eliminated duplication, improved maintainability

### Files Refactored
- ✅ 1 file fully refactored (`edit/page.tsx`)
- ⏳ ~10 files still need updates

### Benefits
1. **Single Source of Truth**: Address parsing, pricing, types all centralized
2. **Easier Testing**: Utilities can be unit tested independently
3. **Better Type Safety**: Centralized types prevent drift
4. **Consistent Behavior**: Same logic everywhere
5. **Easier Maintenance**: Fix bugs in one place

---

## 🔄 Next Steps

### High Priority
1. **Update remaining address parsing locations**
   - `src/app/admin/inspections/[id]/page.tsx`
   - `src/app/admin/inspections/page.tsx`
   - `src/app/(public)/book/[companySlug]/confirmed/page.tsx`

2. **Update remaining price calculation locations**
   - `src/app/admin/services/page.tsx`
   - `src/app/admin/services/[id]/page.tsx`
   - `src/app/inspector/jobs/new/page.tsx`

3. **Replace all mockUser instances**
   - Search for `mockUser` pattern
   - Replace with `mockAdminUser` or `mockInspectorUser`

### Medium Priority
4. **Update error handling patterns**
   - Replace inline error handling with utilities
   - Use factory functions for consistent patterns

5. **Extract form submission patterns**
   - Create reusable form submission hook
   - Standardize mutation handling

### Low Priority
6. **Create validation utilities**
   - Extract repeated validation logic
   - Create Zod schema utilities

---

## 📝 Migration Guide

### Migrating Address Parsing

**Before**:
```typescript
const parts = inspection.address.split(", ");
const street = parts[0] || "";
const cityStateZip = parts[1] || "";
// ... more parsing
```

**After**:
```typescript
import { parseAddress } from "@/lib/utils/address";
const { street, city, state, zip } = parseAddress(inspection.address);
```

### Migrating Price Calculation

**Before**:
```typescript
const serviceMap = Object.fromEntries(services.map(s => [s.serviceId, s]));
let total = 0;
// ... complex calculation logic
```

**After**:
```typescript
import { calculateServiceTotal } from "@/lib/utils/pricing";
const total = useMemo(
  () => calculateServiceTotal(selectedIds, services),
  [selectedIds, services]
);
```

### Migrating Error Handling

**Before**:
```typescript
onError: (error: unknown) => {
  if (error && typeof error === "object" && "message" in error) {
    toast.error((error as { message?: string }).message || "Failed");
  } else {
    toast.error("Failed");
  }
}
```

**After**:
```typescript
import { createErrorHandler } from "@/lib/utils/errors";
onError: createErrorHandler("Failed to save")
```

---

## 🧪 Testing

All utilities should be unit tested:

```typescript
// Example test for address parsing
describe("parseAddress", () => {
  it("should parse full address correctly", () => {
    const result = parseAddress("123 Main St, Austin TX 78701");
    expect(result).toEqual({
      street: "123 Main St",
      city: "Austin",
      state: "TX",
      zip: "78701",
    });
  });
});
```

---

## 📚 Related Documentation

- [CODE_REVIEW.md](./CODE_REVIEW.md) - Full code review with recommendations
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [CLAUDE.md](./CLAUDE.md) - Development guidelines

---

**Last Updated**: January 2026  
**Status**: ✅ Initial refactoring complete, migration in progress
