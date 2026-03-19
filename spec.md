# Tengakhat Masjid Committee

## Current State
App has admin login, member management, UPI payment with QR code, and payment history. No receipt generation exists.

## Requested Changes (Diff)

### Add
- `ReceiptModal` component: displays a formatted digital receipt after payment or on demand
- Receipt content: committee name, member name, member ID, address, amount paid, month/year, payment date, payment mode, receipt number
- Print button: triggers browser print for the receipt
- Download PDF button: generates and downloads a PDF receipt using browser APIs (no new dependencies)
- View Receipt button in Full Payment History table rows

### Modify
- `PaymentModal`: after successful payment submission, show the receipt modal automatically
- `PaymentsPage`: add a "Receipt" button/icon in the Full Payment History table for each payment row

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/components/ReceiptModal.tsx` with print and PDF download (using browser's print-to-PDF, no extra deps)
2. Update `PaymentModal.tsx` to show receipt after successful submission
3. Update `PaymentsPage.tsx` to add receipt button in payment history rows
