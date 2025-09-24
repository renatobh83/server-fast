import { FastifyRequest, FastifyReply } from "fastify";
import StatisticsPerUser from "../../services/Statistics/StatisticsPerUsers";
import { STANDARD } from "../../constants/request";
import { handleServerError } from "../../errors/errors.helper";

type IndexQuery = {
  startDate: string;
  endDate: string;
};

export const index = async (request: FastifyRequest, reply: FastifyReply) => {
  const { tenantId } = request.user as any;
  const { startDate, endDate } = request.query as IndexQuery;
  try {
    const data = await StatisticsPerUser({
      startDate,
      endDate,
      tenantId,
    });

    return reply.code(STANDARD.OK.statusCode).send(data);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
