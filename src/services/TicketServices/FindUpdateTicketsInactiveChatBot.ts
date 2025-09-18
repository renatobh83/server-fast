import { QueryTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Ticket from "../../models/Ticket";
import socketEmit from "../../helpers/socketEmit";
// import BuildSendMessageService, { MessageType } from "../ChatFlowServices/BuildSendMessageService";
import Contact from "../../models/Contact";
import User from "../../models/User";

const FindUpdateTicketsInactiveChatBot = async (): Promise<void> => {
  const query = `
    select
    t.id,
    --t."contactId",
    --t."lastInteractionBot",
    --t.status,
    --config->'configurations',
    --concat(config->'data'->'notResponseMessage'->'time', ' MINUTES')::interval as time_action,
	config->'data'->'notResponseMessage'->'message' as message,
    config->'data'->'notResponseMessage'->'type' as type_action,
    config->'data'->'notResponseMessage'->'destiny' as destiny
    from "Tickets" t
    inner join "ChatFlows" cf on t."tenantId" = cf."tenantId" and cf.id = t."chatFlowId"
    inner join "Settings" s on s."tenantId" = cf."tenantId" and s."key" = 'botTicketActive'
    cross join lateral json_array_elements(cf.flow->'nodeList') as config
    where t."chatFlowId" = s.value::integer
    and t.status = 'pending'
    and config->>'type' = 'configurations'
    and t."lastInteractionBot" < CURRENT_TIMESTAMP - (config->'data'->'notResponseMessage'->>'time')::int * interval '1 minute'
    and (t."queueId" is null and t."userId" is null)
  `;

  const tickets: any = await Ticket.sequelize?.query(query, {
    type: QueryTypes.SELECT,
    logging: false,
  });

  Promise.all(
    tickets.map(async (item: any) => {
      const ticket = await Ticket.findByPk(item.id, {
        include: [
          {
            model: Contact,
            as: "contact",
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "name"],
          },
          {
            association: "whatsapp",
            as: "whatsapp",
            attributes: ["id", "name"],
          },
        ],
      });
      if (!item.destiny && ticket) {
        const messageField = {
          data: { message: item.message },
          id: uuidv4(),
          // type: MessageType.MediaField,
        };
        const sendMessageParams = {
          msg: messageField,
          tenantId: ticket.tenantId,
          ticket: ticket,
        };

        // await BuildSendMessageService(sendMessageParams);
        ticket.update({
          status: "closed",
          chatFlowId: null,
          stepChatFlow: null,
          closedAt: new Date().getTime(),
          botRetries: 0,
          lastInteractionBot: new Date(),
        });
      }

      if (ticket) {
        try {
          const values: any = {
            chatFlowId: null,
            stepChatFlow: null,
            botRetries: 0,
            lastInteractionBot: new Date(),
          };

          // instance.type_action: 1 = fila | 2 = usuario
          if (item.type_action == 1) {
            values.queueId = item.destiny;
          }
          if (item.type_action == 2) {
            values.userId = item.destiny;
          }
          await ticket.update(values);
          socketEmit({
            tenantId: ticket.tenantId,
            type: "ticket:update",
            payload: ticket,
          });
        } catch (error) {
          console.log(error);
        }
      }
    })
  );
};

export default FindUpdateTicketsInactiveChatBot;
