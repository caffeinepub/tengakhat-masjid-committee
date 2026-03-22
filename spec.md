# Tengakhat Masjid Committee

## Current State
Fully functional mosque committee app with admin/member login, member management, monthly fee collection, UPI payments with QR code, digital receipts, PDF/Excel reports, previous balance tracking, canister auto-retry, and member portal.

- Admin login: hardcoded username `admin` / password `logmein` in LoginPage.tsx
- Member login: member enters backend numeric memberId + PIN stored in localStorage
- Payment Modal (admin): records monthly fee payments only; no previous balance payment option
- Previous balance: set by admin in member edit form, stored in localStorage `tmc_prev_balances`; member can pay via UPI but must inform admin to update manually
- Settings page: UPI ID configuration only; admin credential change not available

## Requested Changes (Diff)

### Add
- Admin payment modal: "Previous Balance" payment type toggle; when selected, shows outstanding balance and allows full/partial amount entry; on submit records payment AND deducts from `tmc_prev_balances`
- Member login ID field in add/edit member form: admin sets a login ID (first name or 3-digit padded number 001-999); stored in `tmc_member_login_ids` localStorage map (loginId → memberId string)
- Admin credential change section in SettingsPage: fields for new username, new password, confirm password; saves to `tmc_admin_credentials` localStorage
- Member portal auto-confirm payment: "I have completed this payment" button in Pay Now and Prev. Balance tabs; on click, automatically records the payment to backend and/or deducts from prev balance without requiring admin action

### Modify
- LoginPage admin check: read credentials from `tmc_admin_credentials` localStorage first, fall back to `admin`/`logmein` defaults
- LoginPage member login: resolve entered loginId via `tmc_member_login_ids` map to actual backend memberId; proceed with PIN check against actual memberId
- Member portal header: show member name instead of numeric ID
- On member add/edit: auto-populate loginId suggestion from first name; clean up loginId mapping on member delete

### Remove
- Nothing removed

## Implementation Plan
1. **SettingsPage.tsx**: Add admin credentials change form section (purely localStorage, no backend)
2. **LoginPage.tsx**: Check `tmc_admin_credentials` for admin login; use `tmc_member_login_ids` to resolve member loginId → memberId
3. **MembersPage.tsx**: Add `loginId` field to member form; validate (letters-only first name or 001-999); save/update/delete `tmc_member_login_ids` entries
4. **PaymentModal.tsx**: Add payment type toggle (Monthly Fee / Previous Balance); handle prev balance deduction on submit
5. **MemberPortal.tsx**: Add confirm-payment buttons in Pay Now and Prev. Balance tabs that call `useAddPayment` and update localStorage; show member name in header
