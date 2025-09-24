import type {
  IncomingCall,
  Whatsapp,
  Contact as WbotContact,
} from "wbotconnect";
import Setting from "../../../models/Setting";
import FindOrCreateTicketService from "../../TicketServices/FindOrCreateTicketService";
import VerifyContact from "./VerifyContact";
import { CreateMessageSystemService } from "../../MessageServices/CreateMessageSystemService";

interface Session extends Whatsapp {
  id: number;
}

export const VerifyCall = async (
  call: IncomingCall,
  wbot: Session
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const messageDefault =
        "As chamadas de voz e vídeo estão desabilitas para esse WhatsApp, favor enviar uma mensagem de texto.";

      let settings: any;

      const query = `
          select s."key", s.value, w."tenantId" from "Whatsapp" w
          inner join "Tenants" t on w."tenantId" = t.id
          inner join "Settings" s on t.id = s."tenantId"
          where w.id = '${wbot.id}'
          and s."key" in ('rejectCalls', 'callRejectMessage')
        `;
      settings = await Setting.sequelize?.query(query);

      if (settings?.length) {
        settings = settings[0];
      }
      const rejectCalls =
        settings.find((s: { key: string }) => s.key === "rejectCalls")
          ?.value === "enabled" || false;

      const callRejectMessage =
        settings.find((s: { key: string }) => s.key === "callRejectMessage")
          ?.value || messageDefault;

      const tenantId = settings.find(
        (s: { key: string }) => s.key === "rejectCalls"
      )?.tenantId;

      if (!rejectCalls) {
        resolve();
        return;
      }

      wbot.rejectCall(call.id);

      if (!call.peerJid) return;

      let callContact: WbotContact | any = await wbot.getChatById(call.peerJid);

      if (!callContact) {
        const wid = await wbot.checkNumberStatus(call.peerJid);
        if (wid.canReceiveMessage === false) {
          return;
        }
        callContact = {
          id: wid.id,
          name: wid.id.user,
          isUser: !wid.isBusiness,
          isWAContact: true,
        };
      }
      const contact = await VerifyContact(callContact, tenantId);

      const ticket = await FindOrCreateTicketService({
        contact,
        whatsappId: wbot.id!,
        unreadMessages: 1,
        tenantId,
        channel: "whatsapp",
      });

      // // create message for call
      await CreateMessageSystemService({
        message: {
          body: callRejectMessage,
          fromMe: true,
          read: true,
          sendType: "bot",
        },
        tenantId: ticket.tenantId,
        ticket,
        status: "pending",
      });
      wbot.sendText(call.peerJid, messageDefault);
    } catch (error) {
      reject(error);
    }
  });
};
