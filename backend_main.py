"""
RuralCare Pro — Integrated Backend
Merges HealthBridge Pro + RuralCare AI backend into one unified API.
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Any
import sqlite3, json, hashlib, os
from datetime import datetime, date

# ── APP ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="RuralCare Pro API",
    description="Integrated Rural Healthcare Platform — HealthBridge + RuralCare AI",
    version="2.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "ruralcare.db"

# ── DATABASE ──────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        mobile     TEXT UNIQUE NOT NULL,
        role       TEXT DEFAULT 'patient',
        password   TEXT NOT NULL,
        reg_no     TEXT,
        language   TEXT DEFAULT 'hi',
        village    TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS patients (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        age          INTEGER,
        gender       TEXT,
        blood_group  TEXT DEFAULT 'Unknown',
        mobile       TEXT,
        village      TEXT,
        address      TEXT,
        aadhaar      TEXT,
        conditions   TEXT,
        allergies    TEXT,
        meds         TEXT,
        vaccines     TEXT,
        family_hx    TEXT,
        temp         TEXT,
        bp           TEXT,
        hr           TEXT,
        spo2         TEXT,
        weight       TEXT,
        height       TEXT,
        complaint    TEXT,
        diagnosis    TEXT,
        diagnosis_date TEXT,
        risk         TEXT DEFAULT 'low',
        status       TEXT DEFAULT 'Active',
        is_elder     INTEGER DEFAULT 0,
        is_pregnant  INTEGER DEFAULT 0,
        notes        TEXT,
        created_by   TEXT,
        created_at   TEXT DEFAULT (datetime('now')),
        updated_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
        id           TEXT PRIMARY KEY,
        patient_id   TEXT,
        patient_name TEXT,
        clinic       TEXT,
        doctor       TEXT,
        datetime_iso TEXT,
        visit_type   TEXT DEFAULT 'in-person',
        reason       TEXT,
        notes        TEXT,
        mobile       TEXT,
        status       TEXT DEFAULT 'Pending',
        created_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS diagnoses (
        id            TEXT PRIMARY KEY,
        patient_id    TEXT,
        patient_name  TEXT,
        symptoms      TEXT,
        top_diagnosis TEXT,
        confidence    INTEGER,
        risk          TEXT,
        severity      INTEGER,
        age           INTEGER,
        history       TEXT,
        created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS doctor_notes (
        id          TEXT PRIMARY KEY,
        patient_id  TEXT,
        doctor_name TEXT,
        note        TEXT,
        created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS broadcasts (
        id           TEXT PRIMARY KEY,
        message_type TEXT,
        message      TEXT,
        language     TEXT DEFAULT 'hi',
        recipients   TEXT,
        sent_count   INTEGER DEFAULT 0,
        status       TEXT DEFAULT 'sent',
        created_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS emergencies (
        id              TEXT PRIMARY KEY,
        patient_name    TEXT,
        patient_id      TEXT,
        emergency_type  TEXT,
        location_gps    TEXT,
        assigned_doctor TEXT,
        status          TEXT DEFAULT 'Active',
        notes           TEXT,
        created_at      TEXT DEFAULT (datetime('now')),
        resolved_at     TEXT
    );

    CREATE TABLE IF NOT EXISTS camps (
        id               TEXT PRIMARY KEY,
        name             TEXT,
        location         TEXT,
        date_iso         TEXT,
        expected_patients INTEGER DEFAULT 0,
        actual_patients  INTEGER DEFAULT 0,
        status           TEXT DEFAULT 'planned',
        notes            TEXT,
        created_at       TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
        id          TEXT PRIMARY KEY,
        patient_id  TEXT,
        patient_name TEXT,
        medicine    TEXT,
        schedule    TEXT,
        active      INTEGER DEFAULT 1,
        last_sent   TEXT,
        created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS outbreaks (
        id          TEXT PRIMARY KEY,
        disease     TEXT,
        ward        TEXT,
        case_count  INTEGER DEFAULT 0,
        severity    TEXT DEFAULT 'watch',
        notes       TEXT,
        active      INTEGER DEFAULT 1,
        reported_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sms_log (
        id          TEXT PRIMARY KEY,
        mobile      TEXT,
        message     TEXT,
        status      TEXT DEFAULT 'sent',
        sent_at     TEXT DEFAULT (datetime('now'))
    );
    """)

    # Seed demo data
    _seed_demo(c)
    conn.commit()
    conn.close()

