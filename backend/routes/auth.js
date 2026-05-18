// routes/auth.js  –  Login & Profile
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { pgPool } = require('../config/db');
const { authenticateToken, auditLog } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pgPool.query(
      `SELECT e.emp_id, e.full_name, e.email, e.password_hash, e.access_level, e.is_active,
              r.role_name
       FROM employees e
       JOIN roles r ON e.role_id = r.role_id
       WHERE e.email = $1`,
      [email]
    );

    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const emp = result.rows[0];
    if (!emp.is_active) return res.status(403).json({ error: 'Account disabled' });

    const valid = await bcrypt.compare(password, emp.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { empId: emp.emp_id, name: emp.full_name, email: emp.email, role: emp.role_name, access: emp.access_level },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await auditLog(emp.emp_id, 'login', 'employees', emp.emp_id, 'User logged in', req.ip);

    res.json({
      token,
      user: { empId: emp.emp_id, name: emp.full_name, email: emp.email, role: emp.role_name, access: emp.access_level }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT e.emp_id, e.full_name, e.email, e.job_title, e.department, e.access_level, r.role_name
       FROM employees e JOIN roles r ON e.role_id = r.role_id
       WHERE e.emp_id = $1`,
      [req.user.empId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
