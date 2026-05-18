// ============================================================
// AeroNetB – MongoDB Document Schemas & Seed Data
// Run with: mongosh aeronetb mongo_seed.js
// ============================================================

db = db.getSiblingDB('aeronetb');

// ============================================================
// COLLECTION 1: qc_reports (detailed inspection data)
// ============================================================
db.qc_reports.drop();
db.qc_reports.insertMany([
  {
    _id: "mongo_qc_001",
    report_type: "dimensional",
    pg_report_id: 1,
    pg_order_id: 1,
    supplier: { id: 1, name: "AeroFrame Ltd" },
    part: { id: 1, name: "A320 Fuselage Panel", ref: "AF-A320-FP-001" },
    inspector: { emp_id: 2, name: "Bob Harrington", cert_id: "CERT-NDT-2201" },
    inspection_date: "2024-11-30",
    overall_result: "pass",
    is_finalized: true,
    version: 1,
    version_history: [],
    measurements: [
      { feature: "Panel Length",  nominal_mm: 2400.00, actual_mm: 2400.01, tolerance_mm: 0.02, result: "pass" },
      { feature: "Panel Width",   nominal_mm: 600.00,  actual_mm: 600.00,  tolerance_mm: 0.02, result: "pass" },
      { feature: "Thickness",     nominal_mm: 4.50,    actual_mm: 4.51,    tolerance_mm: 0.02, result: "pass" },
      { feature: "Hole Diameter", nominal_mm: 12.00,   actual_mm: 12.01,   tolerance_mm: 0.02, result: "pass" }
    ],
    notes: "All dimensions within specification. RFID tag verified.",
    attachments: ["drawings/a320_panel_dim_check.pdf"]
  },
  {
    _id: "mongo_qc_002",
    report_type: "NDT",
    pg_report_id: 2,
    pg_order_id: 1,
    supplier: { id: 1, name: "AeroFrame Ltd" },
    part: { id: 1, name: "A320 Fuselage Panel", ref: "AF-A320-FP-001" },
    inspector: { emp_id: 2, name: "Bob Harrington", cert_id: "CERT-NDT-2201" },
    inspection_date: "2024-11-30",
    overall_result: "pass",
    is_finalized: true,
    version: 1,
    version_history: [],
    ndt_details: {
      method: "Ultrasonic Testing (UT)",
      equipment: "Olympus OmniScan MX2",
      frequency_mhz: 5,
      scan_coverage_pct: 100,
      defects_found: [],
      calibration_ref: "CAL-UT-2024-112"
    },
    notes: "No subsurface defects detected. Material continuity confirmed.",
    attachments: ["ndt/a320_panel_ut_scan.pdf", "ndt/a320_panel_ut_images.zip"]
  },
  {
    _id: "mongo_qc_003",
    report_type: "visual",
    pg_report_id: 3,
    pg_order_id: 6,
    supplier: { id: 5, name: "PacificAero Co" },
    part: { id: 4, name: "Landing Gear Bracket", ref: "PA-LG-004" },
    inspector: { emp_id: 7, name: "Grace Liu", cert_id: "CERT-ENV-3305" },
    inspection_date: "2024-12-29",
    overall_result: "pass",
    is_finalized: true,
    version: 1,
    version_history: [],
    visual_checks: [
      { check: "Surface finish",  result: "pass", note: "No scratches or tool marks" },
      { check: "Coating integrity", result: "pass", note: "Zinc phosphate uniform" },
      { check: "Edge condition",  result: "pass", note: "No burrs detected" },
      { check: "Marking/labelling", result: "pass", note: "Part number and batch visible" }
    ],
    notes: "Visual inspection passed for 18 of 20 brackets. 2 flagged for dimensional.",
    attachments: ["visual/lg_bracket_photos.zip"]
  },
  {
    _id: "mongo_qc_004",
    report_type: "dimensional",
    pg_report_id: 4,
    pg_order_id: 6,
    supplier: { id: 5, name: "PacificAero Co" },
    part: { id: 4, name: "Landing Gear Bracket", ref: "PA-LG-004" },
    inspector: { emp_id: 7, name: "Grace Liu", cert_id: "CERT-ENV-3305" },
    inspection_date: "2024-12-29",
    overall_result: "fail",
    is_finalized: false,
    version: 1,
    version_history: [],
    measurements: [
      { feature: "Mount Hole Diameter", nominal_mm: 25.00, actual_mm: 25.05, tolerance_mm: 0.02, result: "fail" },
      { feature: "Bracket Height",      nominal_mm: 150.00, actual_mm: 150.01, tolerance_mm: 0.05, result: "pass" },
      { feature: "Flange Width",        nominal_mm: 80.00, actual_mm: 80.06, tolerance_mm: 0.03, result: "fail" }
    ],
    failure_details: {
      failed_features: ["Mount Hole Diameter", "Flange Width"],
      root_cause_hypothesis: "Possible tooling wear at source",
      corrective_action_required: true,
      supplier_notified: true,
      notification_date: "2024-12-30"
    },
    notes: "2 of 20 brackets failed dimensional check. Supplier notified for corrective action.",
    attachments: ["dimensional/lg_bracket_fail_report.pdf"]
  },
  {
    _id: "mongo_qc_005",
    report_type: "environmental",
    pg_report_id: 5,
    pg_order_id: 2,
    supplier: { id: 2, name: "CompositeWorks GmbH" },
    part: { id: 1, name: "A320 Fuselage Panel", ref: "CW-A320-FP-001" },
    inspector: { emp_id: 2, name: "Bob Harrington", cert_id: "CERT-NDT-2201" },
    inspection_date: "2024-12-13",
    overall_result: "pending",
    is_finalized: false,
    version: 1,
    version_history: [],
    environmental_tests: [
      { test: "Thermal Cycling",  temp_min_c: -55, temp_max_c: 85, cycles: 100, status: "in_progress", result: null },
      { test: "Humidity Exposure", humidity_pct: 95, duration_h: 500, status: "pending", result: null },
      { test: "Salt Spray",        duration_h: 1000, standard: "ASTM B117", status: "pending", result: null }
    ],
    notes: "Thermal cycling test in progress. Humidity and salt spray pending.",
    attachments: []
  }
]);

