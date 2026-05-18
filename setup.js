const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://aeronetb_user:VzpNK667yWGZfPayM9WlgoNnQ48Gtdh1@dpg-d85ja28g4nts7382jo70-a.frankfurt-postgres.render.com/aeronetb_wp1z',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected!');
  
  const schema = fs.readFileSync('./sql/01_schema.sql', 'utf8');
  await client.query(schema);
  console.log('Schema created!');
  
  const data = fs.readFileSync('./sql/02_dummy_data.sql', 'utf8');
  await client.query(data);
  console.log('Data inserted!');
  
  await client.end();
  console.log('Done!');
}

run().catch(e => console.log('Error:', e.message));