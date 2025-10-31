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

    // Define o agendamento (repeat)
    await upsertJobScheduler(
      queueName,
      { every: intervalMinutes * 60 * 1000 },
      {
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
