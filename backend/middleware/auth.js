// middleware/auth.js  –  JWT authentication & RBAC
const jwt = require('jsonwebtoken');
const { pgPool } = require('../config/db');

// ── Verify JWT Token ─────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ── Role-Based Access Control ────────────────────────────────
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
    }
    next();
  };
}

// ── Audit Logger ─────────────────────────────────────────────
async function auditLog(empId, action, tableName, recordId, description, ipAddress) {
  try {
    await pgPool.query(
      `INSERT INTO audit_logs (emp_id, action, table_name, record_id, description, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [empId, action, tableName, recordId, description, ipAddress]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { authenticateToken, requireRole, auditLog };
