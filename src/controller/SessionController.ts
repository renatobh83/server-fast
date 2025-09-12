import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify/types/request";
import { AuthUserService } from "../services/UserServices/AuthUserService";
import { SendRefreshToken } from "../helpers/SendRefreshToken";

export const StoreLoginHandler = async (
  request: FastifyRequest,
  response: FastifyReply
) => {
  const { email, password } = request.body as any;
  const server = request.server;

  const { token, user, refreshToken, usuariosOnline } = await AuthUserService({
    email,
    password,
    server,
  });

  await SendRefreshToken(response, refreshToken);

  const params = {
    token,
    username: user.name,
    email: user.email,
    profile: user.profile,
    status: user.status,
    userId: user.id,
    tenantId: user.tenantId,
    queues: user.queues,
    usuariosOnline,
    configs: user.configs,
  };
  server.io.emit(`${params.tenantId}:users`, {
    action: "update",
    data: {
      username: params.username,
      email: params.email,
      isOnline: true,
      lastLogin: new Date(),
    },
  });

  response.code(200).send({
    status: "success",
    data: params,
    message: "Login realizado com sucesso",
  });
};
