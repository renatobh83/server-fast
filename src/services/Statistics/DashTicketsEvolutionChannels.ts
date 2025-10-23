import { QueryTypes } from "sequelize";
import { sequelize } from "../../database/db";

interface Request {
  startDate: string;
  endDate: string;
  tenantId: string | number;
  userId: string | number;
  userProfile: string;
}

const query = `
  WITH tickets_filtrados AS (
  SELECT DISTINCT t."id", t."createdAt", t."channel"
  FROM "Tickets" t
  INNER JOIN "LogTickets" lt ON lt."ticketId" = t."id"
  WHERE
    t."tenantId" = :tenantId
    AND lt."userId" = :userId
    AND (lt."type" = 'open' OR lt."type" = 'receivedTransfer')
    AND date_trunc('day', t."createdAt") BETWEEN :startDate AND :endDate
)

SELECT
  dt_ref,
  TO_CHAR(dt_ref, 'DD/MM/YYYY') AS dt_referencia,
  label,
  COUNT(*) AS qtd,
  ROUND(100.0 * (COUNT(*) * 1.0 / SUM(COUNT(*)) OVER ()), 2) AS percentual
FROM (
  SELECT
    DATE_TRUNC('day', t."createdAt") AS dt_ref,
    t."channel" AS label
  FROM tickets_filtrados t
) a
GROUP BY dt_ref, label
ORDER BY dt_ref;
`;

const queryAdmin = `
WITH tickets_filtrados AS (
  SELECT DISTINCT t."id", t."createdAt", t."channel"
  FROM "Tickets" t
  INNER JOIN "LogTickets" lt ON lt."ticketId" = t."id"
  WHERE
    t."tenantId" = :tenantId
    AND (lt."type" = 'open' OR lt."type" = 'receivedTransfer')
    AND date_trunc('day', t."createdAt") BETWEEN :startDate AND :endDate
)

SELECT
  dt_ref,
  TO_CHAR(dt_ref, 'DD/MM/YYYY') AS dt_referencia,
  label,
  COUNT(*) AS qtd,
  ROUND(100.0 * (COUNT(*) * 1.0 / SUM(COUNT(*)) OVER ()), 2) AS percentual
FROM (
  SELECT
    DATE_TRUNC('day', t."createdAt") AS dt_ref,
    t."channel" AS label
  FROM tickets_filtrados t
) a
GROUP BY dt_ref, label
ORDER BY dt_ref;
`;

const DashTicketsEvolutionChannels = async ({
  startDate,
  endDate,
  tenantId,
  userId,
  userProfile,
}: Request): Promise<any[]> => {
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
      // logging: console.log,
    }
  );
  return data;
};

export default DashTicketsEvolutionChannels;
