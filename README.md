# PowerSchool (Next.js + Supabase)

School management system with attendance tracking, fee management, and quick reports. Built for AI Kurukshetra.

## Stack
- Next.js 14 (App Router, TypeScript, Tailwind)
- Supabase (Auth, Postgres, storage-ready)
- Vercel-ready deployment

## Quickstart
1) Install deps (requires internet):
   ```sh
   npm install
   ```
2) Copy envs:
   ```sh
   cp .env.local.example .env.local
   ```
   Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3) Create database tables in Supabase SQL editor with `supabase/schema.sql`.
4) Seed demo data (service role key required):
   ```sh
   npm run seed
   ```
5) Run locally:
   ```sh
   npm run dev
   ```
6) Deploy to Vercel: add the two public env vars and build.

## Routes
- `/` (dashboard, auth-protected)
- `/sign-in` (email magic-link or password)
- `/sign-up` (invite-code protected self-serve signup; use `NEXT_PUBLIC_SIGNUP_INVITE_CODE`)

## Database schema (summary)
- `classes`: id, name, grade, teacher_name
- `students`: id, class_id, contact fields
- `attendance_records`: student_id, class_id, date, status
- `fee_invoices`: student_id, due_date, amount_cents, status
- `payments`: invoice_id, paid_on, amount_cents
- `reports`: student_id, term, gpa, summary

## Seed data
`scripts/seed.mjs` inserts sample classes, students, 7 days of attendance, invoices, and three staff logins (admin/teacher/finance). Re-run safe anytime.

## Auth
Middleware enforces auth for dashboard routes. Sign-in uses Supabase Auth UI. Sign-up is invite-code protected and writes role/name into user metadata. Update policies in Supabase if you need role-based filtering.

## Roles & RLS
- Roles stored in `user_metadata.role` and mirrored to `public.profiles`.
- Teacher ↔ class mapping lives in `teacher_classes` (seed links the demo teacher to the first two classes).
- RLS allows read for authenticated users; write perms:
  - Admin: classes, students, attendance, invoices, payments, reports
  - Teacher: attendance, reports
  - Finance: invoices, payments
- Invite code: set `NEXT_PUBLIC_SIGNUP_INVITE_CODE` (blank to disable).

## Notes
- When Supabase envs are missing, the dashboard falls back to local demo data so the UI still renders.
- Tailwind design uses Space Grotesk, dark theme, and cards.
