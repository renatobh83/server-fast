import { redisClient } from "../lib/redis";
import { getWbot } from "../lib/wbot";
import IntegracaoGenesisConfirmacao from "../models/IntegracaoGenesisConfirmacao";
import { logger } from "../utils/logger";

const sending: any = {};

const LOCK_TIMEOUT = 30; // Tempo em segundos que o lock será mantido
enum STATUS_CONFIRMACAO {
  RESPONDIDO = "RESPONDIDO",
  CONFIRMADO = "CONFIRMADO",
  CANCELADO = "CANCELADO",
  ERROR = "ERRO NO PROCESSO DE CONFIRMAÇÂO",
  SEM_RESPOSTA = "SEM RESPOSTA",
  ENVIADA = "ENVIADA",
}
export default {
  key: "SendMessageConfirmar",
  options: {
    delay: 1000,
    attempts: 2,
    removeOnComplete: 2,
    removeOnFail: 5,
  },
  async handle(data: any) {
    const { ticket, sessionId, bodyProcessed } = data;
    try {
      const contato = ticket.contato;
      const wbot = getWbot(sessionId);

      if (!contato) {
        logger.error("Cotnato nao informado");
        throw new Error("Contato não informado");
      }

      const lockKey = `lock:${contato}`;

      const isLocked = await redisClient.exists(lockKey);
      if (isLocked) {
        // Se o lock existe, ignora a nova adição à fila
        logger.info(
          `Mensagem para ${contato} não foi adicionada à fila (lock ativo).`
        );
        return;
      }
      //       // Se não existe lock, cria um lock temporário
      await redisClient.set(lockKey, "locked", "EX", LOCK_TIMEOUT);

      if (sending[ticket.tenantId]) return;

      sending[ticket.tenantId] = true;
      const quantidadeExames = bodyProcessed.dados_agendamentos.length;
      const plural =
        quantidadeExames > 1 ? "exames agendados" : "exame agendado";
      const horarioTexto =
        quantidadeExames > 1
          ? `a partir das ${ticket.atendimentoHora} `
          : `às ${ticket.atendimentoHora}`;

      const sendMessage = await wbot.sendListMessage(contato, {
        buttonText: "Confirmar",
        description: `
Olá ${bodyProcessed.paciente_nome}. 😊,
Nós, da Clínica Lume, temos um importante lembrete pra você:

🗓 Você tem ${plural} na nossa clínica.

Seu atendimento está agendado para o dia ${ticket.atendimentoData} ${horarioTexto}.

⚠ Importante:
  - Paciente deverá apresentar pedido médico, carteira do convênio e documento de identificação com foto.
  - Trazer todos os exames anteriores realizados da área a ser examinada.
                            `,
        sections: [
          {
            title: "Confirmação do agendamento",
            rows: [
              {
                rowId: "1",
                title: "✅ Confirmar ",
                description: "Desejo confirmar o agendamento.",
              },
              {
                rowId: "2",
                title: "🚫 Cancelar",
                description: "Desejo cancelar o agendamento.",
              },
            ],
          },
        ],
      });
      if (sendMessage) {
        try {
          await IntegracaoGenesisConfirmacao.update(
            {
              enviada: new Date(sendMessage.timestamp * 1000),
              status: STATUS_CONFIRMACAO.ENVIADA,
              lastMessageAt: sendMessage.timestamp,
            },
            {
              where: {
                id: ticket.id,
              },
            }
          );
        } catch (error) {
          console.log(error);
        }
      }
      sending[ticket.tenantId] = false;
      return {
        success: true,
        message: "Mensagem Confirmacao enviada!",
      };
    } catch (error: any) {
      throw new Error(error);
    }
  },
};
