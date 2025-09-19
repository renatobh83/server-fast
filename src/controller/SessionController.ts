import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify/types/request";
import { AuthUserService } from "../services/UserServices/AuthUserService";
import { SendRefreshToken } from "../helpers/SendRefreshToken";
import { ERRORS, handleServerError } from "../errors/errors.helper";
import { STANDARD } from "../constants/request";
import { sendPasswordReset } from "../services/UserServices/SendPasswordResetService";
import User from "../models/User";
import { getIO } from "../lib/socket";

export const StoreLoginHandler = async (
  request: FastifyRequest,
  response: FastifyReply
) => {
  const { email, password } = request.body as any;
  const server = request;
  try {
    await AuthUserService({
      reply: response,
      email,
      password,
      server,
    });
  } catch (error) {
    return handleServerError(response, error);
  }
};

export const LogoutUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { userId } = request.body as any;

  try {
    const userLogout = await User.findByPk(userId);
    if (userLogout) {
      userLogout.update({ isOnline: false, lastLogout: new Date() });
    }
    request.server.io.emit(`${userLogout?.tenantId}:users`, {
      action: "update",
      data: {
        username: userLogout?.name,
        email: userLogout?.email,
        isOnline: false,
        lastLogout: new Date(),
      },
    });
    reply
      .clearCookie("refreshToken", {
        path: "/refresh-token", // precisa ser o mesmo usado ao criar
      })
      .send({ message: "Logout realizado com sucesso" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const forgotPassword = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { email } = request.body as any;

    if (!email) {
      return reply.code(400).send({ mesaage: "email nao informado" });
    }

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

    await sendPasswordReset({ user, redis: request.server.redis });

    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "E-mail enviado com link de redefinição" });
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

// export const resetPassword = async (
//   request: FastifyRequest,
//   reply: FastifyReply
// ) => {
//   const { token, newPassword } = request.body as any;
//   if (!token) {
//     return reply
//       .code(ERRORS.invalidToken.statusCode)
//       .send(ERRORS.invalidToken.message);
//   }
//   try {
//     // const payload = await ValidateTokenResetService(token);
//     // const user = await UpdateUserResetPassword(payload, newPassword);
//     reply.code(STANDARD.OK.statusCode).send("teste");
//   } catch (error) {
//     return handleServerError(reply, error);
//   }
// };
