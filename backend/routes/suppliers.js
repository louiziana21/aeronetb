// routes/suppliers.js  –  Suppliers, Parts, Supplier-Parts
const express = require('express');
const { pgPool } = require('../config/db');
const { authenticateToken, requireRole, auditLog } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/suppliers  (all roles can view)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, country, accreditation } = req.query;
    let query = `SELECT * FROM suppliers WHERE 1=1`;
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` AND business_name ILIKE $${params.length}`; }
    if (country) { params.push(country); query += ` AND country = $${params.length}`; }
    if (accreditation) { params.push(accreditation); query += ` AND accreditation_status = $${params.length}`; }
    query += ` ORDER BY business_name`;

    const result = await pgPool.query(query, params);
    await auditLog(req.user.empId, 'view', 'suppliers', null, 'Listed suppliers', req.ip);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/suppliers/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM suppliers WHERE supplier_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    await auditLog(req.user.empId, 'view', 'suppliers', req.params.id, 'Viewed supplier', req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/suppliers  (procurement_officer only)
router.post('/', authenticateToken, requireRole('procurement_officer'), async (req, res) => {
  const { business_name, address, city, country, accreditation_status, contact_name, contact_email, contact_phone } = req.body;
  try {
    const result = await pgPool.query(
      `INSERT INTO suppliers (business_name, address, city, country, accreditation_status, contact_name, contact_email, contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [business_name, address, city, country, accreditation_status, contact_name, contact_email, contact_phone]
    );
    await auditLog(req.user.empId, 'create', 'suppliers', result.rows[0].supplier_id, `Created supplier: ${business_name}`, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/suppliers/kpi/all  (supplier performance)
router.get('/kpi/all', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM v_supplier_kpi ORDER BY on_time_rate_pct DESC NULLS LAST');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/parts
router.get('/parts/all', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT p.*, ps.tensile_strength, ps.fatigue_limit, ps.yield_point, ps.heat_treatment
       FROM parts p
       LEFT JOIN part_specifications ps ON p.part_id = ps.part_id
       ORDER BY p.part_name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/suppliers/:id/parts  (parts from a specific supplier)
router.get('/:id/parts', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT sp.*, p.part_name, p.description, p.part_category
       FROM supplier_parts sp
       JOIN parts p ON sp.part_id = p.part_id
       WHERE sp.supplier_id = $1 AND sp.is_active = true`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
