import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { addDays, formatISO } from 'date-fns'

// Load .env.local manually so you can just run `npm run seed`
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, '')
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const today = new Date()

const classes = [
  { id: '1afdf31a-9e7a-4e9c-9c19-111111111111', name: 'Maple Homeroom', grade: '4', teacher_name: 'Priya Sharma' },
  { id: '1afdf31a-9e7a-4e9c-9c19-222222222222', name: 'Cedar Homeroom', grade: '5', teacher_name: 'Michael Chen' },
  { id: '1afdf31a-9e7a-4e9c-9c19-333333333333', name: 'Oak Homeroom', grade: '6', teacher_name: 'Amelia Rodriguez' },
]

const students = [
  {
    id: '0ec41b1f-3b3c-4f9b-8a41-111111111111',
    full_name: 'Aarav Patel',
    email: 'aarav@example.com',
    guardian_name: 'Neha Patel',
    guardian_email: 'neha.patel@example.com',
    father_name: 'Rahul Patel',
    mother_name: 'Neha Patel',
    phone: '+1-415-555-0111',
    birth_date: '2013-04-22',
    previous_school: 'Sunrise Academy',
    medical_info: 'Peanut allergy',
    class_id: classes[0].id,
  },
  {
    id: '0ec41b1f-3b3c-4f9b-8a41-222222222222',
    full_name: 'Mia Johnson',
    email: 'mia@example.com',
    guardian_name: 'Laura Johnson',
    guardian_email: 'laura.johnson@example.com',
    father_name: 'Mark Johnson',
    mother_name: 'Laura Johnson',
    phone: '+1-415-555-0112',
    birth_date: '2012-11-10',
    previous_school: 'Oak Valley School',
    medical_info: 'Asthma - inhaler',
    class_id: classes[0].id,
  },
  {
    id: '0ec41b1f-3b3c-4f9b-8a41-333333333333',
    full_name: 'Liam Nguyen',
    email: 'liam@example.com',
    guardian_name: 'Anh Nguyen',
    guardian_email: 'anh.nguyen@example.com',
    father_name: 'Minh Nguyen',
    mother_name: 'Anh Nguyen',
    phone: '+1-415-555-0113',
    birth_date: '2012-08-03',
    previous_school: 'Greenfield Prep',
    medical_info: null,
    class_id: classes[1].id,
  },
  {
    id: '0ec41b1f-3b3c-4f9b-8a41-444444444444',
    full_name: 'Sophia Garcia',
    email: 'sophia@example.com',
    guardian_name: 'Carlos Garcia',
    guardian_email: 'carlos.garcia@example.com',
    father_name: 'Carlos Garcia',
    mother_name: 'Elena Garcia',
    phone: '+1-415-555-0114',
    birth_date: '2013-02-15',
    previous_school: 'Harborview Elementary',
    medical_info: 'Lactose sensitive',
    class_id: classes[1].id,
  },
  {
    id: '0ec41b1f-3b3c-4f9b-8a41-555555555555',
    full_name: 'Ethan Brown',
    email: 'ethan@example.com',
    guardian_name: 'Melissa Brown',
    guardian_email: 'melissa.brown@example.com',
    father_name: 'David Brown',
    mother_name: 'Melissa Brown',
    phone: '+1-415-555-0115',
    birth_date: '2011-09-30',
    previous_school: 'Ridgeview Charter',
    medical_info: null,
    class_id: classes[2].id,
  },
  {
    id: '0ec41b1f-3b3c-4f9b-8a41-666666666666',
    full_name: 'Isabella Lee',
    email: 'isabella@example.com',
    guardian_name: 'Grace Lee',
    guardian_email: 'grace.lee@example.com',
    father_name: 'Daniel Lee',
    mother_name: 'Grace Lee',
    phone: '+1-415-555-0116',
    birth_date: '2013-01-12',
    previous_school: 'Pinecrest School',
    medical_info: 'Carries EpiPen',
    class_id: classes[2].id,
  },
]

const attendance = Array.from({ length: 7 }).flatMap((_, dayIdx) => {
  const date = addDays(today, -dayIdx)
  return students.map((s, idx) => {
    const status = (idx + dayIdx) % 6 === 0 ? 'absent' : 'present'
    return {
      student_id: s.id,
      class_id: s.class_id,
      attendance_date: formatISO(date, { representation: 'date' }),
      status,
      note: status === 'absent' ? 'Guardian notified' : null,
    }
  })
})

