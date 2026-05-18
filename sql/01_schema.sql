-- ============================================================
-- AeroNetB Aerospace Supply Chain Management
-- Relational Schema (PostgreSQL)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS & ROLES
-- ============================================================

CREATE TABLE roles (
    role_id     SERIAL PRIMARY KEY,
    role_name   VARCHAR(50) UNIQUE NOT NULL  -- procurement_officer, quality_inspector, supply_chain_manager, equipment_engineer, auditor
);

CREATE TABLE employees (
    emp_id          SERIAL PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    job_title       VARCHAR(100),
    department      VARCHAR(100),
    email           VARCHAR(150) UNIQUE NOT NULL,
    phone           VARCHAR(30),
    access_level    VARCHAR(20) NOT NULL CHECK (access_level IN ('read','write','approve','audit')),
    auth_id         VARCHAR(200) UNIQUE,          -- linked to identity provider
    password_hash   VARCHAR(200),
    role_id         INT NOT NULL REFERENCES roles(role_id),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Role-specific extension tables
CREATE TABLE procurement_officers (
    emp_id              INT PRIMARY KEY REFERENCES employees(emp_id),
    region_managed      VARCHAR(100),
    authorization_limit NUMERIC(15,2)
);

CREATE TABLE quality_inspectors (
    emp_id                  INT PRIMARY KEY REFERENCES employees(emp_id),
    inspector_cert_id       VARCHAR(100),
    inspection_specialization VARCHAR(100),
    digital_signature       TEXT           -- base64 or file reference
);

CREATE TABLE supply_chain_managers (
    emp_id              INT PRIMARY KEY REFERENCES employees(emp_id),
    product_lines       TEXT[],            -- e.g. {fuselage, wing_assemblies}
    reporting_level     VARCHAR(50),
    kpi_preferences     JSONB
);

CREATE TABLE equipment_engineers (
    emp_id              INT PRIMARY KEY REFERENCES employees(emp_id),
    engineering_license VARCHAR(100),
    assigned_facility   VARCHAR(100),
    machine_groups      TEXT[]
);

CREATE TABLE auditors (
    emp_id              INT PRIMARY KEY REFERENCES employees(emp_id),
    regulatory_authority VARCHAR(150),
    accreditation_id    VARCHAR(100),
    audit_scope         VARCHAR(100)
);

-- ============================================================
-- SUPPLIERS
-- ============================================================

CREATE TABLE suppliers (
    supplier_id         SERIAL PRIMARY KEY,
    business_name       VARCHAR(200) NOT NULL,
    address             TEXT,
    city                VARCHAR(100),
    country             VARCHAR(100),
    accreditation_status VARCHAR(50),      -- ISO9001, AS9100, etc.
    contact_name        VARCHAR(100),
    contact_email       VARCHAR(150),
    contact_phone       VARCHAR(30),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PARTS
-- ============================================================

CREATE TABLE parts (
    part_id         SERIAL PRIMARY KEY,
    part_name       VARCHAR(200) NOT NULL,
    description     TEXT,
    part_category   VARCHAR(100),          -- fuselage, wing, engine, etc.
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Baseline manufacturing specs (relational — structured fields)
CREATE TABLE part_specifications (
    spec_id         SERIAL PRIMARY KEY,
    part_id         INT NOT NULL REFERENCES parts(part_id),
    tensile_strength    NUMERIC(10,2),
    fatigue_limit       NUMERIC(10,2),
    yield_point         NUMERIC(10,2),
    heat_treatment      VARCHAR(200),
    surface_finishing   VARCHAR(200),
    machining_steps     TEXT,
    geometry_ref        VARCHAR(300),      -- path/URL to CAD file
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier-specific part variant (many-to-many with extra data)
CREATE TABLE supplier_parts (
    supplier_part_id    SERIAL PRIMARY KEY,
    supplier_id         INT NOT NULL REFERENCES suppliers(supplier_id),
    part_id             INT NOT NULL REFERENCES parts(part_id),
    supplier_part_ref   VARCHAR(100),      -- supplier's own part number
    unit_price          NUMERIC(15,2),
    lead_time_days      INT,
    customization_notes TEXT,              -- e.g. anti-corrosion coating, RFID tags
    is_active           BOOLEAN DEFAULT TRUE,
    UNIQUE(supplier_id, part_id)
);

-- ============================================================
-- ORDERS & SHIPMENTS
-- ============================================================

CREATE TABLE purchase_orders (
    order_id            SERIAL PRIMARY KEY,
    supplier_id         INT NOT NULL REFERENCES suppliers(supplier_id),
    supplier_part_id    INT NOT NULL REFERENCES supplier_parts(supplier_part_id),
    created_by_emp_id   INT REFERENCES employees(emp_id),
    order_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    desired_delivery    DATE,
    actual_delivery     DATE,
    quantity            INT NOT NULL DEFAULT 1,
    total_value         NUMERIC(15,2),
    status              VARCHAR(30) NOT NULL DEFAULT 'placed'
                        CHECK (status IN ('placed','confirmed','dispatched','delivered','completed','cancelled')),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shipments (
    shipment_id         SERIAL PRIMARY KEY,
    order_id            INT NOT NULL REFERENCES purchase_orders(order_id),
    tracking_number     VARCHAR(100) UNIQUE,
    carrier             VARCHAR(100),
    port_of_entry       VARCHAR(100),
    origin_country      VARCHAR(100),
    estimated_arrival   DATE,
    actual_arrival      DATE,
    status              VARCHAR(30) DEFAULT 'in_transit'
                        CHECK (status IN ('pending','in_transit','arrived','cleared','delivered')),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shipment_updates (
    update_id       SERIAL PRIMARY KEY,
    shipment_id     INT NOT NULL REFERENCES shipments(shipment_id),
    timestamp       TIMESTAMPTZ DEFAULT NOW(),
    location        VARCHAR(200),
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    condition_note  TEXT,
    temperature_c   NUMERIC(6,2),
    recorded_by     INT REFERENCES employees(emp_id)
);

-- ============================================================
-- QUALITY CONTROL
-- ============================================================

CREATE TABLE qc_reports (
    report_id           SERIAL PRIMARY KEY,
    order_id            INT NOT NULL REFERENCES purchase_orders(order_id),
    supplier_part_id    INT REFERENCES supplier_parts(supplier_part_id),
    inspector_emp_id    INT REFERENCES employees(emp_id),
    report_type         VARCHAR(50) NOT NULL,  -- visual, dimensional, NDT, environmental
    inspection_date     DATE DEFAULT CURRENT_DATE,
    overall_result      VARCHAR(10) NOT NULL CHECK (overall_result IN ('pass','fail','pending')),
    notes               TEXT,
    version             INT DEFAULT 1,
    is_finalized        BOOLEAN DEFAULT FALSE,
    mongo_doc_id        VARCHAR(100),          -- reference to MongoDB detailed report
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CERTIFICATIONS
-- ============================================================

CREATE TABLE certifications (
    cert_id             SERIAL PRIMARY KEY,
    supplier_part_id    INT NOT NULL REFERENCES supplier_parts(supplier_part_id),
    order_id            INT REFERENCES purchase_orders(order_id),
    inspector_emp_id    INT REFERENCES employees(emp_id),
    cert_number         VARCHAR(100) UNIQUE,
    issue_date          DATE,
    expiry_date         DATE,
    batch_origin        TEXT,
    status              VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','approved','revoked')),
    is_immutable        BOOLEAN DEFAULT FALSE,  -- set TRUE once approved
    mongo_doc_id        VARCHAR(100),           -- reference to MongoDB full cert doc
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EQUIPMENT & IoT
-- ============================================================

CREATE TABLE equipment (
    equipment_id        SERIAL PRIMARY KEY,
    equipment_name      VARCHAR(200) NOT NULL,
    equipment_type      VARCHAR(100),
    facility            VARCHAR(100),
    assigned_engineer   INT REFERENCES employees(emp_id),
    serial_number       VARCHAR(100) UNIQUE,
    install_date        DATE,
    status              VARCHAR(20) DEFAULT 'operational'
                        CHECK (status IN ('operational','warning','critical','offline')),
    last_maintenance    DATE,
    next_maintenance    DATE
);

CREATE TABLE iot_readings (
    reading_id      BIGSERIAL PRIMARY KEY,
    equipment_id    INT NOT NULL REFERENCES equipment(equipment_id),
    timestamp       TIMESTAMPTZ DEFAULT NOW(),
    temperature_c   NUMERIC(6,2),
    vibration_hz    NUMERIC(8,4),
    pressure_bar    NUMERIC(8,4),
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    cycle_count     INT,
    alert_triggered BOOLEAN DEFAULT FALSE,
    raw_payload     JSONB           -- full IoT payload stored as JSON
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_logs (
    log_id          BIGSERIAL PRIMARY KEY,
    emp_id          INT REFERENCES employees(emp_id),
    action          VARCHAR(50) NOT NULL,   -- view, create, update, approve, delete
    table_name      VARCHAR(100),
    record_id       INT,
    description     TEXT,
    ip_address      VARCHAR(45),
    timestamp       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_orders_supplier    ON purchase_orders(supplier_id);
CREATE INDEX idx_orders_status      ON purchase_orders(status);
CREATE INDEX idx_shipments_order    ON shipments(order_id);
CREATE INDEX idx_qc_order           ON qc_reports(order_id);
CREATE INDEX idx_qc_result          ON qc_reports(overall_result);
CREATE INDEX idx_iot_equipment      ON iot_readings(equipment_id);
CREATE INDEX idx_iot_timestamp      ON iot_readings(timestamp DESC);
CREATE INDEX idx_audit_emp          ON audit_logs(emp_id);
CREATE INDEX idx_audit_timestamp    ON audit_logs(timestamp DESC);

-- ============================================================
-- VIEWS
-- ============================================================

-- Shipment overview with order and supplier info
CREATE VIEW v_shipment_overview AS
SELECT
    s.shipment_id,
    s.tracking_number,
    s.status AS shipment_status,
    s.estimated_arrival,
    s.actual_arrival,
    s.port_of_entry,
    po.order_id,
    po.status AS order_status,
    po.desired_delivery,
    po.quantity,
    sup.business_name AS supplier_name,
    sup.country AS supplier_country,
    p.part_name,
    (s.estimated_arrival - CURRENT_DATE) AS days_to_arrival,
    CASE WHEN s.estimated_arrival < CURRENT_DATE AND s.status NOT IN ('arrived','delivered') THEN TRUE ELSE FALSE END AS is_delayed
FROM shipments s
JOIN purchase_orders po ON s.order_id = po.order_id
JOIN supplier_parts sp ON po.supplier_part_id = sp.supplier_part_id
JOIN suppliers sup ON sp.supplier_id = sup.supplier_id
JOIN parts p ON sp.part_id = p.part_id;

-- Supplier KPI view
CREATE VIEW v_supplier_kpi AS
SELECT
    sup.supplier_id,
    sup.business_name,
    COUNT(DISTINCT po.order_id)                                             AS total_orders,
    COUNT(DISTINCT CASE WHEN po.actual_delivery <= po.desired_delivery THEN po.order_id END) AS on_time_orders,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN po.actual_delivery <= po.desired_delivery THEN po.order_id END)
          / NULLIF(COUNT(DISTINCT po.order_id),0), 1)                      AS on_time_rate_pct,
    COUNT(DISTINCT qr.report_id)                                            AS total_qc_reports,
    COUNT(DISTINCT CASE WHEN qr.overall_result = 'fail' THEN qr.report_id END) AS failed_qc,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN qr.overall_result = 'fail' THEN qr.report_id END)
          / NULLIF(COUNT(DISTINCT qr.report_id),0), 1)                     AS defect_rate_pct
FROM suppliers sup
LEFT JOIN supplier_parts sp ON sup.supplier_id = sp.supplier_id
LEFT JOIN purchase_orders po ON sp.supplier_part_id = po.supplier_part_id
LEFT JOIN qc_reports qr ON po.order_id = qr.order_id
GROUP BY sup.supplier_id, sup.business_name;

-- Equipment status summary
CREATE VIEW v_equipment_status AS
SELECT
    e.equipment_id,
    e.equipment_name,
    e.facility,
    e.status,
    e.last_maintenance,
    e.next_maintenance,
    emp.full_name AS engineer_name,
    ir.temperature_c AS last_temp,
    ir.vibration_hz AS last_vibration,
    ir.pressure_bar AS last_pressure,
    ir.timestamp AS last_reading_time
FROM equipment e
LEFT JOIN employees emp ON e.assigned_engineer = emp.emp_id
LEFT JOIN LATERAL (
    SELECT * FROM iot_readings WHERE equipment_id = e.equipment_id ORDER BY timestamp DESC LIMIT 1
) ir ON TRUE;
