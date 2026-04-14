// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react'
import { getVehicles } from '../lib/supabase'
import { format, differenceInDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'

function ExpiryBadge({ days }) {
  if (days === null || days === undefined) return <span className="badge badge-gray">No Data</span>
  if (days < 0) return <span className="badge badge-red">EXPIRED {Math.abs(days)}d ago</span>
  if (days <= 7) return <span className="badge badge-red">⚠ {days}d left</span>
  if (days <= 30) return <span className="badge badge-yellow">🕐 {days}d left</span>
  return <span className="badge badge-green">✓ {days}d left</span>
}

function ExpiryBar({ days }) {
  const pct = days === null ? 0 : Math.min(100, Math.max(0, (days / 30) * 100))
  const color = days < 0 ? '#e74c3c' : days <= 7 ? '#e74c3c' : days <= 30 ? '#f39c12' : '#2ecc71'
  return (
    <div className="expiry-bar-wrap">
      <div className="expiry-bar-track">
        <div className="expiry-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getVehicles().then(v => { setVehicles(v || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const expired = vehicles.filter(v => v.days_until_expiry < 0).length
  const critical = vehicles.filter(v => v.days_until_expiry >= 0 && v.days_until_expiry <= 7).length
  const warning = vehicles.filter(v => v.days_until_expiry > 7 && v.days_until_expiry <= 30).length
  const good = vehicles.filter(v => v.days_until_expiry > 30).length

  const sorted = [...vehicles].sort((a, b) => (a.days_until_expiry ?? 9999) - (b.days_until_expiry ?? 9999))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Road Tax <span>Dashboard</span></h1>
        <button className="btn btn-primary" onClick={() => navigate('/vehicles')}>+ Add Vehicle</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card red">
          <div className="stat-label">Expired</div>
          <div className="stat-value">{expired}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Critical (≤7 days)</div>
          <div className="stat-value">{critical}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Due Soon (≤30 days)</div>
          <div className="stat-value">{warning}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">All Clear</div>
          <div className="stat-value">{good}</div>
        </div>
      </div>

      {(expired > 0 || critical > 0) && (
        <div className="alert alert-red" style={{ marginBottom: 20 }}>
          ⚠ You have {expired + critical} vehicle(s) with expired or critically expiring road tax! Go to <strong>Automate</strong> to pay now.
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>All Vehicles — Expiry Status</h2>
        </div>
        {loading ? (
          <p style={{ color: 'var(--text2)', padding: '20px 0' }}>Loading vehicles...</p>
        ) : vehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
            <p>No vehicles added yet.</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/vehicles')}>Add Your First Vehicle</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vehicle No.</th>
                  <th>Owner</th>
                  <th>Last Period</th>
                  <th>Tax End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(v => (
                  <tr key={v.id}>
                    <td>
                      <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--accent)', fontWeight: 500 }}>
                        {v.vehicle_number.toUpperCase()}
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{v.vehicle_type}</div>
                    </td>
                    <td>{v.owner_name || '—'}</td>
                    <td>{v.last_period || '—'}</td>
                    <td>
                      {v.last_tax_end ? (
                        <>
                          {format(new Date(v.last_tax_end), 'dd MMM yyyy')}
                          <ExpiryBar days={v.days_until_expiry} />
                        </>
                      ) : '—'}
                    </td>
                    <td><ExpiryBadge days={v.days_until_expiry} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }}
                          onClick={() => navigate('/payments', { state: { vehicleId: v.id, vehicleNumber: v.vehicle_number } })}>
                          🧾 History
                        </button>
                        <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: 11 }}
                          onClick={() => navigate('/automate', { state: { vehicle: v } })}>
                          ⚡ Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
