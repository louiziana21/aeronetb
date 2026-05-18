-- ============================================================
-- AeroNetB Aerospace – Dummy Data (DML)
-- ============================================================

-- ROLES
INSERT INTO roles (role_name) VALUES
('procurement_officer'),
('quality_inspector'),
('supply_chain_manager'),
('equipment_engineer'),
('auditor');

-- EMPLOYEES
INSERT INTO employees (full_name, job_title, department, email, phone, access_level, auth_id, password_hash, role_id) VALUES
('Alice Monroe',    'Procurement Officer',    'Procurement',    'alice@aeronetb.com',   '+44-7700-100001', 'write',   'auth_alice',   crypt('Pass1234!', gen_salt('bf')), 1),
('Bob Harrington',  'Quality Inspector',      'Quality',        'bob@aeronetb.com',     '+44-7700-100002', 'approve', 'auth_bob',     crypt('Pass1234!', gen_salt('bf')), 2),
('Carol Tran',      'Supply Chain Manager',   'Operations',     'carol@aeronetb.com',   '+44-7700-100003', 'write',   'auth_carol',   crypt('Pass1234!', gen_salt('bf')), 3),
('David Singh',     'Equipment Engineer',     'Engineering',    'david@aeronetb.com',   '+44-7700-100004', 'write',   'auth_david',   crypt('Pass1234!', gen_salt('bf')), 4),
('Emma Kowalski',   'Auditor',                'Compliance',     'emma@aeronetb.com',    '+44-7700-100005', 'audit',   'auth_emma',    crypt('Pass1234!', gen_salt('bf')), 5),
('Frank Osei',      'Procurement Officer',    'Procurement',    'frank@aeronetb.com',   '+44-7700-100006', 'write',   'auth_frank',   crypt('Pass1234!', gen_salt('bf')), 1),
('Grace Liu',       'Quality Inspector',      'Quality',        'grace@aeronetb.com',   '+44-7700-100007', 'approve', 'auth_grace',   crypt('Pass1234!', gen_salt('bf')), 2);

INSERT INTO procurement_officers (emp_id, region_managed, authorization_limit) VALUES
(1, 'Europe',       500000.00),
(6, 'Asia-Pacific', 250000.00);

INSERT INTO quality_inspectors (emp_id, inspector_cert_id, inspection_specialization, digital_signature) VALUES
(2, 'CERT-NDT-2201', 'NDT, Dimensional Analysis', 'sig_bob_b64=='),
(7, 'CERT-ENV-3305', 'Environmental Testing',      'sig_grace_b64==');

INSERT INTO supply_chain_managers (emp_id, product_lines, reporting_level, kpi_preferences) VALUES
(3, ARRAY['fuselage','wing_assemblies'], 'global_manager', '{"kpis":["on_time_rate","defect_rate","lead_time"]}');

INSERT INTO equipment_engineers (emp_id, engineering_license, assigned_facility, machine_groups) VALUES
(4, 'ENG-LIC-5521', 'Birmingham Plant', ARRAY['CNC_GROUP_A','PRESS_GROUP_B']);

INSERT INTO auditors (emp_id, regulatory_authority, accreditation_id, audit_scope) VALUES
(5, 'EASA', 'EASA-AUD-0042', 'external_compliance');

-- SUPPLIERS
INSERT INTO suppliers (business_name, address, city, country, accreditation_status, contact_name, contact_email, contact_phone) VALUES
('AeroFrame Ltd',        '12 Industrial Park',    'Bristol',    'UK',      'AS9100',  'John Webb',    'jwebb@aeroframe.com',     '+44-117-000-0001'),
('CompositeWorks GmbH',  'Hauptstr. 55',          'Hamburg',    'Germany', 'ISO9001', 'Hans Müller',  'hmuller@cworks.de',       '+49-40-000-0002'),
('SkyParts Inc',         '800 Aviation Blvd',     'Dallas',     'USA',     'AS9100',  'Linda Park',   'lpark@skyparts.com',      '+1-214-000-0003'),
('TechAlloy SA',         'Av. des Aéronefs 22',   'Toulouse',   'France',  'ISO9001', 'Claire Dubois','cdubois@techalloy.fr',    '+33-5-0000-0004'),
('PacificAero Co',       '5 Harbour Road',        'Singapore',  'Singapore','AS9100', 'Kevin Tan',    'ktan@pacificaero.sg',     '+65-6000-0005');

