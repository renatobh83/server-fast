import FindUpdateTicketsInactiveChatBot from "../services/TicketServices/FindUpdateTicketsInactiveChatBot";
import { logger } from "../utils/logger";

export default {
  key: "VerifyTicketsChatBotInactives",
  options: {
    removeOnComplete: 2,
    removeOnFail: 5,
  },
  async handle() {
    try {
      await FindUpdateTicketsInactiveChatBot();

      return { success: true, message: "Ticket Closed" };
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
