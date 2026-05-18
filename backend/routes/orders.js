// routes/orders.js  –  Purchase Orders & Shipments
const express = require('express');
const { pgPool } = require('../config/db');
const { authenticateToken, requireRole, auditLog } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, supplier_id, from_date, to_date } = req.query;
    let query = `
      SELECT po.*, s.business_name AS supplier_name, p.part_name,
             sp.supplier_part_ref, emp.full_name AS created_by_name
      FROM purchase_orders po
      JOIN supplier_parts sp ON po.supplier_part_id = sp.supplier_part_id
      JOIN suppliers s ON po.supplier_id = s.supplier_id
      JOIN parts p ON sp.part_id = p.part_id
      LEFT JOIN employees emp ON po.created_by_emp_id = emp.emp_id
      WHERE 1=1`;
    const params = [];
    if (status)      { params.push(status);       query += ` AND po.status = $${params.length}`; }
    if (supplier_id) { params.push(supplier_id);  query += ` AND po.supplier_id = $${params.length}`; }
    if (from_date)   { params.push(from_date);    query += ` AND po.order_date >= $${params.length}`; }
    if (to_date)     { params.push(to_date);      query += ` AND po.order_date <= $${params.length}`; }
    query += ` ORDER BY po.created_at DESC`;

    const result = await pgPool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/orders/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT po.*, s.business_name AS supplier_name, p.part_name, p.description,
              sp.supplier_part_ref, sp.unit_price, sp.customization_notes
       FROM purchase_orders po
       JOIN supplier_parts sp ON po.supplier_part_id = sp.supplier_part_id
       JOIN suppliers s ON po.supplier_id = s.supplier_id
       JOIN parts p ON sp.part_id = p.part_id
       WHERE po.order_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    await auditLog(req.user.empId, 'view', 'purchase_orders', req.params.id, 'Viewed order', req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/orders  (procurement_officer only)
router.post('/', authenticateToken, requireRole('procurement_officer'), async (req, res) => {
  const { supplier_id, supplier_part_id, order_date, desired_delivery, quantity, total_value, notes } = req.body;
  try {
    const result = await pgPool.query(
      `INSERT INTO purchase_orders
         (supplier_id, supplier_part_id, created_by_emp_id, order_date, desired_delivery, quantity, total_value, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [supplier_id, supplier_part_id, req.user.empId, order_date, desired_delivery, quantity, total_value, notes]
    );
    await auditLog(req.user.empId, 'create', 'purchase_orders', result.rows[0].order_id, `Created order for supplier ${supplier_id}`, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/orders/:id/status  (procurement or supply_chain_manager)
router.patch('/:id/status', authenticateToken, requireRole('procurement_officer', 'supply_chain_manager'), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['placed','confirmed','dispatched','delivered','completed','cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const result = await pgPool.query(
      `UPDATE purchase_orders SET status=$1, updated_at=NOW() WHERE order_id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    await auditLog(req.user.empId, 'update', 'purchase_orders', req.params.id, `Updated status to ${status}`, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/orders/shipments/overview
router.get('/shipments/overview', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM v_shipment_overview ORDER BY days_to_arrival ASC NULLS LAST');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/orders/shipments/:id/updates
router.get('/shipments/:id/updates', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT su.*, emp.full_name AS recorded_by_name
       FROM shipment_updates su
       LEFT JOIN employees emp ON su.recorded_by = emp.emp_id
       WHERE su.shipment_id = $1
       ORDER BY su.timestamp ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
