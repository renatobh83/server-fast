import { FastifyInstance } from "fastify";
import { ERRORS } from "../../errors/errors.helper";
import { FastifyReply } from "fastify/types/reply";

interface Request {
  email: string;
  password: string;
  server: FastifyInstance;
  reply: FastifyReply;
}

export const AuthUserService = async ({
  email,
  password,
  server,
  reply,
}: Request) => {
  
  const { User } = server.models;

  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    return reply
      .code(ERRORS.userNotExists.statusCode)
      .send(ERRORS.userNotExists.message);
  }
  if (!(await user.checkPassword(password))) {
    return reply
      .code(ERRORS.userCredError.statusCode)
      .send(ERRORS.userCredError.message);
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
