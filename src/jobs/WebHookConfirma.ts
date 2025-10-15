import { promisify } from "node:util";
import GetDefaultWhatsApp from "../helpers/GetDefaultWhatsApp";
import GetIntegracaoById from "../helpers/GetIntegracaoById";

import IntegracaoGenesisConfirmacao from "../models/IntegracaoGenesisConfirmacao";
import { getPreparoExteno } from "../services/IntegracoesServices/Genesis/Externa/getPreparoExteno";
import { Confirmar } from "../services/IntegracoesServices/Genesis/Helpers/Confirmar";

import { logger } from "../utils/logger";
import { CancelarAgendamento } from "../services/IntegracoesServices/Genesis/Helpers/Cancelar";

import { Op } from "sequelize";
import { getWbot } from "../lib/wbot";
import { sequelize } from "../database/db";

interface RequestProps {
  contatoSend: string;
  tenantId: number;
  response: string;
  status: string;
}
export enum STATUS_CONFIRMACAO {
  RESPONDIDO = "RESPONDIDO",
  CONFIRMADO = "CONFIRMADO",
  CANCELADO = "CANCELADO",
  ERROR = "ERRO NO PROCESSO DE CONFIRMAÇÂO",
  SEM_RESPOSTA = "SEM RESPOSTA",
  ENVIADA = "ENVIADA",
}
function isBase64Meaningful(base64: any) {
  // Decodifica e mede o tamanho do conteúdo base64
  const decodedContent = Buffer.from(base64, "base64");
  const minSize = 200; // Define 200 bytes como tamanho mínimo para conteúdo relevante
  return decodedContent.length >= minSize;
}

