# AeroNetB ASCM – Task 2 Implementation Guide

## Project Structure

```
aeronetb/
├── backend/
│   ├── config/db.js          # PostgreSQL + MongoDB connections
│   ├── middleware/auth.js    # JWT auth + RBAC + audit logger
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/login, GET /api/auth/me
│   │   ├── suppliers.js      # Suppliers & parts endpoints
│   │   ├── orders.js         # Purchase orders & shipments
│   │   ├── qc.js             # QC reports & certifications
│   │   ├── iot.js            # Equipment & IoT readings
│   │   └── dashboard.js      # Summary stats & audit logs
│   ├── server.js             # Express entry point
│   ├── package.json
│   └── .env.example          # Environment variables template
├── frontend/
│   └── index.html            # Full dashboard (single-page app)
├── sql/
│   ├── 01_schema.sql         # DDL – all tables, views, indexes
│   └── 02_dummy_data.sql     # DML – sample data
├── mongo/
│   └── mongo_seed.js         # MongoDB collections + seed data
└── render.yaml               # Render.com deployment config
```

---

## Part A – Database Setup

### 1. PostgreSQL (Render free tier)

1. Go to [render.com](https://render.com) → New → PostgreSQL
2. Name: `aeronetb-postgres`, Plan: Free → Create
3. Copy the **External Database URL** shown in the dashboard
4. Connect with any SQL client (e.g. DBeaver, pgAdmin, or `psql`):
   ```bash
   psql "postgresql://user:password@host/aeronetb"
   ```
5. Run the schema:
   ```bash
   psql "your-connection-string" -f sql/01_schema.sql
   psql "your-connection-string" -f sql/02_dummy_data.sql
   ```

### 2. MongoDB (MongoDB Atlas free tier)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free cluster
2. Create a database user (username + password)
3. Allow network access: Add IP `0.0.0.0/0` (allow all, fine for demo)
4. Get your connection string: `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/aeronetb`
5. Run the seed script:
   ```bash
   mongosh "your-atlas-connection-string" mongo/mongo_seed.js
   ```

---

## Part B – Backend Deployment (Render)

1. Push your code to a GitHub repository
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variables:
   ```
   PG_HOST       = (from Render PostgreSQL dashboard)
   PG_PORT       = 5432
   PG_DATABASE   = aeronetb
   PG_USER       = aeronetb_user
   PG_PASSWORD   = (from Render PostgreSQL dashboard)
   PG_SSL        = true
   MONGO_URI     = (from MongoDB Atlas)
   JWT_SECRET    = (generate a long random string)
   FRONTEND_ORIGIN = https://your-frontend.onrender.com
   PORT          = 3000
   ```
6. Deploy → your API URL will be: `https://aeronetb-api.onrender.com`

---

## Part C – Frontend Deployment (Render Static Site)

1. Open `frontend/index.html`
2. Find line: `const API_BASE = 'http://localhost:3000/api';`
3. Change it to your Render backend URL:
   ```javascript
   const API_BASE = 'https://aeronetb-api.onrender.com/api';
   ```
4. Go to Render → New → Static Site
5. Connect your GitHub repo
6. Settings:
   - **Root Directory:** `frontend`
   - **Publish Directory:** `.`
7. Deploy → your dashboard URL will be: `https://aeronetb-dashboard.onrender.com`

---

## Part D – Local Development

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your PostgreSQL and MongoDB credentials

# 3. Run PostgreSQL schema (requires local PostgreSQL or use Render)
psql -U postgres -d aeronetb -f ../sql/01_schema.sql
psql -U postgres -d aeronetb -f ../sql/02_dummy_data.sql

# 4. Seed MongoDB (requires local MongoDB or Atlas)
mongosh aeronetb ../mongo/mongo_seed.js

# 5. Start backend
node server.js

# 6. Open frontend
# Simply open frontend/index.html in your browser
# (or use Live Server in VS Code)
```

---

## API Endpoint Reference

| Method | Endpoint                          | Role Required              | Description                        |
|--------|-----------------------------------|----------------------------|------------------------------------|
| POST   | /api/auth/login                   | Any                        | Login, returns JWT token           |
| GET    | /api/auth/me                      | Authenticated              | Get current user profile           |
| GET    | /api/suppliers                    | Authenticated              | List suppliers                     |
| POST   | /api/suppliers                    | procurement_officer        | Create new supplier                |
| GET    | /api/suppliers/kpi/all            | Authenticated              | Supplier KPI metrics               |
| GET    | /api/suppliers/:id/parts          | Authenticated              | Parts offered by supplier          |
| GET    | /api/orders                       | Authenticated              | List purchase orders               |
| GET    | /api/orders/:id                   | Authenticated              | Order detail                       |
| POST   | /api/orders                       | procurement_officer        | Create purchase order              |
| PATCH  | /api/orders/:id/status            | procurement, supply_chain  | Update order status                |
| GET    | /api/orders/shipments/overview    | Authenticated              | Shipment tracking overview         |
| GET    | /api/orders/shipments/:id/updates | Authenticated              | Shipment location history          |
| GET    | /api/qc/reports                   | Authenticated              | List QC reports                    |
| GET    | /api/qc/reports/:id               | Authenticated              | QC report detail (incl. MongoDB)   |
| POST   | /api/qc/reports                   | quality_inspector          | Create QC report                   |
| POST   | /api/qc/reports/:id/finalize      | quality_inspector          | Finalise/lock QC report            |
| GET    | /api/qc/certifications            | Authenticated              | List certifications                |
| GET    | /api/qc/certifications/:id        | Authenticated              | Cert detail (incl. MongoDB)        |
| POST   | /api/qc/certifications/:id/approve| quality_inspector          | Approve + make immutable           |
| GET    | /api/qc/stats                     | Authenticated              | QC analytics (pass/fail trends)    |
| GET    | /api/iot/equipment                | Authenticated              | Equipment status list              |
| GET    | /api/iot/readings/:equipment_id   | Authenticated              | Time-series IoT readings           |
| POST   | /api/iot/readings                 | equipment_engineer         | Ingest new IoT reading             |
| GET    | /api/iot/alerts                   | engineer, supply_chain     | Recent alert readings              |
| GET    | /api/iot/dashboard                | Authenticated              | IoT summary dashboard              |
| GET    | /api/dashboard/summary            | Authenticated              | Global KPI snapshot                |
| GET    | /api/dashboard/supplier-kpi       | Authenticated              | Supplier performance               |
| GET    | /api/dashboard/shipments-map      | Authenticated              | Active shipments with GPS          |
| GET    | /api/dashboard/audit-logs         | auditor                    | Full audit log (read-only)         |

---

## Demo Login Credentials

| User  | Email                  | Password   | Role                  |
|-------|------------------------|------------|-----------------------|
| Alice | alice@aeronetb.com     | Pass1234!  | Procurement Officer   |
| Bob   | bob@aeronetb.com       | Pass1234!  | Quality Inspector     |
| Carol | carol@aeronetb.com     | Pass1234!  | Supply Chain Manager  |
| David | david@aeronetb.com     | Pass1234!  | Equipment Engineer    |
| Emma  | emma@aeronetb.com      | Pass1234!  | Auditor               |

---

## Security Implementation

- **Authentication:** JWT tokens (8-hour expiry), bcrypt password hashing
- **RBAC:** Each route enforces `requireRole()` middleware
- **Immutability:** Certifications set `is_immutable=TRUE` on approval; further updates blocked
- **Audit logging:** Every API action writes to `audit_logs` table with `emp_id`, action, table, timestamp
- **Auditor access:** Read-only, only sees audit logs endpoint
- **CORS:** Restricted to frontend origin in production

---

## Data Architecture Summary

### Relational (PostgreSQL) — structured, transactional data
- employees, roles, procurement_officers, quality_inspectors, supply_chain_managers, equipment_engineers, auditors
- suppliers, parts, part_specifications, supplier_parts
- purchase_orders, shipments, shipment_updates
- qc_reports (summary), certifications (summary)
- equipment, iot_readings, audit_logs

### Document (MongoDB) — semi-structured, flexible detail data
- **qc_reports** — full inspection detail (measurements, NDT scans, test arrays, attachments)
- **certifications** — full cert docs (material traceability, test results, digital signatures, audit trail)
- **part_documents** — engineering drawings, CAD files, prototype images (metadata)
- **iot_snapshots** — IoT time-series archive

### Cross-Reference
PostgreSQL records store `mongo_doc_id` to link to the corresponding MongoDB document for drill-down detail.
