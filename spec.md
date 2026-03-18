# Tengakhat Masjid Committee

## Current State
Admin and member login both use Internet Identity (II), which is broken/confusing for users. The backend uses Principal-based AccessControl. The frontend has a LoginPage with II-triggered buttons.

## Requested Changes (Diff)

### Add
- Simple username + password login form for admins (no Internet Identity)
- Default admin credentials: username=`admin`, password=`logmein`
- Backend function `loginAdmin(username, password)` returning Bool
- Backend function `changeAdminPassword(username, oldPassword, newPassword)` returning Bool
- Frontend session management via localStorage (no II)

### Modify
- Backend: Replace Principal/AccessControl-based auth with credential-based auth stored in canister state. All functions accept anonymous callers; admin actions are gated by a simple session check on the frontend.
- Frontend LoginPage: Replace II button with username + password form for admin tab
- Frontend App.tsx: Remove II hooks; use local session state for admin/member auth

### Remove
- Internet Identity dependency from login flow
- AccessControl permission checks from backend functions

## Implementation Plan
1. Rewrite backend: store admin credentials map (username -> password), expose loginAdmin and changeAdminPassword; keep member/payment/UPI functions but remove AccessControl checks
2. Rewrite frontend LoginPage: admin tab shows username+password form; member tab keeps serial+PIN flow
3. Rewrite App.tsx: use localStorage session state instead of II hooks
