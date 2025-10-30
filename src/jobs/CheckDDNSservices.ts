import { CheckDDNSservices } from "../services/DnsServices/CheckDDNSservices";
import { logger } from "../utils/logger";

export default {
  key: "CheckDDNSservices",
  options: {
    removeOnComplete: 2,
    removeOnFail: 5,
  },
  async handle() {
    try {
      await CheckDDNSservices();
      return { success: true, message: "dns check" };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({
        message: `Erro catastrófico durante a execução do job . O job continuará agendado.`,
        errorDetails: errorMessage,
        originalError: error,
      });
    }
  },
};
