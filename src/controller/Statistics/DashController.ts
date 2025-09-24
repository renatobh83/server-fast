import { FastifyRequest, FastifyReply } from "fastify";
import DashTicketsAndTimes from "../../services/Statistics/DashTicketsAndTimes";
import { STANDARD } from "../../constants/request";
import { handleServerError } from "../../errors/errors.helper";
import DashTicketsChannels from "../../services/Statistics/DashTicketsChannels";
import DashTicketsEvolutionChannels from "../../services/Statistics/DashTicketsEvolutionChannels";
import DashTicketsEvolutionByPeriod from "../../services/Statistics/DashTicketsEvolutionByPeriod";
import DashTicketsPerUsersDetail from "../../services/Statistics/DashTicketsPerUsersDetail";
import DashTicketsQueue from "../../services/Statistics/DashTicketsQueue";

type IndexQuery = {
  startDate: string;
  endDate: string;
};

export const getDashTicketsAndTimes = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, id, profile } = request.user as any;
  const { startDate, endDate } = request.query as IndexQuery;
  const payload = {
    startDate,
    endDate,
    tenantId,
    userId: id,
    userProfile: profile,
  };
  try {
    const data = await DashTicketsAndTimes(payload);
    return reply.code(STANDARD.OK.statusCode).send(data);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const getDashTicketsChannels = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, id, profile } = request.user as any;
  const { startDate, endDate } = request.query as IndexQuery;
  const payload = {
    startDate,
    endDate,
    tenantId,
    userId: id,
    userProfile: profile,
  };
  try {
    const data = await DashTicketsChannels(payload);
    return reply.code(STANDARD.OK.statusCode).send(data);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const getDashTicketsEvolutionChannels = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, id, profile } = request.user as any;
  const { startDate, endDate } = request.query as IndexQuery;
  const payload = {
    startDate,
    endDate,
    tenantId,
    userId: id,
    userProfile: profile,
  };
  try {
    const data = await DashTicketsEvolutionChannels(payload);
    return reply.code(STANDARD.OK.statusCode).send(data);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const getDashTicketsEvolutionByPeriod = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, id, profile } = request.user as any;
  const { startDate, endDate } = request.query as IndexQuery;
  const payload = {
    startDate,
    endDate,
    tenantId,
    userId: id,
    userProfile: profile,
  };
  try {
    const data = await DashTicketsEvolutionByPeriod(payload);
    return reply.code(STANDARD.OK.statusCode).send(data);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const getDashTicketsPerUsersDetail = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, id, profile } = request.user as any;
  const { startDate, endDate } = request.query as IndexQuery;
  const payload = {
    startDate,
    endDate,
    tenantId,
    userId: id,
    userProfile: profile,
  };
  try {
    const data = await DashTicketsPerUsersDetail(payload);
    return reply.code(STANDARD.OK.statusCode).send(data);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const getDashTicketsQueue = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, id, profile } = request.user as any;
  const { startDate, endDate } = request.query as IndexQuery;
  const payload = {
    startDate,
    endDate,
    tenantId,
    userId: id,
    userProfile: profile,
  };
  try {
    const data = await DashTicketsQueue(payload);
    return reply.code(STANDARD.OK.statusCode).send(data);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
