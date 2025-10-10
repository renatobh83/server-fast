import type { Message as WbotMessage } from "wbotconnect";
import BuildSendMessageService from "./BuildSendMessageService";
import DefinedUserBotService from "./DefinedUserBotService";
import { SendWhatsMessageList } from "../WbotServices/SendWhatsAppMessageList";
import {
  ListMessageWelcome,
  ListMessageWelcomeTelegram,
} from "./Helpers/optionsListMensagens";
import { SendTbotAppMessageList } from "../WbotServices/SendTbotAppMessageList";
import { v4 as uuidV4 } from "uuid";
import { logger } from "../../utils/logger";
import socketEmit from "../../helpers/socketEmit";
import Ticket from "../../models/Ticket";
import {
  ChatFlowAction,
  ConditionType,
  FlowConfig,
  MessageData,
  MessageType,
  RetryDestinyType,
  Step,
  StepCondition,
} from "./types";
import ChatFlow from "../../models/ChatFlow";
import IsContactTest from "./IsContactTest";
import { obterSessaoUsuarioRedis } from "../IntegracoesServices/Genesis/Lib/sessoesRedis";
import VerifyBusinessHoursFlow from "../WbotServices/Helpers/VerifyBusinessHoursFlow";
import { CreateMessageSystemService } from "../MessageServices/CreateMessageSystemService";
import { AppError } from "../../errors/errors.helper";

// Função auxiliar para atualizar o ticket e emitir o evento de socket
const updateTicketAndEmit = async (
  ticket: Ticket,
  data: Partial<any>,
  socketType: "ticket:update" | "ticket:update_chatflow" = "ticket:update"
): Promise<void> => {
  try {
    await ticket.update(data);
    socketEmit({
      tenantId: ticket.tenantId,
      type: socketType,
      payload: ticket,
    });
  } catch (error) {
    console.log(error);
  }
};

// Função auxiliar para verificar horário comercial e fechar ticket se fora do horário
const handleBusinessHoursCheck = async (ticket: Ticket): Promise<boolean> => {
  const isBusinessHours = await VerifyBusinessHoursFlow(ticket);

  if (!isBusinessHours) {
    await updateTicketAndEmit(ticket, {
      status: "closed",
      lastMessage: "Fora do horario de atendimento",
      closedAt: new Date().getTime(),
      botRetries: 0,
      lastInteractionBot: new Date(),
    });
    return false;
  }
  return true;
};

// Função auxiliar para extrair o corpo da mensagem de forma padronizada
const getMessageBody = (msg: WbotMessage | any): string => {
  console.log(msg)
  if (msg.type === "reply_markup") {
    return msg.body.toLowerCase().trim();
  }
  if (msg.type === "list_response") {
    return String(msg.listResponse.singleSelectReply.selectedRowId)
      .toLowerCase()
      .trim();
  }
  return String(msg.body).toLowerCase().trim();
};

// Função auxiliar para enviar mensagens do bot
const sendBotMessage = async (
  tenantId: number,
  ticket: Ticket,
  messageBody: string
): Promise<void> => {
  const messageData: MessageData = {
    body: messageBody,
    fromMe: true,
    read: true,
    sendType: "bot",
  };

  await CreateMessageSystemService({
    message: messageData,
    tenantId: tenantId,
    ticket,
    status: "pending",
  });
};

// Função auxiliar para encontrar a condição do passo
const findStepCondition = (
  conditions: StepCondition[],
  msg: WbotMessage | any
): StepCondition | undefined => {
  const message = getMessageBody(msg);

  return conditions.find((condition) => {
    if (
      condition.type === ConditionType.UserSelection ||
      condition.type === ConditionType.Automatic
    ) {
      return true; // Condições 'US' e 'A' sempre retornam true para serem tratadas como fallback ou ação automática
    }
    return condition.condition?.some((c) =>
      message.startsWith(String(c).toLowerCase().trim())
    );
  });
};

export const handleNextStep = async (
  ticket: Ticket,
  chatFlow: ChatFlow,
  stepCondition: StepCondition,
  msg: WbotMessage | any
): Promise<void> => {
  if (stepCondition.action === ChatFlowAction.NextStep) {
    await updateTicketAndEmit(ticket, {
      stepChatFlow: stepCondition.nextStepId,
      botRetries: 0,
      lastInteractionBot: new Date(),
    });

    const nodesList = [...chatFlow.flow.nodeList];

    const nextStep = nodesList.find(
      (n) => n.id === stepCondition.nextStepId
    ) as Step;

    if (!nextStep) return;

    for (const interaction of nextStep.data.interactions) {
      await BuildSendMessageService({
        msg: { ...interaction, msg },
        tenantId: ticket.tenantId,
        ticket,
      });
    }
  }
};

