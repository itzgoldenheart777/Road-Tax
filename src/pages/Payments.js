// src/pages/Payments.js
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getVehicles, getPayments, addPayment, updatePayment, uploadReceipt, formatReceiptFilename } from '../lib/supabase'
import { format } from 'date-fns'

const TAX_TYPES = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL']

function periodLabel(start, type) {
  const d = new Date(start)
  if (type === 'MONTHLY') return format(d, 'MMM yyyy')
  if (type === 'QUARTERLY') return `Q${Math.ceil((d.getMonth()+1)/3)} ${d.getFullYear()}`
  if (type === 'HALF_YEARLY') return `H${d.getMonth() < 6 ? 1 : 2} ${d.getFullYear()}`
  return `FY ${d.getFullYear()}-${String(d.getFullYear()+1).slice(2)}`
}

function periodEnd(start, type) {
  const d = new Date(start)
  if (type === 'MONTHLY') { d.setMonth(d.getMonth()+1); d.setDate(d.getDate()-1) }
  else if (type === 'QUARTERLY') { d.setMonth(d.getMonth()+3); d.setDate(d.getDate()-1) }
  else if (type === 'HALF_YEARLY') { d.setMonth(d.getMonth()+6); d.setDate(d.getDate()-1) }
  else { d.setFullYear(d.getFullYear()+1); d.setDate(d.getDate()-1) }
  return d.toISOString().slice(0,10)
}

export default function Payments() {
  const location = useLocation()
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicleId, setSelectedVehicleId] = useState(location.state?.vehicleId || '')
  const [payments, setPayments] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ vehicle_id: '', vehicle_number: '', period_start: new Date().toISOString().slice(0,10), tax_type: 'MONTHLY', amount: '', status: 'PAID', transaction_id: '', notes: '' })
  const [receiptFile, setReceiptFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getVehicles().then(v => setVehicles(v || []))
  }, [])

  useEffect(() => {
    getPayments(selectedVehicleId || null).then(p => setPayments(p || []))
  }, [selectedVehicleId])

  const openAdd = () => {
    const v = vehicles.find(x => x.id === selectedVehicleId)
    setForm({ vehicle_id: selectedVehicleId || '', vehicle_number: v?.vehicle_number || '', period_start: new Date().toISOString().slice(0,10), tax_type: 'MONTHLY', amount: '', status: 'PAID', transaction_id: '', notes: '' })
    setReceiptFile(null)
    setShowModal(true)
    setMsg('')
  }

  const save = async () => {
    if (!form.vehicle_id) { setMsg('Select a vehicle'); return }
    setSaving(true)
    try {
      const v = vehicles.find(x => x.id === form.vehicle_id)
      const pEnd = periodEnd(form.period_start, form.tax_type)
      const label = periodLabel(form.period_start, form.tax_type)
      const fname = formatReceiptFilename(v.vehicle_number, form.period_start, pEnd)
      
      let receiptUrl = null
      if (receiptFile) {
        const ext = receiptFile.name.split('.').pop()
        const { publicUrl } = await uploadReceipt(receiptFile, `${fname}.${ext}`)
        receiptUrl = publicUrl
      }

      await addPayment({
        vehicle_id: form.vehicle_id,
        vehicle_number: v.vehicle_number,
        period_start: form.period_start,
        period_end: pEnd,
        period_label: label,
        tax_type: form.tax_type,
        amount: form.amount ? parseFloat(form.amount) : null,
        status: form.status,
        transaction_id: form.transaction_id || null,
        notes: form.notes || null,
        receipt_filename: fname,
        receipt_url: receiptUrl,
        payment_date: form.status === 'PAID' ? new Date().toISOString() : null
      })
      setShowModal(false)
      getPayments(selectedVehicleId || null).then(p => setPayments(p || []))
    } catch(e) { setMsg(e.message) }
    setSaving(false)
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const veh = form.vehicle_id ? vehicles.find(x => x.id === form.vehicle_id) : null

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payment <span>Records</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Log Payment</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} style={{ maxWidth: 300 }}>
            <option value="">All Vehicles</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number} — {v.owner_name || 'No owner'}</option>)}
          </select>
          <span style={{ color: 'var(--text2)', fontSize: 13 }}>{payments.length} records</span>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Period</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Receipt</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: "'DM Mono', monospace", color: 'var(--accent)' }}>{p.vehicle_number}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.period_label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                      {format(new Date(p.period_start), 'dd MMM')} → {format(new Date(p.period_end), 'dd MMM yy')}
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{p.tax_type}</span></td>
                  <td>{p.amount ? `₹${p.amount.toFixed(2)}` : '—'}</td>
                  <td>
                    <span className={`badge ${p.status === 'PAID' ? 'badge-green' : p.status === 'FAILED' ? 'badge-red' : 'badge-gray'}`}>{p.status}</span>
                  </td>
                  <td>
                    {p.receipt_url ? (
                      <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 10px', display: 'inline-flex' }}>
                        📥 Download
                      </a>
                    ) : p.receipt_filename ? (
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>No file</span>
                    ) : '—'}
                    {p.receipt_filename && <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 3, maxWidth: 200 }}>{p.receipt_filename}</div>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {p.payment_date ? format(new Date(p.payment_date), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text2)', padding: 40 }}>No payment records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">+ Log Tax Payment</div>
            {msg && <div className="alert alert-red">{msg}</div>}
            
            <div className="form-group">
              <label>Vehicle *</label>
              <select value={form.vehicle_id} onChange={e => {
                const v = vehicles.find(x => x.id === e.target.value)
                setForm(p => ({ ...p, vehicle_id: e.target.value, vehicle_number: v?.vehicle_number || '' }))
              }}>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Period Start *</label>
                <input type="date" value={form.period_start} onChange={f('period_start')} />
              </div>
              <div className="form-group">
                <label>Tax Type *</label>
                <select value={form.tax_type} onChange={f('tax_type')}>
                  {TAX_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {form.vehicle_id && (
              <div className="alert alert-green" style={{ fontSize: 12 }}>
                📅 Period: <strong>{form.period_start}</strong> → <strong>{periodEnd(form.period_start, form.tax_type)}</strong><br/>
                📁 Receipt name: <strong>{formatReceiptFilename(veh?.vehicle_number, form.period_start, periodEnd(form.period_start, form.tax_type))}</strong>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input type="number" value={form.amount} onChange={f('amount')} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={f('status')}>
                  <option>PAID</option>
                  <option>PENDING</option>
                  <option>FAILED</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Transaction ID</label>
              <input value={form.transaction_id} onChange={f('transaction_id')} placeholder="UPI / Bank ref number" style={{ fontFamily: "'DM Mono', monospace" }} />
            </div>

            <div className="form-group">
              <label>Upload Receipt (PDF/Image)</label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setReceiptFile(e.target.files[0])} style={{ cursor: 'pointer' }} />
              {receiptFile && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>✓ {receiptFile.name}</div>}
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea value={form.notes} onChange={f('notes')} rows={2} style={{ resize: 'vertical' }} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Record'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
