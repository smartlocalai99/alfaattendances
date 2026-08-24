-- Use this only for a trusted internal/local deployment with no login screen.
-- It allows the public browser client to manage TeachTrack data.

drop policy if exists "admin teachers" on public.teachers;
drop policy if exists "admin attendance" on public.attendance;
drop policy if exists "admin notes" on public.teacher_notes;
drop policy if exists "admin payroll" on public.payroll;

create policy "public teachers access" on public.teachers
  for all to anon, authenticated using (true) with check (true);
create policy "public attendance access" on public.attendance
  for all to anon, authenticated using (true) with check (true);
create policy "public notes access" on public.teacher_notes
  for all to anon, authenticated using (true) with check (true);
create policy "public payroll access" on public.payroll
  for all to anon, authenticated using (true) with check (true);
