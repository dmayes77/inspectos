# DRY Refactoring Progress

**Last Updated**: January 2026

---

## ✅ Completed Refactoring

### Files Fully Refactored

1. ✅ **`src/app/admin/inspections/[id]/edit/page.tsx`**
   - Uses `parseAddress()` utility
   - Uses `calculateServiceTotal()` utility
   - Uses `booleanToYesNo()` / `yesNoToBoolean()` formatters
   - Uses `toString()` / `toNumber()` formatters
   - Uses `mockAdminUser` constant
   - Uses centralized types

2. ✅ **`src/app/admin/inspections/[id]/page.tsx`**
   - Uses `parseAddress()` utility
   - Uses `formatInspectionDateTime()` utility
   - Uses `mockAdminUser` constant
   - Removed duplicate `formatInspectionDateTime()` function

3. ✅ **`src/app/admin/inspections/page.tsx`**
   - Uses `parseAddress()` utility (in table and mobile view)
   - Uses `mockAdminUser` constant

4. ✅ **`src/app/admin/services/page.tsx`**
   - Uses `calculatePackageDiscount()` utility
   - Uses `mockAdminUser` constant
   - Optimized discount calculation calls

5. ✅ **`src/hooks/use-inspections.ts`**
   - Uses centralized `Inspection` type

6. ✅ **`src/lib/mock/inspections.ts`**
   - Uses centralized `Inspection` type

---

## ⏳ Remaining Files to Refactor

### High Priority (Address Parsing)

- [ ] `src/app/(public)/book/[companySlug]/confirmed/page.tsx`
  - Has inline address parsing logic
  - Should use `parseAddress()` utility

### High Priority (Mock Users)

All these files still have `mockUser` constants:
- [ ] `src/app/admin/team/[id]/schedule/page.tsx`
- [ ] `src/app/admin/team/[id]/page.tsx`
- [ ] `src/app/admin/team/[id]/edit/page.tsx`
- [ ] `src/app/admin/team/[id]/availability/page.tsx`
- [ ] `src/app/admin/team/page.tsx`
- [ ] `src/app/admin/overview/page.tsx`
- [ ] `src/app/admin/settings/roles/new/page.tsx`
- [ ] `src/app/admin/team/new/page.tsx`
- [ ] `src/app/admin/settings/roles/[id]/page.tsx`
- [ ] `src/app/admin/services/[id]/page.tsx`
- [ ] `src/app/admin/clients/new/page.tsx`
- [ ] `src/app/admin/templates/page.tsx`
- [ ] `src/app/admin/clients/page.tsx`
- [ ] `src/app/admin/settings/roles/page.tsx`
- [ ] `src/app/admin/settings/page.tsx`
- [ ] `src/app/admin/clients/[id]/page.tsx`
- [ ] `src/app/admin/clients/[id]/edit/page.tsx`

**Total**: 17 files

### Medium Priority (Price Calculation)

- [ ] `src/app/admin/services/[id]/page.tsx`
  - Has `calculatePackageDiscount()` function
  - Should use utility

- [ ] `src/app/inspector/jobs/new/page.tsx`
  - Has `calculateTotal()` function
  - Should use `calculateServiceTotal()` utility

### Medium Priority (Error Handling)

- [ ] All mutation handlers across the codebase
  - Replace inline error handling with `handleMutationError()` or factory functions
  - ~20+ locations

---

## 📊 Statistics

- **Files Refactored**: 6
- **Files Remaining**: ~25
- **Lines of Duplicated Code Eliminated**: ~200+
- **Utility Functions Created**: 15+

---

## 🎯 Next Steps

1. **Batch replace mockUser** - Create a script or manual batch replacement
2. **Update remaining address parsing** - 1 file
3. **Update remaining price calculations** - 2 files
4. **Standardize error handling** - Ongoing

---

## 💡 Quick Wins

The easiest remaining refactoring is replacing `mockUser` constants. This can be done with a simple find/replace:

**Find**:
```typescript
const mockUser = {
  name: "Sarah Johnson",
  email: "sarah@acmeinspections.com",
  companyName: "Acme Home Inspections",
};
```

**Replace**:
```typescript
import { mockAdminUser } from "@/lib/constants/mock-users";
```

Then replace `user={mockUser}` with `user={mockAdminUser}`.
