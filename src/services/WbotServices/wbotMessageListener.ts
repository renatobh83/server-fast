import { Ack, IncomingCall, Message, Whatsapp } from "wbotconnect";
import { logger } from "../../utils/logger";
import { blockedMessages } from "../../helpers/BlockedMessages";
import { HandleMessageSend } from "./HandleMessageSend";

interface Session extends Whatsapp {
  id: number;
}

export interface MessageReaction {
  id: string;
  msgId: string;
  reactionText: string;
  read: boolean;
  orphan: number;
  orphanReason: any;
  timestamp: number;
}
interface MessageChange extends Message {
  filename: string;
}
let isSyncing = true;

export const wbotMessageListener = async (wbot: any): Promise<void> => {
  setTimeout(() => {
    isSyncing = false;
    logger.warn(`Sync ${new Date().toLocaleTimeString()}`);
  }, 5000); // Aguarda 10 segundos para evitar salvar mensagens sincronizadas
  // tratar mensagem enviada
  wbot.onAnyMessage(async (msg: Message) => {
    if (isSyncing) {
      return;
    }
    if (msg.chatId === "status@broadcast") return;
    if (!msg.fromMe) return;
    if (msg.type === "list") return;
    const messageContent = msg.body || msg.caption || ""; // Garante que sempre haverá uma string
    const isBlocked = blockedMessages.some((blocked) =>
      messageContent.includes(blocked)
    );
    if (msg.fromMe && isBlocked) return;
    await HandleMessageSend(msg, wbot);
  });
  // tratar mensagem recebida
  wbot.onMessage(async (msg: Message) => {
    console.log("onMessage", msg);
    // if (isSyncing) {
    //   return;
    // }
    // await HandleMessageReceived(msg, wbot);
  });

  wbot.onIncomingCall(async (call: IncomingCall) => {
    // if (isSyncing) {
    //   return;
    // }
    // await VerifyCall(call, wbot);
  });

  wbot.onReactionMessage(async (msg: MessageReaction) => {
    // await HandleMsgReaction(msg);
  });
  wbot.onAck(async (ack: Ack) => {
    // if (isSyncing) {
    //   return;
    // }
    // try {
    //   // Obter a mensagem original relacionada ao ACK
    //   const message = await wbot.getMessageById(ack.id._serialized);
    //   if (!message.fromMe) return;
    //   if (message && message.ack === 2) {
    //     // await HandleMsgAck(ack);
    //   } else {
    //     console.warn(`Mensagem não encontrada para ACK ID: ${ack.id.id}`);
    //   }
    // } catch (error) {
    //   console.error("Erro ao processar ACK:", error);
    // }
  });
};
