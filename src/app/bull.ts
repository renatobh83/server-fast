import fastify from "fastify";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";

import { processQueues, queues, upsertJobScheduler } from "../lib/Queue";

export async function registerBullMQ(app: ReturnType<typeof fastify>) {
  processQueues();
  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: queues.map((q) => new BullMQAdapter(q.bull)),
    serverAdapter,
  });
  serverAdapter.setBasePath("/ui");
  app.register(serverAdapter.registerPlugin(), { prefix: "/ui" });


  setImmediate(() => {
    // upsertJobScheduler(
    //   "VerifyTicketsChatBotInactives",
    //   { every: 5_60_000 },
    //   {
    //     removeOnComplete: true,
    //     removeOnFail: 10,
    //     attempts: 3,
    //     backoff: { type: "fixed", delay: 1000 },
    //   }
    // );

    // upsertJobScheduler(
    //   "VerifyTicketsConfirmacaoInactives",
    //   { every: 5_60_000 },
    //   {
    //     removeOnComplete: true,
    //     removeOnFail: 5,
    //     attempts: 3,
    //     backoff: { type: "fixed", delay: 1000 },
    //   }
    // );
  });
}
