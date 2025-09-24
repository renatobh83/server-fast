import { Telegraf } from "telegraf";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import VerifyContact from "./TelegramVerifyContact";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import VerifyMediaMessage from "./TelegramVerifyMediaMessage";
import VerifyMessage from "./TelegramVerifyMessage";
// import verifyBusinessHours from "../WbotServices/Helpers/VerifyBusinessHours";
import VerifyStepsChatFlowTicket from "../ChatFlowServices/VerifyStepsChatFlowTicket";

interface Session extends Telegraf {
  id: number;
}

const HandleMessage = async (ctx: any, tbot: Session): Promise<void> => {
  const channel = await ShowWhatsAppService({ id: tbot.id });

  let message;
  let updateMessage: any = {};
  // const { message, update }: any = ctx;
  message = ctx?.message || ctx.update.callback_query.message;
  updateMessage = ctx?.update;

  // Verificar se mensagem foi editada.
  if (!message && updateMessage) {
    message = updateMessage?.edited_message;
  }

  const chat = message?.chat;
  const me = await ctx.telegram.getMe();
  const fromMe = me.id === ctx.message?.from.id;

  const messageData = {
    ...message,
    // compatibilizar timestamp com js
    timestamp: +message.date * 1000,
  };

  const contact = await VerifyContact(ctx, channel.tenantId);

  const ticket = await FindOrCreateTicketService({
    contact,
    whatsappId: tbot.id!,
    unreadMessages: fromMe ? 0 : 1,
    tenantId: channel.tenantId,
    msg: { ...messageData, fromMe },
    channel: "telegram",
  });
  if (ticket?.isFarewellMessage) {
    return;
  }

  if (!messageData?.text && chat?.id) {
    await VerifyMediaMessage(ctx, fromMe, ticket, contact);
  } else {
    await VerifyMessage(ctx, fromMe, ticket, contact);
  }

  // const isBusinessHours = await verifyBusinessHours(
  //   {
  //     fromMe,
  //     timestamp: messageData.timestamp,
  //   },
  //   ticket
  // );

  await VerifyStepsChatFlowTicket(
    {
      fromMe,
      body: message.reply_markup
        ? ctx.update.callback_query.data
        : message.text,
      type: "reply_markup",
    },
    ticket
  );
};

export default HandleMessage;
