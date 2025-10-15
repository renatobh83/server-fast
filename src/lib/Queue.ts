import { type Job, Queue, Worker, JobSchedulerTemplateOptions } from "bullmq";
import * as jobs from "../jobs/index";
import { logger } from "../utils/logger";

import { RepeatOptions, JobsOptions } from "bullmq";
import { redisClient } from "./redis";
import fastify from "fastify";

// Atualize a interface JobQueue para incluir o tipo correto para options
interface JobQueue {
  bull: Queue;
  name: string;
  handle: (data: any) => Promise<void>;
  options: JobsOptions & { opts?: JobSchedulerTemplateOptions }; // Adicionando suporte para opts
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface ShutdownResult {
  success: boolean;
  workerErrors: Error[];
  queueErrors: Error[];
}

// Monitoramento de eventos Redis
redisClient.on("error", (err) => {
  logger.error("Erro na conexão Redis (redisForWorkers):", err);
});
redisClient.on("close", () => {
  logger.warn("Conexão Redis (redisForWorkers) fechada.");
});
redisClient.on("reconnecting", () => {
  logger.info("Reconectando ao Redis (redisForWorkers)...");
});

// Cria as filas com tipagem melhorada
export const queues: JobQueue[] = Object.values(jobs).map((job: any) => {
  const bullQueue = new Queue(job.key, { connection: redisClient,
                                       defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential"
    },
    removeOnComplete: {
      age: 1 * 3600,
      count: 1,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  }});

  // Configura listeners de forma consistente
  // bullQueue.on("waiting", QueueListener.onWaiting);
  // bullQueue.on("removed", QueueListener.onRemoved);
  // bullQueue.on("error", QueueListener.onError);
  // bullQueue.on("progress", QueueListener.onProgress);
  // bullQueue.on("ioredis:close", QueueListener.onIoredis);

  return {
    bull: bullQueue,
    name: job.key,
    handle: job.handle,
    options: job.options,
  };
});

const workers: Worker[] = [];

// Função utilitária para tratamento de erros
function handleError(context: string, error: unknown): Error {
  const errorMessage =
    error instanceof Error ? error.message : "Erro desconhecido";
  logger.error({
    message: `Erro em ${context}`,
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
  });
  return error instanceof Error ? error : new Error(errorMessage);
}

// Configura listeners do worker de forma centralizada
function setupWorkerListeners(worker: Worker, name: string) {
  worker.on("active", (job: Job) => {
    logger.info(`[Worker ${name}] Job ${job.id} iniciado (active).`);
  });

  worker.on("completed", (job: Job, result: any) => {
    logger.info(
      `[Worker ${name}] Job ${
        job.id
      } concluído com sucesso. Resultado: ${JSON.stringify(result, null, 2)}`
    );
  });

  worker.on("failed", (job: Job | undefined, error: Error) => {
    logger.error(
      `[Worker ${name}] Job ${job?.id || "unknown"} falhou. Erro: ${
        error.message
      }`,
      { error }
    );
  });

  worker.on("error", (error: Error) => {
    logger.error(`[Worker ${name}] Erro geral no worker: ${error.message}`, {
      error,
    });
  });

  worker.on("stalled", (jobId: string) => {
    logger.warn(`[Worker ${name}] Job ${jobId} detectado como stalled.`);
  });
}

/**
 * Adiciona um job a uma fila específica
 * @param queueName Nome da fila
 * @param data Dados do job
 * @param jobOptions Opções específicas do job
 * @returns Promise<boolean> True se o job foi adicionado com sucesso
 * @throws Error Se a fila não for encontrada ou ocorrer um erro ao adicionar o job
 */
