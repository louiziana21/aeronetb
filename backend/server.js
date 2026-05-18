require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/qc',        require('./routes/qc'));
app.use('/api/iot',       require('./routes/iot'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AeroNetB API running on port ${PORT}`);
});