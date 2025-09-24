import { QueryTypes } from "sequelize";
import { sequelize } from "../../database/db";

interface Request {
  startDate: string;
  endDate: string;
  tenantId: string | number;
  userId: string | number;
  userProfile: string;
}

const queryAdmin = `
  WITH tickets_filtrados AS (
  SELECT DISTINCT t."id", t."createdAt"
  FROM "Tickets" t
  INNER JOIN "LogTickets" lt ON lt."ticketId" = t."id"
  WHERE
    t."tenantId" = :tenantId
    AND (lt."type" = 'open' OR lt."type" = 'receivedTransfer')
    AND date_trunc('day', t."createdAt") BETWEEN :startDate AND :endDate
)

SELECT
  dt_ref,
  TO_CHAR(dt_ref, 'DD/MM/YYYY') AS label,
  COUNT(*) AS qtd
FROM (
  SELECT DATE_TRUNC('day', t."createdAt") AS dt_ref
  FROM tickets_filtrados t
) a
GROUP BY dt_ref
ORDER BY dt_ref;

`;

const query = `
  WITH tickets_filtrados AS (
  SELECT DISTINCT t."id", t."createdAt"
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
  TO_CHAR(dt_ref, 'DD/MM/YYYY') AS label,
  COUNT(*) AS qtd
FROM (
  SELECT DATE_TRUNC('day', t."createdAt") AS dt_ref
  FROM tickets_filtrados t
) a
GROUP BY dt_ref
ORDER BY dt_ref;

`;

const DashTicketsEvolutionByPeriod = async ({
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
      // logging: console.log
    }
  );
  return data;
};

export default DashTicketsEvolutionByPeriod;
