// src/pages/Automate.js
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getVehicles, addPayment, uploadReceipt, formatReceiptFilename } from '../lib/supabase'

export default function Automate() {
  const location = useLocation()
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(location.state?.vehicle || null)
  const [taxType, setTaxType] = useState('MONTHLY')
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().slice(0, 10))
  const [step, setStep] = useState(0)
  const [receiptFile, setReceiptFile] = useState(null)
  const [amount, setAmount] = useState('')
  const [txnId, setTxnId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getVehicles().then(v => setVehicles(v || []))
  }, [])

  function periodEnd(start, type) {
    const d = new Date(start)
    if (type === 'MONTHLY') { d.setMonth(d.getMonth() + 1); d.setDate(d.getDate() - 1) }
    else if (type === 'QUARTERLY') { d.setMonth(d.getMonth() + 3); d.setDate(d.getDate() - 1) }
    else if (type === 'HALF_YEARLY') { d.setMonth(d.getMonth() + 6); d.setDate(d.getDate() - 1) }
    else { d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1) }
    return d.toISOString().slice(0, 10)
  }

  function periodLabel(start, type) {
    const d = new Date(start)
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    if (type === 'MONTHLY') return `${months[d.getMonth()]} ${d.getFullYear()}`
    if (type === 'QUARTERLY') return `Q${Math.ceil((d.getMonth()+1)/3)} ${d.getFullYear()}`
    return `FY ${d.getFullYear()}`
  }

  const pEnd = selectedVehicle ? periodEnd(periodStart, taxType) : ''
  const receiptName = selectedVehicle ? formatReceiptFilename(selectedVehicle.vehicle_number, periodStart, pEnd) : ''

  const saveRecord = async () => {
    if (!selectedVehicle || !receiptFile) return
    setSaving(true)
    try {
      const ext = receiptFile.name.split('.').pop()
      const { publicUrl } = await uploadReceipt(receiptFile, `${receiptName}.${ext}`)
      await addPayment({
        vehicle_id: selectedVehicle.id,
        vehicle_number: selectedVehicle.vehicle_number,
        period_start: periodStart,
        period_end: pEnd,
        period_label: periodLabel(periodStart, taxType),
        tax_type: taxType,
        amount: amount ? parseFloat(amount) : null,
        status: 'PAID',
        receipt_filename: receiptName,
        receipt_url: publicUrl,
        transaction_id: txnId || null,
        payment_date: new Date().toISOString()
      })
      setSaved(true)
      setStep(0)
    } catch (e) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  const VAHAN_URL = 'https://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml'

  const steps = selectedVehicle ? [
    {
      title: 'Open VAHAN Portal',
      desc: `Click the button below to open the VAHAN portal in a new tab. Close any popup that appears.`,
      action: <a href={VAHAN_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: 8 }}>🌐 Open VAHAN Portal</a>
    },
    {
      title: 'Enter Registration Number',
      desc: `In the search box on VAHAN, type the vehicle registration number exactly:`,
      action: <div className="code-block">{selectedVehicle.vehicle_number.toUpperCase()}</div>
    },
    {
      title: 'Solve Captcha & Proceed',
      desc: 'Click the captcha checkbox, then click the "Proceed" button on the VAHAN page.'
    },
    {
      title: 'Select "Pay Your Tax"',
      desc: 'On the services page, click on "Pay Your Tax" (you may need to login or verify OTP first).'
    },
    {
      title: 'Enter Chassis Number',
      desc: `Enter the last 5 digits of the chassis number when prompted:`,
      action: <div className="code-block" style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, letterSpacing: 4, color: 'var(--accent)' }}>{selectedVehicle.chassis_last5}</div>
    },
    {
      title: 'Verify Details & Submit OTP',
      desc: `Click "Verify Details". An OTP will be sent to the mobile number ${selectedVehicle.mobile_number || 'linked to your vehicle'}. Enter the OTP and click Submit.`
    },
    {
      title: 'Select Tax Period',
      desc: `Select tax type: "${taxType}" from the dropdown. Confirm the period starts from your chosen date.`
    },
    {
      title: 'Click Payment → Confirm Payment',
      desc: 'Click the "Payment" button, then review and click "Confirm Payment".'
    },
    {
      title: 'Pay via UPI QR',
      desc: `On the SBI ePay page: Select UPI → UPI QR. A QR code will appear. Scan it with your UPI app (GPay, PhonePe, etc.) and complete the payment. Once done, come back here.`,
      action: (
        <div className="alert alert-yellow" style={{ marginTop: 8 }}>
          ⚠ <strong>QR payment completed?</strong> Come back to this tab and continue to the next step to save your receipt!
        </div>
      )
    },
    {
      title: 'Download Receipt from VAHAN',
      desc: 'After payment success, VAHAN will show a receipt page. Download it (PDF or screenshot).',
      action: (
        <div className="alert alert-green" style={{ marginTop: 8 }}>
          💡 The receipt should be saved as: <strong>{receiptName}</strong>
        </div>
      )
    },
    {
      title: 'Upload Receipt & Save Record',
      desc: 'Upload the downloaded receipt here and fill in payment details. This will be saved to your database.',
      action: (
        <div style={{ marginTop: 12 }}>
          <div className="form-group">
            <label>Amount Paid (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 450.00" />
          </div>
          <div className="form-group">
            <label>Transaction / UPI Reference ID</label>
            <input value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="UPI ref or bank transaction ID" style={{ fontFamily: "'DM Mono', monospace" }} />
          </div>
          <div className="form-group">
            <label>Upload Receipt (PDF or Image)</label>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setReceiptFile(e.target.files[0])} />
            {receiptFile && <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>✓ Will save as: <strong>{receiptName}.{receiptFile.name.split('.').pop()}</strong></div>}
          </div>
          <button className="btn btn-green" onClick={saveRecord} disabled={saving || !receiptFile}>
            {saving ? 'Saving...' : '💾 Save Payment Record'}
          </button>
        </div>
      )
    }
  ] : []

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">⚡ Pay Road <span>Tax</span></h1>
      </div>

      {saved && (
        <div className="alert alert-green" style={{ marginBottom: 20 }}>
          ✅ Payment record saved successfully! Receipt stored as: <strong>{receiptName}</strong>
          <button className="btn btn-ghost" style={{ marginLeft: 12, fontSize: 12 }} onClick={() => setSaved(false)}>Dismiss</button>
        </div>
      )}

      {/* Vehicle & Period Selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>1. Select Vehicle & Period</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Vehicle</label>
            <select value={selectedVehicle?.id || ''} onChange={e => setSelectedVehicle(vehicles.find(v => v.id === e.target.value) || null)}>
              <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number} ({v.owner_name || 'No owner'})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Tax Type</label>
            <select value={taxType} onChange={e => setTaxType(e.target.value)}>
              <option>MONTHLY</option>
              <option>QUARTERLY</option>
              <option>HALF_YEARLY</option>
              <option>ANNUAL</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Period Start Date</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
          </div>
        </div>

        {selectedVehicle && (
          <div style={{ marginTop: 16, padding: 14, background: 'var(--bg3)', borderRadius: 8, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>VEHICLE</div>
              <div style={{ fontFamily: "'DM Mono', monospace", color: 'var(--accent)', fontWeight: 500 }}>{selectedVehicle.vehicle_number}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>CHASSIS (LAST 5)</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{selectedVehicle.chassis_last5}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>PERIOD</div>
              <div>{periodStart} → {pEnd}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>RECEIPT FILENAME</div>
              <div style={{ fontSize: 12, color: 'var(--green)' }}>{receiptName}</div>
            </div>
          </div>
        )}
      </div>

      {/* Step Guide */}
      {selectedVehicle ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>2. Follow These Steps on VAHAN</h2>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>Step {step + 1} of {steps.length}</span>
          </div>
          <div className="step-list">
            {steps.map((s, i) => (
              <div key={i} className={`step-item ${i === step ? '' : 'opacity-step'}`} style={{ opacity: i === step ? 1 : i < step ? 0.5 : 0.35, cursor: 'pointer' }} onClick={() => setStep(i)}>
                <div className="step-num" style={{ background: i < step ? 'var(--green)' : i === step ? 'var(--accent)' : 'var(--bg3)', color: i < step ? '#0d0f14' : i === step ? '#0d0f14' : 'var(--text2)' }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div className="step-content">
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                  {i === step && s.action && <div style={{ marginTop: 10 }}>{s.action}</div>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Previous</button>
            <button className="btn btn-primary" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}>Next Step →</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>⚡</div>
          <p>Select a vehicle above to see the step-by-step payment guide</p>
        </div>
      )}

      {/* Puppeteer Script Download */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🤖 Automation Script (Puppeteer)</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
          For advanced users: run this Node.js script on your computer to auto-fill the VAHAN form. It will pause at the QR code so you can scan and pay, then auto-download the receipt.
        </p>
        {selectedVehicle && (
          <PuppeteerScriptDisplay vehicle={selectedVehicle} taxType={taxType} />
        )}
        {!selectedVehicle && <p style={{ color: 'var(--text2)', fontSize: 13 }}>Select a vehicle to generate the script.</p>}
      </div>
    </div>
  )
}

function PuppeteerScriptDisplay({ vehicle, taxType }) {
  const script = `// VAHAN Road Tax Automation Script
// Run: node vahan-pay.js
// Requires: npm install puppeteer

const puppeteer = require('puppeteer');

const CONFIG = {
  vehicleNumber: '${vehicle.vehicle_number.toUpperCase()}',
  chassisLast5: '${vehicle.chassis_last5}',
  taxType: '${taxType}',  // MONTHLY, QUARTERLY, etc.
};

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,      // Show browser window
    defaultViewport: null,
    args: ['--start-maximized']
  });
  const page = await browser.newPage();
  
  console.log('Opening VAHAN portal...');
  await page.goto('https://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/homepage.xhtml');
  await page.waitForTimeout(2000);

  // Close popup if it appears
  try {
    await page.click('#updatemobileno button', { timeout: 3000 });
  } catch(e) { console.log('No popup found, continuing...'); }

  // Enter vehicle number
  await page.click('#regnid');
  await page.type('#regnid', CONFIG.vehicleNumber, { delay: 80 });
  console.log('Vehicle number entered:', CONFIG.vehicleNumber);

  // ⚠ MANUAL STEP: Solve captcha, then press Enter in this terminal
  console.log('\\n⚠ Please solve the CAPTCHA in the browser, then press ENTER here...');
  await new Promise(r => process.stdin.once('data', r));

  // Click Proceed
  await page.click('#proccedHomeButtonId');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  // Click Pay Your Tax
  await page.click('#trigger1');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  // Enter chassis number
  await page.waitForSelector('#form_eapp\\\\:tf_chasis_no');
  await page.click('#form_eapp\\\\:tf_chasis_no');
  await page.type('#form_eapp\\\\:tf_chasis_no', CONFIG.chassisLast5, { delay: 100 });
  console.log('Chassis entered:', CONFIG.chassisLast5);

  // Verify Details
  await page.click('#form_eapp\\\\:validate_button');
  await page.waitForTimeout(2000);

  // ⚠ Enter OTP manually
  console.log('\\n⚠ Enter the OTP sent to your mobile in the browser, then press ENTER here...');
  await new Promise(r => process.stdin.once('data', r));

  // Submit OTP
  await page.click('#form_eapp\\\\:tf_show_button');
  await page.waitForTimeout(3000);

  console.log('\\n⚠ Select "${taxType}" tax type in browser, then click Payment → Confirm Payment');
  console.log('\\nPress ENTER when the SBI ePay QR page is showing...');
  await new Promise(r => process.stdin.once('data', r));

  // Screenshot the QR code
  await page.screenshot({ path: 'qr-code.png', fullPage: false });
  console.log('📸 QR code screenshot saved as qr-code.png - scan it to pay!');

  console.log('\\n⚠ After scanning and completing UPI payment, press ENTER...');
  await new Promise(r => process.stdin.once('data', r));

  // Download receipt
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: './receipts'
  });

  console.log('✅ Payment complete! Download your receipt from the VAHAN page.');
  console.log('💡 Save receipt as: Road Tax - ${vehicle.vehicle_number.toUpperCase()} - [period]');

  await browser.close();
})();`

  const download = () => {
    const blob = new Blob([script], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vahan-pay-${vehicle.vehicle_number.toLowerCase()}.js`
    a.click()
  }

  return (
    <div>
      <div className="code-block" style={{ maxHeight: 300, overflowY: 'auto' }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{script}</pre>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button className="btn btn-primary" onClick={download}>📥 Download Script</button>
        <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center' }}>Run with: <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4, marginLeft: 6, fontFamily: "'DM Mono', monospace" }}>node vahan-pay-{vehicle.vehicle_number.toLowerCase()}.js</code></div>
      </div>
    </div>
  )
}