export async function addJob(
  queueName: string,
  data: Record<string, any> = {},
  jobOptions: JobsOptions & { opts?: JobSchedulerTemplateOptions } = {}
): Promise<{ success: boolean; jobId: string }> {
  const queue = queues.find((q) => q.name === queueName);
  if (!queue) {
    throw new Error(`Queue "${queueName}" not found.`);
  }

  try {
    // Separando opts das outras opções se necessário
    const { opts, ...options } = jobOptions;
    const finalOptions = {
      ...queue.options,
      ...options,
      ...(opts ? { opts } : {}),
    };
    // Gera um jobId único se não foi fornecido
    const jobId =
      data.jobId ||
      `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Adiciona o jobId aos dados do job
    const jobData = {
      ...data,
      jobId,
    };
    await queue.bull.add(queueName, jobData, finalOptions);
    logger.info(`Job adicionado à fila ${queueName}`);
    return {
      success: true,
      jobId: jobId,
    };
  } catch (error) {
    throw handleError(`addJob para fila ${queueName}`, error);
  }
}

/**
 * Configura os workers para processar as filas
 * @param concurrency Número de jobs que podem ser processados simultaneamente por worker
 */
export function processQueues(concurrency = 10) {
  for (const { name, handle } of queues) {
    const worker = new Worker(
      name,
      async (job: Job) => {
        try {
          logger.info(`Processando job ${name} com ID ${job.id}`);
          const result = await handle(job.data);
          logger.info(`Job ${name} processado com sucesso.`);
          return result;
        } catch (error) {
          const err = handleError(
            `processamento do job ${name} (ID: ${job.id})`,
            error
          );
          throw err;
        }
      },
      { connection: redisClient, concurrency }
    );

    setupWorkerListeners(worker, name);
    workers.push(worker);
  }
  //logger.info("Workers configurados e prontos para processar jobs.");
}

/**
 * Obtém estatísticas de uma fila específica
 * @param queueName Nome da fila
 * @returns Promise<QueueStats> Estatísticas da fila
 * @throws Error Se a fila não for encontrada ou ocorrer um erro ao obter estatísticas
 */
export async function getQueueStats(queueName: string): Promise<QueueStats> {
  const queue = queues.find((q) => q.name === queueName);
  if (!queue) throw new Error(`Queue "${queueName}" not found.`);

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.bull.getWaitingCount(),
      queue.bull.getActiveCount(),
      queue.bull.getCompletedCount(),
      queue.bull.getFailedCount(),
      queue.bull.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  } catch (error) {
    throw handleError(`getQueueStats para fila ${queueName}`, error);
  }
}

/**
 * Loga as estatísticas de uma fila específica
 * @param queueName Nome da fila
 */
export function logQueueStats(queueName: string) {
  getQueueStats(queueName)
    .then((stats) => {
      logger.info(`Estatísticas da fila ${queueName}:`, stats);
    })
    .catch((error) => {
      handleError(`logQueueStats para fila ${queueName}`, error);
    });
}

/**
 * Encerra todos os workers e filas de forma segura
 * @returns Promise<ShutdownResult> Resultado do encerramento
 */
export async function shutdown(): Promise<ShutdownResult> {
  const errors: ShutdownResult = {
    success: true,
    workerErrors: [],
    queueErrors: [],
  };

  // Fecha workers em paralelo
  await Promise.all(
    workers.map(async (worker) => {
      try {
        await worker.close();
        logger.info(`Worker para a fila ${worker.name} foi fechado.`);
      } catch (error) {
        const err = handleError(`fechamento do worker ${worker.name}`, error);
        errors.workerErrors.push(err);
        errors.success = false;
      }
    })
  );

  // Fecha filas em paralelo
  await Promise.all(
    queues.map(async ({ bull, name }) => {
      try {
        await bull.close();
        logger.info(`Fila ${name} foi fechada.`);
      } catch (error) {
        const err = handleError(`fechamento da fila ${name}`, error);
        errors.queueErrors.push(err);
        errors.success = false;
      }
    })
  );

  if (!errors.success) {
    logger.warn("Sistema de filas encerrado com um ou mais erros.");
  } else {
    logger.info("Sistema de filas encerrado com sucesso.");
  }

  return errors;
}

/**
 * Cria ou atualiza um job agendado
 * @param queueName Nome da fila
 * @param repeatOptions Opções de repetição
 * @param jobOptions Opções do job
 * @throws Error Se a fila não for encontrada ou ocorrer um erro ao agendar
 */
export async function upsertJobScheduler(
  queueName: string,
  repeatOptions: RepeatOptions,
  jobOptions: JobsOptions & { opts?: JobSchedulerTemplateOptions } = {} // Tipo corrigido
): Promise<void> {
  const queue = queues.find((q) => q.name === queueName);
  if (!queue) {
    throw new Error(`Queue "${queueName}" not found.`);
  }

  try {
    // Separando as propriedades para atender à assinatura do método
    const { opts, ...restOptions } = jobOptions;

    await queue.bull.upsertJobScheduler(queue.name, repeatOptions, {
      name: queue.name,
      data: {},
      opts: opts || undefined,
      ...restOptions,
    });

    logger.info(`Agendamento atualizado para a fila ${queueName}`);
  } catch (error) {
    throw handleError(`upsertJobScheduler para fila ${queueName}`, error);
  }
}

export async function getJobById(queueName: string, jobId: string) {
  const queue = queues.find((q) => q.name === queueName);
  if (!queue) {
    throw new Error(`Queue "${queueName}" not found.`);
  }

  // Obtém todos os jobs e busca pelo jobId nos dados
  const jobs = await queue.bull.getJobs([
    "waiting",
    "active",
    "completed",
    "failed",
  ]);

  for (const job of jobs) {
    if (job.data.jobId === jobId) {
      return job;
    }
  }

  return null;
}
