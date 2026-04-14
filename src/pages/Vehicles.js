// src/pages/Vehicles.js
import React, { useEffect, useState } from 'react'
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '../lib/supabase'

const EMPTY = { vehicle_number: '', chassis_last5: '', owner_name: '', vehicle_type: 'Private', mobile_number: '', notes: '' }

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => getVehicles().then(v => { setVehicles(v || []); setLoading(false) })
  useEffect(() => { load() }, [])

  const open = (v = null) => {
    setEditing(v)
    setForm(v ? { vehicle_number: v.vehicle_number, chassis_last5: v.chassis_last5, owner_name: v.owner_name || '', vehicle_type: v.vehicle_type || 'Private', mobile_number: v.mobile_number || '', notes: v.notes || '' } : EMPTY)
    setShowModal(true)
    setMsg('')
  }

  const save = async () => {
    if (!form.vehicle_number || !form.chassis_last5) { setMsg('Vehicle number and chassis digits are required'); return }
    setSaving(true)
    try {
      const data = { ...form, vehicle_number: form.vehicle_number.toUpperCase().trim(), chassis_last5: form.chassis_last5.toUpperCase().trim() }
      if (editing) await updateVehicle(editing.id, data)
      else await addVehicle(data)
      setShowModal(false)
      load()
    } catch (e) { setMsg(e.message) }
    setSaving(false)
  }

  const remove = async (v) => {
    if (!window.confirm(`Delete ${v.vehicle_number}? This removes all payment records too.`)) return
    await deleteVehicle(v.id)
    load()
  }

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My <span>Vehicles</span></h1>
        <button className="btn btn-primary" onClick={() => open()}>+ Add Vehicle</button>
      </div>

      {loading ? <p style={{ color: 'var(--text2)' }}>Loading...</p> : (
        <div className="vehicle-grid">
          {vehicles.map(v => (
            <div className="vehicle-card" key={v.id}>
              <div className="vehicle-card-header">
                <div>
                  <div className="vehicle-number">{v.vehicle_number}</div>
                  <div className="vehicle-meta">{v.vehicle_type} · {v.owner_name || 'No owner set'}</div>
                </div>
                <ExpiryChip days={v.days_until_expiry} />
              </div>
              <div className="vehicle-card-body">
                <div>Chassis (last 5): <strong style={{ fontFamily: "'DM Mono', monospace" }}>{v.chassis_last5}</strong></div>
                {v.mobile_number && <div>Mobile: <strong>{v.mobile_number}</strong></div>}
                {v.last_tax_end && <div style={{ marginTop: 6 }}>Tax until: <strong>{new Date(v.last_tax_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>}
                {v.last_period && <div>Last period: <strong>{v.last_period}</strong></div>}
                {v.notes && <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 6 }}>{v.notes}</div>}
              </div>
              <div className="vehicle-card-actions">
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => open(v)}>✏ Edit</button>
                <button className="btn btn-danger" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => remove(v)}>🗑 Delete</button>
              </div>
            </div>
          ))}
          {vehicles.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🚘</div>
              <p>No vehicles yet. Add one to get started!</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">{editing ? '✏ Edit Vehicle' : '+ Add Vehicle'}</div>
            {msg && <div className="alert alert-red">{msg}</div>}
            <div className="form-group">
              <label>Vehicle Registration Number *</label>
              <input value={form.vehicle_number} onChange={f('vehicle_number')} placeholder="e.g. MH48CQ3166" />
            </div>
            <div className="form-group">
              <label>Chassis Number (Last 5 digits) *</label>
              <input value={form.chassis_last5} onChange={f('chassis_last5')} placeholder="e.g. 55540" maxLength={5} style={{ fontFamily: "'DM Mono', monospace" }} />
            </div>
            <div className="form-group">
              <label>Owner Name</label>
              <input value={form.owner_name} onChange={f('owner_name')} placeholder="Owner's full name" />
            </div>
            <div className="form-group">
              <label>Vehicle Type</label>
              <select value={form.vehicle_type} onChange={f('vehicle_type')}>
                <option>Private</option>
                <option>Commercial</option>
                <option>Two-Wheeler</option>
                <option>Three-Wheeler</option>
                <option>Goods Vehicle</option>
              </select>
            </div>
            <div className="form-group">
              <label>Mobile Number (linked to VAHAN)</label>
              <input value={form.mobile_number} onChange={f('mobile_number')} placeholder="10-digit mobile" />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Any notes..." style={{ resize: 'vertical' }} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Vehicle'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExpiryChip({ days }) {
  if (days === null || days === undefined) return null
  if (days < 0) return <span className="badge badge-red">EXPIRED</span>
  if (days <= 7) return <span className="badge badge-red">⚠ {days}d</span>
  if (days <= 30) return <span className="badge badge-yellow">🕐 {days}d</span>
  return <span className="badge badge-green">✓ {days}d</span>
}
