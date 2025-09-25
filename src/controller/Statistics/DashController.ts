import { FastifyRequest, FastifyReply } from "fastify";
import DashTicketsAndTimes from "../../services/Statistics/DashTicketsAndTimes";
import { STANDARD } from "../../constants/request";
import { handleServerError } from "../../errors/errors.helper";
import DashTicketsChannels from "../../services/Statistics/DashTicketsChannels";
import DashTicketsEvolutionChannels from "../../services/Statistics/DashTicketsEvolutionChannels";
import DashTicketsEvolutionByPeriod from "../../services/Statistics/DashTicketsEvolutionByPeriod";
import DashTicketsPerUsersDetail from "../../services/Statistics/DashTicketsPerUsersDetail";
import DashTicketsQueue from "../../services/Statistics/DashTicketsQueue";
import { getCache, setCache } from "../../utils/cacheRedis";
import { RedisKeys } from "../../constants/redisKeys";

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
    let dataDash = await getCache(
      RedisKeys.DashTicketsAndTimes(startDate, endDate, profile)
    );
    if (!dataDash) {
      dataDash = await DashTicketsAndTimes(payload);
      await setCache(
        RedisKeys.DashTicketsAndTimes(startDate, endDate, profile),
        dataDash,
        360
      );
    }
    return reply.code(STANDARD.OK.statusCode).send(dataDash);
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
    let dataDash = await getCache(
      RedisKeys.DashTicketsChannel(startDate, endDate, profile)
    );
    if (!dataDash) {
      dataDash = await DashTicketsChannels(payload);
      await setCache(
        RedisKeys.DashTicketsChannel(startDate, endDate, profile),
        dataDash,
        360
      );
    }
    return reply.code(STANDARD.OK.statusCode).send(dataDash);
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
    let dataDash = await getCache(
      RedisKeys.DashTicketsEvolutionChannels(startDate, endDate, profile)
    );
    if (!dataDash) {
      dataDash = await DashTicketsEvolutionChannels(payload);
      await setCache(
        RedisKeys.DashTicketsEvolutionChannels(startDate, endDate, profile),
        dataDash
      );
    }
    return reply.code(STANDARD.OK.statusCode).send(dataDash);
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
    let dataDash = await getCache(
      RedisKeys.DashTicketsEvolutionByPeriod(startDate, endDate, profile)
    );
    if (!dataDash) {
      dataDash = await DashTicketsEvolutionByPeriod(payload);
      await setCache(
        RedisKeys.DashTicketsEvolutionByPeriod(startDate, endDate, profile),
        dataDash,
        360
      );
    }
    return reply.code(STANDARD.OK.statusCode).send(dataDash);
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
    let dataDash = await getCache(
      RedisKeys.DashTicketsPerUsersDetail(startDate, endDate, profile)
    );
    if (!dataDash) {
      dataDash = await DashTicketsPerUsersDetail(payload);
      await setCache(
        RedisKeys.DashTicketsPerUsersDetail(startDate, endDate, profile),
        dataDash,
        360
      );
    }
    return reply.code(STANDARD.OK.statusCode).send(dataDash);
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
    let dataDash = await getCache(
      RedisKeys.DashTicketsQueue(startDate, endDate, profile)
    );
    if (!dataDash) {
      dataDash = await DashTicketsQueue(payload);
      await setCache(
        RedisKeys.DashTicketsQueue(startDate, endDate, profile),
        dataDash,
        360
      );
    }
    return reply.code(STANDARD.OK.statusCode).send(dataDash);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
