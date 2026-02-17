import { subDays, parseISO, isWithinInterval } from 'date-fns'
import { getServerSupabase } from './supabaseServer'
import { getDemoData, DemoAttendance, DemoClass, DemoInvoice, DemoStudent } from './demoData'

type AttendanceRecord = DemoAttendance
export type Class = DemoClass
export type Student = DemoStudent
export type Invoice = DemoInvoice

export type DashboardData = {
  classes: Class[]
  students: Student[]
  attendance: AttendanceRecord[]
  invoices: Invoice[]
  summary: {
    studentCount: number
    attendanceRate: number
    outstandingAmount: number
    overdueCount: number
    paidThisMonth: number
  }
  insights: {
    mostAbsent: { student: Student; absences: number }[]
    upcomingDue: Invoice[]
  }
}

const fallback = computeDerived(getDemoData())

export async function loadDashboardData(role?: string, userId?: string): Promise<DashboardData> {
  const supabase = getServerSupabase()

  const hasCreds = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (!hasCreds) return fallback

  try {
    let teacherClassIds: string[] | null = null

    if (role === 'teacher' && userId) {
      const tc = await supabase.from('teacher_classes').select('class_id').eq('user_id', userId)
      if (tc.error) throw tc.error
      teacherClassIds = tc.data?.map((r: any) => r.class_id) || []
    }

    const [classesRes, studentsRes] = await Promise.all([
      supabase.from('classes').select('*'),
      supabase.from('students').select('*'),
    ])

    if (classesRes.error || studentsRes.error) throw new Error('Failed fetching base tables')

    const today = new Date()
    const sevenDaysAgo = subDays(today, 7).toISOString().slice(0, 10)

    const [attendanceRes, invoicesRes] = await Promise.all([
      supabase
        .from('attendance_records')
        .select('*')
        .gte('attendance_date', sevenDaysAgo),
      supabase.from('fee_invoices').select('*')
    ])

    if (attendanceRes.error || invoicesRes.error) throw new Error('Failed fetching fact tables')

    let classes = classesRes.data || []
    let students = studentsRes.data || []
    let attendance = attendanceRes.data || []
    let invoices = invoicesRes.data || []

    if (teacherClassIds && teacherClassIds.length) {
      classes = classes.filter((c) => teacherClassIds!.includes(c.id))
      students = students.filter((s) => teacherClassIds!.includes(s.class_id))
      attendance = attendance.filter((a) => teacherClassIds!.includes(a.class_id))
      invoices = invoices.filter((i) => {
        const student = students.find((s) => s.id === i.student_id)
        return student ? teacherClassIds!.includes(student.class_id) : false
      })
    }

    return computeDerived({
      classes,
      students,
      attendance,
      invoices,
    })
  } catch (err) {
    console.warn('Falling back to demo data:', err)
    return fallback
  }
}

function computeDerived(data: {
  classes: Class[]
  students: Student[]
  attendance: AttendanceRecord[]
  invoices: Invoice[]
}): DashboardData {
  const { classes, students, attendance, invoices } = data
  const today = new Date()
  const last30 = subDays(today, 30)

  const attendanceLast7 = attendance.filter((a) =>
    isWithinInterval(parseISO(a.attendance_date), {
      start: subDays(today, 7),
      end: today,
    })
  )

  const presentCount = attendanceLast7.filter((a) => a.status === 'present').length
  const attendanceRate = attendanceLast7.length ? Math.round((presentCount / attendanceLast7.length) * 100) : 0

  const outstandingInvoices = invoices.filter((inv) => inv.status !== 'paid')
  const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.amount_cents, 0)
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length

  const paidThisMonth = invoices
    .filter((inv) => inv.status === 'paid' && isWithinInterval(parseISO(inv.issued_on), { start: last30, end: today }))
    .reduce((sum, inv) => sum + inv.amount_cents, 0)

  const absencesByStudent = students.map((s) => ({
    student: s,
    absences: attendanceLast7.filter((a) => a.student_id === s.id && a.status === 'absent').length,
  }))

  const mostAbsent = absencesByStudent
    .filter((a) => a.absences > 0)
    .sort((a, b) => b.absences - a.absences)
    .slice(0, 3)

  const upcomingDue = invoices
    .filter((inv) => inv.status !== 'paid')
    .sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime())
    .slice(0, 5)

  return {
    classes,
    students,
    attendance,
    invoices,
    summary: {
      studentCount: students.length,
      attendanceRate,
      outstandingAmount,
      overdueCount,
      paidThisMonth,
    },
    insights: {
      mostAbsent,
      upcomingDue,
    },
  }
}
