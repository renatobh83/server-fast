import { QueryTypes } from "sequelize";
import { AppError } from "../../errors/errors.helper";
import { sequelize } from "../../database/db";

interface Request {
  startDate: string;
  endDate: string;
  tenantId: string | number;
  userId: string | number;
  userProfile: string;
}

const query = `
WITH ticket_logs AS (
    SELECT DISTINCT ON (t."id")
        t."id",
        t."createdAt",
        t."closedAt",
        t."startedAttendanceAt",
        t."isActiveDemand",
        t."tenantId"
    FROM "Tickets" t
    INNER JOIN "LogTickets" lt ON lt."ticketId" = t."id"
    WHERE
        t."tenantId" = :tenantId
        AND DATE_TRUNC('day', t."createdAt") BETWEEN :startDate AND :endDate
        AND lt."userId" = :userId
        AND (lt."type" LIKE 'open' OR lt."type" LIKE 'receivedTransfer')
    ORDER BY t."id", lt."createdAt" -- pega o primeiro evento por ticket
)

SELECT
    SUM(qtd_total_atendimentos) AS qtd_total_atendimentos,
    SUM(qtd_demanda_ativa) AS qtd_demanda_ativa,
    SUM(qtd_demanda_receptiva) AS qtd_demanda_receptiva,

    JSON_BUILD_OBJECT(
        'horas', COALESCE(FLOOR(EXTRACT(EPOCH FROM AVG(tma)) / 3600), 0),
        'minutos', COALESCE(FLOOR((EXTRACT(EPOCH FROM AVG(tma)) % 3600) / 60), 0),
        'segundos', COALESCE(ROUND(EXTRACT(EPOCH FROM AVG(tma)) % 60), 0)
    ) AS tma,

    JSON_BUILD_OBJECT(
        'horas', COALESCE(FLOOR(EXTRACT(EPOCH FROM AVG(tme)) / 3600), 0),
        'minutos', COALESCE(FLOOR((EXTRACT(EPOCH FROM AVG(tme)) % 3600) / 60), 0),
        'segundos', COALESCE(ROUND(EXTRACT(EPOCH FROM AVG(tme)) % 60), 0)
    ) AS tme,

    (
        SELECT COUNT(DISTINCT c."id")
        FROM "Contacts" c
        INNER JOIN "Tickets" tc ON tc."contactId" = c."id"
        INNER JOIN "LogTickets" ltc ON ltc."ticketId" = tc."id"
        WHERE c."tenantId" = :tenantId
        AND ltc."userId" = :userId
        AND DATE_TRUNC('day', c."createdAt") BETWEEN :startDate AND :endDate
    ) AS new_contacts

FROM (
    SELECT
        DATE_TRUNC('month', t."createdAt") AS dt_referencia,
        1 AS qtd_total_atendimentos,
        CASE WHEN t."isActiveDemand" IS TRUE THEN 1 ELSE 0 END AS qtd_demanda_ativa,
        CASE WHEN t."isActiveDemand" IS NOT TRUE THEN 1 ELSE 0 END AS qtd_demanda_receptiva,
        t."createdAt",
        TO_TIMESTAMP(t."closedAt" / 1000) AS closedAt,
        TO_TIMESTAMP(t."startedAttendanceAt" / 1000) AS startedAttendanceAt,
        AGE(TO_TIMESTAMP(t."closedAt" / 1000), t."createdAt") AS tma,
        AGE(TO_TIMESTAMP(t."startedAttendanceAt" / 1000), t."createdAt") AS tme,
        t."tenantId"
    FROM ticket_logs t
) a;


`;
const queryAdmin = `
WITH ticket_logs AS (
    SELECT DISTINCT ON (t."id")
        t."id",
        t."createdAt",
        t."closedAt",
        t."startedAttendanceAt",
        t."isActiveDemand",
        t."tenantId"
    FROM "Tickets" t
    INNER JOIN "LogTickets" lt ON lt."ticketId" = t."id"
    WHERE
        t."tenantId" = :tenantId
        AND DATE_TRUNC('day', t."createdAt") BETWEEN :startDate AND :endDate
        AND (lt."type" LIKE 'open' OR lt."type" LIKE 'receivedTransfer')
    ORDER BY t."id", lt."createdAt" -- pega o primeiro evento por ticket
)

SELECT
    SUM(qtd_total_atendimentos) AS qtd_total_atendimentos,
    SUM(qtd_demanda_ativa) AS qtd_demanda_ativa,
    SUM(qtd_demanda_receptiva) AS qtd_demanda_receptiva,

    JSON_BUILD_OBJECT(
        'horas', COALESCE(FLOOR(EXTRACT(EPOCH FROM AVG(tma)) / 3600), 0),
        'minutos', COALESCE(FLOOR((EXTRACT(EPOCH FROM AVG(tma)) % 3600) / 60), 0),
        'segundos', COALESCE(ROUND(EXTRACT(EPOCH FROM AVG(tma)) % 60), 0)
    ) AS tma,

    JSON_BUILD_OBJECT(
        'horas', COALESCE(FLOOR(EXTRACT(EPOCH FROM AVG(tme)) / 3600), 0),
        'minutos', COALESCE(FLOOR((EXTRACT(EPOCH FROM AVG(tme)) % 3600) / 60), 0),
        'segundos', COALESCE(ROUND(EXTRACT(EPOCH FROM AVG(tme)) % 60), 0)
    ) AS tme,

    (
        SELECT COUNT(DISTINCT c."id")
        FROM "Contacts" c
        INNER JOIN "Tickets" tc ON tc."contactId" = c."id"
        INNER JOIN "LogTickets" ltc ON ltc."ticketId" = tc."id"
        WHERE c."tenantId" = :tenantId
        AND DATE_TRUNC('day', c."createdAt") BETWEEN :startDate AND :endDate
    ) AS new_contacts

FROM (
    SELECT
        DATE_TRUNC('month', t."createdAt") AS dt_referencia,
        1 AS qtd_total_atendimentos,
        CASE WHEN t."isActiveDemand" IS TRUE THEN 1 ELSE 0 END AS qtd_demanda_ativa,
        CASE WHEN t."isActiveDemand" IS NOT TRUE THEN 1 ELSE 0 END AS qtd_demanda_receptiva,
        t."createdAt",
        TO_TIMESTAMP(t."closedAt" / 1000) AS closedAt,
        TO_TIMESTAMP(t."startedAttendanceAt" / 1000) AS startedAttendanceAt,
        AGE(TO_TIMESTAMP(t."closedAt" / 1000), t."createdAt") AS tma,
        AGE(TO_TIMESTAMP(t."startedAttendanceAt" / 1000), t."createdAt") AS tme,
        t."tenantId"
    FROM ticket_logs t
) a;

`;

const DashTicketsAndTimes = async ({
  startDate,
  endDate,
  tenantId,
  userId,
  userProfile,
}: Request): Promise<any[]> => {
  try {
    const data = await sequelize.query(
      userProfile === "admin" ? queryAdmin : query,
      {
        replacements: {
          tenantId,
          startDate,
          endDate,
          userId,
        },
        type: QueryTypes.SELECT,
        //  logging: true
      }
    );

    return data;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_DASH_TICKETS_AND_TIMES", 500);
  }
};

export default DashTicketsAndTimes;
