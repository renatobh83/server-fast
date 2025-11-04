import { queues, upsertJobScheduler } from "../lib/Queue";
import Setting from "../models/Setting";

import { logger } from "../utils/logger";

export async function scheduleOrUpdateDnsJob() {
  try {
    const setting = await Setting.findOne({
      where: { key: "DNSTrackingTime" },
      raw: true,
    });

    const intervalMinutes = Number(setting?.value || 0);
    const queueName = "CheckDDNSservices";

    // Busca a fila
    const queue = queues.find((q) => q.name === queueName);
    if (!queue) {
      logger.warn(`⚠️ Fila "${queueName}" não encontrada`);
      return;
    }

    // Remove o agendamento se o valor for 0
    if (intervalMinutes <= 0) {
      const jobs = await queue.bull.getRepeatableJobs();

      for (const job of jobs) {
        if (job.name === queueName) {
          await queue.bull.removeRepeatableByKey(job.key);
          logger.info(`🧹 Job "${queueName}" removido (intervalo 0)`);
        }
      }
      return;
    }
    const newInterval = intervalMinutes * 60 * 1000;

    // 🔍 Verifica se já existe um job com esse nome
    const jobs = await queue.bull.getRepeatableJobs();
    const existingJob = jobs.find((j) => j.name === queueName);

    // 🧹 Remove o job antigo se o intervalo mudou
    if (existingJob) {
      const oldEvery = Number(existingJob.every || 0);
      if (oldEvery !== newInterval) {
        await queue.bull.removeRepeatableByKey(existingJob.key);
        logger.info(
          `♻️ Job "${queueName}" removido para atualizar intervalo (${
            oldEvery / 60000
          } → ${intervalMinutes} min)`
        );
      }
    }
    // Define o agendamento (repeat)
    // await upsertJobScheduler(
    //   queueName,
    //   { every: newInterval },
    //   {
    //     removeOnComplete: true,
    //     removeOnFail: true,
    //   }
    // );
    // 🕒 Adiciona novo agendamento
    await queue.bull.add(
      queueName,
      {},
      {
        repeat: { every: newInterval },
        removeOnComplete: true,
        removeOnFail: true,
      }
    );

    logger.info(
      `✅ Job "${queueName}" agendado a cada ${intervalMinutes} min.`
    );
  } catch (error) {
    logger.error("❌ Erro ao agendar job DNS:", error);
  }
}
