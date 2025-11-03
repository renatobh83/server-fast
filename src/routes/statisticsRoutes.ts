import { FastifyInstance } from "fastify/types/instance";
import * as RelatorioController from "../controller/RelatorioController";
import * as StatisticsController from "../controller/StatisticsController";
import * as StatisticsPerUsersController from "../controller/Statistics/StatisticsPerUsersController";
import * as DashController from "../controller/Statistics/DashController";
import * as DnsController from "../controller/DnsController";

export default async function statisticsRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.post(
    "/relatorio-chamado",
    {
      schema: {
        body: {
          type: "object",
          required: ["startDate"],
          properties: {
            startDate: { type: "string" },
          },
        },
      },
    },
    RelatorioController.relatorioChamado
  );
  fastify.post(
    "/generate-Report",
    {
      schema: {
        body: {
          type: "object",
          required: ["empresaId", "period", "now"],
          properties: {
            startDate: { type: "string" },
            period: { type: "string" },
            now: { type: "string" },
          },
        },
      },
    },
    RelatorioController.reportGenerateByCompany
  );
  fastify.get("/dash-tickets-queues", StatisticsController.DashTicketsQueues);
  fastify.get("/contacts-report", StatisticsController.ContactsReport);
  fastify.get("/statistics-per-users", StatisticsPerUsersController.index);
  fastify.get("/resultado-ddns", DnsController.getDDNStatus);
  fastify.get(
    "/statistics-tickets-times",
    DashController.getDashTicketsAndTimes
  );
  fastify.get(
    "/statistics-tickets-channels",
    DashController.getDashTicketsChannels
  );
  fastify.get(
    "/statistics-tickets-evolution-channels",
    DashController.getDashTicketsEvolutionChannels
  );
  fastify.get(
    "/statistics-tickets-evolution-by-period",
    DashController.getDashTicketsEvolutionByPeriod
  );
  fastify.get(
    "/statistics-tickets-per-users-detail",
    DashController.getDashTicketsPerUsersDetail
  );
  fastify.get("/statistics-tickets-queue", DashController.getDashTicketsQueue);
  done();
}
