import fastify from "fastify";
import fastifyExpress from "@fastify/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import {
  initQueues,
  processQueues,
  queues,
  upsertJobScheduler,
} from "../lib/Queue";

export async function registerBullMQ(app: ReturnType<typeof fastify>) {
  initQueues(fastify); // cria as filas com o Redis do Fastify
  processQueues(5); // inicia os workers
  // Agendamento de jobs
  // await upsertJobScheduler(
  //   "VerifyTicketsChatBotInactives",
  //   { every: 5_60_000 },
  //   {
  //     removeOnComplete: true,
  //     removeOnFail: 10,
  //     attempts: 3,
  //     backoff: { type: "fixed", delay: 1000 },
  //   }
  // );

  // await upsertJobScheduler(
  //   "VerifyTicketsConfirmacaoInactives",
  //   { every: 5_60_000 },
  //   {
  //     removeOnComplete: true,
  //     removeOnFail: 5,
  //     attempts: 3,
  //     backoff: { type: "fixed", delay: 1000 },
  //   }
  // );

  // Inicializa Bull Board
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: queues.map((q) => new BullMQAdapter(q.bull)),
    serverAdapter,
  });

  // Necessário registrar Fastify Express
  await app.register(fastifyExpress);

  // Monta o router do Bull Board no Fastify
  app.use("/admin/queues", serverAdapter.getRouter());
}
