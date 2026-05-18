const express = require('express');
const { pgPool } = require('../config/db');
const { authenticateToken, requireRole, auditLog } = require('../middleware/auth');

const router = express.Router();

router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const { result, report_type, order_id } = req.query;
    let query = `
      SELECT qr.*, emp.full_name AS inspector_name,
             s.business_name AS supplier_name, p.part_name
      FROM qc_reports qr
      LEFT JOIN employees emp ON qr.inspector_emp_id = emp.emp_id
      LEFT JOIN purchase_orders po ON qr.order_id = po.order_id
      LEFT JOIN supplier_parts sp ON qr.supplier_part_id = sp.supplier_part_id
      LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
      LEFT JOIN parts p ON sp.part_id = p.part_id
      WHERE 1=1`;
    const params = [];
    if (result) { params.push(result); query += ` AND qr.overall_result = $${params.length}`; }
    if (report_type) { params.push(report_type); query += ` AND qr.report_type = $${params.length}`; }
    if (order_id) { params.push(order_id); query += ` AND qr.order_id = $${params.length}`; }
    query += ` ORDER BY qr.inspection_date DESC`;
    const pgResult = await pgPool.query(query, params);
    res.json(pgResult.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT qr.*, emp.full_name AS inspector_name
       FROM qc_reports qr
       LEFT JOIN employees emp ON qr.inspector_emp_id = emp.emp_id
       WHERE qr.report_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    await auditLog(req.user.empId, 'view', 'qc_reports', req.params.id, 'Viewed QC report', req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reports', authenticateToken, requireRole('quality_inspector'), async (req, res) => {
  const { order_id, supplier_part_id, report_type, inspection_date, overall_result, notes } = req.body;
  try {
    const result = await pgPool.query(
      `INSERT INTO qc_reports
         (order_id, supplier_part_id, inspector_emp_id, report_type, inspection_date, overall_result, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [order_id, supplier_part_id, req.user.empId, report_type, inspection_date, overall_result, notes]
    );
    await auditLog(req.user.empId, 'create', 'qc_reports', result.rows[0].report_id, 'Created QC report', req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reports/:id/finalize', authenticateToken, requireRole('quality_inspector'), async (req, res) => {
  try {
    const result = await pgPool.query(
      `UPDATE qc_reports SET is_finalized=TRUE, updated_at=NOW() WHERE report_id=$1 AND is_finalized=FALSE RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found or already finalized' });
    await auditLog(req.user.empId, 'approve', 'qc_reports', req.params.id, 'Finalized QC report', req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/certifications', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT c.*, emp.full_name AS inspector_name,
              p.part_name, s.business_name AS supplier_name
       FROM certifications c
       LEFT JOIN employees emp ON c.inspector_emp_id = emp.emp_id
       LEFT JOIN supplier_parts sp ON c.supplier_part_id = sp.supplier_part_id
       LEFT JOIN parts p ON sp.part_id = p.part_id
       LEFT JOIN suppliers s ON sp.supplier_id = s.supplier_id
       ORDER BY c.created_at DESC`
    );
    await auditLog(req.user.empId, 'view', 'certifications', null, 'Listed certifications', req.ip);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/certifications/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT c.*, emp.full_name AS inspector_name
       FROM certifications c
       LEFT JOIN employees emp ON c.inspector_emp_id = emp.emp_id
       WHERE c.cert_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Certification not found' });
    await auditLog(req.user.empId, 'view', 'certifications', req.params.id, 'Viewed certification', req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/certifications/:id/approve', authenticateToken, requireRole('quality_inspector'), async (req, res) => {
  try {
    const result = await pgPool.query(
      `UPDATE certifications SET status='approved', is_immutable=TRUE, issue_date=CURRENT_DATE
       WHERE cert_id=$1 AND is_immutable=FALSE RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cert not found or already approved' });
    await auditLog(req.user.empId, 'approve', 'certifications', req.params.id, 'Approved certification', req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [total, byResult, byType, monthly] = await Promise.all([
      pgPool.query(`SELECT COUNT(*) AS total FROM qc_reports`),
      pgPool.query(`SELECT overall_result, COUNT(*) AS count FROM qc_reports GROUP BY overall_result`),
      pgPool.query(`SELECT report_type, COUNT(*) AS count FROM qc_reports GROUP BY report_type`),
      pgPool.query(`
        SELECT TO_CHAR(inspection_date,'YYYY-MM') AS month,
               COUNT(*) AS total,
               SUM(CASE WHEN overall_result='pass' THEN 1 ELSE 0 END) AS passed,
               SUM(CASE WHEN overall_result='fail' THEN 1 ELSE 0 END) AS failed
        FROM qc_reports
        WHERE inspection_date >= NOW() - INTERVAL '12 months'
        GROUP BY month ORDER BY month
      `)
    ]);
    res.json({
      total: parseInt(total.rows[0].total),
      by_result: byResult.rows,
      by_type: byType.rows,
      monthly_trend: monthly.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;