// routes/iot.js  –  Equipment & IoT Monitoring
const express = require('express');
const { pgPool } = require('../config/db');
const { authenticateToken, requireRole, auditLog } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/iot/equipment  (all authenticated users can view)
router.get('/equipment', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM v_equipment_status ORDER BY facility, equipment_name');
    await auditLog(req.user.empId, 'view', 'equipment', null, 'Viewed equipment status', req.ip);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/iot/equipment/:id
router.get('/equipment/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT * FROM v_equipment_status WHERE equipment_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Equipment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/iot/readings/:equipment_id  (time-series readings)
router.get('/readings/:equipment_id', authenticateToken, async (req, res) => {
  try {
    const { limit = 60, from } = req.query;
    let query = `
      SELECT reading_id, equipment_id, timestamp, temperature_c, vibration_hz, pressure_bar,
             latitude, longitude, cycle_count, alert_triggered
      FROM iot_readings WHERE equipment_id = $1`;
    const params = [req.params.equipment_id];
    if (from) { params.push(from); query += ` AND timestamp >= $${params.length}`; }
    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pgPool.query(query, params);
    res.json(result.rows.reverse()); // return chronological order
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/iot/readings  (equipment_engineer or IoT device ingestion)
router.post('/readings', authenticateToken, requireRole('equipment_engineer'), async (req, res) => {
  const { equipment_id, temperature_c, vibration_hz, pressure_bar, latitude, longitude, cycle_count, raw_payload } = req.body;

  // Determine if alert should be triggered based on thresholds
  const alertTriggered =
    (temperature_c && temperature_c > 90) ||
    (vibration_hz && vibration_hz > 0.35) ||
    (pressure_bar && pressure_bar > 170);

  try {
    const result = await pgPool.query(
      `INSERT INTO iot_readings
         (equipment_id, temperature_c, vibration_hz, pressure_bar, latitude, longitude, cycle_count, alert_triggered, raw_payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [equipment_id, temperature_c, vibration_hz, pressure_bar, latitude, longitude, cycle_count, alertTriggered, JSON.stringify(raw_payload || {})]
    );

    // Update equipment status if alert
    if (alertTriggered) {
      await pgPool.query(
        `UPDATE equipment SET status='warning' WHERE equipment_id=$1 AND status='operational'`,
        [equipment_id]
      );
    }

    res.status(201).json({ ...result.rows[0], alert_triggered: alertTriggered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/iot/alerts  (equipment_engineer only)
router.get('/alerts', authenticateToken, requireRole('equipment_engineer', 'supply_chain_manager'), async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT ir.*, e.equipment_name, e.facility, e.status AS equipment_status
       FROM iot_readings ir
       JOIN equipment e ON ir.equipment_id = e.equipment_id
       WHERE ir.alert_triggered = TRUE
       ORDER BY ir.timestamp DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/iot/dashboard  (summary for dashboard)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const [equip, recentAlerts, statsResult] = await Promise.all([
      pgPool.query('SELECT * FROM v_equipment_status ORDER BY facility'),
      pgPool.query(`
        SELECT ir.equipment_id, e.equipment_name, ir.timestamp, ir.temperature_c,
               ir.vibration_hz, ir.pressure_bar, ir.alert_triggered
        FROM iot_readings ir JOIN equipment e ON ir.equipment_id = e.equipment_id
        WHERE ir.alert_triggered = TRUE ORDER BY ir.timestamp DESC LIMIT 10
      `),
      pgPool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='operational') AS operational,
          COUNT(*) FILTER (WHERE status='warning')     AS warning,
          COUNT(*) FILTER (WHERE status='critical')    AS critical,
          COUNT(*) FILTER (WHERE status='offline')     AS offline
        FROM equipment
      `)
    ]);

    res.json({
      equipment: equip.rows,
      recent_alerts: recentAlerts.rows,
      summary: statsResult.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
