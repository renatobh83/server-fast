import { FastifyInstance } from "fastify";
import { ERRORS } from "../../errors/errors.helper";
import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify/types/request";
import User from "../../models/User";
import { SendRefreshToken } from "../../helpers/SendRefreshToken";
import { getIO } from "../../lib/socket";
import { STANDARD } from "../../constants/request";

interface Request {
  email: string;
  password: string;
  server: FastifyRequest;
  reply: FastifyReply;
}

export const AuthUserService = async ({
  email,
  password,
  server,
  reply,
}: Request) => {
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
  const accessToken = server.server.jwt.sign(payload, { expiresIn: "3d" });
  const refreshToken = server.server.jwt.sign(payload, { expiresIn: "7d" });

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

  // return {
  //   user: userSafe,
  //   token: accessToken,
  //   refreshToken,
  //   usuariosOnline,
  // };
  await SendRefreshToken(reply, refreshToken);
  const io = getIO();
  const params = {
    token: accessToken,
    username: userSafe.name,
    email: userSafe.email,
    profile: userSafe.profile,
    status: userSafe.status,
    userId: userSafe.id,
    tenantId: userSafe.tenantId,
    // queues: user.queues,
    usuariosOnline,
    configs: userSafe.configs,
  };
  io.emit(`${params.tenantId}:users`, {
    action: "update",
    data: {
      username: params.username,
      email: params.email,
      isOnline: true,
      lastLogin: new Date(),
    },
  });

  return reply.code(STANDARD.OK.statusCode).send(params);
};
