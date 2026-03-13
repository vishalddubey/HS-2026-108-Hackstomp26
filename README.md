number:+91 9876543210
pass:

# RuralCare Pro — Integrated Rural Healthcare Platform

Merged from **HealthBridge Pro** + **RuralCare AI** into one unified app.

---

## 🚀 Quick Start

### 1. Install backend dependencies
```bash
pip install -r requirements.txt --break-system-packages
```

### 2. Run the backend
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Open the frontend
Open `index.html` in any browser. Go to **Settings → API Configuration** and click **Test Connection** to link frontend to backend.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/login` | Login with mobile + password |
| POST | `/auth/register` | Create new account |
| GET | `/stats` | Dashboard statistics |
| GET/POST | `/patients` | List or register patients |
| GET/PUT/DELETE | `/patients/{id}` | Get, update, delete patient |
| PATCH | `/patients/{id}/status` | Update patient status |
| GET/POST | `/appointments` | List or book appointments |
| PATCH | `/appointments/{id}/status` | Confirm/cancel appointment |
| POST | `/symptom-check` | Server-side AI triage |
| POST | `/diagnoses` | Save AI diagnosis result |
| POST | `/doctor-notes` | Add clinical note |
| GET/POST | `/broadcasts` | List or send voice broadcast |
| GET | `/broadcasts/messages` | Pre-defined Hindi templates |
| GET/POST | `/emergencies` | List or trigger SOS |
| PATCH | `/emergencies/{id}/resolve` | Resolve emergency |
| GET/POST | `/camps` | Health camps |
| GET/POST | `/reminders` | Medicine reminders |
| GET | `/outbreaks` | Disease outbreak data |
| GET | `/clinics?lat=&lng=` | Nearby clinics (GPS-sorted) |
| GET | `/sms-log` | SMS delivery history |

## 🔐 Demo Credentials

| Role | Mobile | Password |
|------|--------|----------|
| Patient | +91 9876543210 | password123 |
| Doctor | +91 9111000001 | doctor123 |
| Health Worker | +91 9876200001 | worker123 |

## ✨ What's New vs Previous Version

- **Merged HealthBridge Pro + RuralCare AI** — single frontend, single backend
- **Real GPS location** — "Use My Location" button updates clinic distances dynamically
- **Google Maps navigation** — Navigate button opens Google Maps directions
- **Voice Broadcast panel** — send Hindi voice messages to patients
- **Emergency protocols** — CPR, stroke, choking, burns step-by-step guides
- **Emergency SOS** — posts GPS location to backend + alerts 108
- **Doctor Notes** — saved to backend database permanently
- **Light/Dark theme** — persisted in localStorage
- **API-first with local fallback** — works offline, syncs when backend online
- **Elder patient filter** — auto-tagged patients aged 60+
- **Outbreak monitor** — real data from backend
- **Full audit trail** — SMS log, diagnosis history, broadcast history

## 🗃️ Database Tables

`users`, `patients`, `appointments`, `diagnoses`, `doctor_notes`, `broadcasts`, `emergencies`, `camps`, `reminders`, `outbreaks`, `sms_log`

## 🚀 Production Checklist

- [ ] Change CORS `allow_origins=["*"]` to your domain
- [ ] Add JWT token validation (replace `demo_token`)
- [ ] Use bcrypt instead of SHA-256 for passwords
- [ ] Migrate SQLite → PostgreSQL for multi-clinic
- [ ] Integrate Twilio / Kaleyra for real voice calls
- [ ] Add HTTPS / nginx reverse proxy
- [ ] Integrate Google Maps API key for real clinic map
