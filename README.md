# TeachTrack

TeachTrack is a single Next.js application that runs on port 3000.

```bash
npm install
npm run dev
```

## Routes

- `http://localhost:3000/dashboard` — teacher management and attendance history
- `http://localhost:3000/attendance` — camera-based face attendance kiosk
- `http://localhost:3000/dashboard` — dashboard, daily IN/OUT records, and payroll
- `http://localhost:3000/attendance` — attendance face-verification PWA

The kiosk marks IN on a teacher’s first successful face scan each day and OUT on the second scan. From a teacher profile, use the enrollment link to open `/attendance/enroll` and capture that teacher’s face descriptor. Raw photos are not stored.

## Environment variables

Set these values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key
NEXT_PUBLIC_FACE_MATCH_THRESHOLD=0.48
SCHOOL_TIMEZONE=Asia/Kolkata
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_` variable.

## No-login setup

This app is configured for a trusted internal deployment with no login page. Run [`supabase/migrations/002_anonymous_access.sql`](supabase/migrations/002_anonymous_access.sql) in the Supabase SQL Editor after the main migration. It allows the browser client to create and manage teachers, attendance, notes, and payroll without authentication.

## Supabase setup

Run [`supabase/migrations/001_teacher_attendance.sql`](supabase/migrations/001_teacher_attendance.sql) in Supabase SQL Editor. Create an Auth user, then use the migration’s final commented SQL statement to assign that user the `admin` role.
