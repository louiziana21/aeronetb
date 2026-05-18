// routes/dashboard.js  –  Dashboard summary stats & audit logs
const express = require('express');
const { pgPool } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/dashboard/summary  (global KPI snapshot)
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const [orders, shipments, qc, equipment, suppliers] = await Promise.all([
      pgPool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status='placed')      AS placed,
          COUNT(*) FILTER (WHERE status='confirmed')   AS confirmed,
          COUNT(*) FILTER (WHERE status='dispatched')  AS dispatched,
          COUNT(*) FILTER (WHERE status='completed')   AS completed,
          COUNT(*) FILTER (WHERE desired_delivery < CURRENT_DATE AND actual_delivery IS NULL AND status NOT IN ('completed','cancelled')) AS overdue
        FROM purchase_orders
      `),
      pgPool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status='in_transit')  AS in_transit,
          COUNT(*) FILTER (WHERE estimated_arrival < CURRENT_DATE AND actual_arrival IS NULL) AS delayed
        FROM shipments
      `),
      pgPool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE overall_result='pass')    AS passed,
          COUNT(*) FILTER (WHERE overall_result='fail')    AS failed,
          COUNT(*) FILTER (WHERE overall_result='pending') AS pending
        FROM qc_reports
      `),
      pgPool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status='warning')  AS warning,
          COUNT(*) FILTER (WHERE status='critical') AS critical
        FROM equipment
      `),
      pgPool.query(`SELECT COUNT(*) AS total FROM suppliers WHERE is_active=TRUE`)
    ]);

    res.json({
      orders:    orders.rows[0],
      shipments: shipments.rows[0],
      qc:        qc.rows[0],
      equipment: equipment.rows[0],
      suppliers: suppliers.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/dashboard/supplier-kpi
router.get('/supplier-kpi', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM v_supplier_kpi ORDER BY on_time_rate_pct DESC NULLS LAST');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/dashboard/shipments-map
router.get('/shipments-map', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT s.shipment_id, s.tracking_number, s.status,
             su.latitude, su.longitude, su.location AS last_location, su.timestamp AS last_update,
             s.estimated_arrival, s.port_of_entry,
             po.order_id, sup.business_name AS supplier_name, p.part_name
      FROM shipments s
      JOIN purchase_orders po ON s.order_id = po.order_id
      JOIN supplier_parts sp ON po.supplier_part_id = sp.supplier_part_id
      JOIN suppliers sup ON po.supplier_id = sup.supplier_id
      JOIN parts p ON sp.part_id = p.part_id
      LEFT JOIN LATERAL (
        SELECT latitude, longitude, location, timestamp
        FROM shipment_updates WHERE shipment_id = s.shipment_id ORDER BY timestamp DESC LIMIT 1
      ) su ON TRUE
      WHERE s.status IN ('in_transit', 'pending')
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/dashboard/audit-logs  (auditor only)
router.get('/audit-logs', authenticateToken, requireRole('auditor'), async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT al.*, emp.full_name, emp.email, r.role_name
      FROM audit_logs al
      LEFT JOIN employees emp ON al.emp_id = emp.emp_id
      LEFT JOIN roles r ON emp.role_id = r.role_id
      ORDER BY al.timestamp DESC
      LIMIT 200
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
