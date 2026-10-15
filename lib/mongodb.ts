import mongoose from "mongoose";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache = (globalWithMongoose.mongooseCache ??= {
  connection: null,
  promise: null,
});

export async function connectToDatabase() {
  if (cache.connection) return cache.connection;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not configured.");

  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri).catch((error: unknown) => {
      cache.promise = null;
      throw error;
    });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}