const invoices = [
  { id: '7a662123-4b5c-4a0f-8fb1-111111111111', student_id: students[0].id, amount_cents: 180000, status: 'pending', description: 'Tuition Q1', issued_on: formatISO(addDays(today, -10), { representation: 'date' }), due_date: formatISO(addDays(today, 7), { representation: 'date' }) },
  { id: '7a662123-4b5c-4a0f-8fb1-222222222222', student_id: students[2].id, amount_cents: 95000, status: 'paid', description: 'Activity Fee', issued_on: formatISO(addDays(today, -21), { representation: 'date' }), due_date: formatISO(addDays(today, -5), { representation: 'date' }) },
  { id: '7a662123-4b5c-4a0f-8fb1-333333333333', student_id: students[3].id, amount_cents: 120000, status: 'overdue', description: 'Tuition Q1', issued_on: formatISO(addDays(today, -35), { representation: 'date' }), due_date: formatISO(addDays(today, -3), { representation: 'date' }) },
  { id: '7a662123-4b5c-4a0f-8fb1-444444444444', student_id: students[5].id, amount_cents: 45000, status: 'pending', description: 'Uniforms', issued_on: formatISO(addDays(today, -6), { representation: 'date' }), due_date: formatISO(addDays(today, 4), { representation: 'date' }) },
]

const subjects = [
  { id: '11111111-1111-1111-1111-aaaaaaaaaaa1', class_id: classes[0].id, name: 'Math' },
  { id: '11111111-1111-1111-1111-aaaaaaaaaaa2', class_id: classes[0].id, name: 'Science' },
  { id: '11111111-1111-1111-1111-aaaaaaaaaaa3', class_id: classes[1].id, name: 'English' },
  { id: '11111111-1111-1111-1111-aaaaaaaaaaa4', class_id: classes[2].id, name: 'History' },
]

const grades = [
  { id: '22222222-2222-2222-2222-bbbbbbbbbbb1', student_id: students[0].id, subject_id: '11111111-1111-1111-1111-aaaaaaaaaaa1', term: 'Term 1', score: 92, max_score: 100, letter: 'A', comments: 'Great work' },
  { id: '22222222-2222-2222-2222-bbbbbbbbbbb2', student_id: students[0].id, subject_id: '11111111-1111-1111-1111-aaaaaaaaaaa2', term: 'Term 1', score: 88, max_score: 100, letter: 'B+', comments: 'Solid understanding' },
  { id: '22222222-2222-2222-2222-bbbbbbbbbbb3', student_id: students[1].id, subject_id: '11111111-1111-1111-1111-aaaaaaaaaaa1', term: 'Term 1', score: 79, max_score: 100, letter: 'C+', comments: 'Needs practice' },
  { id: '22222222-2222-2222-2222-bbbbbbbbbbb4', student_id: students[2].id, subject_id: '11111111-1111-1111-1111-aaaaaaaaaaa3', term: 'Term 1', score: 85, max_score: 100, letter: 'B', comments: 'Good participation' },
]

const locks = [
  {
    class_id: classes[0].id,
    attendance_date: formatISO(today, { representation: 'date' }),
    locked: true,
    locked_by: null,
  },
]

const homeworks = [
  {
    id: '33333333-3333-3333-3333-aaaaaaaaaaa1',
    class_id: classes[0].id,
    title: 'Math worksheet - Fractions',
    description: 'Complete problems 1-10. Bring questions to next class.',
    due_date: formatISO(addDays(today, 2), { representation: 'date' }),
    attachment_url: null,
    assigned_by: null,
  },
  {
    id: '33333333-3333-3333-3333-aaaaaaaaaaa2',
    class_id: classes[1].id,
    title: 'English reading log',
    description: 'Read chapter 3 and write 5 bullet takeaways.',
    due_date: formatISO(addDays(today, 3), { representation: 'date' }),
    attachment_url: null,
    assigned_by: null,
  },
]

const homeworkSubmissions = [
  {
    id: '44444444-4444-4444-4444-aaaaaaaaaaa1',
    homework_id: homeworks[0].id,
    student_id: students[0].id,
    file_url: null,
    comments: 'Submitted in class',
    grade: null,
    status: 'submitted',
  },
]

