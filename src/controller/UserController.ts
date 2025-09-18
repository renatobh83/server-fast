import { FastifyRequest, FastifyReply } from "fastify";
import ListUsersService from "../services/UserServices/ListUsersService";
import { STANDARD } from "../constants/request";
import { ERRORS, handleServerError } from "../errors/errors.helper";
import CreateUserService from "../services/UserServices/CreateUserService";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import { getIO } from "../lib/socket";
import DeleteUserService from "../services/UserServices/DeleteUserService";
import UpdateDeletedUserOpenTicketsStatus from "../helpers/UpdateDeletedUserOpenTicketsStatus";
import { UpdateUserIsOnlineService } from "../helpers/UpdateUserIsOnlineService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};
export const listUserController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  const { searchParam, pageNumber } = request.query as IndexQuery;
  try {
    const { users, count, hasMore } = await ListUsersService({
      searchParam,
      pageNumber,
      tenantId,
    });
    return reply.code(STANDARD.OK.statusCode).send({ users, count, hasMore });
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const createUser = async (
  request: FastifyRequest<{
    Body: {
      email: string;
      password: string;
      name: string;
      profile: string;
    };
  }>,
  reply: FastifyReply
) => {
  const { tenantId, profile } = request.user as any;
  const payload = { ...request.body, tenantId };
  try {
    if (profile !== "admin") {
      return reply
        .code(ERRORS.unauthorizedAccess.statusCode)
        .send(ERRORS.unauthorizedAccess.message);
    }
    const user = await CreateUserService(payload);

    return reply.code(STANDARD.OK.statusCode).send(user);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const update = async (
  request: FastifyRequest<{
    Body: {
      email: string;
      password: string;
      name: string;
      profile: string;
      ativo: boolean;
      queues: {
        id?: number;
        queue?: number;
      }[];
    };
  }>,
  reply: FastifyReply
) => {
  const { tenantId, profile } = request.user as any;
  const { userId } = request.params as any;
  const payload = { userData: request.body, tenantId, userId };
  try {
    if (profile !== "admin") {
      return reply
        .code(ERRORS.unauthorizedAccess.statusCode)
        .send(ERRORS.unauthorizedAccess.message);
    }
    const user = await UpdateUserService(payload);
    const io = getIO();

    io.emit(`${tenantId}:user`, {
      action: "update",
      user,
    });
    return reply.code(STANDARD.OK.statusCode).send(user);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const removeUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, profile, id } = request.user as any;
  const { userId } = request.params as any;
  try {
    if (profile !== "admin") {
      return reply
        .code(ERRORS.unauthorizedAccess.statusCode)
        .send(ERRORS.unauthorizedAccess.message);
    }
    await DeleteUserService(userId, tenantId, id);
    const io = getIO();

    io.emit(`${tenantId}:user`, {
      action: "delete",
      userId,
    });
    return reply.code(STANDARD.OK.statusCode).send({ message: "User deleted" });
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const updateIsOnline = async (
  request: FastifyRequest<{
    Body: {
      isOnline: boolean;
      status: string;
    };
  }>,
  reply: FastifyReply
) => {
  const { tenantId, profile, id } = request.user as any;
  const { userId } = request.params as any;
  const payload = { userData: request.body, userId, tenantId };
  try {
    const io = getIO();
    const updatedUser = await UpdateUserIsOnlineService(payload);
    const updateMessage = {
      action: "update",
      user: updatedUser,
    };
    io.emit(tenantId + ":user", updateMessage);
    return reply.code(STANDARD.OK.statusCode).send(updatedUser);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
