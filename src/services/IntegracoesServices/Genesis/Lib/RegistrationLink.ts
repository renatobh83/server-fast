import { sign } from "jsonwebtoken";
import { customAlphabet, nanoid } from "nanoid";
import { redisClient } from "../../../../lib/redis";

const { FRONTEND_URL, BACKEND_URL } = process.env;
export const generateRegistrationLink = async (
  user: string,
  integracao: any
) => {
  const { id, tenantId } = integracao;
  const payload = { identifier: user, id: id, tenantId: tenantId };

  const token = sign(
    payload,
    "78591a1f59eda6e939d7a7752412b364a5218eef12a839616af49080860273c7",
    { expiresIn: "15m" }
  );

  // Link original com o token
  const fullUrl = `${FRONTEND_URL}/register?token=${token}`;

  const nanoidSafe = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    6
  );
  // Encurta com Redis
  const code = nanoidSafe();
  const expireSeconds = 15 * 60;

  await redisClient.setex(`short:${code}`, expireSeconds, fullUrl);

  const shortUrl = `${BACKEND_URL}/r/${code}`;

  return shortUrl;
};

export const generateLinkPdf = async (plano: number, integracao: any) => {
  const { id, tenantId } = integracao;
  const payload = { cdPlano: plano, id: id, tenantId: tenantId };

  const token = sign(
    payload,
    "78591a1f59eda6e939d7a7752412b364a5218eef12a839616af49080860273c7",
    { expiresIn: "25m" }
  );

  // Link original com o token
  const fullUrl = `${BACKEND_URL}/pdf/${plano}?token=${token}`;

  const nanoidSafe = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    6
  );
  // Encurta com Redis
  const code = nanoidSafe();
  const expireSeconds = 25 * 60;

  await redisClient.setex(`short:${code}`, expireSeconds, fullUrl);

  const shortUrl = `${BACKEND_URL}/r/${code}`;

  return shortUrl;
};
