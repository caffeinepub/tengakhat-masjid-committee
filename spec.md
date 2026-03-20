# Tengakhat Masjid Committee

## Current State
The ReportsTab component exists but is a stub that renders null. The PDF/Excel libraries (jspdf, jspdf-autotable, xlsx) are missing from package.json. All other features (member management, UPI payments, receipts, member portal, auto-retry, admin PIN reset) are working.

## Requested Changes (Diff)

### Add
- `jspdf`, `jspdf-autotable`, `xlsx` to package.json dependencies
- Full ReportsTab UI with three report types:
  1. **Member List** -- all members with ID, name, phone, address, monthly fee
  2. **Payment History** -- all payments with member name, month/year, amount, status, mode
  3. **Monthly Summary** -- for a selected month/year, each member and their payment status
- Export buttons for PDF and Excel for each report type
- Year/month selector for Monthly Summary

### Modify
- `src/frontend/src/pages/ReportsTab.tsx` -- replace stub with full implementation
- `src/frontend/package.json` -- add jspdf, jspdf-autotable, xlsx

### Remove
- Nothing

## Implementation Plan
1. Add jspdf, jspdf-autotable, xlsx to package.json
2. Implement ReportsTab with three tabs: Member List, Payment History, Monthly Summary
3. Each tab has preview table + PDF export + Excel export buttons
4. Data fetched from existing useMembers and useAllPayments hooks
5. PDF generated with jspdf + jspdf-autotable
6. Excel generated with xlsx (SheetJS)
7. Validate and deploy