const timetables = [
  {
    id: '55555555-5555-5555-5555-aaaaaaaaaaa1',
    class_id: classes[0].id,
    day_of_week: 'Mon',
    start_time: '09:00',
    end_time: '09:45',
    subject: 'Math',
    room: '201',
    teacher_id: null,
  },
  {
    id: '55555555-5555-5555-5555-aaaaaaaaaaa2',
    class_id: classes[0].id,
    day_of_week: 'Mon',
    start_time: '10:00',
    end_time: '10:45',
    subject: 'Science',
    room: 'Lab 1',
    teacher_id: null,
  },
  {
    id: '55555555-5555-5555-5555-aaaaaaaaaaa3',
    class_id: classes[1].id,
    day_of_week: 'Tue',
    start_time: '11:00',
    end_time: '11:45',
    subject: 'English',
    room: '105',
    teacher_id: null,
  },
]

const exams = [
  {
    id: '66666666-6666-6666-6666-aaaaaaaaaaa1',
    class_id: classes[0].id,
    name: 'Math Unit Test 1',
    exam_type: 'unit',
    term: 'Term 1',
    exam_date: formatISO(today, { representation: 'date' }),
    max_score: 100,
  },
  {
    id: '66666666-6666-6666-6666-aaaaaaaaaaa2',
    class_id: classes[1].id,
    name: 'English Midterm',
    exam_type: 'midterm',
    term: 'Term 1',
    exam_date: formatISO(addDays(today, 7), { representation: 'date' }),
    max_score: 100,
  },
]

const examScores = [
  {
    id: '77777777-7777-7777-7777-aaaaaaaaaaa1',
    exam_id: exams[0].id,
    student_id: students[0].id,
    score: 92,
    grade: 'A',
    comments: 'Great work',
  },
  {
    id: '77777777-7777-7777-7777-aaaaaaaaaaa2',
    exam_id: exams[0].id,
    student_id: students[1].id,
    score: 78,
    grade: 'C+',
    comments: 'Needs practice',
  },
  {
    id: '77777777-7777-7777-7777-aaaaaaaaaaa3',
    exam_id: exams[1].id,
    student_id: students[2].id,
    score: 85,
    grade: 'B',
    comments: 'Good comprehension',
  },
]

const staffAttendance = () => {
  const todayStr = formatISO(today, { representation: 'date' })
  return [
    { user_id: null, attendance_date: todayStr, status: 'present', note: 'Demo principal' },
  ]
}

const staffLeaves = [
  {
    id: '88888888-8888-8888-8888-aaaaaaaaaaa1',
    user_id: null,
    start_date: formatISO(addDays(today, 2), { representation: 'date' }),
    end_date: formatISO(addDays(today, 3), { representation: 'date' }),
    reason: 'Medical appointment',
    status: 'pending',
  },
]

const payrollEntries = [
  {
    id: '99999999-9999-9999-9999-aaaaaaaaaaa1',
    user_id: null,
    period_start: formatISO(addDays(today, -30), { representation: 'date' }),
    period_end: formatISO(addDays(today, -1), { representation: 'date' }),
    gross_cents: 900000,
    deductions_cents: 50000,
    net_cents: 850000,
    paid_on: formatISO(addDays(today, -1), { representation: 'date' }),
    method: 'bank transfer',
    note: 'Monthly payroll',
  },
]

async function run() {
  await seedUsers()

  console.log('Seeding classes...')
  await must(supabase.from('classes').upsert(classes))

  console.log('Seeding students...')
  await must(supabase.from('students').upsert(students))

  console.log('Seeding attendance...')
  await must(
    supabase
      .from('attendance_records')
      .upsert(attendance, { onConflict: 'student_id,attendance_date' })
  )

  console.log('Seeding invoices...')
  await must(supabase.from('fee_invoices').upsert(invoices))

  console.log('Seeding subjects...')
  await must(supabase.from('subjects').upsert(subjects))

  console.log('Seeding grades...')
  await must(supabase.from('grades').upsert(grades))

  console.log('Seeding attendance locks...')
  await must(supabase.from('attendance_locks').upsert(locks))

  console.log('Seeding homeworks...')
  await must(supabase.from('homeworks').upsert(homeworks))
  console.log('Seeding homework submissions...')
  await must(supabase.from('homework_submissions').upsert(homeworkSubmissions))
  console.log('Seeding timetables...')
  await must(supabase.from('timetables').upsert(timetables))
  console.log('Seeding exams...')
  await must(supabase.from('exams').upsert(exams))
  console.log('Seeding exam scores...')
  await must(supabase.from('exam_scores').upsert(examScores))

  console.log('Seeding activity log...')
  await supabase.from('activity_logs').upsert([
    {
      id: 'act-1',
      user_id: null,
      action: 'seed_initialized',
      entity: 'system',
      entity_id: 'seed',
      meta: { note: 'Initial seed run' }
    },
    {
      id: 'act-2',
      user_id: null,
      action: 'invoice_mark_paid',
      entity: 'invoice',
      entity_id: '7a662123-4b5c-4a0f-8fb1-222222222222',
      meta: { amount_cents: 95000 }
    }
  ])

  console.log('Done. Dashboard will show this data on next load.')
}

