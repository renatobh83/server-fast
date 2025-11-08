import { TelegramEmoji } from "telegraf/typings/core/types/typegram";
import { AppError } from "../../../errors/errors.helper";
import { getTbot } from "../../../lib/tbot";
import Contact from "../../../models/Contact";
import Message from "../../../models/Message";
import Ticket from "../../../models/Ticket";
import User from "../../../models/User";
import GetTicketWbot from "./GetTicketWbot";
import socketEmit from "../../../helpers/socketEmit";

const VALID_REACTIONS_TBOT = [
  "👍", "👎", "❤", "🔥", "🥰", "👏", "😁", "🤔", "🤯", "😱", "🤬", "😢", "🎉", "🤩", "🤮", "💩", "🙏", "👌", "🕊", "🤡", "🥱", "🥴", "😍", "🐳", "❤‍🔥", "🌚", "🌭", "💯", "🤣", "⚡", "🍌", "🏆", "💔", "🤨", "😐", "🍓", "🍾", "💋", "🖕", "😈", "😴", "😭", "🤓", "👻", "👨‍💻", "👀", "🎃", "🙈", "😇", "😨", "🤝", "✍", "🤗", "🫡", "🎅", "🎄", "☃", "💅", "🤪", "🗿", "🆒", "💘", "🙉", "🦄", "😘", "💊", "🙊", "😎", "👾", "🤷‍♂", "🤷", "🤷‍♀", "😡"
];

export const SendReactionMessage = async (
  messageid: string,
  reaction: string
) => {
  try {
    const messageExist = await Message.findByPk(messageid, {
      include: [
        {
          model: Ticket,
          as: "ticket",
          include: [
            { model: Contact, as: "contact" },
            { model: User, as: "user" },
          ],
        },
      ],

    });

    if (!messageExist) {
      throw new AppError("ERR_SENDING_WAPP_MSG", 404);
    }
    if (messageExist.ticket.channel === "whatsapp") {
      const wbot = await GetTicketWbot(messageExist.ticket);
      await wbot.sendReactionToMessage(messageid, reaction);
    } else if (messageExist.ticket.channel === "telegram"){
      const chatId = messageExist.ticket.contact.telegramId as string;

      const tbot = getTbot(messageExist.ticket.whatsappId);
      if (!VALID_REACTIONS_TBOT.includes(reaction)) {
        console.warn(`Emoji ${reaction} não é suportado pelo Telegram como reação`);
        return;
      }
      await tbot.telegram.callApi("setMessageReaction", {
        chat_id: chatId,
        message_id: +messageExist.messageId,
        reaction: [{ type: "emoji", emoji: reaction as unknown as TelegramEmoji }]

      })
      const updateData = { reactionFromMe: reaction };

      await messageExist.update(updateData);
      // Recarrega com include do ticket
      const updatedMessage = await messageExist.reload({
        include: [
          {
            model: Ticket,
            as: "ticket",
            include: [
              { model: Contact, as: "contact" },
              { model: User, as: "user" },
            ],
          },
        ],
      });

      socketEmit({
        tenantId: updatedMessage.ticket.tenantId,
        type: "chat:update",
        payload: updatedMessage,
      });


    }

  } catch (error) {
    console.log(error)
    throw new AppError("ERR_SENDING_WAPP_MSG", 501);
  }
};
