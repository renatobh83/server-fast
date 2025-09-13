import { Redis } from "ioredis";

export const redisClient = new Redis({
  port: Number(process.env.IO_REDIS_PORT), // Redis port
  host: process.env.IO_REDIS_SERVER,
  db: Number(process.env.IO_REDIS_DB_SESSION) || 3,
  password: process.env.IO_REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});
