// Queue.ts
import { Queue, Worker, Job, JobsOptions, RepeatOptions } from "bullmq";
import * as jobs from "../jobs/index";
import { logger } from "../utils/logger";
export interface JobQueue {
  bull: Queue;
  name: string;
  handle: (data: any) => Promise<void>;
  options: JobsOptions;
}

export let queues: JobQueue[] = [];
let workers: Worker[] = [];

/**
 * Inicializa todas as filas com o Redis do Fastify
 */
export function initQueues(fastify: any) {
  queues = Object.values(jobs).map((job: any) => {
    const bullQueue = new Queue(job.key, { connection: fastify.redis });

    // listeners
    // bullQueue.on("error", QueueListener.onError);
    // bullQueue.on("waiting", QueueListener.onWaiting);
    bullQueue.on("progress", (data) => console.log(data));

    return {
      bull: bullQueue,
      name: job.key,
      handle: job.handle,
      options: job.options,
    };
  });

  return queues;
}

/**
 * Processa todas as filas
 */
export function processQueues(concurrency = 10) {
  for (const { name, handle } of queues) {
    const worker = new Worker(
      name,
      async (job: Job) => {
        logger.info(`Processando job ${name} ID ${job.id}`);
        await handle(job.data);
      },
      {
        connection: queues.find((q) => q.name === name)!.bull.opts.connection,
        concurrency,
      }
    );

    workers.push(worker);
  }
}

/**
 * Adiciona um job a uma fila
 */
export async function addJob(
  queueName: string,
  data: any,
  options: JobsOptions = {}
) {
  const queue = queues.find((q) => q.name === queueName);
  if (!queue) throw new Error(`Queue "${queueName}" não encontrada`);

  const jobId =
    data.jobId ||
    `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await queue.bull.add(
    queueName,
    { ...data, jobId },
    { ...queue.options, ...options }
  );
  return jobId;
}

/**
 * Upsert / schedule de jobs repetitivos
 */
export async function upsertJobScheduler(
  queueName: string,
  repeatOptions: RepeatOptions,
  jobOptions: JobsOptions = {}
) {
  const queue = queues.find((q) => q.name === queueName);
  if (!queue) throw new Error(`Queue "${queueName}" não encontrada`);

  await queue.bull.add(
    queue.name,
    {},
    { ...queue.options, ...jobOptions, repeat: repeatOptions }
  );
}
