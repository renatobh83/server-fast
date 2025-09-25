import { redisClient } from "../lib/redis";

// Buscar do cache
export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

// Salvar no cache com TTL
export async function setCache<T>(key: string, value: T, ttlSeconds = 120) {
  await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
}
