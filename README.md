# 🚗 VahanTax — Road Tax Manager

A full-featured web app to manage vehicle road tax payments via VAHAN 4.0.

## Features
- 📊 Dashboard showing all vehicles with expiry status
- 🚙 Add/edit vehicles with number plate + last 5 chassis digits
- 🧾 Log payments with auto-named receipts (e.g. `Road Tax - MH48CQ3166 - 01 Apr 26 to 30 Apr 26`)
- ⚠ Expiry alerts: Red (expired / ≤7 days), Yellow (≤30 days), Green (safe)
- ⚡ Step-by-step VAHAN payment guide
- 🤖 Puppeteer automation script generator (downloads per-vehicle)
- 📥 Receipt storage via Supabase Storage

---

## Setup Guide

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Settings → API** and copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon/public key** → `REACT_APP_SUPABASE_ANON_KEY`

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 3. Install & Run Locally
```bash
npm install
npm start
```
App opens at http://localhost:3000

### 4. Deploy to GitHub Pages
```bash
# In package.json, add your homepage:
# "homepage": "https://YOUR_GITHUB_USERNAME.github.io/vahan-tax-app"

npm install --save-dev gh-pages
npm run deploy
```

Or deploy to **Vercel** (recommended — supports env vars easily):
```bash
npm install -g vercel
vercel
# Follow prompts, add env vars in Vercel dashboard
```

---

## Using the App

### Add a Vehicle
1. Go to **Vehicles** → Click **+ Add Vehicle**
2. Enter: Registration number (e.g. `MH48CQ3166`), last 5 chassis digits (e.g. `55540`)
3. Add owner name, mobile number

### Pay Road Tax (Manual-Assisted)
1. Go to **Automate** → Select your vehicle
2. Choose tax type (Monthly/Quarterly) and period start date
3. Follow the step-by-step guide — it shows you exactly what to enter at each VAHAN screen
4. After payment, upload the receipt and it will be saved with the correct filename

### Pay Road Tax (Puppeteer Script)
1. Go to **Automate** → Select vehicle → Download the script
2. Install dependencies:
   ```bash
   npm install puppeteer
   mkdir receipts
   ```
3. Run the script:
   ```bash
   node vahan-pay-mh48cq3166.js
   ```
4. The script handles form-filling; you manually: solve captcha, enter OTP, scan QR code
5. QR is auto-screenshotted as `qr-code.png`

### Receipt Naming Convention
Receipts are automatically named:
```
Road Tax - MH48CQ3166 - 01 Apr 26 to 30 Apr 26
```

---

## Receipt Filename Examples
| Vehicle | Period | Filename |
|---------|--------|----------|
| MH48CQ3166 | Apr 2026 Monthly | `Road Tax - MH48CQ3166 - 01 Apr 26 to 30 Apr 26` |
| MH48CQ3166 | Q2 2026 | `Road Tax - MH48CQ3166 - 01 Apr 26 to 30 Jun 26` |

---

## Database Tables
- `vehicles` — vehicle details (number, chassis, owner, mobile)
- `tax_payments` — payment records with period, amount, receipt URL
- `vehicle_status` — view combining both with days-until-expiry

---

## Tech Stack
- **Frontend**: React 18, React Router 6
- **Backend**: Supabase (PostgreSQL + Storage)
- **Fonts**: Rajdhani, DM Mono, Nunito
- **Deployment**: GitHub Pages / Vercel
=======
# Road-Tax
>>>>>>> origin/main