def _seed_demo(c):
    # Check if seeded
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] > 0:
        return

    def ph(p): return hashlib.sha256(p.encode()).hexdigest()

    # Users
    users = [
        ("u1","Priya Kumari","+91 9876543210","patient",ph("password123"),None,"hi","Ward 2, Rajganj"),
        ("u2","Dr. R. Sharma","+91 9111000001","doctor",ph("doctor123"),"MCI/2008/12345","hi","Rajganj"),
        ("u3","Sunita ASHA","+91 9876200001","worker",ph("worker123"),None,"hi","Ward 4, Rajganj"),
    ]
    c.executemany("INSERT INTO users(id,name,mobile,role,password,reg_no,language,village) VALUES(?,?,?,?,?,?,?,?)", users)

    # Patients
    patients = [
        ("pt1","Ramesh Kumar",45,"Male","B+","+91 9876100001","Ward 4, Rajganj","Near Shiv Mandir, Ward 4",
         "Diabetes,Hypertension","Penicillin","Metformin 500mg, Amlodipine 5mg","COVID-19,Polio,BCG","Diabetes in father",
         "38.5","145/95","92","96","72","168","Fever and body ache since 2 days","Dengue Fever","2026-03-11","medium","Under observation",0,0,"u1"),
        ("pt2","Sunita Devi",32,"Female","A+","+91 9876100002","Ward 2, Rajganj","42 Gandhi Nagar",
         "Asthma","None","Salbutamol inhaler","COVID-19,Polio,BCG","Asthma in mother",
         "39.2","110/70","110","91","55","158","Cough and breathing difficulty","Pneumonia","2026-03-11","high","Referred to hospital",0,0,"u1"),
        ("pt3","Arjun Patel",8,"Male","O+","+91 9876100003","Ward 1, Rajganj","12 Nehru Colony",
         None,"None","None","Polio,BCG,COVID-19","None",
         "37.8","","100","98","22","122","Loose motions and vomiting","Acute Gastroenteritis","2026-03-10","low","Recovering",0,0,"u2"),
        ("pt4","Meena Sharma",60,"Female","AB+","+91 9876100004","Ward 3, Rajganj","78 Main Road",
         "Hypertension,Diabetes,Heart Disease","Aspirin","Losartan 50mg, Metformin 1g","COVID-19,Influenza","Heart disease",
         "37.0","180/110","88","97","68","152","Severe headache and dizziness","Hypertensive Crisis","2026-03-12","high","Referred to district hospital",1,0,"u1"),
        ("pt5","Priya Kumari",28,"Female","O+","+91 9876543210","Ward 2, Rajganj","Gandhi Nagar, Ward 2",
         None,"None","None","COVID-19,Polio,BCG","None",
         "36.8","110/70","72","98","57","162","Routine checkup","","","low","Active",0,0,"u1"),
    ]
    c.executemany("""INSERT INTO patients(id,name,age,gender,blood_group,mobile,village,address,conditions,allergies,meds,vaccines,family_hx,temp,bp,hr,spo2,weight,height,complaint,diagnosis,diagnosis_date,risk,status,is_elder,is_pregnant,created_by)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", patients)

    # Appointments
    appointments = [
        ("a1",None,"Priya Kumari","Rajganj CHC","Dr. P. Verma","2026-03-20 10:00","in-person","Follow-up for fever","","+91 9876543210","Confirmed"),
        ("a2",None,"Priya Kumari","District Hospital","Dr. R. Sharma","2026-03-22 14:00","in-person","Blood test review","","+91 9876543210","Pending"),
        ("a3",None,"Ramesh Kumar","Arogya Clinic","Dr. S. Mishra","2026-03-18 11:00","in-person","Dengue follow-up","","+91 9876100001","Confirmed"),
        ("a4",None,"Meena Sharma","District Hospital","Dr. R. Sharma","2026-03-25 09:00","in-person","BP monitoring","","+91 9876100004","Confirmed"),
    ]
    c.executemany("INSERT INTO appointments(id,patient_id,patient_name,clinic,doctor,datetime_iso,visit_type,reason,notes,mobile,status) VALUES(?,?,?,?,?,?,?,?,?,?,?)", appointments)

    # Emergencies (demo)
    c.execute("INSERT INTO emergencies(id,patient_name,emergency_type,location_gps,status,notes) VALUES('e1','Demo Patient','SOS','25.7051,85.7988','Resolved','Test SOS from demo')")

    # Outbreaks
    outbreaks = [
        ("ob1","Dengue","Ward 4",8,"critical","8 cases within 3km in 72hrs",1),
        ("ob2","Diarrhoea","Ward 1",5,"watch","Possible water contamination",1),
        ("ob3","Viral Fever","Ward 2",12,"watch","Seasonal increase",1),
    ]
    c.executemany("INSERT INTO outbreaks(id,disease,ward,case_count,severity,notes,active) VALUES(?,?,?,?,?,?,?)", outbreaks)

    # Camps
    c.execute("INSERT INTO camps(id,name,location,date_iso,expected_patients,status,notes) VALUES('c1','Free Health Camp','Rajganj Panchayat Bhawan','2026-03-20',100,'planned','BP, sugar, eye check. ASHA workers to mobilize')")

# ── MODELS ────────────────────────────────────────────────────────────────────
class LoginModel(BaseModel):
    mobile: str
    password: str

class PatientModel(BaseModel):
    name: str
    age: int
    gender: str = "Male"
    blood_group: str = "Unknown"
    mobile: str = ""
    village: str = ""
    address: str = ""
    conditions: str = ""
    allergies: str = ""
    meds: str = ""
    vaccines: str = ""
    family_hx: str = ""
    temp: str = ""
    bp: str = ""
    hr: str = ""
    spo2: str = ""
    weight: str = ""
    height: str = ""
    complaint: str = ""
    diagnosis: str = ""
    diagnosis_date: str = ""
    risk: str = "low"
    status: str = "Active"
    is_elder: int = 0
    is_pregnant: int = 0
    notes: str = ""
    created_by: str = ""

class AppointmentModel(BaseModel):
    patient_id: Optional[str] = None
    patient_name: str
    clinic: str = ""
    doctor: str = ""
    datetime_iso: str
    visit_type: str = "in-person"
    reason: str = ""
    notes: str = ""
    mobile: str = ""
    status: str = "Pending"

class BroadcastModel(BaseModel):
    message_type: str
    message: str
    language: str = "hi"
    recipients: List[Any] = []

class EmergencyModel(BaseModel):
    patient_name: str
    patient_id: Optional[str] = None
    emergency_type: str = "SOS"
    location_gps: str = ""
    notes: str = ""

class DiagnosisModel(BaseModel):
    patient_id: Optional[str] = None
    patient_name: str = ""
    symptoms: List[str]
    severity: int = 5
    age: int = 35
    history: List[str] = []
    top_diagnosis: str = ""
    confidence: int = 0
    risk: str = "low"

class DoctorNoteModel(BaseModel):
    patient_id: str
    doctor_name: str
    note: str

class SymptomCheckModel(BaseModel):
    symptoms: List[str]
    severity: int = 5
    age: int = 35
    history: List[str] = []

class CampModel(BaseModel):
    name: str
    location: str
    date_iso: str
    expected_patients: int = 50
    notes: str = ""

class ReminderModel(BaseModel):
    patient_id: str
    patient_name: str
    medicine: str
    schedule: str

class StatusUpdate(BaseModel):
    status: str

# ── HELPERS ───────────────────────────────────────────────────────────────────
def row_to_dict(row):
    if row is None: return None
    return dict(row)

def rows_to_list(rows):
    return [dict(r) for r in rows]

def uid(prefix=""):
    import uuid
    return prefix + str(uuid.uuid4())[:8]

def ph(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ── DISEASE DATABASE (server-side triage) ─────────────────────────────────────
TRIAGE_RULES = {
    "urgent": ["Chest Pain","Shortness of Breath","Blood in Sputum","Blood in Stool","Convulsion","Fainting / Loss of Consciousness","Severe Headache / Migraine","Rapid Breathing"],
    "high_risk_conditions": ["Hypertension","Diabetes","Heart Disease","Asthma","TB"],
}

def server_triage(symptoms: List[str], severity: int, age: int, history: List[str]):
    urgent = any(s in TRIAGE_RULES["urgent"] for s in symptoms)
    high_risk = any(h in TRIAGE_RULES["high_risk_conditions"] for h in history)
    if urgent or severity >= 8:
        triage = "URGENT"
        action = "Refer to hospital immediately. Do not delay."
    elif severity >= 6 or high_risk or age >= 60 or age <= 5:
        triage = "MODERATE"
        action = "Visit PHC or clinic within 24 hours."
    else:
        triage = "MILD"
        action = "Rest, fluids, and home care. Visit clinic if no improvement in 2 days."
    return {"triage": triage, "action": action, "urgent_symptoms": [s for s in symptoms if s in TRIAGE_RULES["urgent"]]}

# ── BROADCAST TEMPLATES ───────────────────────────────────────────────────────
BROADCAST_MSGS = {
    "medicine": "Namaste! Yeh aapka medicine reminder hai. Aaj apni dawai lena mat bhoolein. Doctor ki salah se niyamit dawai lena bahut zaroori hai.",
    "appointment": "Namaste! Aapka kal doctor ke saath appointment hai. Samay par PHC aana na bhoolen. Apni purani reports saath layen.",
    "camp": "Namaste! Rajpur mein FREE health camp ho raha hai. BP, sugar aur aankhon ki jaanch bilkul muft. Zaroor aayen.",
    "followup": "Namaste! Aapka follow-up visit overdue hai. Jald se jald PHC mein aayein. Aapki sehat hamari priority hai.",
    "emergency": "Yeh ek zaroori alert hai. Kripya turant PHC ya doctor se sampark karein. Yeh aapke doctor ka urgent sandesh hai.",
}

# ── ROUTES ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "app": "RuralCare Pro API v2.0", "timestamp": datetime.now().isoformat()}

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.post("/auth/login")
def login(body: LoginModel, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT * FROM users WHERE mobile=? AND password=?", (body.mobile, ph(body.password))).fetchone()
    if not row:
        # Also try plain-text for demo accounts
        row = db.execute("SELECT * FROM users WHERE mobile=? AND password=?", (body.mobile, body.password)).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = row_to_dict(row)
    user.pop("password", None)
    return {"user": user, "token": "demo_token"}

@app.post("/auth/register")
def register(body: dict, db: sqlite3.Connection = Depends(get_db)):
    existing = db.execute("SELECT id FROM users WHERE mobile=?", (body.get("mobile",""),)).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered")
    uid_ = uid("u")
    db.execute("INSERT INTO users(id,name,mobile,role,password,reg_no) VALUES(?,?,?,?,?,?)",
        (uid_, body.get("name"), body.get("mobile"), body.get("role","patient"), ph(body.get("password","")), body.get("reg_no")))
    db.commit()
    return {"success": True, "id": uid_}

# ── STATS ──────────────────────────────────────────────────────────────────────
@app.get("/stats")
def get_stats(db: sqlite3.Connection = Depends(get_db)):
    total = db.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
    urgent = db.execute("SELECT COUNT(*) FROM patients WHERE risk IN ('high','critical')").fetchone()[0]
    elder = db.execute("SELECT COUNT(*) FROM patients WHERE is_elder=1").fetchone()[0]
    today = date.today().isoformat()
    appts_today = db.execute("SELECT COUNT(*) FROM appointments WHERE datetime_iso LIKE ? AND status!='Cancelled'", (today+"%",)).fetchone()[0]
    broadcasts = db.execute("SELECT COUNT(*) FROM broadcasts").fetchone()[0]
    active_emergencies = db.execute("SELECT COUNT(*) FROM emergencies WHERE status='Active'").fetchone()[0]
    active_outbreaks = db.execute("SELECT COUNT(*) FROM outbreaks WHERE active=1").fetchone()[0]
    camps = db.execute("SELECT COUNT(*) FROM camps WHERE status='planned'").fetchone()[0]
    diagnoses = db.execute("SELECT COUNT(*) FROM diagnoses").fetchone()[0]
    return {
        "total_patients": total,
        "urgent_patients": urgent,
        "elder_patients": elder,
        "appointments_today": appts_today,
        "broadcasts_sent": broadcasts,
        "active_emergencies": active_emergencies,
        "active_outbreaks": active_outbreaks,
        "upcoming_camps": camps,
        "ai_diagnoses": diagnoses,
    }

# ── PATIENTS ──────────────────────────────────────────────────────────────────
@app.get("/patients")
def list_patients(
    search: str = "",
    risk: str = "",
    elder: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
    db: sqlite3.Connection = Depends(get_db)
):
    sql = "SELECT * FROM patients WHERE 1=1"
    params = []
    if search:
        sql += " AND (name LIKE ? OR village LIKE ? OR diagnosis LIKE ?)"
        like = f"%{search}%"
        params += [like, like, like]
    if risk:
        sql += " AND risk=?"
        params.append(risk)
    if elder is not None:
        sql += " AND is_elder=?"
        params.append(elder)
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params += [limit, offset]
    rows = db.execute(sql, params).fetchall()
    total = db.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
    return {"patients": rows_to_list(rows), "total": total}

@app.get("/patients/{pid}")
def get_patient(pid: str, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT * FROM patients WHERE id=?", (pid,)).fetchone()
    if not row: raise HTTPException(404, "Patient not found")
    p = row_to_dict(row)
    # Attach notes
    notes = rows_to_list(db.execute("SELECT * FROM doctor_notes WHERE patient_id=? ORDER BY created_at DESC", (pid,)).fetchall())
    p["doctor_notes"] = notes
    # Attach diagnoses
    diags = rows_to_list(db.execute("SELECT * FROM diagnoses WHERE patient_id=? ORDER BY created_at DESC LIMIT 5", (pid,)).fetchall())
    p["diagnosis_history"] = diags
    return p

@app.post("/patients")
def create_patient(body: PatientModel, db: sqlite3.Connection = Depends(get_db)):
    pid = uid("pt")
    now = datetime.now().isoformat()
    db.execute("""
        INSERT INTO patients(id,name,age,gender,blood_group,mobile,village,address,conditions,allergies,meds,vaccines,family_hx,temp,bp,hr,spo2,weight,height,complaint,diagnosis,diagnosis_date,risk,status,is_elder,is_pregnant,notes,created_by,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (pid,body.name,body.age,body.gender,body.blood_group,body.mobile,body.village,body.address,
          body.conditions,body.allergies,body.meds,body.vaccines,body.family_hx,
          body.temp,body.bp,body.hr,body.spo2,body.weight,body.height,body.complaint,
          body.diagnosis,body.diagnosis_date,body.risk,body.status,
          1 if body.age>=60 else body.is_elder,body.is_pregnant,body.notes,body.created_by,now,now))
    db.commit()
    return {"success": True, "patient": {"id": pid, **body.dict()}}

@app.put("/patients/{pid}")
def update_patient(pid: str, body: dict, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT id FROM patients WHERE id=?", (pid,)).fetchone()
    if not row: raise HTTPException(404, "Patient not found")
    allowed = ["name","age","gender","blood_group","mobile","village","address","conditions","allergies","meds","vaccines","family_hx","temp","bp","hr","spo2","weight","height","complaint","diagnosis","diagnosis_date","risk","status","is_elder","is_pregnant","notes"]
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates: raise HTTPException(400, "No valid fields")
    updates["updated_at"] = datetime.now().isoformat()
    sets = ", ".join([f"{k}=?" for k in updates])
    db.execute(f"UPDATE patients SET {sets} WHERE id=?", list(updates.values()) + [pid])
    db.commit()
    return {"success": True}

@app.patch("/patients/{pid}/status")
def update_patient_status(pid: str, body: StatusUpdate, db: sqlite3.Connection = Depends(get_db)):
    db.execute("UPDATE patients SET status=?, updated_at=? WHERE id=?", (body.status, datetime.now().isoformat(), pid))
    db.commit()
    return {"success": True}

@app.delete("/patients/{pid}")
def delete_patient(pid: str, db: sqlite3.Connection = Depends(get_db)):
    db.execute("DELETE FROM patients WHERE id=?", (pid,))
    db.commit()
    return {"success": True}

# ── APPOINTMENTS ──────────────────────────────────────────────────────────────
@app.get("/appointments")
def list_appointments(
    status: str = "",
    patient_name: str = "",
    limit: int = 50,
    db: sqlite3.Connection = Depends(get_db)
):
    sql = "SELECT * FROM appointments WHERE 1=1"
    params = []
    if status:
        sql += " AND status=?"
        params.append(status)
    if patient_name:
        sql += " AND patient_name LIKE ?"
        params.append(f"%{patient_name}%")
    sql += " ORDER BY datetime_iso ASC LIMIT ?"
    params.append(limit)
    rows = db.execute(sql, params).fetchall()
    return {"appointments": rows_to_list(rows)}

@app.post("/appointments")
def create_appointment(body: AppointmentModel, db: sqlite3.Connection = Depends(get_db)):
    aid = uid("a")
    db.execute("""
        INSERT INTO appointments(id,patient_id,patient_name,clinic,doctor,datetime_iso,visit_type,reason,notes,mobile,status)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)
    """, (aid,body.patient_id,body.patient_name,body.clinic,body.doctor,body.datetime_iso,
          body.visit_type,body.reason,body.notes,body.mobile,body.status))
    # Log SMS
    if body.mobile:
        sms = f"Appointment confirmed: {body.clinic} on {body.datetime_iso}. Reason: {body.reason}. RuralCare Pro"
        db.execute("INSERT INTO sms_log(id,mobile,message,status) VALUES(?,?,?,?)", (uid("sms"),body.mobile,sms,"sent"))
    db.commit()
    return {"success": True, "appointment": {"id": aid, **body.dict()}}

@app.get("/appointments/{aid}")
def get_appointment(aid: str, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT * FROM appointments WHERE id=?", (aid,)).fetchone()
    if not row: raise HTTPException(404, "Appointment not found")
    return row_to_dict(row)

@app.patch("/appointments/{aid}/status")
def update_appointment_status(aid: str, body: StatusUpdate, db: sqlite3.Connection = Depends(get_db)):
    db.execute("UPDATE appointments SET status=? WHERE id=?", (body.status, aid))
    db.commit()
    return {"success": True}

@app.delete("/appointments/{aid}")
def cancel_appointment(aid: str, db: sqlite3.Connection = Depends(get_db)):
    db.execute("UPDATE appointments SET status='Cancelled' WHERE id=?", (aid,))
    db.commit()
    return {"success": True}

# ── AI DIAGNOSIS & SYMPTOM CHECK ──────────────────────────────────────────────
@app.post("/symptom-check")
def symptom_check(body: SymptomCheckModel):
    """Server-side triage logic — returns urgency level and suggested action."""
    result = server_triage(body.symptoms, body.severity, body.age, body.history)
    return {
        "triage": result["triage"],
        "action": result["action"],
        "urgent_symptoms": result["urgent_symptoms"],
        "severity": body.severity,
        "age": body.age,
        "symptom_count": len(body.symptoms),
    }

@app.post("/diagnoses")
def save_diagnosis(body: DiagnosisModel, db: sqlite3.Connection = Depends(get_db)):
    did = uid("d")
    db.execute("""
        INSERT INTO diagnoses(id,patient_id,patient_name,symptoms,top_diagnosis,confidence,risk,severity,age,history)
        VALUES(?,?,?,?,?,?,?,?,?,?)
    """, (did,body.patient_id,body.patient_name,
          json.dumps(body.symptoms),body.top_diagnosis,body.confidence,body.risk,
          body.severity,body.age,json.dumps(body.history)))
    db.commit()
    return {"success": True, "id": did}

@app.get("/diagnoses")
def list_diagnoses(patient_id: str = "", limit: int = 20, db: sqlite3.Connection = Depends(get_db)):
    if patient_id:
        rows = db.execute("SELECT * FROM diagnoses WHERE patient_id=? ORDER BY created_at DESC LIMIT ?", (patient_id, limit)).fetchall()
    else:
        rows = db.execute("SELECT * FROM diagnoses ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return {"diagnoses": rows_to_list(rows)}

# ── DOCTOR NOTES ──────────────────────────────────────────────────────────────
@app.post("/doctor-notes")
def add_doctor_note(body: DoctorNoteModel, db: sqlite3.Connection = Depends(get_db)):
    nid = uid("dn")
    db.execute("INSERT INTO doctor_notes(id,patient_id,doctor_name,note) VALUES(?,?,?,?)",
               (nid, body.patient_id, body.doctor_name, body.note))
    db.commit()
    return {"success": True, "id": nid}

@app.get("/doctor-notes/{pid}")
def get_doctor_notes(pid: str, db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM doctor_notes WHERE patient_id=? ORDER BY created_at DESC", (pid,)).fetchall()
    return {"notes": rows_to_list(rows)}

# ── BROADCASTS ────────────────────────────────────────────────────────────────
@app.get("/broadcasts")
def list_broadcasts(limit: int = 20, db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return {"broadcasts": rows_to_list(rows)}

@app.post("/broadcasts")
def send_broadcast(body: BroadcastModel, db: sqlite3.Connection = Depends(get_db)):
    bid = uid("bc")
    recipients_json = json.dumps(body.recipients) if isinstance(body.recipients, list) else str(body.recipients)
    count = len(body.recipients) if isinstance(body.recipients, list) else 0
    db.execute("""
        INSERT INTO broadcasts(id,message_type,message,language,recipients,sent_count,status)
        VALUES(?,?,?,?,?,?,?)
    """, (bid, body.message_type, body.message, body.language, recipients_json, count, "sent"))
    # Log SMS for each recipient
    for r in body.recipients:
        phone = r.get("phone","") if isinstance(r, dict) else ""
        if phone:
            db.execute("INSERT INTO sms_log(id,mobile,message) VALUES(?,?,?)",
                       (uid("sms"), phone, body.message))
    db.commit()
    return {"success": True, "broadcast_id": bid, "sent_count": count}

@app.get("/broadcasts/messages")
def get_broadcast_messages():
    return {"messages": BROADCAST_MSGS}

# ── EMERGENCIES ───────────────────────────────────────────────────────────────
@app.get("/emergencies")
def list_emergencies(status: str = "", db: sqlite3.Connection = Depends(get_db)):
    if status:
        rows = db.execute("SELECT * FROM emergencies WHERE status=? ORDER BY created_at DESC", (status,)).fetchall()
    else:
        rows = db.execute("SELECT * FROM emergencies ORDER BY created_at DESC LIMIT 50").fetchall()
    return {"emergencies": rows_to_list(rows)}

@app.post("/emergencies")
def trigger_emergency(body: EmergencyModel, db: sqlite3.Connection = Depends(get_db)):
    eid = uid("e")
    db.execute("""
        INSERT INTO emergencies(id,patient_name,patient_id,emergency_type,location_gps,status,notes)
        VALUES(?,?,?,?,?,?,?)
    """, (eid,body.patient_name,body.patient_id,body.emergency_type,body.location_gps,"Active",body.notes))
    db.commit()
    return {"success": True, "emergency_id": eid, "message": "Emergency alert dispatched. ETA ambulance: 15–20 min.", "helpline": "108"}

@app.patch("/emergencies/{eid}/assign")
def assign_emergency(eid: str, body: dict, db: sqlite3.Connection = Depends(get_db)):
    db.execute("UPDATE emergencies SET assigned_doctor=? WHERE id=?", (body.get("doctor"), eid))
    db.commit()
    return {"success": True}

@app.patch("/emergencies/{eid}/resolve")
def resolve_emergency(eid: str, body: dict, db: sqlite3.Connection = Depends(get_db)):
    db.execute("UPDATE emergencies SET status='Resolved', resolved_at=? WHERE id=?",
               (datetime.now().isoformat(), eid))
    db.commit()
    return {"success": True}

# ── CAMPS ─────────────────────────────────────────────────────────────────────
@app.get("/camps")
def list_camps(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM camps ORDER BY date_iso DESC").fetchall()
    return {"camps": rows_to_list(rows)}

@app.post("/camps")
def create_camp(body: CampModel, db: sqlite3.Connection = Depends(get_db)):
    cid = uid("c")
    db.execute("INSERT INTO camps(id,name,location,date_iso,expected_patients,notes) VALUES(?,?,?,?,?,?)",
               (cid, body.name, body.location, body.date_iso, body.expected_patients, body.notes))
    db.commit()
    return {"success": True, "camp_id": cid}

# ── REMINDERS ─────────────────────────────────────────────────────────────────
@app.get("/reminders")
def list_reminders(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM reminders WHERE active=1 ORDER BY created_at DESC").fetchall()
    return {"reminders": rows_to_list(rows)}

@app.post("/reminders")
def create_reminder(body: ReminderModel, db: sqlite3.Connection = Depends(get_db)):
    rid = uid("r")
    db.execute("INSERT INTO reminders(id,patient_id,patient_name,medicine,schedule) VALUES(?,?,?,?,?)",
               (rid, body.patient_id, body.patient_name, body.medicine, body.schedule))
    db.commit()
    return {"success": True, "reminder_id": rid}

@app.delete("/reminders/{rid}")
def deactivate_reminder(rid: str, db: sqlite3.Connection = Depends(get_db)):
    db.execute("UPDATE reminders SET active=0 WHERE id=?", (rid,))
    db.commit()
    return {"success": True}

# ── OUTBREAKS ─────────────────────────────────────────────────────────────────
@app.get("/outbreaks")
def list_outbreaks(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM outbreaks ORDER BY reported_at DESC").fetchall()
    return {"outbreaks": rows_to_list(rows)}

@app.post("/outbreaks")
def report_outbreak(body: dict, db: sqlite3.Connection = Depends(get_db)):
    oid = uid("ob")
    db.execute("INSERT INTO outbreaks(id,disease,ward,case_count,severity,notes) VALUES(?,?,?,?,?,?)",
               (oid, body.get("disease"), body.get("ward"), body.get("case_count",1), body.get("severity","watch"), body.get("notes","")))
    db.commit()
    return {"success": True, "outbreak_id": oid}

# ── SMS LOG ───────────────────────────────────────────────────────────────────
@app.get("/sms-log")
def get_sms_log(limit: int = 50, db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("SELECT * FROM sms_log ORDER BY sent_at DESC LIMIT ?", (limit,)).fetchall()
    return {"sms_log": rows_to_list(rows)}

@app.post("/sms-log")
def log_sms(body: dict, db: sqlite3.Connection = Depends(get_db)):
    sid = uid("sms")
    db.execute("INSERT INTO sms_log(id,mobile,message,status) VALUES(?,?,?,?)",
               (sid, body.get("mobile"), body.get("message"), body.get("status","sent")))
    db.commit()
    return {"success": True}

# ── CLINICS (static data — real GPS coords for Rajganj area) ──────────────────
@app.get("/clinics")
def get_clinics(lat: Optional[float] = None, lng: Optional[float] = None, type_: str = Query("", alias="type")):
    clinics = [
        {"id":0,"name":"District Hospital Rajganj","type":"govt","address":"Main Road, Rajganj, Bihar","hours":"24/7 Emergency","phone":"06453-234567","tags":["Emergency 24/7","ICU","Blood Bank","OT","Free"],"cost":"Free (Government)","walkin":True,"lat":25.70,"lng":85.80,"rating":4.2},
        {"id":1,"name":"Rajganj CHC Block","type":"govt","address":"Block Road, Rajganj CHC","hours":"8am–8pm","phone":"06453-234890","tags":["Free","Lab Tests","ANC","Immunization"],"cost":"Free (Government)","walkin":True,"lat":25.71,"lng":85.79,"rating":3.9},
        {"id":2,"name":"Arogya Clinic","type":"private","address":"Market Road, Near Bus Stand","hours":"9am–6pm","phone":"9876100010","tags":["General Medicine","Lab Tests"],"cost":"₹300","walkin":True,"lat":25.72,"lng":85.81,"rating":4.5},
        {"id":3,"name":"PHC Rajganj Block","type":"govt","address":"Ward 5, PHC Road","hours":"9am–5pm","phone":"06453-234321","tags":["Free","Maternal Health"],"cost":"Free (Government)","walkin":True,"lat":25.68,"lng":85.82,"rating":3.7},
        {"id":4,"name":"Dr. A. Gupta Clinic","type":"private","address":"Near Panchayat Bhawan, Ward 2","hours":"10am–2pm, 5pm–8pm","phone":"9876100020","tags":["Walk-in","Diabetes Care"],"cost":"₹200","walkin":True,"lat":25.705,"lng":85.795,"rating":4.7},
        {"id":5,"name":"Mother & Child Clinic","type":"private","address":"Women's Colony, Ward 3","hours":"9am–7pm","phone":"9876100030","tags":["Maternal Health","Paediatrics"],"cost":"₹400","walkin":False,"lat":25.715,"lng":85.785,"rating":4.6},
        {"id":6,"name":"Jeevan Diagnostic Centre","type":"private","address":"Near District Hospital","hours":"7am–9pm","phone":"9876100040","tags":["Lab Tests","X-ray","Ultrasound"],"cost":"Market rates","walkin":True,"lat":25.702,"lng":85.802,"rating":4.4},
        {"id":7,"name":"Telehealth — eAushadhi","type":"govt","address":"Online","hours":"9am–6pm","phone":"1800-11-4477","tags":["Free","Online","Hindi"],"cost":"Free","walkin":False,"lat":None,"lng":None,"rating":4.0},
    ]
    if type_:
        clinics = [c for c in clinics if c["type"] == type_]
    if lat and lng:
        import math
        def dist(c):
            if not c["lat"]: return 999
            dlat = (c["lat"]-lat)*111
            dlng = (c["lng"]-lng)*111*math.cos(math.radians(lat))
            return round(math.sqrt(dlat**2 + dlng**2), 2)
        for c in clinics:
            c["distance_km"] = dist(c)
        clinics.sort(key=lambda c: c["distance_km"])
    return {"clinics": clinics}

# ── STARTUP ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    init_db()
    print("✅ RuralCare Pro API started — DB initialized")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