-- PARTS
INSERT INTO parts (part_name, description, part_category) VALUES
('A320 Fuselage Panel',      'Forward fuselage structural panel for A320',      'fuselage'),
('Wing Spar Assembly',       'Primary load-bearing wing spar for A320 family',  'wing'),
('Engine Nacelle Frame',     'Composite nacelle structural frame',               'engine'),
('Landing Gear Bracket',     'Main landing gear attachment bracket',             'landing_gear'),
('Cabin Floor Beam',         'Longitudinal cabin floor support beam',            'interior');

-- PART SPECS
INSERT INTO part_specifications (part_id, tensile_strength, fatigue_limit, yield_point, heat_treatment, surface_finishing, machining_steps, geometry_ref) VALUES
(1, 560.00, 210.00, 420.00, 'Solution annealing at 530°C', 'Anodizing + primer coat', 'Milling → Drilling → Deburring', 'cad/a320_fuselage_panel.stp'),
(2, 720.00, 280.00, 560.00, 'Age hardening T6',            'Shot peening + sealant',  'Forging → CNC milling → Inspection', 'cad/wing_spar.stp'),
(3, 480.00, 190.00, 380.00, 'Autoclave cure 180°C',        'Gel coat + UV protect',   'Layup → Autoclave → Trim → NDT', 'cad/nacelle_frame.stp'),
(4, 820.00, 350.00, 650.00, 'Quench & temper',             'Zinc phosphate coating',  'Rough mill → Heat treat → Finish grind', 'cad/lgear_bracket.stp'),
(5, 410.00, 160.00, 320.00, 'None',                        'Powder coat',             'Extrusion → Punch → Weld → Inspect', 'cad/floor_beam.stp');

-- SUPPLIER PARTS
INSERT INTO supplier_parts (supplier_id, part_id, supplier_part_ref, unit_price, lead_time_days, customization_notes) VALUES
(1, 1, 'AF-A320-FP-001', 12500.00, 30, 'Anti-corrosion coating + serialized RFID tags'),
(2, 1, 'CW-A320-FP-001', 11800.00, 35, 'Reinforced composite layering + shock sensors in packaging'),
(3, 1, 'SP-A320-FP-001', 13200.00, 28, 'Optimised heat treatment, 3% lighter, digital twin data included'),
(1, 2, 'AF-WS-002',      45000.00, 60, 'Standard AS9100 supply'),
(4, 2, 'TA-WS-002',      43500.00, 55, 'Enhanced surface treatment for high-humidity environments'),
(3, 3, 'SP-EN-003',      28000.00, 45, 'Carbon-fibre reinforced variant'),
(5, 4, 'PA-LG-004',      9800.00,  25, 'Additional NDT pre-inspection at source'),
(2, 5, 'CW-CB-005',      3200.00,  20, 'Lightweight aluminium alloy variant');

-- PURCHASE ORDERS
INSERT INTO purchase_orders (supplier_id, supplier_part_id, created_by_emp_id, order_date, desired_delivery, actual_delivery, quantity, total_value, status) VALUES
(1, 1, 1, '2024-11-01', '2024-12-01', '2024-11-29', 10, 125000.00, 'completed'),
(2, 2, 1, '2024-11-10', '2024-12-15', NULL,          5,  59000.00,  'dispatched'),
(3, 3, 6, '2024-11-15', '2024-12-20', NULL,          8,  105600.00, 'confirmed'),
(1, 4, 1, '2024-11-20', '2025-01-10', NULL,          3,  135000.00, 'placed'),
(4, 5, 6, '2024-12-01', '2025-01-05', NULL,          6,  261000.00, 'dispatched'),
(5, 7, 1, '2024-12-05', '2024-12-30', '2024-12-28', 20, 196000.00, 'completed'),
(2, 8, 6, '2024-12-10', '2025-01-15', NULL,          15, 48000.00,  'confirmed'),
(3, 6, 1, '2024-12-12', '2025-01-20', NULL,          4,  112000.00, 'dispatched');

