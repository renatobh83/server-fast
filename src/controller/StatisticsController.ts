import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";
import StatisticsPerUser from "../services/Statistics/StatisticsPerUsers";
import TicketsQueuesService from "../services/Statistics/TicketsQueuesService";
import ContactsReportService from "../services/Statistics/ContactsReportService";
import { logger } from "../utils/logger";

type IndexQuery = {
  dateStart: string;
  dateEnd: string;
  status: string[];
  queuesIds: string[];
  showAll: string;
};

type TContactReport = {
  startDate: string;
  endDate: string;
  tags?: number[] | string[];
  ddds?: number[] | string[];
  searchParam?: string;
};

export const DashTicketsQueues = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, id, profile } = request.user as any;
  const { dateStart, dateEnd, status, queuesIds } = request.query as IndexQuery;
  try {
    const payload = {
      dateEnd,
      dateStart,
      status,
      queuesIds,
      tenantId,
      userId: id,
      showAll: profile === "admin" ? true : false,
    };
    const tickets = await TicketsQueuesService(payload);

    return reply.code(STANDARD.OK.statusCode).send(tickets);
  } catch (error) {
    logger.error("Error in DashTicketsQueues",error )
    return handleServerError(reply, error);
  }
};
export const ContactsReport = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, id, profile } = request.user as any;
  const { startDate, endDate, tags, ddds, searchParam } =
    request.query as TContactReport;
  try {
    const payload = {
      startDate,
      endDate,
      tags,
      ddds,
      tenantId,
      profile: profile,
      userId: id,
      searchParam,
    };
    const tickets = await ContactsReportService(payload);
    return reply.code(STANDARD.OK.statusCode).send(tickets);
  } catch (error) {
    logger.error("Error in ContactsReport",error )
    return handleServerError(reply, error);
  }
};
