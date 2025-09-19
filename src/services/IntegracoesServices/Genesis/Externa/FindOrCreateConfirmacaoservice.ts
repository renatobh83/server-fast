// import { Op, Sequelize } from "sequelize"
// import IntegracaoGenesisConfirmacao from "../../../../models/IntegracaoGenesisConfirmacao"

// interface Notificacao {
//     paciente_nome: string
//     atendimento_data: string
//     atendimento_endereco: string
//     dados_agendamentos: any[]
//     bot: string
// }
// interface Request {
//     contato: string,
//     cliente: string,
//     idExterno: number,
//     notificacao: Notificacao
// }
// interface PropsBody {
//     bodyProcessed: Request
//     tenantId: number
//     idNumber: any
//     contato: string
//     integracaoId: number
// }
// export const FindOrCreateConfirmacaoservice = async ({
//     bodyProcessed,
//     tenantId,
//     idNumber,
//     contato,
//     integracaoId
// }: PropsBody): Promise<IntegracaoGenesisConfirmacao> => {
//     try {

//         const horarioMaisCedo = bodyProcessed.notificacao.dados_agendamentos.reduce(
//             (min, agendamento) => {
//                 return agendamento.Hora < min.Hora ? agendamento : min;
//             },
//             bodyProcessed.notificacao.dados_agendamentos[0]
//         );

//         const confirmacao = await IntegracaoGenesisConfirmacao.findOne({
//             where: {
//                 tenantId,
//                 atendimentoData: bodyProcessed.notificacao.atendimento_data,
//                 answered: false,
//                 closedAt: null,
//                 [Op.and]: [
//                     Sequelize.where(
//                         Sequelize.literal(`"idexterno"`),
//                         "@>",
//                         JSON.stringify([bodyProcessed.idExterno])
//                     ),
//                 ],
//             },
//             raw: true
//         })
//         if (!confirmacao) {

//             const novosProcedimentos: any[] = [];
//             const novosIdExternos: any[] = [];

//             for (const agendamento of bodyProcessed.notificacao.dados_agendamentos) {
//                 const { idExterno, Procedimento } = agendamento;

//                 // Verifique se idExterno já existe em novosIdExternos antes de adicionar
//                 if (!novosIdExternos.includes(idExterno)) {
//                     novosIdExternos.push(idExterno);
//                 }

//                 // Verifique se Procedimento já existe em novosProcedimentos antes de adicionar
//                 if (!novosProcedimentos.includes(Procedimento)) {
//                     novosProcedimentos.push(Procedimento);
//                 }
//             }
//             const confirmacaoObj: any = {
//                 contato: idNumber.id._serialized,
//                 contatoSend: contato,
//                 procedimentos: novosProcedimentos,
//                 idexterno: novosIdExternos,
//                 channel: "Whatsapp",
//                 atendimentoData: bodyProcessed.notificacao.atendimento_data,
//                 atendimentoHora: horarioMaisCedo.Hora,
//                 tenantId: tenantId,
//                 integracaoId

//             };

//             const ticketConfirmacao = await IntegracaoGenesisConfirmacao.create(confirmacaoObj)
//             return ticketConfirmacao
//         }
//         for (const agendamento of bodyProcessed.notificacao.dados_agendamentos) {
//             const { idExterno, Procedimento } = agendamento;
//             await IntegracaoGenesisConfirmacao.update(
//                 {
//                     procedimentos: Sequelize.literal(`
//                   CASE
//                     WHEN NOT EXISTS (
//                       SELECT 1
//                       FROM jsonb_array_elements_text(procedimentos) AS elem
//                       WHERE elem::int = ANY(ARRAY[${Procedimento}]::int[])
//                     )
//                     THEN procedimentos || '${Procedimento}'
//                     ELSE procedimentos
//                   END
//                 `),
//                     atendimentoHora: Sequelize.fn(
//                         "LEAST",
//                         Sequelize.col("atendimentoHora"),
//                         horarioMaisCedo.Hora
//                     ),
//                     idexterno: Sequelize.literal(`
//                   CASE
//                     WHEN NOT EXISTS (
//                       SELECT 1
//                       FROM jsonb_array_elements_text(idexterno) AS elem
//                       WHERE elem::int = ANY(ARRAY[${idExterno}]::int[])
//                     )
//                     THEN idexterno || '${JSON.stringify(idExterno)}'
//                     ELSE idexterno
//                   END
//                 `),
//                 },
//                 {
//                     where: {
//                         id: confirmacao.id,
//                     },
//                 }
//             );
//         }
//         return confirmacao
//     } catch (error) {
//         console.error("Error in FindOrCreateConfirmacaoService:", error);

//         // Gracefully handle the error by returning a default value or throwing a user-friendly error
//         throw new Error("An unexpected error occurred while processing the confirmation service.");
//     }
// }