-- SHIPMENTS
INSERT INTO shipments (order_id, tracking_number, carrier, port_of_entry, origin_country, estimated_arrival, actual_arrival, status) VALUES
(1, 'TRK-2024-001', 'DHL Freight',   'Felixstowe',  'UK',      '2024-11-29', '2024-11-29', 'delivered'),
(2, 'TRK-2024-002', 'Maersk',        'Hamburg',     'Germany', '2024-12-14', NULL,          'in_transit'),
(3, 'TRK-2024-003', 'FedEx Freight', 'Los Angeles', 'USA',     '2024-12-19', NULL,          'in_transit'),
(5, 'TRK-2024-004', 'Air France K',  'Paris CDG',   'France',  '2025-01-04', NULL,          'in_transit'),
(6, 'TRK-2024-005', 'Singapore Air', 'Heathrow',    'Singapore','2024-12-28', '2024-12-28', 'delivered'),
(8, 'TRK-2024-006', 'DHL Freight',   'Felixstowe',  'USA',     '2025-01-19', NULL,          'pending');

-- SHIPMENT UPDATES
INSERT INTO shipment_updates (shipment_id, timestamp, location, latitude, longitude, condition_note, temperature_c, recorded_by) VALUES
(2, '2024-12-10 08:00:00', 'Hamburg Port',        53.5511, 9.9937,  'Container sealed, condition good', 18.5, 3),
(2, '2024-12-11 14:00:00', 'North Sea',           56.0000, 3.0000,  'Temperature within range',         16.2, 3),
(2, '2024-12-12 20:00:00', 'English Channel',     51.0000, 1.5000,  'Slight vibration noted in log',    15.8, 3),
(3, '2024-12-16 10:00:00', 'Dallas Warehouse',    32.7767,-96.7970, 'Departed origin warehouse',        21.0, 3),
(3, '2024-12-17 18:00:00', 'Pacific Ocean',       35.0000,-140.0000,'In transit, all normal',           19.5, 3),
(4, '2024-12-28 09:00:00', 'Toulouse Factory',    43.6047, 1.4442,  'Dispatched from factory',          22.1, 3),
(5, '2024-12-26 11:00:00', 'Singapore Changi',    1.3521,  103.8198,'Loaded onto aircraft',             24.0, 3),
(5, '2024-12-27 23:00:00', 'Dubai Stopover',      25.2048, 55.2708, 'Transit stop, good condition',     26.3, 3);

-- QC REPORTS
INSERT INTO qc_reports (order_id, supplier_part_id, inspector_emp_id, report_type, inspection_date, overall_result, notes, version, is_finalized, mongo_doc_id) VALUES
(1, 1, 2, 'dimensional', '2024-11-30', 'pass',    'All dimensions within ±0.02mm tolerance.',         1, TRUE,  'mongo_qc_001'),
(1, 1, 2, 'NDT',         '2024-11-30', 'pass',    'No subsurface defects detected via ultrasonic.',   1, TRUE,  'mongo_qc_002'),
(6, 7, 7, 'visual',      '2024-12-29', 'pass',    'Surface finish acceptable, no visible cracks.',    1, TRUE,  'mongo_qc_003'),
(6, 7, 7, 'dimensional', '2024-12-29', 'fail',    'Two brackets outside tolerance by 0.05mm.',        1, FALSE, 'mongo_qc_004'),
(2, 2, 2, 'environmental','2024-12-13', 'pending', 'Awaiting full thermal cycle test results.',        1, FALSE, 'mongo_qc_005');

-- CERTIFICATIONS
INSERT INTO certifications (supplier_part_id, order_id, inspector_emp_id, cert_number, issue_date, expiry_date, batch_origin, status, is_immutable, mongo_doc_id) VALUES
(1, 1, 2, 'CERT-2024-A320-001', '2024-11-30', '2026-11-30', 'Batch ALU-2024-078, Mill: Sheffield Steel', 'approved', TRUE,  'mongo_cert_001'),
(7, 6, 7, 'CERT-2024-LG-001',  '2024-12-29', '2026-12-29', 'Batch TI-2024-102, Forge: Singapore TechAlloy', 'draft', FALSE, 'mongo_cert_002');

