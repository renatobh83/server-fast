import { Ack, IncomingCall, Message, Whatsapp } from "wbotconnect";
import { logger } from "../../utils/logger";
import { blockedMessages } from "../../helpers/BlockedMessages";
import { HandleMessageSend } from "./Helpers/HandleMessageSend";
import { HandleMessageReceived } from "./Helpers/HandleMessageReceived";
import { VerifyCall } from "./Helpers/VerifyCall";
import { HandleMsgReaction } from "./Helpers/HandleMsgReaction";
// import HandleMsgAck from "./Helpers/HandleMsgAck";

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

export const wbotMessageListener = async (wbot: Session): Promise<void> => {
  setTimeout(() => {
    isSyncing = false;
    logger.warn(`Sync ${new Date().toLocaleTimeString()}`);
  }, 5000);

  wbot.onAnyMessage(async (msg: Message) => {
    if (isSyncing) {
      return;
    }
    if (msg.chatId === "status@broadcast") return;
    if (!msg.fromMe) return;
    if (msg.type === "list") return;
    const messageContent = msg.body || msg.caption || ""; // Garante que sempre haverá uma string
    const isBlocked = blockedMessages.some((blocked) => {
      return messageContent.includes(blocked);
    });
    if (msg.fromMe && isBlocked) return;
    msg.ack = 2;
    await HandleMessageSend(msg, wbot);
  });
  // tratar mensagem recebida
  wbot.onMessage(async (msg: Message) => {
    if (isSyncing) {
      return;
    }
    await HandleMessageReceived(msg, wbot);
  });

  wbot.onIncomingCall(async (call: IncomingCall) => {
    if (isSyncing) {
      return;
    }
    await VerifyCall(call, wbot);
  });

  wbot.onReactionMessage(async (msg: MessageReaction) => {
    await HandleMsgReaction(msg);
  });
  // wbot.onAck(async (ack: Ack) => {
  //   if (isSyncing) {
  //     return;
  //   }
  //   try {
  //     const message = await wbot.getMessageById(ack.id._serialized);
  //     console.log(message);

  //     if (message.type === "list") return;
  //     const messageContent = message.body || message.caption || ""; // Garante que sempre haverá uma string
  //     const isBlocked = blockedMessages.some((blocked) => {
  //       return messageContent.includes(blocked);
  //     });

  //     if (isBlocked) return;

  //     if (!message.fromMe) return;

  //     if (message && (message.ack === 2 || message.isGroupMsg)) {
  //       // await HandleMsgAck(ack);

  //       await HandleMessageSend(message, wbot);
  //     }
  //   } catch (error) {
  //     console.error("Erro ao processar ACK:", error);
  //   }
  // });
};
