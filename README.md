# RuralCare AI — Smart Rural Healthcare Platform 🏥⛰️

**Empowering Rural Health through Integrated AI, Real-time Monitoring, and Seamless Connectivity.**

RuralCare AI is a comprehensive healthcare ecosystem designed specifically for the unique challenges of rural environments. It merges clinical management, emergency response, and epidemiological tracking into one unified, lightweight platform.

## 🚀 Key Features

- **Multi-Role Ecosystem:** Specialized dashboards for Patients, Doctors, and Ground-level Workers (ASHA/ANM).
- **AI-Assisted Diagnosis:** Smart diagnostic tools that help health workers identify risks and categorize severity.
- **Real-Time Outbreak Tracking:** Geographic visualization of disease clusters to prevent local epidemics.
- **Smart Referral System:** Seamlessly transition patients from village-level care to specialized private/government clinics.
- **Emergency SOS & GPS:** Instant emergency alerts with location tracking for rapid response.
- **Bilingual & Accessible:** Designed with language preferences (Hindi/English) and voice-ready interfaces.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Modern Flex/Grid), Vanilla JavaScript
- **Backend:** Python (FastAPI)
- **Database:** SQLite (SQLAlchemy/Raw SQL)
- **Maps:** Leaflet.js (OpenStreetMap)
- **Security:** SHA-256 Encryption & JWT-ready architecture

## 🏗️ System Architecture


The platform follows a **Client-Server Architecture**:
1. **API Layer:** FastAPI serves as the backbone, handling requests for patient records, appointments, and emergency triggers.
2. **Data Layer:** A relational SQLite database manages structured health data, including longitudinal patient history and vital signs.
3. **Frontend Layer:** A responsive, mobile-first web interface that utilizes CSS Design Tokens for high-performance UI and accessibility.

## 📦 Database Schema

- `users`: Authentication and role-based access control.
- `patients`: Comprehensive EMR (Electronic Medical Records) including vitals and history.
- `diagnoses`: AI-assisted records with confidence scores and severity levels.
- `outbreaks`: Ward-wise tracking of infectious diseases.
- `emergencies`: Real-time tracking of active SOS calls.

## 🚦 Getting Started

### Prerequisites
- Python 3.8+
- Modern Web Browser

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/vishalddubey/HS-2026-108-Hackstomp26.git](https://github.com/vishalddubey/HS-2026-108-Hackstomp26.git)
   cd HS-2026-108-Hackstomp26
