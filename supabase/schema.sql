-- Create extensions
create extension if not exists "uuid-ossp";

-- Core tables
create table if not exists public.classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  grade text not null,
  teacher_name text not null,
  created_at timestamptz default now()
);

-- Map staff to classes they manage
create table if not exists public.teacher_classes (
  user_id uuid references auth.users on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, class_id)
);

-- Attendance lock per class/day
create table if not exists public.attendance_locks (
  class_id uuid references public.classes(id) on delete cascade,
  attendance_date date not null,
  locked boolean default true,
  locked_by uuid references auth.users on delete set null,
  locked_at timestamptz default now(),
  primary key (class_id, attendance_date)
);

create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text,
  birth_date date,
  previous_school text,
  father_name text,
  mother_name text,
  phone text,
  medical_info text,
  photo_url text,
  aadhar_url text,
  certificate_url text,
  guardian_name text,
  guardian_email text,
  avatar_url text,
  class_id uuid references public.classes(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present','absent','tardy','excused')),
  note text,
  created_at timestamptz default now(),
  unique (student_id, attendance_date)
);

create table if not exists public.fee_invoices (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.students(id) on delete cascade,
  due_date date not null,
  issued_on date default now(),
  amount_cents integer not null,
  status text default 'pending' check (status in ('pending','paid','overdue')),
  description text,
  created_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.fee_invoices(id) on delete cascade,
  paid_on date not null,
  amount_cents integer not null,
  method text,
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.students(id) on delete cascade,
  term text not null,
  gpa numeric(3,2),
  summary text,
  created_at timestamptz default now()
);

-- Exams + scores
create table if not exists public.exams (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references public.classes(id) on delete cascade,
  name text not null,
  exam_type text not null default 'unit' check (exam_type in ('unit','midterm','final','quiz')),
  term text default 'Term 1',
  exam_date date default now(),
  max_score integer default 100,
  created_at timestamptz default now()
);

