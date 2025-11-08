import { Telegraf } from "telegraf";
import { getCachedBotInstance } from "./HandleMessageTelegram";
import { logger } from "../../utils/logger";
import { getCachedChannel } from "../WbotServices/Helpers/HandleMessageReceived";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import socketEmit from "../../helpers/socketEmit";
import Contact from "../../models/Contact";
import User from "../../models/User";

interface Session extends Telegraf {
    id: number;
}
export const HandleReactionTelegram = async (ctx: any, tbot: Session): Promise<void> => {
    const channel = await getCachedChannel(tbot.id);
    if (!channel) {
        logger.error(`[Telegram] Canal ${tbot.id} não encontrado.`);
        return;
    }
    const me = await getCachedBotInstance(ctx);
    const fromMe =
        me.id ===
        (ctx.message?.from?.id ||
            ctx.update?.callback_query?.from?.id ||
            ctx.update?.edited_message?.from?.id);

    const messageReaction = ctx.update.message_reaction

    const messageToUpdate = await Message.findOne({
        where: { messageId: String(messageReaction.message_id) },
        include: [
            "contact",
            {
                model: Ticket,
                as: "ticket",
                attributes: ["id", "tenantId", "apiConfig"],
            },
            {
                model: Message,
                as: "quotedMsg",
                include: ["contact"],
            },
        ],
    });
    if (messageToUpdate) {

        // 💡 Captura as reações antigas e novas
        const newEmoji = messageReaction.new_reaction?.[0]?.emoji || null;
        const oldEmoji = messageReaction.old_reaction?.[0]?.emoji || null;


        // 💬 Decide o que atualizar
        let updateData: any = {};

        if (fromMe) {
            if (newEmoji) {
                updateData = { reactionFromMe: newEmoji }; // adicionou reação
            } else if (oldEmoji) {
                updateData = { reactionFromMe: null }; // removeu reação
            }
        } else {
            if (newEmoji) {
                updateData = { reaction: newEmoji };
            } else if (oldEmoji) {
                updateData = { reaction: null };
            }
        }
        // se não há nada para atualizar, sai
        if (Object.keys(updateData).length === 0) return;

        await messageToUpdate.update(updateData);

        // Recarrega com include do ticket
        const updatedMessage = await messageToUpdate.reload({
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

}