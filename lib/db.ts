import { MongoClient, Db } from 'mongodb';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://finovoraglobal_db_user:S0dFZFKNImRwyqTd@ac-sqijsuv-shard-00-00.twoiy33.mongodb.net:27017,ac-sqijsuv-shard-00-01.twoiy33.mongodb.net:27017,ac-sqijsuv-shard-00-02.twoiy33.mongodb.net:27017/?ssl=true&replicaSet=atlas-2qivaj-shard-0&authSource=admin&compressors=zlib';

declare global {
  var _superMongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (!global._superMongoClientPromise) {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  });
  global._superMongoClientPromise = client.connect();
}
clientPromise = global._superMongoClientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db('tropical_gyros');
}
