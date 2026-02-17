"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import clsx from "clsx"
import { DashboardData } from "@/lib/data"
import { getBrowserSupabase } from "@/lib/supabaseClient"
import { Loader2, Check, AlertTriangle, ReceiptText, Send, Plus } from "lucide-react"
import { logAction } from "@/lib/log"

type Role = "admin" | "finance" | "teacher" | string

export function FeeTable({ data, role }: { data: DashboardData; role: Role }) {
  const supabase = useMemo(() => getBrowserSupabase(), [])
  const [localInvoices, setLocalInvoices] = useState(data.invoices || [])
  const [creating, setCreating] = useState(false)
  const [newInvoice, setNewInvoice] = useState({
    student_id: data.students[0]?.id || '',
    description: '',
    due_date: '',
    amount_cents: 0,
  })
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sendState, setSendState] = useState<{ [id: string]: 'idle' | 'sending' | 'sent' | 'error' }>({})

  const sorted = localInvoices
    .slice()
    .sort((a, b) => (a.due_date > b.due_date ? 1 : -1))
    .slice(0, 10)

  const total = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`

  const canEdit = role === "admin" || role === "finance"

  const markPaid = async (invoiceId: string, amount_cents: number) => {
    if (!canEdit) return
    setSavingId(invoiceId)
    setError(null)

    const today = new Date().toISOString().slice(0, 10)

    const { error: payErr } = await supabase.from("payments").insert({
      invoice_id: invoiceId,
      paid_on: today,
      amount_cents,
      method: "manual",
    })

    if (payErr) {
      setError(payErr.message)
      setSavingId(null)
      return
    }

    const { error: invErr } = await supabase
      .from("fee_invoices")
      .update({ status: "paid" })
      .eq("id", invoiceId)

    if (invErr) {
      setError(invErr.message)
      setSavingId(null)
      return
    }

    setLocalInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "paid" } : inv
      )
    )
    logAction({
      action: "invoice_mark_paid",
      entity: "invoice",
      entity_id: invoiceId,
      meta: { amount_cents },
    })
    setSavingId(null)
  }

  const downloadReceipt = async (invoiceId: string) => {
    const invoice = localInvoices.find((i) => i.id === invoiceId)
    if (!invoice) return
    const student = data.students.find((s) => s.id === invoice.student_id)
    const { data: pays } = await supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("paid_on", { ascending: false })

    const paidOn = pays?.[0]?.paid_on || invoice.issued_on
    const paidAmount = pays?.reduce((s, p) => s + p.amount_cents, 0) ?? invoice.amount_cents

    const html = `
      <html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #0b1021; }
        h1 { margin: 0 0 8px 0; }
        .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-top: 16px; }
        .row { display:flex; justify-content:space-between; margin: 4px 0; }
        .muted { color: #6b7280; }
      </style></head>
      <body>
        <h1>Payment Receipt</h1>
        <div class="muted">Invoice ID: ${invoice.id}</div>
        <div class="card">
          <div class="row"><strong>Student</strong><span>${student?.full_name || "Unknown"}</span></div>
          <div class="row"><span class="muted">Class</span><span>${student?.class_id || "-"}</span></div>
          <div class="row"><span class="muted">Description</span><span>${invoice.description}</span></div>
          <div class="row"><span class="muted">Issued</span><span>${invoice.issued_on}</span></div>
          <div class="row"><span class="muted">Paid on</span><span>${paidOn}</span></div>
          <div class="row"><span class="muted">Amount</span><strong>$${(paidAmount / 100).toFixed(2)}</strong></div>
          <div class="row"><span class="muted">Status</span><strong>${invoice.status}</strong></div>
        </div>
        <p class="muted">Generated from PowerSchool admin.</p>
      </body></html>
    `
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `receipt-${invoiceId}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const sendReceipt = async (invoiceId: string) => {
    setSendState((s) => ({ ...s, [invoiceId]: 'sending' }))
    try {
      const res = await fetch('/api/receipt/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setSendState((s) => ({ ...s, [invoiceId]: 'sent' }))
      logAction({ action: 'receipt_sent', entity: 'invoice', entity_id: invoiceId, meta: { via: 'manual-send' } })
    } catch (e: any) {
      setSendState((s) => ({ ...s, [invoiceId]: 'error' }))
      setError(e?.message || 'Failed to send receipt')
    }
  }

  const createInvoice = async () => {
    setCreating(true)
    setError(null)
    try {
      const payload = {
        ...newInvoice,
        status: "pending",
        issued_on: new Date().toISOString().slice(0, 10),
      }
      const { data: inserted, error } = await supabase.from("fee_invoices").insert(payload).select().single()
      if (error) throw error
      setLocalInvoices((prev) => [inserted, ...prev])
      setNewInvoice({
        student_id: data.students[0]?.id || "",
        description: "",
        due_date: "",
        amount_cents: 0,
      })
    } catch (e: any) {
      setError(e?.message || "Failed to create invoice")
    }
    setCreating(false)
  }

  const downloadCsv = () => {
    const headers = ["student", "description", "due_date", "amount", "status"]
    const rows = localInvoices.map((inv) => {
      const student = data.students.find((s) => s.id === inv.student_id)
      return [
        student?.full_name || "Unknown",
        inv.description,
        inv.due_date,
        (inv.amount_cents / 100).toFixed(2),
        inv.status,
      ].join(",")
    })
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fees.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Fees</p>
          <p className="text-lg font-semibold">Invoices & status</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge">{localInvoices.length} invoices</span>
          {(role === "admin" || role === "finance") && (
            <div className="flex items-center gap-2">
              <button
                onClick={downloadCsv}
                className="text-xs rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white hover:bg-white/10"
              >
                Export CSV
              </button>
              <button
                onClick={() => setCreating((v) => !v)}
                className="text-xs inline-flex items-center gap-2 rounded-lg bg-accent/20 border border-accent/40 text-accent px-3 py-2 hover:bg-accent/25"
              >
                <Plus size={14} /> New invoice
              </button>
            </div>
          )}
        </div>
      </div>
      {(role === "admin" || role === "finance") && creating && (
        <div className="card bg-white/5 border border-white/10 p-4 space-y-3 text-sm">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-white/70 text-xs">Student</span>
              <select
                className="w-full rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
                value={newInvoice.student_id}
                onChange={(e) => setNewInvoice({ ...newInvoice, student_id: e.target.value })}
              >
                {data.students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-white/70 text-xs">Due date</span>
              <input
                type="date"
                className="w-full rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
                value={newInvoice.due_date}
                onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
              />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-white/70 text-xs">Description</span>
              <input
                className="w-full rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                placeholder="e.g., Tuition Q2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-white/70 text-xs">Amount (USD)</span>
              <input
                type="number"
                className="w-full rounded-lg bg-[#0F162B] text-white border border-white/10 px-3 py-2"
                value={newInvoice.amount_cents / 100}
                onChange={(e) => setNewInvoice({ ...newInvoice, amount_cents: Math.round(Number(e.target.value) * 100) })}
              />
            </label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setCreating(false)}
              className="text-xs rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white hover:bg-white/10"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={createInvoice}
              disabled={creating}
              className="text-xs inline-flex items-center gap-2 rounded-lg bg-accent text-midnight px-3 py-2 font-semibold hover:bg-accent/90 disabled:opacity-60"
              type="button"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Create invoice
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="text-sm text-danger inline-flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-white/60 border-b border-white/5">
            <tr className="text-left">
              <th className="py-2 pr-3">Student</th>
              <th className="py-2 pr-3">Description</th>
              <th className="py-2 pr-3">Due</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">Status</th>
              {canEdit && <th className="py-2 pr-3 text-right">Actions</th>}
              {!canEdit && <th className="py-2 pr-3 text-right">Receipt</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((invoice) => {
              const student = data.students.find((s) => s.id === invoice.student_id)
              const statusColor = {
                paid: "text-success bg-success/15 border-success/25",
                pending: "text-warning bg-warning/15 border-warning/25",
                overdue: "text-danger bg-danger/15 border-danger/25",
              }[invoice.status]
              return (
                <tr key={invoice.id} className="table-row">
                  <td className="py-3 pr-3 text-white">
                    <div className="flex flex-col">
                      <span>{student?.full_name || "Unknown"}</span>
                      <span className="text-xs text-white/50">
                        {student?.guardian_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-white/80">{invoice.description}</td>
                  <td className="py-3 pr-3 text-white/70">
                    {format(new Date(invoice.due_date), "MMM d")}
                  </td>
                  <td className="py-3 pr-3 font-semibold">
                    {total(invoice.amount_cents)}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={clsx("badge border", statusColor)}>
                      {invoice.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="py-3 pr-3 text-right space-x-2">
                      {invoice.status === "paid" ? (
                        <span className="text-success inline-flex items-center gap-1 text-xs">
                          <Check size={14} /> Paid
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            markPaid(invoice.id, invoice.amount_cents)
                          }
                          disabled={savingId === invoice.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-success/20 border border-success/30 text-success px-3 py-2 text-xs hover:bg-success/30 disabled:opacity-60"
                        >
                          {savingId === invoice.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Mark paid
                        </button>
                      )}
                      {invoice.status === "paid" && (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => downloadReceipt(invoice.id)}
                            className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/15 text-white px-3 py-2 text-xs hover:bg-white/10"
                          >
                            <ReceiptText size={14} /> Receipt
                          </button>
                          <button
                            onClick={() => sendReceipt(invoice.id)}
                            disabled={sendState[invoice.id] === 'sending'}
                            className="inline-flex items-center gap-2 rounded-lg bg-accent/20 border border-accent/40 text-accent px-3 py-2 text-xs hover:bg-accent/25 disabled:opacity-60"
                          >
                            {sendState[invoice.id] === 'sending' ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Send size={14} />
                            )}
                            {sendState[invoice.id] === 'sent' ? 'Sent' : 'Send'}
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                  {!canEdit && (
                    <td className="py-3 pr-3 text-right">
                      {invoice.status === "paid" && (
                        <button
                          onClick={() => downloadReceipt(invoice.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/15 text-white px-3 py-2 text-xs hover:bg-white/10"
                        >
                          <ReceiptText size={14} /> Receipt
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
