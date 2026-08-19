import mongoose from 'mongoose';
import { getEnv } from '@/config/env';

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConnection?: Promise<typeof mongoose>;
};

export const connectMongo = async (): Promise<typeof mongoose> => {
  if (!globalForMongoose.mongooseConnection) {
    const env = getEnv();
    globalForMongoose.mongooseConnection = mongoose
      .connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME,
        maxPoolSize: 10,
      })
      .catch((error) => {
        globalForMongoose.mongooseConnection = undefined;
        throw error;
      });
  }

  return globalForMongoose.mongooseConnection;
};
