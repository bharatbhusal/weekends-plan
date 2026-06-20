import { MongoClient, MongoClientOptions, Db } from 'mongodb';

const options: MongoClientOptions = {
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 5000,
  serverSelectionTimeoutMS: 5000,
};

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables.');
  }

  client = new MongoClient(uri, options);
  await client.connect();
  db = client.db('events_db');
  return db;
}

export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