// ============================================================
// COLLECTION 2: certifications (full cert documents)
// ============================================================
db.certifications.drop();
db.certifications.insertMany([
  {
    _id: "mongo_cert_001",
    pg_cert_id: 1,
    cert_number: "CERT-2024-A320-001",
    part: {
      id: 1,
      name: "A320 Fuselage Panel",
      supplier_ref: "AF-A320-FP-001",
      supplier: { id: 1, name: "AeroFrame Ltd" }
    },
    order_id: 1,
    issue_date: "2024-11-30",
    expiry_date: "2026-11-30",
    status: "approved",
    is_immutable: true,
    inspector: {
      emp_id: 2,
      name: "Bob Harrington",
      cert_id: "CERT-NDT-2201",
      digital_signature: "sig_bob_b64==",
      signed_at: "2024-11-30T14:32:00Z"
    },
    material_traceability: {
      batch_id: "ALU-2024-078",
      raw_material: "Aluminium Alloy 2024-T3",
      mill_origin: "Sheffield Steel Works, UK",
      mill_cert_ref: "MILL-CERT-SS-2024-078",
      heat_number: "HT-20241101-A"
    },
    test_results: [
      { test: "Chemical Composition", result: "pass", standard: "AMS 2770" },
      { test: "Tensile Strength",     result: "pass", actual_mpa: 475, min_mpa: 420 },
      { test: "Dimensional",          result: "pass" },
      { test: "NDT Ultrasonic",       result: "pass" }
    ],
    regulatory_standards: ["AS9100D", "EASA Part 21", "FAA AC 21-43"],
    attachments: ["certs/CERT-2024-A320-001.pdf", "certs/mill_cert_ALU-2024-078.pdf"],
    audit_trail: [
      { action: "created",  by_emp_id: 2, timestamp: "2024-11-30T13:00:00Z" },
      { action: "approved", by_emp_id: 2, timestamp: "2024-11-30T14:32:00Z" }
    ]
  },
  {
    _id: "mongo_cert_002",
    pg_cert_id: 2,
    cert_number: "CERT-2024-LG-001",
    part: {
      id: 4,
      name: "Landing Gear Bracket",
      supplier_ref: "PA-LG-004",
      supplier: { id: 5, name: "PacificAero Co" }
    },
    order_id: 6,
    issue_date: null,
    expiry_date: null,
    status: "draft",
    is_immutable: false,
    inspector: {
      emp_id: 7,
      name: "Grace Liu",
      cert_id: "CERT-ENV-3305",
      digital_signature: null,
      signed_at: null
    },
    material_traceability: {
      batch_id: "TI-2024-102",
      raw_material: "Titanium Alloy Ti-6Al-4V",
      mill_origin: "Singapore TechAlloy",
      mill_cert_ref: "MILL-CERT-STA-2024-102",
      heat_number: "HT-20241201-B"
    },
    test_results: [
      { test: "Chemical Composition", result: "pass", standard: "AMS 4928" },
      { test: "Tensile Strength",     result: "pending", actual_mpa: null, min_mpa: 828 },
      { test: "Dimensional",          result: "fail" },
      { test: "NDT Ultrasonic",       result: "pending" }
    ],
    regulatory_standards: ["AS9100D", "EASA Part 21"],
    attachments: [],
    audit_trail: [
      { action: "created", by_emp_id: 7, timestamp: "2024-12-29T10:00:00Z" }
    ]
  }
]);

