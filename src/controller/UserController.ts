import { FastifyRequest, FastifyReply } from "fastify";
import ListUsersService from "../services/UserServices/ListUsersService";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";

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
