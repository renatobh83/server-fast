import { redisClient } from "../lib/redis";
import { gerarNfsePDF } from "../services/IntegracoesServices/NFE/PDF/gerarPdf";
import { logger } from "../utils/logger";

export default {
  key: "pdfQueue",
  options: {
    removeOnComplete: {
      age: 3600, // em segundos -> 1 hora
      count: 100, // mantém no máximo 100 jobs completados
    },
    removeOnFail: {
      age: 86400, // mantém falhas por 1 dia
    },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    timeout: 120000,
  },
  async handle(data: any) {
    const { payload, jobId } = data;
    try {
      const redisKey = `job_result:${jobId}`;
      const resultString = await redisClient.get(redisKey);
      // 🚀 Se já existe, retorna sem gerar de novo
      if (resultString) {
        logger.info(
          `📦 Resultado já existente no Redis para job ${jobId}, não será gerado novamente`
        );
        return {
          success: true,
          cached: true,
          result: JSON.parse(resultString),
        };
      }
      const result = await gerarNfsePDF(payload);
      logger.info(`✅ gerarNfsePDF concluído`);
      if (!result || !result.dadosParaTemplate) {
        throw new Error("gerarNfsePDF retornou resultado inválido");
      }
      await redisClient.set(redisKey, JSON.stringify(result), "EX", 86400); // 86400s = 24h
      return { success: true, cached: false, result };
    } catch (error: any) {
      console.error(`❌ ERRO no job ${jobId}:`, error);
      console.error(`📋 Stack trace:`, error.stack);

      // Log mais detalhado dependendo do tipo de erro
      if (error.message.includes("timeout")) {
        console.error(`⏰ Timeout ocorreu durante geração do PDF`);
      }

      if (error.message.includes("navigation")) {
        console.error(`🌐 Erro de navegação/no browser`);
      }

      throw new Error(`Falha na geração do PDF [${jobId}]: ${error.message}`);
    }
  },
};
