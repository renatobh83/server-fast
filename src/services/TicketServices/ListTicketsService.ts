import { QueryTypes } from "sequelize";
import Ticket from "../../models/Ticket";
import UsersQueues from "../../models/UsersQueues";

import Queue from "../../models/Queue";

import ListSettingsService from "../SettingServices/ListSettingsService";

import { AppError } from "../../errors/errors.helper";
interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string[];
  date?: string;
  showAll?: string;
  userId: string;
  withUnreadMessages?: string;
  isNotAssignedUser?: string;
  queuesIds?: string[];
  includeNotQueueDefined?: string;
  tenantId: string | number;
  profile: string;
}

interface Response {
  tickets: any[];
  count: number;
  hasMore: boolean;
}

const ListTicketsService = async ({
  searchParam = "",
  pageNumber = "1",
  status,
  date,
  showAll,
  userId,
  withUnreadMessages,
  queuesIds,
  isNotAssignedUser,
  includeNotQueueDefined,
  tenantId,
  profile,
}: Request): Promise<Response> => {
  // check is admin

  const isAdminShowAll = showAll == "true" && profile === "admin";
  const isUnread =
    withUnreadMessages && withUnreadMessages == "true" ? "S" : "N";
  const isNotAssigned =
    isNotAssignedUser && isNotAssignedUser == "true" ? "S" : "N";
  const isShowAll = isAdminShowAll ? "S" : "N";
  const isQueuesIds = queuesIds ? "S" : "N";
  const NotQueueDefinedTicket = includeNotQueueDefined === "true" ? "S" : "N";
  const isSearchParam = searchParam ? "S" : "N";
  // tratar as configurações do sistema
  const settings = await ListSettingsService(tenantId);

  // // Nao visualizar ticket ja associado a um usuario
  const isNotViewAssignedTickets =
    settings?.find((s) => {
      return s.key === "NotViewAssignedTickets";
    })?.value === "enabled"
      ? "S"
      : "N";

  // const isNotViewTicketsChatBot =
  //   settings?.find(s => {
  //     return s.key === "NotViewTicketsChatBot";
  //   })?.value === "enabled"
  //     ? "S"
  //     : "N";

  if (!status && !isAdminShowAll) {
    // if not informed status and not admin, reject request
    // status = ["open", "pending"];
    throw new AppError("ERR_NO_STATUS_SELECTED", 404);
  }

  if (isAdminShowAll) {
    status = ["open", "pending", "closed"];
  }

  // Verificar se existem filas cadastradas, caso contrário,
  // não aplicar restrição
  const isExistsQueueTenant =
    (await Queue.count({
      where: { tenantId, isActive: true },
    })) > 0
      ? "S"
      : "N";

  // list queues user request
  const queues = await UsersQueues.findAll({
    where: {
      userId,
    },
  });

  // mount array ids queues
  let queuesIdsUser = queues.map((q) => q.queueId);
  // check is queues filter and verify access user queue
  if (queuesIds) {
    const newArray: number[] = [];
    queuesIds.forEach((i) => {
      const idx = queuesIdsUser.indexOf(+i);
      if (idx) {
        newArray.push(+i);
      }
    });
    queuesIdsUser = newArray.length ? newArray : [0];
  }

  // se não existir fila, ajustar para parse do sql
  if (!queuesIdsUser.length) {
    queuesIdsUser = [0];
  }

  const query = `
  select
  count(*) OVER ( ) as count,
  c."profilePicUrl",
  c."name",
  u."name" as username,
  q.queue,
  em."name" as empresaNome,
  jsonb_build_object('id', w.id, 'name', w."name") whatsapp,
  t.*
from "Tickets" t
inner join "Whatsapp" w on (w.id = t."whatsappId")
left join "Contacts" c on (t."contactId" = c.id)
left join "Empresas" em on (t."empresaId" = em.id)
left join "Users" u on (u.id = t."userId")
left join "Queues" q on (t."queueId" = q.id)
where t."tenantId" = :tenantId
and c."tenantId" = :tenantId
and t."chatFlowId" is null
and t.status in ( :status )
/* Condição simplificada para filas - admin ignora restrição de fila */
and (
  (:profile = 'admin')
  OR
  (:isExistsQueueTenant = 'S' and t."queueId" in ( :queuesIdsUser ))
  OR
  (:NotQueueDefinedTicket = 'S')
  OR
  (t."userId" = :userId)
  OR
  (exists (select 1 from "ContactWallets" cw where cw."walletId" = :userId and cw."contactId" = t."contactId"))
  OR
  (t."isGroup" = true)
  OR
  (:isExistsQueueTenant = 'N')
)
and (( :isUnread = 'S' and t."unreadMessages" > 0) OR (:isUnread = 'N'))
and ((:isNotAssigned = 'S' and t."userId" is null) OR (:isNotAssigned = 'N'))
and (
  (:isSearchParam = 'S' and (
    (t.id::varchar like :searchParam) or
    (exists (
      select 1 from "Contacts" c
      where c.id = t."contactId" and
      (upper(c."name") like upper(:searchParam) or c."number" like :searchParam)
    ))
  ) OR (:isSearchParam = 'N')
)
/* Condição corrigida para visualização de tickets */
and (
  (:profile = 'admin') /* Admin vê tudo */
  OR
  (:isNotViewAssignedTickets = 'N') /* Config desligada - mostra tudo */
  OR
  (
    :isNotViewAssignedTickets = 'S' and
    (t."userId" = :userId or t."userId" is null) /* Config ligada - mostra só do usuário ou não atribuídos */
  )
)
)
order by
  CASE t.status
    WHEN 'pending' THEN 0
    WHEN 'open' THEN 1
    WHEN 'closed' THEN 2
    ELSE 3
  END,
  t."updatedAt" DESC
limit :limit offset :offset;
`;

  const limit = 50;
  const offset = limit * (+pageNumber - 1);

  const tickets: any = await Ticket.sequelize?.query(query, {
    replacements: {
      tenantId,
      isQueuesIds,
      NotQueueDefinedTicket,
      status,
      isShowAll,
      isExistsQueueTenant,
      queuesIdsUser,
      userId,
      profile,
      isUnread,
      isNotViewAssignedTickets,
      isNotAssigned,
      isSearchParam,
      searchParam: `%${searchParam}%`,
      limit,
      offset,
    },
    type: QueryTypes.SELECT,
    nest: true,
    logging: false,
  });
  let count = 0;
  let ticketsLength = 0;
  if (tickets?.length) {
    count = tickets[0].count;
    ticketsLength = tickets.length;
  }
  const hasMore = count > offset + ticketsLength;

  return {
    tickets: tickets || [],
    count,
    hasMore,
  };
};

export default ListTicketsService;
