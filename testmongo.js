const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://louizianapag_db_user:8jPQ0z0BCj76RxS5@cluster0.et1xgcm.mongodb.net/aeronetb?retryWrites=true&w=majority&appName=Cluster0';

async function test() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  try {
    await client.connect();
    console.log('Connected to MongoDB!');
    await client.close();
  } catch (e) {
    console.log('Error:', e.message);
  }
}

test();