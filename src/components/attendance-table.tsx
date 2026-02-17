'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import clsx from 'clsx'
import { Class, Student, DashboardData } from '@/lib/data'

type Role = 'admin' | 'teacher' | 'finance' | string

export function AttendanceTable({ data, role }: { data: DashboardData; role: Role }) {
  const { attendance, students, classes } = data

  const lookupStudent = (id: string) => students.find((s) => s.id === id)
  const lookupClass = (id: string) => classes.find((c) => c.id === id)

  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const filtered = attendance
    .filter((a) => (selectedClass === 'all' ? true : a.class_id === selectedClass))
    .filter((a) => (startDate ? a.attendance_date >= startDate : true))
    .filter((a) => (endDate ? a.attendance_date <= endDate : true))
    .sort((a, b) => (a.attendance_date < b.attendance_date ? 1 : -1))
    .slice(0, 100)

  const downloadCsv = () => {
    const headers = ['date', 'student', 'class', 'status', 'note']
    const rows = filtered.map((item) => {
      const student = lookupStudent(item.student_id)
      const klass = lookupClass(item.class_id)
      return [
        item.attendance_date,
        student?.full_name || 'Unknown',
        klass?.name || '',
        item.status,
        (item.note || '').replace(/,/g, ';'),
      ].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendance.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Attendance</p>
          <p className="text-lg font-semibold">Recent attendance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2 text-sm"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2 text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <span className="badge">{filtered.length} rows</span>
          {(role === 'admin' || role === 'teacher') && (
            <button
              onClick={downloadCsv}
              className="text-xs rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white hover:bg-white/10"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-white/60 border-b border-white/5">
            <tr className="text-left">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Student</th>
              <th className="py-2 pr-3">Class</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const student = lookupStudent(item.student_id)
              const klass = lookupClass(item.class_id)
              const statusColor = {
                present: 'text-success bg-success/15 border-success/25',
                absent: 'text-danger bg-danger/15 border-danger/25',
                tardy: 'text-warning bg-warning/15 border-warning/25',
                excused: 'text-accent bg-accent/15 border-accent/25',
              }[item.status]
              return (
                <tr key={item.id} className="table-row">
                  <td className="py-3 pr-3 text-white/80">
                    {format(new Date(item.attendance_date), 'EEE, MMM d')}
                  </td>
                  <td className="py-3 pr-3 text-white">
                    <div className="flex flex-col">
                      <span>{student?.full_name || 'Unknown'}</span>
                      <span className="text-xs text-white/50">{student?.email}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-white/80">{klass?.name}</td>
                  <td className="py-3 pr-3">
                    <span className={clsx('badge border', statusColor)}>{item.status}</span>
                  </td>
                  <td className="py-3 pr-3 text-white/70">{item.note || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
