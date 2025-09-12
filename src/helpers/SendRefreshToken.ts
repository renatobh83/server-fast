import { FastifyReply } from "fastify/types/reply";

export const SendRefreshToken = async (
  reply: FastifyReply,
  token: string
): Promise<void> => {
  reply.setCookie("refreshToken", token, {
    httpOnly: true,
    secure: true, // em produção, só via HTTPS
    sameSite: "strict", // protege contra CSRF
    path: "/refresh-token", // restringe rota que pode enviar o cookie
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
};