// ============================================================
// COLLECTION 3: part_documents (unstructured/semi-structured)
// ============================================================
db.part_documents.drop();
db.part_documents.insertMany([
  {
    part_id: 1,
    part_name: "A320 Fuselage Panel",
    document_type: "engineering_drawing",
    file_name: "A320_FP_DWG_Rev3.pdf",
    file_path: "documents/parts/A320_FP_DWG_Rev3.pdf",
    revision: "Rev3",
    uploaded_by_emp_id: 4,
    uploaded_at: "2024-10-01T09:00:00Z",
    tags: ["fuselage", "structural", "A320"],
    description: "Main engineering drawing including GD&T callouts."
  },
  {
    part_id: 1,
    part_name: "A320 Fuselage Panel",
    document_type: "cad_model",
    file_name: "A320_FP_Model.stp",
    file_path: "cad/A320_FP_Model.stp",
    revision: "Rev3",
    uploaded_by_emp_id: 4,
    uploaded_at: "2024-10-01T09:10:00Z",
    tags: ["CAD", "STEP", "3D"],
    description: "3D STEP model for manufacturing reference."
  },
  {
    part_id: 3,
    part_name: "Engine Nacelle Frame",
    document_type: "prototype_image",
    file_name: "nacelle_prototype_001.jpg",
    file_path: "images/nacelle_prototype_001.jpg",
    revision: null,
    uploaded_by_emp_id: 4,
    uploaded_at: "2024-09-15T14:30:00Z",
    tags: ["nacelle", "prototype", "composite"],
    description: "Prototype image after autoclave cure cycle."
  }
]);

// ============================================================
// COLLECTION 4: iot_snapshots (IoT time-series archive)
// ============================================================
db.iot_snapshots.drop();

// Generate 20 sample IoT snapshots per equipment
const equipmentList = [
  { id: 1, serial: "CNC-BHM-001", type: "CNC Mill" },
  { id: 2, serial: "CNC-BHM-002", type: "CNC Mill" },
  { id: 4, serial: "PRS-BHM-001", type: "Hydraulic Press" }
];

let iotDocs = [];
equipmentList.forEach(eq => {
  for (let i = 20; i >= 1; i--) {
    let baseTemp  = eq.id === 4 ? 90 + Math.random() * 10 : 70 + Math.random() * 10;
    let baseVib   = eq.id === 2 ? 0.40 + Math.random() * 0.15 : 0.08 + Math.random() * 0.08;
    let basePress = eq.id === 4 ? 175 + Math.random() * 15 : 6 + Math.random() * 1;
    iotDocs.push({
      equipment_id: eq.id,
      serial_number: eq.serial,
      equipment_type: eq.type,
      timestamp: new Date(Date.now() - i * 60000),
      readings: {
        temperature_c: parseFloat(baseTemp.toFixed(2)),
        vibration_hz:  parseFloat(baseVib.toFixed(3)),
        pressure_bar:  parseFloat(basePress.toFixed(2))
      },
      alert_triggered: baseVib > 0.40 || basePress > 180,
      alert_type: baseVib > 0.40 ? "vibration_high" : (basePress > 180 ? "pressure_critical" : null)
    });
  }
});
db.iot_snapshots.insertMany(iotDocs);

// ============================================================
// INDEXES
// ============================================================
db.qc_reports.createIndex({ pg_order_id: 1 });
db.qc_reports.createIndex({ "supplier.id": 1 });
db.qc_reports.createIndex({ overall_result: 1 });
db.certifications.createIndex({ cert_number: 1 }, { unique: true });
db.certifications.createIndex({ "part.id": 1 });
db.iot_snapshots.createIndex({ equipment_id: 1, timestamp: -1 });
db.part_documents.createIndex({ part_id: 1 });

print("✅ MongoDB seed complete: qc_reports, certifications, part_documents, iot_snapshots");
