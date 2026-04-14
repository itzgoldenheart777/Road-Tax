// src/lib/supabase.js
// Replace these with your actual Supabase project credentials
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Vehicles ────────────────────────────────────────────────────────────────

export async function getVehicles() {
  const { data, error } = await supabase
    .from('vehicle_status')
    .select('*')
    .order('days_until_expiry', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function addVehicle(vehicle) {
  const { data, error } = await supabase
    .from('vehicles')
    .insert([vehicle])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateVehicle(id, updates) {
  const { data, error } = await supabase
    .from('vehicles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteVehicle(id) {
  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw error
}

// ─── Tax Payments ────────────────────────────────────────────────────────────

export async function getPayments(vehicleId) {
  const query = supabase
    .from('tax_payments')
    .select('*')
    .order('period_end', { ascending: false })
  if (vehicleId) query.eq('vehicle_id', vehicleId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function addPayment(payment) {
  const { data, error } = await supabase
    .from('tax_payments')
    .insert([payment])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePayment(id, updates) {
  const { data, error } = await supabase
    .from('tax_payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Receipt Upload ───────────────────────────────────────────────────────────

export async function uploadReceipt(file, filename) {
  const path = `receipts/${filename}`
  const { error } = await supabase.storage.from('receipts').upload(path, file, {
    upsert: true,
    contentType: file.type
  })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)
  return { path, publicUrl }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatReceiptFilename(vehicleNumber, periodStart, periodEnd) {
  const fmt = (d) => {
    const date = new Date(d)
    const day = String(date.getDate()).padStart(2, '0')
    const month = date.toLocaleString('en', { month: 'short' })
    const year = String(date.getFullYear()).slice(2)
    return `${day} ${month} ${year}`
  }
  const vNum = vehicleNumber.toUpperCase().replace(/\s/g, '')
  return `Road Tax - ${vNum} - ${fmt(periodStart)} to ${fmt(periodEnd)}`
}