-- EQUIPMENT
INSERT INTO equipment (equipment_name, equipment_type, facility, assigned_engineer, serial_number, install_date, status, last_maintenance, next_maintenance) VALUES
('CNC Mill Alpha-1',    'CNC Milling Machine',  'Birmingham Plant', 4, 'CNC-BHM-001', '2020-03-15', 'operational', '2024-10-01', '2025-01-01'),
('CNC Mill Alpha-2',    'CNC Milling Machine',  'Birmingham Plant', 4, 'CNC-BHM-002', '2020-03-15', 'warning',     '2024-09-01', '2024-12-01'),
('Autoclave Beta-1',    'Autoclave',            'Bristol Facility', 4, 'ATC-BST-001', '2019-07-20', 'operational', '2024-11-01', '2025-02-01'),
('Press Unit Gamma-1',  'Hydraulic Press',      'Birmingham Plant', 4, 'PRS-BHM-001', '2021-01-10', 'critical',    '2024-08-01', '2024-11-01'),
('Transit Container T1','Smart Container',      'Logistics Hub',    4, 'CNT-LOG-001', '2022-05-05', 'operational', '2024-12-01', '2025-03-01');

-- IoT READINGS (recent sample data)
INSERT INTO iot_readings (equipment_id, timestamp, temperature_c, vibration_hz, pressure_bar, latitude, longitude, cycle_count, alert_triggered, raw_payload) VALUES
(1, NOW() - INTERVAL '5 minutes',  72.3, 0.12, 6.2, 52.4862, -1.8904, 14520, FALSE, '{"sensor":"CNC-BHM-001","mode":"cutting"}'),
(1, NOW() - INTERVAL '4 minutes',  73.1, 0.13, 6.3, 52.4862, -1.8904, 14521, FALSE, '{"sensor":"CNC-BHM-001","mode":"cutting"}'),
(1, NOW() - INTERVAL '3 minutes',  74.5, 0.15, 6.4, 52.4862, -1.8904, 14522, FALSE, '{"sensor":"CNC-BHM-001","mode":"cutting"}'),
(2, NOW() - INTERVAL '5 minutes',  88.1, 0.45, 6.8, 52.4862, -1.8904, 8820,  TRUE,  '{"sensor":"CNC-BHM-002","mode":"cutting","alert":"vibration_high"}'),
(2, NOW() - INTERVAL '4 minutes',  89.3, 0.52, 6.9, 52.4862, -1.8904, 8821,  TRUE,  '{"sensor":"CNC-BHM-002","mode":"cutting","alert":"vibration_high"}'),
(3, NOW() - INTERVAL '5 minutes',  182.5, 0.08, 12.1, 51.4545, -2.5879, 3201, FALSE, '{"sensor":"ATC-BST-001","mode":"cure_cycle"}'),
(4, NOW() - INTERVAL '5 minutes',  95.2, 1.21, 180.5, 52.4862, -1.8904, 6620, TRUE,  '{"sensor":"PRS-BHM-001","mode":"pressing","alert":"pressure_critical"}'),
(4, NOW() - INTERVAL '4 minutes',  96.8, 1.35, 185.2, 52.4862, -1.8904, 6621, TRUE,  '{"sensor":"PRS-BHM-001","mode":"pressing","alert":"pressure_critical"}'),
(5, NOW() - INTERVAL '5 minutes',  18.2, 0.05, 1.0, 51.5074, -0.1278, NULL,  FALSE, '{"sensor":"CNT-LOG-001","gps":"heathrow_area"}'),
(5, NOW() - INTERVAL '3 minutes',  18.5, 0.06, 1.0, 51.5090, -0.1290, NULL,  FALSE, '{"sensor":"CNT-LOG-001","gps":"heathrow_area"}');

-- AUDIT LOGS (sample entries)
INSERT INTO audit_logs (emp_id, action, table_name, record_id, description, ip_address) VALUES
(1, 'create', 'purchase_orders', 1, 'Created PO #1 for AeroFrame Ltd',           '10.0.0.1'),
(2, 'create', 'qc_reports',      1, 'Created dimensional QC report for Order #1', '10.0.0.2'),
(2, 'approve','certifications',  1, 'Approved certification CERT-2024-A320-001',  '10.0.0.2'),
(3, 'view',   'v_shipment_overview', NULL, 'Viewed shipment overview dashboard',  '10.0.0.3'),
(5, 'view',   'certifications',  1, 'Auditor viewed certification record',         '10.0.0.5'),
(4, 'view',   'iot_readings',    NULL,'Engineer viewed IoT dashboard',             '10.0.0.4');
