import mongoose from 'mongoose';
import { getEnv } from '@/config/env';

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConnection?: Promise<typeof mongoose>;
};

export const connectMongo = async (): Promise<typeof mongoose> => {
  if (!globalForMongoose.mongooseConnection) {
    globalForMongoose.mongooseConnection = mongoose
      .connect(getEnv().MONGODB_URI, { maxPoolSize: 10 })
      .catch((error) => {
        globalForMongoose.mongooseConnection = undefined;
        throw error;
      });
  }

  return globalForMongoose.mongooseConnection;
};