const delay = promisify(setTimeout);
export default {
  key: "WebHookConfirma",
  options: {
    delay: 6000,
    attempts: 5,
    removeOnComplete: 2,
    removeOnFail: 5,
  },
  async handle({ contatoSend, response, status, tenantId }: RequestProps) {
    const t = await sequelize.transaction();

    try {
      const idSession = await GetDefaultWhatsApp(tenantId);
      const wbot = getWbot(idSession.id);

      const ticketIntegracao = (await IntegracaoGenesisConfirmacao.findOne({
        where: {
          tenantId,
          contato: contatoSend,
          closedAt: { [Op.is]: null },
        },
      })) as IntegracaoGenesisConfirmacao;
      if (!ticketIntegracao) {
        logger.error(`Ticket não encontrado para ${contatoSend}`);
        return;
      }

      await ticketIntegracao.update(
        {
          status: STATUS_CONFIRMACAO.RESPONDIDO,
          lastMessage: response,
          answered: true,
          lastMessageAt: new Date().getTime(),
        },
        { transaction: t }
      );

      if (status === "invalid") {
        wbot.sendText(
          contatoSend,
          "Resposta inválida. Por favor, responda apenas com uma das opções da lista."
        );
        await t.rollback(); // ← Finaliza a transação pendente

        return;
      }

      const integracao = await GetIntegracaoById(ticketIntegracao.integracaoId);
      const confirmacao = ticketIntegracao.idexterno.map(async (id) => {
        try {
          if (status === "confirm") {
            return await Confirmar({ cdAtendimento: id, integracao });
          }
          if (status === "cancel") {
            return await CancelarAgendamento({ integracao, cdAtendimento: id });
          }
        } catch (error) {
          // Captura e retorna erros para análise posterior
          console.log(error, "Erro na confirmacao dos exames");
          return error;
        }
      });

      const retornoConfirmacao = await Promise.allSettled(confirmacao);

      const errosConfirmacao = retornoConfirmacao.filter(
        (result) => result.status === "rejected"
      );

      if (errosConfirmacao.length > 0) {
        // Lidar com os erros, talvez logar com mais detalhes ou atualizar o status do ticket
        errosConfirmacao.forEach((error) =>
          logger.error(`Erro na confirmação/cancelamento: ${error.reason}`)
        );
        // Opcional: Atualizar o ticket com um status de erro específico
        await ticketIntegracao.update(
          { status: "erro_parcial_confirmacao" },
          { transaction: t }
        );
      }

      // const examesConfirmados = retornoConfirmacao
      //   .filter(
      //     (result) =>
      //       result.status === "fulfilled" &&
      //       result.value.some((exame: { dt_hora: any }) => exame.dt_hora)
      //   )
      //   .filter((result) => result.status === "fulfilled")
      //   .flatMap((result) => result.value)
      //   .filter((exame) => exame.dt_hora) // Filtra os exames que realmente possuem 'dt_hora'
      //   .map((exame) => exame.cd_atendimento); // Extrai os 'cd_atendimento' dos exames confirmados
      const examesConfirmados = retornoConfirmacao.filter(
        (result) => result.status === "fulfilled"
      );

      if (examesConfirmados.length > 0) {
        // Apenas exames confirmados seguem para o preparo
        const preparos = ticketIntegracao.procedimentos.map((i) =>
          getPreparoExteno({ integracao, atedimento: i })
        );
        const retornoPreparo = await Promise.allSettled(preparos);

        await wbot.sendText(
          contatoSend,
          `Seu agendamento foi confirmado com sucesso!
      🏥 Para garantir que tudo ocorra bem, confira as instruções de preparo no arquivo anexado.`
        );

        let mensagemPreparoEnviada = false; // Variável de controle
        for (const data of retornoPreparo) {
          if (data.status === "fulfilled") {
            if (data.value === null) {
              if (!mensagemPreparoEnviada) {
                // Verifica se a mensagem já foi enviada
                await wbot.sendText(
                  contatoSend,
                  "Identificamos que um dos seus agendamentos não possui instruções de preparo."
                );
                mensagemPreparoEnviada = true; // Marca que a mensagem foi enviada
              }
            } else if (isBase64Meaningful(data.value)) {
              const formattedBase64 = `data:text/html;base64,${data.value}`;
              await wbot.sendFile(contatoSend, formattedBase64, {
                filename: "Preparo do exame.html",
                caption: "Segue o preparo do seu exame!",
              });
            }
          }
        }

        await ticketIntegracao.update(
          {
            status: STATUS_CONFIRMACAO.CONFIRMADO,
            preparoEnviado: true,
            closedAt: new Date().getTime(),
            lastMessage: "Preparo de exame enviado",
            lastMessageAt: new Date().getTime(),
          },
          { transaction: t }
        );
        await delay(3000);
        await wbot.sendText(
          contatoSend,
          "O processo de confirmação foi concluído com sucesso. Caso tenha alguma dúvida ou precise de mais informações, entre em contato com a nossa central de atendimento. Estamos à disposição para ajudá-lo!"
        );
      } else if (status === "cancel") {
        await wbot.sendText(
          contatoSend,
          "Seu exame foi cancelado com sucesso. Se precisar reagendar, entre em contato com nossa central de atendimento."
        );

        await ticketIntegracao.update(
          {
            status: STATUS_CONFIRMACAO.CANCELADO,
            closedAt: new Date().getTime(),
            lastMessage: "Exame cancelado",
            lastMessageAt: new Date().getTime(),
          },
          { transaction: t }
        );
        await delay(1000);
        await wbot.sendText(
          contatoSend,
          "O processo de confirmação foi concluído com sucesso. Caso tenha alguma dúvida ou precise de mais informações, entre em contato com a nossa central de atendimento. Estamos à disposição para ajudá-lo!"
        );
      } else {
        await ticketIntegracao.update(
          {
            status: STATUS_CONFIRMACAO.ERROR,
            closedAt: new Date().getTime(),
            lastMessage: "Erro confirmacao",
            lastMessageAt: new Date().getTime(),
          },
          { transaction: t }
        );
        await delay(1000);
        await wbot.sendText(
          contatoSend,
          `Infelizamente não conseguimos confirmar o exame selecionado.
Favor entrar em contato com a nossa central para confirma o seu exame, estamos à disposição.`
        );
      }
      await t.commit(); // Confirma todas as operações se tudo ocorrer bem

      return {
        success: true,
        message: "WebHookConfirma success",
      };
    } catch (error: any) {
      logger.error(`Error send message confirmacao response: ${error}`);
    }
  },
};