export const handleQueueAssignment = async (
  ticket: Ticket,
  flowConfig: any,
  stepCondition: any
): Promise<void> => {
  try {
    if (stepCondition.action === ChatFlowAction.QueueDefine) {
      if (!(await handleBusinessHoursCheck(ticket))) return;

      await updateTicketAndEmit(
        ticket,
        {
          queueId: stepCondition.queueId,
          chatFlowId: null,
          stepChatFlow: null,
          botRetries: 0,
          lastInteractionBot: new Date(),
        },
        "ticket:update_chatflow"
      );

      if (flowConfig?.data?.autoDistributeTickets) {
        await DefinedUserBotService(
          ticket,
          stepCondition.queueId,
          ticket.tenantId,
          flowConfig.data.autoDistributeTickets
        );
        await ticket.reload();
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const handleUserAssignment = async (
  ticket: Ticket,
  stepCondition: StepCondition
): Promise<void> => {
  if (stepCondition.action === ChatFlowAction.UserDefine) {
    if (!(await handleBusinessHoursCheck(ticket))) return;

    await updateTicketAndEmit(ticket, {
      userId: stepCondition.userIdDestination,
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date(),
    });

    await ticket.reload();
  }
};

export const handleCloseTicket = async (
  ticket: Ticket,
  actionDetails: StepCondition
): Promise<void> => {
  if (actionDetails.action === ChatFlowAction.CloseTicket) {
    const closeTicketMessage = { message: actionDetails.closeTicket };

    const messageField = {
      data: closeTicketMessage,
      id: uuidV4(),
      type: MessageType.MediaField,
    };

    await BuildSendMessageService({
      msg: messageField,
      tenantId: ticket.tenantId,
      ticket: ticket,
    });

    await updateTicketAndEmit(ticket, {
      status: "closed",
      closedAt: new Date().getTime(),
      botRetries: 0,
      lastInteractionBot: new Date(),
    });
  }
};

export const sendCloseMessage = async (
  ticket: Ticket,
  flowConfig: FlowConfig
): Promise<void> => {
  if (flowConfig?.data?.notResponseMessage?.message) {
    const messageBody = flowConfig.data.notResponseMessage.message;
    await sendBotMessage(ticket.tenantId, ticket, messageBody);
  }
};

export const sendWelcomeMessage = async (
  ticket: Ticket,
  flowConfig: FlowConfig
): Promise<void> => {
  if (flowConfig?.data?.welcomeMessage?.message) {
    const messageBody = flowConfig.data.welcomeMessage.message;
    await sendBotMessage(ticket.tenantId, ticket, messageBody);
  }
};

export const isRetriesLimit = async (
  ticket: Ticket,
  flowConfig: FlowConfig
): Promise<boolean> => {
  const maxRetryNumber = flowConfig?.data?.maxRetryBotMessage?.number;
  const sessao = await obterSessaoUsuarioRedis(ticket.id); // carrega ou cria a sessão no Redis
  if (
    flowConfig?.data?.maxRetryBotMessage &&
    maxRetryNumber &&
    (ticket.botRetries >= maxRetryNumber - 1 ||
      sessao.errosResponse >= maxRetryNumber - 1)
  ) {
    const destinyType = flowConfig.data.maxRetryBotMessage.type;
    const { destiny } = flowConfig.data.maxRetryBotMessage;

    const updatedValues: Partial<Ticket> = {
      botRetries: 0,
      lastInteractionBot: new Date(),
    };
    const logsRetry: any = {
      ticketId: ticket.id,
      tenantId: ticket.tenantId,
    };

    if (destinyType === RetryDestinyType.Close) {
      updatedValues.status = "closed";
      updatedValues.closedAt = new Date().getTime();
      await sendCloseMessage(ticket, flowConfig);
      logsRetry.type = "retriesLimitClose";
    } else if (destinyType === RetryDestinyType.Queue && destiny) {
      updatedValues.queueId = Number(destiny);
      logsRetry.type = "retriesLimitQueue";
      logsRetry.queueId = destiny;
    } else if (destinyType === RetryDestinyType.User && destiny) {
      updatedValues.userId = Number(destiny);
      logsRetry.type = "retriesLimitUserDefine";
      logsRetry.userId = destiny;
    }

    await updateTicketAndEmit(ticket, updatedValues, "ticket:update_chatflow");

    // enviar mensagem de boas vindas à fila ou usuário
    if (destinyType !== RetryDestinyType.Close) {
      await sendWelcomeMessage(ticket, flowConfig);
    }
    return true;
  }
  return false;
};

export const isAnswerCloseTicket = async (
  flowConfig: FlowConfig,
  ticket: Ticket,
  message: string
): Promise<boolean> => {
  if (
    !flowConfig?.data?.answerCloseTicket ||
    flowConfig.data.answerCloseTicket.length < 1
  ) {
    return false;
  }

  const messageBody = message.toLowerCase().trim();

  const shouldClose = flowConfig.data.answerCloseTicket.some((condition) => {
    return String(condition).toLowerCase().trim() === messageBody;
  });

  if (shouldClose) {
    await updateTicketAndEmit(ticket, {
      chatFlowId: undefined,
      stepChatFlow: undefined,
      botRetries: 0,
      lastInteractionBot: new Date(),
      unreadMessages: 0,
      answered: false,
      status: "closed",
    });

    return true;
  }
  return false;
};
const ticketMemory = new Map<
  number,
  {
    status: string;
    queue: any[];
    menuSentAt?: number;
  }
>();

const MIN_DELAY = 5000; // 2 segundos

const VerifyStepsChatFlowTicket = async (
  msg: WbotMessage | any,
  ticket: Ticket | any
): Promise<void> => {
  try {
    // Condições iniciais para processar o fluxo de chat

    if (
      !ticket.chatFlowId ||
      ticket.status !== "pending" ||
      msg.fromMe ||
      ticket.isGroup ||
      ticket.answered
    ) {
      return;
    }


    const chatFlow = await ticket.getChatFlow();

  
    if (!chatFlow) {
      logger.warn(`ChatFlow não encontrado para o ticket ${ticket.id}`);
      return;
    }

    let celularTeste: string | undefined;
    if (chatFlow.celularTeste) {
      celularTeste = chatFlow.celularTeste.replace(/\s/g, "");
    }
    const step = chatFlow.flow.nodeList.find(
      (node: { id: any }) => node.id === ticket.stepChatFlow
    ) as Step;

    if (!step) {
      logger.warn(
        `Passo do ChatFlow não encontrado para o ticket ${ticket.id} e stepChatFlow ${ticket.stepChatFlow}`
      );
      return;
    }

    const flowConfig = chatFlow.flow.nodeList.find(
      (node: { type: string }) => node.type === "configurations"
    ) as FlowConfig;
    const stepCondition = findStepCondition(step.data.conditions, msg);

    // Verificar se a mensagem é para fechar o ticket automaticamente
    if (
      !ticket.isCreated &&
      (await isAnswerCloseTicket(flowConfig, ticket, getMessageBody(msg)))
    ) {
      return;
    }
    if (stepCondition && !ticket.isCreated) {
      // Verificar se é um contato de teste e sair se for

      if (
        await IsContactTest(ticket.contact.number, celularTeste, ticket.channel)
      ) {
        return;
      }
      if (await isRetriesLimit(ticket, flowConfig)) return;
      // Processar a condição encontrada
      await handleNextStep(ticket, chatFlow, stepCondition, msg);
      await handleQueueAssignment(ticket, flowConfig, stepCondition);
      await handleUserAssignment(ticket, stepCondition);
      await handleCloseTicket(ticket, stepCondition);

      socketEmit({
        tenantId: ticket.tenantId,
        type: "ticket:update",
        payload: ticket,
      });

      // Enviar mensagem de boas-vindas se o ticket foi atribuído a fila/usuário
      if (
        stepCondition.action === ChatFlowAction.QueueDefine ||
        stepCondition.action === ChatFlowAction.UserDefine
      ) {
        const isBusinessHours = await VerifyBusinessHoursFlow(ticket);

        if (isBusinessHours) await sendWelcomeMessage(ticket, flowConfig);
      }
    } else {
      // Se nenhuma condição foi encontrada e não é a primeira interação (isCreated)
      // ou se o ticket já foi criado e não encontrou condição (caso de retry)

      if (!ticket.isCreated) {
        if (await isRetriesLimit(ticket, flowConfig)) return;

        const defaultMessage =
          "Desculpe! Não entendi sua resposta. Vamos tentar novamente! Escolha uma opção válida.";
        const messageBody =
          flowConfig.data.notOptionsSelectMessage?.message || defaultMessage;
        await sendBotMessage(ticket.tenantId, ticket, messageBody);

        // Tratar o número de retentativas do bot
        await updateTicketAndEmit(ticket, {
          botRetries: ticket.botRetries + 1,
          lastInteractionBot: new Date(),
        });
      }
      // Reenviar interações do passo atual
      for (const interaction of step.data.interactions) {
        await BuildSendMessageService({
          msg: interaction,
          tenantId: ticket.tenantId,
          ticket,
        });
      }

      // Lógica de boas-vindas para o passo inicial
      if (step.type === "boasVindas") {
        try {
          logger.info(
            `Tentando enviar mensagem de boas-vindas para o ticket ${ticket.id}`
          );
          if (ticket.channel === "telegram") {
            await SendTbotAppMessageList({
              ticket,
              options: ListMessageWelcomeTelegram(),
            });
          } else {
            await SendWhatsMessageList({
              ticket,
              options: ListMessageWelcome(),
            });
          }

          await ticket.update({ sendWelcomeFlow: true });
          logger.info(
            `Mensagem de boas-vindas enviada com sucesso para o ticket ${ticket.id} e estado atualizado.`
          );
        } catch (error) {
          logger.error(
            `Falha ao enviar mensagem de boas-vindas ou atualizar ticket ${ticket.id}:`,
            error
          );
        }
      }
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error(
      `Erro em VerifyStepsChatFlowTicket para o ticket ${ticket.id}:`,
      error
    );
    throw new AppError("ERR_VERIFY_STEPS_CHAT_FLOW_SERVICE", 502);
  }
};

export default VerifyStepsChatFlowTicket;
