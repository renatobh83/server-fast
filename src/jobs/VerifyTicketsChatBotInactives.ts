import { logger } from "../utils/logger";

export default {
  key: "VerifyTicketsChatBotInactives",
  options: {
    removeOnComplete: 2,
    removeOnFail: 5,
  },
  async handle() {
    
    // try {
      logger.info("FindUpdateTicketsInactiveChatBot Initiated");
    //   await FindUpdateTicketsInactiveChatBot();
      logger.info("Finalized FindUpdateTicketsInactiveChatBot");
    // } catch (error: unknown) {
    //   const errorMessage =
    //     error instanceof Error ? error.message : "Erro desconhecido";
    //   logger.error({
    //     message: `Erro catastrófico durante a execução do job . O job continuará agendado.`,
    //     errorDetails: errorMessage,
    //     originalError: error,
    //   });
    // }
  },
};
// No seu arquivo jobs/Index.ts ou onde 'VerifyTicketsChatBotInactives' é definido
// jobs/VerifyTicketsChatBotInactivesJob.ts (exemplo)

// ... imports, logger ...

// export const key = "VerifyTicketsChatBotInactives";

// export default async function handle(jobData: any) { // Tipar jobData se possível
// 	logger.info(`Iniciando job '${key}'...`);
// 	try {
// 		logger.info("FindUpdateTicketsInactiveChatBot Initiated");
// 		await FindUpdateTicketsInactiveChatBot();
// 		logger.info("Finalized FindUpdateTicketsInactiveChatBot");

// 	} catch (error: unknown) {
// 		const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
// 		logger.error({
// 			message: `Erro catastrófico durante a execução do job '${key}'. O job continuará agendado.`,
// 			jobName: key,
// 			jobData: jobData, // Cuidado com dados sensíveis
// 			errorDetails: errorMessage,
// 			originalError: error,
// 		});
// 		// NÃO RELANCE O ERRO AQUI se você quer que o job periódico continue agendado
// 		// pelo BullMQ sem ser movido para 'failed' após N tentativas.
// 		// Se você relançar, o BullMQ o tratará como uma falha de job, que pode levar
// 		// a retries e, eventualmente, a ser movido para a fila de falhas, parando a repetição.
// 		// Se o erro for tal que o job NÃO DEVE tentar novamente até a próxima ocorrência agendada,
// 		// então capturar e logar é o suficiente.
// 		// Se você precisa que o BullMQ saiba da falha para, por exemplo, não contar como sucesso
// 		// em métricas, mas ainda quer que ele repita, a configuração de retries do job é importante.
// 		// Para um job periódico simples que deve rodar independentemente de falhas anteriores,
// 		// apenas logar o erro é uma estratégia comum.
// 	}
// }

// export const options = {
// 	// Opções padrão para este job, se houver.
// 	// removeOnComplete: false, // Já deve estar em ensureRepeatJob
// 	// removeOnFail: false,    // Para não remover da fila de jobs repetíveis em caso de falha
// };
