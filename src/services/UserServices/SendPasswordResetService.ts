import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { SendEmailServices } from "../EmailServices/SendEmailServices";

interface Request {
  user: any;
  redis: any;
}

export async function sendPasswordReset({ user, redis }: Request) {
  const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET_FORGOT!, {
    expiresIn: "15m",
  });

  const fullUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  //   // Encurta com Redis
  const code = nanoid(6);
  const expireSeconds = 15 * 60;

  await redis.setex(`short:${code}`, expireSeconds, fullUrl);

  const shortUrl = `${process.env.BACKEND_URL}/r/${code}`;
  await SendEmailServices({
    tenantId: user.tenantId,
    to: user.email,
    subject: "Recuperação de senha",
    html: `<p>Você solicitou a recuperação de senha. Clique abaixo para redefinir:</p>
           <a href="${shortUrl}">Redefinir Senha</a>
           <p>Este link expira em 15 minutos.</p>`,
  });
}
