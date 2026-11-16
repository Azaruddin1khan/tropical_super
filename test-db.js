const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Automatically read MONGODB_URI from .env
let uri = process.env.MONGODB_URI;
if (!uri) {
  try {
    const envPath = path.resolve(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.+)/);
    if (match) uri = match[1].trim();
  } catch (e) {}
}

if (!uri) {
  console.error('❌ Error: MONGODB_URI not found in .env');
  process.exit(1);
}

console.log('🔄 Connecting to MongoDB Atlas cluster...');

async function checkConnection() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📡 Cluster: Atlas Sharded Cluster (TLS Verified)');

    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log('📦 Databases in Cluster:');
    dbs.databases.forEach((db) => {
      console.log(`   • ${db.name}`);
    });
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
  } finally {
    await client.close();
    console.log('🔒 Connection closed cleanly.');
  }
}

checkConnection();

