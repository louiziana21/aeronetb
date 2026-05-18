const { MongoClient } = require('mongodb');

async function seed() {
  const client = new MongoClient('mongodb+srv://louizianapag_db_user:8jPQ0z0BCj76RxS5@cluster0.et1xgcm.mongodb.net/aeronetb?retryWrites=true&w=majority&appName=Cluster0');
  await client.connect();
  console.log('MongoDB Connected!');
  const db = client.db('aeronetb');
  const code = require('fs').readFileSync('./mongo/mongo_seed.js', 'utf8');
  eval(code.replace(/db\s*=/g, 'var db ='));
  console.log('Seeding done!');
  await client.close();
}

seed().catch(e => console.log('Error:', e.message));