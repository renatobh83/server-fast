import { FastifyReply } from "fastify/types/reply";

export const SendRefreshToken = (reply: FastifyReply, token: string): void => {
  reply.setCookie("refreshToken", token, {
    httpOnly: true,
    secure: false, // true em prod
    sameSite: "strict",
    path: "/", // 👉 cuidado: se deixar "/refresh-token", não aparece no login
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
};
