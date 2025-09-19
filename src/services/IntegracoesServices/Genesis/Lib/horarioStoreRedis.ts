import { redisClient } from "../../../../lib/redis";

const PREFIX = "horario:";
const EXPIRACAO = 60 * 15;

export async function salvarHorarioRedis(
  id: string,
  dados: any
): Promise<void> {
  await redisClient.set(
    `${PREFIX}${id}`,
    JSON.stringify(dados),
    "EX",
    EXPIRACAO
  );
}

export async function obterHorarioRedis(id: string): Promise<any | null> {
  const raw = await redisClient.get(`${PREFIX}${id}`);
  return raw ? JSON.parse(raw) : null;
}