create table if not exists public.exam_scores (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid references public.exams(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  score numeric(6,2) not null,
  grade text,
  comments text,
  created_at timestamptz default now(),
  unique (exam_id, student_id)
);

-- Timetable per class/period
create table if not exists public.timetables (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references public.classes(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  start_time time not null,
  end_time time not null,
  subject text not null,
  room text,
  teacher_id uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

-- Homework + submissions
create table if not exists public.homeworks (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references public.classes(id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  attachment_url text,
  assigned_by uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.homework_submissions (
  id uuid primary key default uuid_generate_v4(),
  homework_id uuid references public.homeworks(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  file_url text,
  comments text,
  grade text,
  status text default 'pending' check (status in ('pending','submitted','graded')),
  submitted_at timestamptz default now()
);

-- Subjects per class
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references public.classes(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Grade records
create table if not exists public.grades (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  term text not null,
  score numeric(5,2),
  max_score numeric(5,2) default 100,
  letter text,
  comments text,
  recorded_at timestamptz default now()
);

-- Activity log
create table if not exists public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete set null,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_attendance_date on public.attendance_records(attendance_date);
create index if not exists idx_invoices_status on public.fee_invoices(status);
create index if not exists idx_students_class on public.students(class_id);
create index if not exists idx_subjects_class on public.subjects(class_id);
create index if not exists idx_grades_student on public.grades(student_id);

-- Profiles mirror auth users with roles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text default 'teacher',
  designation text,
  department text,
  salary_cents integer,
  staff_doc_url text,
  resume_url text,
  created_at timestamptz default now()
);

-- Sync profile on new auth user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), coalesce(new.raw_user_meta_data->>'role','teacher'))
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable row level security
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.attendance_records enable row level security;
alter table public.fee_invoices enable row level security;
alter table public.payments enable row level security;
alter table public.reports enable row level security;
alter table public.profiles enable row level security;
alter table public.teacher_classes enable row level security;
alter table public.attendance_locks enable row level security;
alter table public.activity_logs enable row level security;
alter table public.subjects enable row level security;
alter table public.grades enable row level security;
alter table public.staff_attendance enable row level security;
alter table public.staff_leaves enable row level security;
alter table public.payroll_entries enable row level security;

-- Helper to extract app role from JWT user metadata
create or replace function public.jwt_role() returns text language sql immutable as $$
  select coalesce(current_setting('request.jwt.claims'::text, true)::json->'user_metadata'->>'role', 'teacher')
$$;

-- Drop old policies
do $$ declare
  pol record;
begin
  for pol in select policyname, tablename from pg_policies where schemaname='public' loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- Read policies (authenticated only)
create policy "classes_select" on public.classes for select using (auth.role() = 'authenticated');
create policy "students_select" on public.students for select using (auth.role() = 'authenticated');
create policy "attendance_select" on public.attendance_records for select using (
  auth.role() = 'authenticated' and (
    public.jwt_role() = 'admin'
    or exists (
      select 1 from public.teacher_classes tc
      where tc.user_id = auth.uid()
        and tc.class_id = attendance_records.class_id
    )
    or public.jwt_role() in ('finance') -- allow finance read if needed
  )
);
create policy "invoices_select" on public.fee_invoices for select using (
  auth.role() = 'authenticated' and (
    public.jwt_role() in ('admin','finance')
    or exists (
      select 1 from public.teacher_classes tc
      join public.students s on s.class_id = tc.class_id
      where tc.user_id = auth.uid()
        and s.id = fee_invoices.student_id
    )
  )
);
create policy "payments_select" on public.payments for select using (auth.role() = 'authenticated');
create policy "reports_select" on public.reports for select using (auth.role() = 'authenticated');
create policy "profiles_select" on public.profiles for select using (
  auth.role() = 'authenticated' and (auth.uid() = user_id or public.jwt_role() = 'admin')
);

create policy "teacher_classes_select" on public.teacher_classes for select using (
  auth.role() = 'authenticated' and (public.jwt_role() = 'admin' or auth.uid() = user_id)
);
create policy "teacher_classes_write_admin" on public.teacher_classes
  for insert with check (public.jwt_role() = 'admin' or public.jwt_role() is null);
create policy "teacher_classes_delete_admin" on public.teacher_classes
  for delete using (public.jwt_role() = 'admin' or public.jwt_role() is null);
create policy "teacher_classes_update_admin" on public.teacher_classes
  for update using (public.jwt_role() = 'admin' or public.jwt_role() is null)
  with check (public.jwt_role() = 'admin' or public.jwt_role() is null);

create policy "attendance_locks_select" on public.attendance_locks for select using (
  auth.role() = 'authenticated'
);
create policy "attendance_locks_write" on public.attendance_locks
  for insert with check (public.jwt_role() in ('admin','teacher') or public.jwt_role() is null);
create policy "attendance_locks_update" on public.attendance_locks
  for update using (public.jwt_role() in ('admin','teacher') or public.jwt_role() is null)
  with check (public.jwt_role() in ('admin','teacher') or public.jwt_role() is null);
create policy "attendance_locks_delete_admin" on public.attendance_locks
  for delete using (public.jwt_role() = 'admin' or public.jwt_role() is null);

create policy "activity_logs_select" on public.activity_logs for select using (auth.role() = 'authenticated');
create policy "activity_logs_insert" on public.activity_logs for insert with check (
  public.jwt_role() in ('admin','teacher','finance') or public.jwt_role() is null
);

create policy "subjects_select" on public.subjects for select using (auth.role() = 'authenticated');
create policy "subjects_write_admin" on public.subjects for insert with check (public.jwt_role() = 'admin');
create policy "subjects_update_admin" on public.subjects for update using (public.jwt_role() = 'admin');
create policy "subjects_delete_admin" on public.subjects for delete using (public.jwt_role() = 'admin');

create policy "grades_select" on public.grades for select using (
  auth.role() = 'authenticated' and (
    public.jwt_role() = 'admin'
    or exists (
      select 1 from public.teacher_classes tc
      join public.subjects sub on sub.class_id = tc.class_id
      where tc.user_id = auth.uid()
        and sub.id = grades.subject_id
    )
    or public.jwt_role() = 'finance' -- allow finance read if needed
  )
);
create policy "grades_write_teacher_admin" on public.grades
  for insert with check (
    public.jwt_role() = 'admin'
    or (
      public.jwt_role() = 'teacher'
      and exists (
        select 1 from public.teacher_classes tc
        join public.subjects sub on sub.class_id = tc.class_id
        where tc.user_id = auth.uid()
          and sub.id = grades.subject_id
      )
    )
  );
create policy "grades_update_teacher_admin" on public.grades
  for update using (
    public.jwt_role() = 'admin'
    or (
      public.jwt_role() = 'teacher'
      and exists (
        select 1 from public.teacher_classes tc
        join public.subjects sub on sub.class_id = tc.class_id
        where tc.user_id = auth.uid()
          and sub.id = grades.subject_id
      )
    )
  );

-- Write policies by role
create policy "classes_admin_write" on public.classes for insert with check (public.jwt_role() = 'admin');

create policy "students_admin_write" on public.students for insert with check (public.jwt_role() = 'admin');
create policy "students_admin_update" on public.students for update using (public.jwt_role() = 'admin');

create policy "attendance_write_teacher_admin" on public.attendance_records
  for insert with check (
    public.jwt_role() = 'admin'
    or (
      public.jwt_role() = 'teacher'
      and exists (
        select 1 from public.teacher_classes tc
        where tc.user_id = auth.uid()
          and tc.class_id = attendance_records.class_id
      )
      or (
        -- fallback: if teacher has no mappings yet, allow (hackathon-friendly)
        public.jwt_role() = 'teacher' and not exists (select 1 from public.teacher_classes tc where tc.user_id = auth.uid())
      )
    )
  );

create policy "attendance_update_teacher_admin" on public.attendance_records
  for update using (
    public.jwt_role() = 'admin'
    or (
      public.jwt_role() = 'teacher'
      and exists (
        select 1 from public.teacher_classes tc
        where tc.user_id = auth.uid()
          and tc.class_id = attendance_records.class_id
      )
      or (
        public.jwt_role() = 'teacher' and not exists (select 1 from public.teacher_classes tc where tc.user_id = auth.uid())
      )
    )
  );

create policy "invoices_write_finance_admin" on public.fee_invoices for insert with check (public.jwt_role() in ('admin','finance'));
create policy "invoices_update_finance_admin" on public.fee_invoices for update using (public.jwt_role() in ('admin','finance'));

create policy "payments_write_finance_admin" on public.payments for insert with check (public.jwt_role() in ('admin','finance'));

create policy "reports_write_teacher_admin" on public.reports for insert with check (public.jwt_role() in ('admin','teacher'));
create policy "reports_update_teacher_admin" on public.reports for update using (public.jwt_role() in ('admin','teacher'));

-- Timetable policies
create policy "timetables_select" on public.timetables for select using (auth.role() = 'authenticated');
create policy "timetables_insert" on public.timetables for insert with check (public.jwt_role() in ('admin','teacher'));
create policy "timetables_update" on public.timetables for update using (public.jwt_role() in ('admin','teacher'));

-- Homework policies
create policy "homeworks_select" on public.homeworks for select using (auth.role() = 'authenticated');
create policy "homeworks_insert_admin_teacher" on public.homeworks for insert with check (public.jwt_role() in ('admin','teacher'));
create policy "homeworks_update_admin_teacher" on public.homeworks for update using (public.jwt_role() in ('admin','teacher'));

create policy "homework_submissions_select" on public.homework_submissions for select using (auth.role() = 'authenticated');
create policy "homework_submissions_insert" on public.homework_submissions for insert with check (public.jwt_role() in ('admin','teacher'));
create policy "homework_submissions_update" on public.homework_submissions for update using (public.jwt_role() in ('admin','teacher'));

-- Exams policies
create policy "exams_select" on public.exams for select using (auth.role() = 'authenticated');
create policy "exams_insert" on public.exams for insert with check (public.jwt_role() in ('admin','teacher'));
create policy "exams_update" on public.exams for update using (public.jwt_role() in ('admin','teacher'));

create policy "exam_scores_select" on public.exam_scores for select using (auth.role() = 'authenticated');
create policy "exam_scores_upsert" on public.exam_scores for insert with check (public.jwt_role() in ('admin','teacher'));
create policy "exam_scores_update" on public.exam_scores for update using (public.jwt_role() in ('admin','teacher'));

-- Staff attendance
create table if not exists public.staff_attendance (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present','absent','leave')),
  note text,
  created_at timestamptz default now(),
  unique (user_id, attendance_date)
);
alter table public.staff_attendance enable row level security;
create policy "staff_attendance_select" on public.staff_attendance for select using (public.jwt_role() = 'admin' or auth.uid() = user_id);
create policy "staff_attendance_insert" on public.staff_attendance for insert with check (public.jwt_role() = 'admin' or auth.uid() = user_id);
create policy "staff_attendance_update" on public.staff_attendance for update using (public.jwt_role() = 'admin' or auth.uid() = user_id);

-- Staff leaves
create table if not exists public.staff_leaves (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);
alter table public.staff_leaves enable row level security;
create policy "staff_leaves_select" on public.staff_leaves for select using (public.jwt_role() = 'admin' or auth.uid() = user_id);
create policy "staff_leaves_insert" on public.staff_leaves for insert with check (auth.uid() = user_id or public.jwt_role() = 'admin');
create policy "staff_leaves_update" on public.staff_leaves for update using (public.jwt_role() = 'admin');

-- Payroll entries
create table if not exists public.payroll_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  period_start date not null,
  period_end date not null,
  gross_cents integer not null,
  deductions_cents integer default 0,
  net_cents integer not null,
  paid_on date,
  method text,
  note text,
  created_at timestamptz default now()
);
alter table public.payroll_entries enable row level security;
create policy "payroll_select" on public.payroll_entries for select using (public.jwt_role() = 'admin');
create policy "payroll_insert" on public.payroll_entries for insert with check (public.jwt_role() = 'admin');
create policy "payroll_update" on public.payroll_entries for update using (public.jwt_role() = 'admin');

-- Storage buckets for docs
insert into storage.buckets (id, name, public)
values
  ('student-docs', 'student-docs', true),
  ('staff-docs', 'staff-docs', true),
  ('homework', 'homework', true)
on conflict do nothing;

-- Storage RLS for student docs
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'student_docs_select') then
    create policy "student_docs_select" on storage.objects for select using (bucket_id = 'student-docs' and auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'student_docs_insert') then
    create policy "student_docs_insert" on storage.objects for insert with check (bucket_id = 'student-docs' and public.jwt_role() in ('admin','teacher'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'student_docs_delete') then
    create policy "student_docs_delete" on storage.objects for delete using (bucket_id = 'student-docs' and public.jwt_role() = 'admin');
  end if;
end $$;

-- Storage RLS for staff docs
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'staff_docs_select') then
    create policy "staff_docs_select" on storage.objects for select using (bucket_id = 'staff-docs' and public.jwt_role() = 'admin');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'staff_docs_insert') then
    create policy "staff_docs_insert" on storage.objects for insert with check (bucket_id = 'staff-docs' and public.jwt_role() = 'admin');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'staff_docs_delete') then
    create policy "staff_docs_delete" on storage.objects for delete using (bucket_id = 'staff-docs' and public.jwt_role() = 'admin');
  end if;
end $$;
