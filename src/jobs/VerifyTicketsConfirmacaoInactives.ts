import FindUpdateTicketsInactiveIntegracaoConfirmacao from "../services/IntegracoesServices/FindUpdateTicketsInactiveIntegracaoConfirmacao";
import { logger } from "../utils/logger";

export default {
  key: "VerifyTicketsConfirmacaoInactives",
  options: {
    removeOnComplete: 2,
    removeOnFail: 5,
  },
  async handle() {
    try {
      await FindUpdateTicketsInactiveIntegracaoConfirmacao();
      return { success: true, message: "Ticket Closed" };
    } catch (error: any) {
      logger.error({ message: "Error send messages", error });
    }
  },
};
