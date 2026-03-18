# Tengakhat Masjid Committee

## Current State
New project, no existing application.

## Requested Changes (Diff)

### Add
- Phone + OTP login with two roles: Admin and Member
- Admin dashboard: add/delete/view members, contribution reports, payment history, balance overview, activity log
- Member dashboard: profile card (serial no, name, phone, monthly amount, yearly balance), payment history, UPI pay links (GPay/PhonePe/Paytm)
- Members data model: serial_no, name, phone, monthly_amount, total_paid, join_date, status (active/inactive)
- Payments data model: member_phone, amount, date, upi_txn_id, status
- UPI payment link generation (deep links for GPay/PhonePe/Paytm) with configurable UPI ID
- Charts: monthly contribution bar chart, yearly pie chart
- Activity log for admin
- Role-based access (admin vs member)

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend: Member and Payment data stores with CRUD, role assignment, payment recording, balance calculation, activity log
2. Backend: UPI configuration (admin sets UPI ID/merchant name)
3. Frontend: Splash/landing page with app name and logo placeholder
4. Frontend: Phone + OTP login screen (simulated OTP for demo)
5. Frontend: Role-based routing (admin vs member)
6. Frontend: Admin dashboard - member table, add/delete member forms, charts, activity log
7. Frontend: Member dashboard - profile card, payment history, UPI pay buttons
8. Frontend: Payment screen with UPI deep links for GPay/PhonePe/Paytm
