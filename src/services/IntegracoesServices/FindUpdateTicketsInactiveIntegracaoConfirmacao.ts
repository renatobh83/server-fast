// import { QueryTypes } from "sequelize";
// import IntegracaoGenesisConfirmacao from "../../models/IntegracaoGenesisConfirmacao";
// import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
// import { getWbot } from "../../libs/wbot";
// import { STATUS_CONFIRMACAO } from "../../jobs/WebHookConfirma";

// const FindUpdateTicketsInactiveIntegracaoConfirmacao =
//   async (): Promise<void> => {
//     const query = `
//   SELECT
//     t.id
// FROM
//     "IntegracaoGenesisConfirmacao" t
// INNER JOIN
//     "Integracoes" cf
//     ON t."tenantId" = cf."tenantId"
//     AND cf.id = t."integracaoId"
// WHERE
//     to_timestamp(t."lastMessageAt") < (CURRENT_TIMESTAMP - INTERVAL '25 minutes')
// 	and t."closedAt" is null
//   `;

//     const tickets: any = await IntegracaoGenesisConfirmacao.sequelize?.query(
//       query,
//       {
//         type: QueryTypes.SELECT,
//         logging: false,
//       }
//     );

//     Promise.all(
//       tickets.map(async (item: any) => {
//         const ticket = await IntegracaoGenesisConfirmacao.findByPk(item.id);
//         if (!ticket) return;
//         const whatsapp = await GetDefaultWhatsApp(ticket.tenantId);
//         const wbot = getWbot(whatsapp.id);

//         const sendMessage = await wbot.sendText(
//           ticket.contato,
//           "Olá, percebemos que ainda não tivemos sua confirmação. Para concluir o seu atendimento, pedimos que entre em contato com a nossa central para confirmar o agendamento do seu exame. Estamos à disposição para qualquer dúvida. Agradecemos sua atenção!"
//         );

//         if (sendMessage) {
//           await ticket.update({
//             status: STATUS_CONFIRMACAO.SEM_RESPOSTA,
//             closedAt: new Date().getTime(),
//             lastMessage: "sem retorno",
//             lastMessageAt: new Date().getTime(),
//           });
//         }
//       })
//     );
//   };

// export default FindUpdateTicketsInactiveIntegracaoConfirmacao;