async function seedUsers() {
  const users = [
    { email: 'admin@school.test', password: 'Admin123!', role: 'admin', full_name: 'Admin User' },
    { email: 'finance@school.test', password: 'Finance123!', role: 'finance', full_name: 'Finance User' },
    { email: 'teacher@school.test', password: 'Teacher123!', role: 'teacher', full_name: 'Teacher User' },
    // dummy teachers
    ...[
      'Priya Sharma',
      'Michael Chen',
      'Amelia Rodriguez',
      'Liam Nguyen',
      'Olivia Davis',
      'Noah Wilson',
      'Emma Thompson',
      'Ava Martinez',
      'Ethan Brown',
      'Sophia Patel',
      'Mason Clark',
      'Isabella Lopez',
      'Lucas Turner',
      'Mia Scott',
      'James Walker',
      'Charlotte Young',
      'Benjamin Hill',
      'Harper Adams',
      'Elijah Rivera',
      'Aria Flores'
    ].map((name) => ({
      email: `${name.toLowerCase().replace(/\s+/g, '')}@school.test`,
      password: 'Teacher123!',
      role: 'teacher',
      full_name: name.trim(),
    })),
  ]

  const profiles = []

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role: user.role, full_name: user.full_name },
    })

    let userId = data?.user?.id

    if (error) {
      const isExists = error.code === 'email_exists' || error.message?.includes('already been registered')
      if (!isExists) {
        console.error('User seed error', user.email, error)
        continue
      }
    }

    if (!userId) {
      const fetched = await getUserByEmail(user.email)
      userId = fetched?.id
    }

    if (userId) {
      const base = { user_id: userId, full_name: user.full_name, role: user.role }
      const enriched =
        user.role === 'admin'
          ? { ...base, designation: 'Principal', department: 'Administration', salary_cents: 1200000 }
          : user.role === 'finance'
            ? { ...base, designation: 'Accountant', department: 'Finance', salary_cents: 900000 }
            : { ...base, designation: 'Teacher', department: 'Academics', salary_cents: 800000 }
      profiles.push(enriched)
      console.log(`Ready profile for ${user.email} (${user.role})`)
    }
  }

  if (profiles.length) {
    console.log('Upserting profiles...')
    await must(supabase.from('profiles').upsert(profiles))
  }

  // Map teacher to classes 1 and 2 if present
  const teacher = profiles.find((p) => p.role === 'teacher')
  const admin = profiles.find((p) => p.role === 'admin')
  const finance = profiles.find((p) => p.role === 'finance')

  if (teacher) {
    const classIds = classes.slice(0, 2).map((c) => c.id)
    const teacherClasses = classIds.map((cid) => ({ user_id: teacher.user_id, class_id: cid }))
    console.log('Linking teacher to classes...')
    await must(supabase.from('teacher_classes').upsert(teacherClasses))
  }

  // Seed staff attendance / leaves / payroll
  const attendanceRows = staffAttendance().map((row) => ({ ...row, user_id: admin?.user_id || row.user_id }))
  if (attendanceRows.length) {
    console.log('Seeding staff attendance...')
    await must(supabase.from('staff_attendance').upsert(attendanceRows, { onConflict: 'user_id,attendance_date' }))
  }
  const leaveRows = staffLeaves.map((row) => ({ ...row, user_id: admin?.user_id || row.user_id }))
  if (leaveRows.length) {
    console.log('Seeding staff leaves...')
    await must(supabase.from('staff_leaves').upsert(leaveRows))
  }
  const payrollRows = payrollEntries.map((row) => ({ ...row, user_id: finance?.user_id || admin?.user_id || row.user_id }))
  if (payrollRows.length) {
    console.log('Seeding payroll entries...')
    await must(supabase.from('payroll_entries').upsert(payrollRows))
  }
}

async function getUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) {
    console.error('listUsers error', error)
    return null
  }
  return data.users.find((u) => u.email === email) || null
}

async function must(resultPromise) {
  const result = await resultPromise
  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }
  return result.data
}

run()
