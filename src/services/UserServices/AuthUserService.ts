import { FastifyInstance } from "fastify";
import AppError from "../../errors/AppError";

interface Request {
  email: string;
  password: string;
  server: FastifyInstance;
}

export const AuthUserService = async ({ email, password, server }: Request) => {
  const { User } = server.models;
  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }
  if (!(await user.checkPassword(password))) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }
  const userJson = user.toJSON();

  const payload = {
    usarname: userJson.name,
    tenantId: userJson.tenantId,
    profile: userJson.profile,
    id: userJson.id,
  };
  const accessToken = server.jwt.sign(payload, { expiresIn: "3m" });
  const refreshToken = server.jwt.sign(payload, { expiresIn: "7d" });

  const { passwordHash, ...userSafe } = userJson;
  await user.update({
    isOnline: true,
    status: "online",
    lastLogin: new Date(),
  });
  const usuariosOnline = await User.findAll({
    where: { tenantId: userJson.tenantId, isOnline: true },
    attributes: [
      "id",
      "email",
      "status",
      "lastOnline",
      "name",
      "lastLogin",
      "isOnline",
    ],
  });

  return {
    user: userSafe,
    token: accessToken,
    refreshToken,
    usuariosOnline,
  };
};
// {"message":"Login realizado com sucesso","data":{"id":24,"email":"suporte2@exp.net.br","name":"Renato lucio","status":"offline","tokenVersion":0,"profile":"admin","createdAt":"2024-12-22T20:28:29.832Z","updatedAt":"2025-09-11T20:34:35.062Z"}}
