import { FastifyRequest, FastifyReply } from "fastify";
import { handleServerError } from "../errors/errors.helper";
import { STANDARD } from "../constants/request";
import { GetStatusDDNSservices } from "../services/DnsServices/GetStatusDDNSServices";
import { logger } from "../utils/logger";

export const getDDNStatus = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const data = await GetStatusDDNSservices();
    return reply.code(STANDARD.OK.statusCode).send(data);
  } catch (error) {
    logger.error("Error in getDDNStatus",error )
    return handleServerError(reply, error);
  }
};
