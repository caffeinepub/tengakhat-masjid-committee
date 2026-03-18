# Tengakhat Masjid Committee

## Current State
Existing app with simulated OTP login, member dashboard, UPI payment links, and Islamic-themed UI.

## Requested Changes (Diff)

### Add
- Multi-admin authentication: username + password login stored in backend
- Super-admin role that can add/remove other admins
- Member authentication: login via serial number or username + PIN
- Admin ability to set username and PIN when adding a member
- UPI settings page for admin to configure committee UPI ID

### Modify
- Replace fake OTP login with real username/password (admin) and serial/username+PIN (member) login
- Member add form: include username and PIN fields

### Remove
- All fake OTP/phone login code
- Stripe/debit card payment integration

## Implementation Plan
1. Backend: admin accounts (username, password hash, role), member accounts (serial, username, pin, name, phone, contribution), UPI settings
2. Backend: login/auth functions for admins and members, session tokens
3. Backend: CRUD for members, admin management by super-admin
4. Frontend: Admin login page (username+password)
5. Frontend: Member login page (serial number or username + PIN)
6. Frontend: Admin dashboard with member management, UPI settings, and other admin management
7. Frontend: Member dashboard with profile, balance, UPI payment links
8. PWA manifest and service worker retained
