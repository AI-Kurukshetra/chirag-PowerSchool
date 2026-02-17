import { addDays, formatISO } from 'date-fns'

export type DemoStudent = {
  id: string
  full_name: string
  email: string
  class_id: string
  guardian_name?: string
  guardian_email?: string
  avatar_url?: string
}

export type DemoClass = {
  id: string
  name: string
  grade: string
  teacher_name: string
}

export type DemoAttendance = {
  id: string
  student_id: string
  class_id: string
  attendance_date: string
  status: 'present' | 'absent' | 'tardy' | 'excused'
  note?: string
}

export type DemoInvoice = {
  id: string
  student_id: string
  due_date: string
  issued_on: string
  amount_cents: number
  status: 'pending' | 'paid' | 'overdue'
  description: string
}

const today = new Date()

const classes: DemoClass[] = [
  { id: 'cls-1', name: 'Maple Homeroom', grade: '4', teacher_name: 'Priya Sharma' },
  { id: 'cls-2', name: 'Cedar Homeroom', grade: '5', teacher_name: 'Michael Chen' },
  { id: 'cls-3', name: 'Oak Homeroom', grade: '6', teacher_name: 'Amelia Rodriguez' },
]

const students: DemoStudent[] = [
  { id: 'stu-1', full_name: 'Aarav Patel', email: 'aarav@example.com', class_id: 'cls-1', guardian_name: 'Neha Patel', guardian_email: 'neha.patel@example.com' },
  { id: 'stu-2', full_name: 'Mia Johnson', email: 'mia@example.com', class_id: 'cls-1', guardian_name: 'Laura Johnson', guardian_email: 'laura.johnson@example.com' },
  { id: 'stu-3', full_name: 'Liam Nguyen', email: 'liam@example.com', class_id: 'cls-2', guardian_name: 'Anh Nguyen', guardian_email: 'anh.nguyen@example.com' },
  { id: 'stu-4', full_name: 'Sophia Garcia', email: 'sophia@example.com', class_id: 'cls-2', guardian_name: 'Carlos Garcia', guardian_email: 'carlos.garcia@example.com' },
  { id: 'stu-5', full_name: 'Ethan Brown', email: 'ethan@example.com', class_id: 'cls-3', guardian_name: 'Melissa Brown', guardian_email: 'melissa.brown@example.com' },
  { id: 'stu-6', full_name: 'Isabella Lee', email: 'isabella@example.com', class_id: 'cls-3', guardian_name: 'Grace Lee', guardian_email: 'grace.lee@example.com' }
]

const attendance: DemoAttendance[] = Array.from({ length: 6 }).flatMap((_, dayIdx) => {
  const date = addDays(today, -dayIdx)
  return students.map((s, idx) => {
    const status: DemoAttendance['status'] = (idx + dayIdx) % 7 === 0 ? 'absent' : 'present'
    return {
      id: `att-${dayIdx}-${s.id}`,
      student_id: s.id,
      class_id: s.class_id,
      attendance_date: formatISO(date, { representation: 'date' }),
      status,
      note: status === 'absent' ? 'Guardian notified' : undefined,
    }
  })
})

const invoices: DemoInvoice[] = [
  { id: 'inv-1', student_id: 'stu-1', amount_cents: 180000, status: 'pending', description: 'Tuition Q1', issued_on: formatISO(addDays(today, -10), { representation: 'date' }), due_date: formatISO(addDays(today, 7), { representation: 'date' }) },
  { id: 'inv-2', student_id: 'stu-3', amount_cents: 95000, status: 'paid', description: 'Activity Fee', issued_on: formatISO(addDays(today, -21), { representation: 'date' }), due_date: formatISO(addDays(today, -5), { representation: 'date' }) },
  { id: 'inv-3', student_id: 'stu-4', amount_cents: 120000, status: 'overdue', description: 'Tuition Q1', issued_on: formatISO(addDays(today, -35), { representation: 'date' }), due_date: formatISO(addDays(today, -3), { representation: 'date' }) },
  { id: 'inv-4', student_id: 'stu-6', amount_cents: 45000, status: 'pending', description: 'Uniforms', issued_on: formatISO(addDays(today, -6), { representation: 'date' }), due_date: formatISO(addDays(today, 4), { representation: 'date' }) }
]

export function getDemoData() {
  return { classes, students, attendance, invoices }
}
