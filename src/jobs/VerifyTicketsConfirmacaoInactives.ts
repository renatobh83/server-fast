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
      logger.info("VerifyTicketsConfirmacaoInactives Initiated");
      await FindUpdateTicketsInactiveIntegracaoConfirmacao();
      logger.info("Finalized VerifyTicketsConfirmacaoInactives");
    } catch (error: any) {
      logger.error({ message: "Error send messages", error });
    }
  },
};
