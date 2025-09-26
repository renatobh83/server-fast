import Ticket from "../../../models/Ticket";
import { dispatchAction } from "./actions/action_dispatcher";
import {
  obterSessaoUsuarioRedis,
  salvarSessaoUsuario,
} from "./Lib/sessoesRedis";

export const actionsIntegracaoGenesis = async (
  integracao: any,
  ticket: Ticket,
  msg: any
) => {
  const action = msg.data.webhook?.acao!;
  console.log("Estou no Action", action);

  const sessao = await obterSessaoUsuarioRedis(ticket.id); // carrega ou cria a sessão no Redis
  const input: any = ticket.lastMessage;

  try {
    const result = await dispatchAction({
      action,
      integracao,
      ticket,
      msg,
      sessao,
      input,
    });

    await salvarSessaoUsuario(ticket.id, sessao);
    return result;
  } catch (error) {
    console.error("Erro na execução da ação:", error);
    return "Desculpe, ocorreu um erro inesperado. Por favor, tente novamente mais tarde.";
  }
};

// import dayjs from "dayjs";
// import customParseFormat from 'dayjs/plugin/customParseFormat';
// dayjs.extend(customParseFormat);
// import Ticket from "../../../models/Ticket";
// import { validarCPF } from "../../../utils/validarCPF";
// import { doAgendaHorario, doAgendaPost, doAgendaSemanal, getListProcedimento, ListarPlanos, ListarUnidades, ObsplanoAsync } from "./Helpers/AgendarExame";
// import { Confirmar } from "./Helpers/Confirmar";
// import { ConsultaAgendamentos } from "./Helpers/ConsultaAgendamentos";
// import { ConsultaAtendimentos } from "./Helpers/ConsultaAtendimentos";
// import { ConsultaPaciente } from "./Helpers/ConsultaPaciente";
// import { GetLaudo } from "./Helpers/GetLaudo";
// import { getPreparo } from "./Helpers/GetPreparo";
// import { RecuperarAcesso } from "./Helpers/recuperar";
// import { Buffer } from 'buffer';
// import { generateRegistrationLink } from "./Lib/RegistrationLink";
// import { obterHorarioRedis, salvarHorarioRedis } from "./Lib/horarioStoreRedis";
// import { adicionarMinutos, gerarIntervalosPorPeriodo } from "./utils";

// type SessaoUsuario = {
//     dadosPaciente: any;
//     unidadeSelecionada: any;
//     planoSelecionado: any;
//     examesParaAgendar: any[];
//     ultimaDataConsulta: any
//     horarioSelecionado: any
//     cadastro: any
//     cdHorario: any
//     periodo: string
//     intervaloSelecionado: string
// };
// // Exemplo com Map para gerenciar sessões:
// const sessoes: Map<string, SessaoUsuario> = new Map();

// interface ResponseListaAtendimento {
//     ds_medico: string;
//     dt_data: string;
//     ds_procedimento: string;
//     cd_exame: string;
// }

// interface ResponseListaPlanos {
//     cd_plano: number;
//     ds_plano: string;
//     cd_fornecedor: number;
//     ds_fornecedor: string;
// }
// interface ResponseListaAgendamentos {
//     cd_atendimento: number;
//     ds_status: string;
//     cd_paciente: number;
//     ds_paciente: string;
//     ds_paciente_social: null;
//     dt_data: string;
//     dt_hora_chegada: string;
//     dt_hora: string;
//     ds_empresa: string;
//     cd_procedimento: string;
//     cd_modalidade: number;
//     ds_modalidade: string;
// }

// let listaAtendimentos: ResponseListaAtendimento[];
// let listaAgendamentos: ResponseListaAgendamentos[];
// let listaPlanos: ResponseListaPlanos[];
// export let listaUnidades: any[]
// let horariosAgendamento: any[]
// let listaExames: any[]

// function obterSessaoUsuario(userId: any): SessaoUsuario {
//     if (!sessoes.has(userId)) {
//         sessoes.set(userId, {
//             dadosPaciente: {},
//             unidadeSelecionada: null,
//             planoSelecionado: null,
//             examesParaAgendar: [],
//             ultimaDataConsulta: dayjs().format('DD/MM/YYYY'),
//             horarioSelecionado: null,
//             cadastro: null,
//             cdHorario: null,
//             intervaloSelecionado: '',
//             periodo: ''

//         });
//     }
//     return sessoes.get(userId)!;
// }
// export const actionsIntegracaoGenesis = async (integracao: any, ticket: Ticket, msg: any) => {
//     const action = msg.data.webhook?.acao!
//     console.log(action)

//     const sessao = obterSessaoUsuario(ticket.id);
//     const input: any = ticket.lastMessage; // exemplo vindo do body.body
//     const servicosDisponiveis = ["Agendamentos", "Laudos"]
//     if (action === "recuperar") {
//         const emailMatch = input.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
//         const emailMsg = emailMatch ? emailMatch[0] : null;
//         if (!emailMatch) {
//             ticket.update({
//                 botRetries: ticket.botRetries + 1,
//                 lastInteractionBot: new Date(),
//             });
//             return "Dados inseridos inválido, favor conferir e enviar novamente."
//         }
//         let dtNascimento = null
//         if (emailMsg) {
//             dtNascimento = input.replace(emailMsg, '').trim();
//         }
//         try {
//             ticket.update({
//                 status: "closed",
//                 closedAt: new Date().getTime(),
//                 botRetries: 0,
//                 lastInteractionBot: new Date(),
//             });
//             const data = await RecuperarAcesso({ integracao, email: emailMsg, dtNascimento })
//             return `${data[0].Sucesso} Atendimento será finalziado.`
//         } catch (error) {
//             ticket.update({
//                 status: "closed",
//                 closedAt: new Date().getTime(),
//                 botRetries: 0,
//                 lastInteractionBot: new Date(),
//             });
//             return "Não conseguimos localizar seu cadastro com as informações inseridas, favor entrar em contato com a nossa central e solicitar o seu acesso. Atendimento será finalziado."
//         }

//     }

//     else if (action === "consulta") {
//         try {

//             const cpfMatch = input.match(/\b\d{11}\b/);
//             if (!cpfMatch) {
//                 ticket.update({
//                     botRetries: ticket.botRetries + 1,
//                     lastInteractionBot: new Date(),
//                 });

//                 return "Dados inseridos inválido, favor conferir e enviar novamente."
//             }
//             if (!validarCPF(cpfMatch[0])) {
//                 ticket.update({
//                     botRetries: ticket.botRetries + 1,
//                     lastInteractionBot: new Date(),
//                 });

//                 return "Dados inseridos inválido, favor conferir e enviar novamente."
//             }
//             ticket.update({
//                 botRetries: 0,
//                 lastInteractionBot: new Date(),
//             });
//             const cpf = cpfMatch[0]
//             sessao.cadastro = cpf
//             const consultaAPI = await ConsultaPaciente({ senha: "0", integracao, cpf })
//             if (consultaAPI.error.trim() === "Senha inválida !") {
//                 return "Para continuar, por favor, digite sua senha de acesso."
//             }
//             else if (consultaAPI.error.trim() === "Cadastro não encontrado !") {
//                 if (ticket.channel === "whatsapp") {
//                     const options =
//                     {
//                         buttonText: "📌 Como podemos seguir?",
//                         description: "Desculpe, não localizei seu cadastro. 😔",
//                         sections: [{
//                             title: "📍 Menu Principal",
//                             rows: [
//                                 {
//                                     rowId: "cadastrar",
//                                     title: "🗒️  Me cadastrar",
//                                     description: "Receber link para cadastro."
//                                 },
//                                 {
//                                     rowId: "suporte",
//                                     title: "📞 Falar com o suporte",
//                                     description: "Entre em contato com nossa equipe."
//                                 }, {
//                                     rowId: "3",
//                                     title: "❌ Finalizar atendimento",
//                                     description: "Encerrar esta conversa."
//                                 }]
//                         }]
//                     }
//                     return options
//                 } else {
//                     const rows = [[{
//                         callback_data: "cadastrar",
//                         text: "Receber link para cadastro",
//                     }]]
//                     rows.push([{
//                         callback_data: "suporte",
//                         text: "📞 Falar com o suporte",
//                     }])
//                     rows.push([{
//                         callback_data: "3",
//                         text: "❌ Finalizar Atendimento"
//                     }])
//                     const options = {
//                         body: `Desculpe, não localizei seu cadastro. 😔
// Como podemos seguir?`,
//                         hasButtons: true,
//                         reply_markup: {
//                             inline_keyboard: rows
//                         }
//                     }
//                     return options
//                 }
//             } else {
//                 ticket.update({
//                     botRetries: ticket.botRetries + 1,
//                     lastInteractionBot: new Date(),
//                 });
//                 return "Desculpe, estamos enfrentando dificuldades técnicas. Tente novamente mais tarde.";
//             }
//         } catch (error) {
//             return "Desculpe, estamos enfrentando dificuldades técnicas. Tente novamente mais tarde.";
//         }
//     }
//     else if (action === "solicitarSenha") {
//         const senha = input.trim()
//         const cpf = sessao.cadastro
//         const retornoConsulta = await ConsultaPaciente({ senha, integracao, cpf })
//         if (retornoConsulta.error) {
//             ticket.update({
//                 botRetries: ticket.botRetries + 1,
//                 lastInteractionBot: new Date(),
//             });

//             if (ticket.botRetries === 1 || ticket.botRetries === 2) {

//                 return "Dados inseridos inválido, favor conferir e enviar novamente."
//             } else if (ticket.botRetries >= 3) {
//                 ticket.update({
//                     botRetries: 0,
//                     lastInteractionBot: new Date(),
//                 });
//                 return 'Os dados fornecidos não conferem. Favor digitar *recuperar* para cadastrar uma nova senha.';
//             }

//         }

//         sessao.dadosPaciente = retornoConsulta[0];

//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         if (ticket.channel === "whatsapp") {
//             const options =
//             {
//                 buttonText: "📌 Escolha uma opção",
//                 description: `Olá, ${sessao.dadosPaciente.ds_paciente}! Como podemos te ajudar hoje?`,
//                 sections: [{
//                     title: "📍 Menu Principal",
//                     rows: [
//                         {
//                             rowId: "servicos",
//                             title: "🔍 Consultar serviços disponíveis",
//                             description: "Veja quais serviços estão disponíveis para você."
//                         },
//                         {
//                             rowId: "suporte",
//                             title: "📞 Falar com o suporte",
//                             description: "Entre em contato com nossa equipe."
//                         }, {
//                             rowId: "3",
//                             title: "❌ Finalizar atendimento",
//                             description: "Encerrar esta conversa."
//                         }]
//                 }]
//             }

//             return options
//         } else {
//             const rows = [[{
//                 callback_data: 'servicos',
//                 text: "🔍 Consultar serviços disponíveis",
//             }]]
//             rows.push([{

//                 callback_data: "suporte",
//                 text: "📞 Falar com o suporte",
//             }])
//             rows.push([{
//                 callback_data: "3",
//                 text: "❌ Finalizar Atendimento"
//             }])

//             const options = {
//                 body: `Olá, ${sessao.dadosPaciente.ds_paciente}! Como podemos te ajudar hoje?`,
//                 hasButtons: true,
//                 reply_markup: {
//                     inline_keyboard: rows
//                 }
//             }
//             return options
//         }
//     }
//     else if (action === "linkcadastro") {
//         const cpfCadastro = sessao.cadastro
//         const link = await generateRegistrationLink(cpfCadastro, integracao)
//         ticket.update({
//             status: "closed",
//             closedAt: new Date().getTime(),
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         return `Clique no link para se cadastrar:\n${link}\n\nO link irá expirar em 15minutos.\nEsse atendimento sera encerrado.`
//     }
//     else if (action === "servicoescolhido") {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         if (ticket.channel === "whatsapp") {
//             const rowsListMessage = [
//                 ...servicosDisponiveis.map(servico => ({
//                     rowId: `${servico}`,
//                     title: servico,
//                     description: `Desejo acessar: ${servico}`
//                 })),

//                 {
//                     rowId: "suporte",
//                     title: "📞 Falar com o suporte",
//                     description: "Entre em contato com nossa equipe."
//                 }, {
//                     rowId: "3",
//                     title: "❌ Finalizar atendimento",
//                     description: "Encerrar esta conversa."
//                 } // Adiciona o novo item ao final do array
//             ];

//             const options =
//             {
//                 buttonText: "👉 Clique Aqui 👈",
//                 description: "Para qual serviço deseja atendimento.",
//                 sections: [{
//                     title: "Selecione uma opção",
//                     rows: rowsListMessage
//                 }]
//             }

//             return options
//         } else {
//             const rowsListMessage = servicosDisponiveis.map(servico => ([
//                 {
//                     callback_data: `${servico}`,
//                     text: `${servico} `,
//                 }
//             ]));
//             rowsListMessage.push([{

//                 callback_data: "suporte",
//                 text: "📞 Falar com o suporte",
//             }])
//             rowsListMessage.push([{
//                 callback_data: "3",
//                 text: "❌ Finalizar Atendimento"
//             }])
//             const options = {
//                 body: "Para qual serviço deseja atendimento.",
//                 hasButtons: true,
//                 reply_markup: {
//                     inline_keyboard: rowsListMessage
//                 }
//             }
//             return options
//         }
//     }
//     else if (action === "agendamentos") {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });

//         listaAgendamentos = await ConsultaAgendamentos({ ticket, codPaciente: sessao.dadosPaciente.cd_paciente, integracao })

//         if (listaAgendamentos.length > 0) {

//             let message = "📅 *Seus próximos agendamentos:*\n\n";
//             listaAgendamentos.forEach((item: { ds_modalidade: any; dt_data: any; dt_hora: any; }, index: number) => {
//                 message += `📍 *${index + 1}. Exame de:* ${item.ds_modalidade}\n`;
//                 message += `📆 *Data:* ${item.dt_data} | 🕒 *Hora:* ${item.dt_hora}\n\n`;
//             });
//             message += "✅ Para confirmar um agendamento, digite o número correspondente.\n";
//             message += "📄 6 - Para preparo.\n";
//             message += "🔙 7 - Voltar menu anterior.\n";
//             message += "📞 9 - Falar com o suporte.\n";
//             message += "❌ 8 - Para encerrar atendimento.\n\n"
//             message += "_Digite o número da opção desejada_."
//             return message
//         } else {
//             let message = `Olá! 😊 Queremos avisá-lo que, no momento, você não tem nenhum agendamento conosco.
// Se precisar marcar um horário ou tiver qualquer dúvida, estamos à disposição para ajudar! É só nos chamar. 📅✨\n\n`;
//             message += "📞 9 - Falar com o suporte.\n";
//             message += "🔙 7 - Para menu anterior.\n";
//             message += "❌ 8 - Para encerrar.\n\n"
//             message += "_Digite o número da opção desejada_."
//             return message
//         }
//     } else if (action === "laudo") {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         listaAtendimentos = await ConsultaAtendimentos({ integracao, codigoPaciente: sessao.dadosPaciente.cd_paciente })
//         if (listaAtendimentos.length) {
//             let message =
//                 "👋 *Prezado(a),* segue a relação dos seus atendimentos recentes com laudos disponíveis:\n\n" +
//                 "📌 *Para acessar um laudo, informe o número correspondente à opção desejada:*\n\n";

//             listaAtendimentos.forEach((item, index) => {
//                 message += `📝 *${index + 1}.* 📅 *Data do Exame:* ${item.dt_data}\n`;
//                 message += `    *Descrição:* ${item.ds_procedimento}\n\n`;
//             });

//             message +=
//                 "📅 Caso precise de um laudo de outro período, entre em contato com nossa central para solicitar.\n\n" +
//                 "📞 9 - Falar com o suporte.\n" +
//                 "🔄 6 - Retornar ao menu.\n" +
//                 "❌ 7 -  Encerrar o atendimento.\n\n" +
//                 "_Digite o número da opção desejada_."
//             return message
//         } else {
//             let message =
//                 "⚠️ *Não encontramos exames recentes com laudo disponível.*\n\n" +
//                 "📞 Por favor, entre em contato com a nossa *central de atendimento* para mais informações.\n\n" +
//                 "🙏 Agradecemos pela sua compreensão!";
//             return message
//         }

//     } else if (action === "laudopdf") {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
// const selectedLaudo = listaAtendimentos[+ticket.lastMessage - 1];

//         await GetLaudo({ cdExame: +selectedLaudo.cd_exame, integracao, ticket, exame: selectedLaudo.ds_procedimento, cdPaciente: sessao.dadosPaciente.cd_paciente })

//         let message =
//             "📅 Caso precise de um laudo de outro período, entre em contato com nossa central para solicitar.\n\n" +
//             "📞 9 - Falar com o suporte.\n" +
//             "🔄 6 - Retornar ao menu.\n" +
//             "❌ 7 - Encerrar o atendimento.\n\n" +
//             "_Digite o número da opção desejada_."
//         return message
//     }
//     else if (action === 'preparo') {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         if (ticket.channel === "whatsapp") {
//             const rowsListMessage = [
//                 ...listaAgendamentos.map(agenda => ({
//                     rowId: `Preparo_${agenda.cd_procedimento}`,
//                     title: `📌 ${agenda.ds_modalidade}`,
//                     description: `${agenda.dt_data} - ${agenda.dt_hora}`
//                 })),
//                 {
//                     rowId: "suporte",
//                     title: "📞 Falar com o suporte",
//                     description: "Entre em contato com nossa equipe."
//                 }, {
//                     rowId: "3",
//                     title: "❌ Finalizar atendimento",
//                     description: "Encerrar esta conversa."
//                 } // Adiciona o novo item ao final do array

//             ];

//             const options =
//             {
//                 buttonText: "📋 Escolher agendamento",
//                 description: "Selecione o agendamento para consultar o preparo:",
//                 sections: [{
//                     title: "📍 Agendamento disponíveis",
//                     rows: rowsListMessage
//                 }]
//             }
//             return options
//         } else {

//             const rowsListMessage = listaAgendamentos.map(agenda => ([
//                 {
//                     callback_data: `Preparo_${agenda.cd_procedimento}`,
//                     text: `📌 ${agenda.dt_data} ${agenda.dt_hora} - ${agenda.ds_modalidade.slice(0, 10)}`
//                 }
//             ]));
//             rowsListMessage.push([{
//                 callback_data: "suporte",
//                 text: "📞 Falar com o suporte",
//             }])
//             rowsListMessage.push([{
//                 callback_data: "3",
//                 text: "❌ Finalizar Atendimento"
//             }])
//             const options = {
//                 body: "Selecione o agendamento para consultar o preparo:",
//                 hasButtons: true,
//                 reply_markup: {
//                     inline_keyboard: rowsListMessage
//                 }
//             }
//             return options
//         }
//     } else if (action === "sendpreparo") {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         let procedimento: string = ''
//         if (msg.msg.type === "reply_markup") {
//             procedimento = msg.msg.body.toLowerCase().trim().split("_")[1]
//         }
//         if (msg.msg.type === 'list_response') {
//             procedimento = String(msg.msg.listResponse.singleSelectReply.selectedRowId).toLowerCase().trim().split("_")[1]
//         }
//         const cdProcedimento = procedimento.split(";").map(Number);

//         const data = await Promise.all(cdProcedimento.map(async (procedimento) => {
//             return await getPreparo(procedimento, integracao, ticket);
//         }));
//         // Ver Erro opcoes nao funcinoa
//         if (data.some(item => item === null)) {
//             let message =
//                 "📄 Procedimento não tem preparo.\n\n" +
//                 "📞 9 - Falar com o suporte.\n" +
//                 "🔄 6 - Retornar ao menu.\n" +
//                 "❌ 7 - Encerrar o atendimento.\n\n" +
//                 "_Digite o número da opção desejada_."

//             return message
//         }
//         let message =
//             "📄 Caso precise do preparo de outro agendamento, entre em contato com nossa central para solicitar.\n\n" +
//             "📞 9 - Falar com o suporte.\n" +
//             "🔄 6 - Retornar ao menu.\n" +
//             "❌ 7 - Encerrar o atendimento.\n\n" +
//             "_Digite o número da opção desejada_."
//         return message

//     } else if (action === "confirmar") {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         const exameParaConfirmar = listaAgendamentos[+ticket.lastMessage - 1].cd_atendimento
//         const response = await Confirmar({ integracao, cdAtendimento: exameParaConfirmar })
//         const message =
//             response.length > 0
//                 ? `Exame(s) confirmado com sucesso.\n\n
// 🔄 2 - Retornar ao menu.\n
// ❌ 3 - Encerrar o atendimento.\n\n
// _Digite o número da opção desejada_.`
//                 : `Infelizamente não conseguimos confirmar o exame selecionado.\n\n
// Se precisar favor entrar em contato com a nossa central, estamos à disposição.\n
// 📞 1 - Falar com o suporte.\n
// 🔄 2 - Retornar ao menu.\n
// ❌ 3 - Encerrar o atendimento.\n\n
// _Digite o número da opção desejada_.`
//         return message;
//     }
//     else if (["agendar", "agendamento", "marcar"].includes(action)) {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         listaUnidades = await ListarUnidades(integracao)
//         listaPlanos = await ListarPlanos(integracao)
//         if (ticket.channel === "whatsapp") {
//             const rowsListMessage = [
//                 ...listaUnidades.map(unidade => ({
//                     rowId: `empresa_${unidade.cd_empresa}`,
//                     title: `📌 ${unidade.ds_empresa}`,
//                     description: `Local: ${unidade.ds_endereco || 'Endereço não informado'}\n⏰ Atendimento: ${unidade.ds_horario || 'Horário não informado'}\n📞 Contato: ${unidade.nr_telefone || 'Não informado'}`
//                 })),

//             ];

//             const options =
//             {
//                 buttonText: "📋 Escolher unidade",
//                 description: "Selecione a unidade para qual deseja agendar seu exame:",
//                 sections: [{
//                     title: "Selecione uma unidade para prosseguir no agendamento",
//                     rows: rowsListMessage
//                 }]
//             }
//             return options
//         } else {

//             const buttonsPerRow = 2;
//             const allButtons = listaUnidades.map(unidade => ({
//                 callback_data: `selecEmpresa_${unidade.cd_empresa}`,
//                 text: `${unidade.ds_empresa}`,
//             }));
//             const rowsListMessage = [];
//             for (let i = 0; i < allButtons.length; i += buttonsPerRow) {
//                 rowsListMessage.push(allButtons.slice(i, i + buttonsPerRow));
//             }

//             const options = {
//                 body: "Para unidade você deseja agendar?",
//                 hasButtons: true,
//                 reply_markup: {
//                     inline_keyboard: rowsListMessage
//                 }
//             }
//             return options
//         }
//     } else if (action === "selecionarPlano") {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         let unidade: any
//         if (msg.msg.type === "reply_markup") {
//             unidade = msg.msg.body.toLowerCase().trim().split("_")[1]
//         }
//         if (msg.msg.type === 'list_response') {
//             unidade = String(msg.msg.listResponse.singleSelectReply.selectedRowId).toLowerCase().trim().split("_")[1]
//         }
//         // unidadeSelecionada = unidade
//         sessao.unidadeSelecionada = unidade;
//         return "Digite o nome do seu plano de saúde para que possamos encontrar as opções corretas."
//     } else if (action === "getPlano") {

//         const plano = input
//         const Fuse = require('fuse.js');

//         const options = {
//             keys: ['ds_plano'],
//             threshold: 0.4, // 0 = exato, 1 = qualquer coisa. 0.3–0.4 é um bom valor.
//             includeScore: true,
//         };

//         if (typeof plano === 'string' && plano.length >= 4) {
//             const fuse = new Fuse(listaPlanos, options);

//             const resultado = fuse.search(plano).map((result: { item: any; }) => result.item)
//             if (resultado.length === 0) {
//                 ticket.update({
//                     botRetries: ticket.botRetries + 1,
//                     lastInteractionBot: new Date(),
//                 });
//                 return "Ops! Não localizamos nenhum plano com base no que foi digitado. Por favor, revise as informações e tente novamente."
//             }
//             ticket.update({
//                 botRetries: 0,
//                 lastInteractionBot: new Date(),
//             });
//             if (ticket.channel === "whatsapp") {
//                 const rowsListMessage = [
//                     ...resultado.map((plano: { cd_plano: any; ds_plano: any; }) => ({
//                         rowId: `plano_${plano.cd_plano}`,
//                         title: `${plano.ds_plano}`
//                     })),

//                 ];

//                 rowsListMessage.push({
//                     rowId: "voltar_plano",
//                     title: "⬅️ Voltar",
//                 })
//                 const options =
//                 {
//                     buttonText: "📋 Selecionar o plano",
//                     description: "Aqui está a lista de planos disponíveis para agendamento. Por favor, selecione o plano desejado diretamente na lista abaixo.",
//                     sections: [{
//                         title: "Por favor, selecione o seu plano de saúde:",
//                         rows: rowsListMessage
//                     }]
//                 }
//                 return options

//             } else {
//                 const buttonsPerRow = 2;
//                 const allButtons = resultado.map((plano: { cd_plano: any; ds_plano: any; }) => ({
//                     callback_data: `plano_${plano.cd_plano}`,
//                     text: `${plano.ds_plano}`
//                 }));
//                 const rowsListMessage = [];
//                 for (let i = 0; i < allButtons.length; i += buttonsPerRow) {
//                     rowsListMessage.push(allButtons.slice(i, i + buttonsPerRow));
//                 }
//                 rowsListMessage.push([{ text: "⬅️ Voltar", callback_data: "voltar_plano" }])
//                 const options = {
//                     body: "Aqui está a lista de planos disponíveis para agendamento. Por favor, selecione o plano desejado diretamente na lista abaixo.",
//                     hasButtons: true,
//                     reply_markup: {
//                         inline_keyboard: rowsListMessage
//                     }
//                 }
//                 return options
//             }
//         } else {
//             ticket.update({
//                 botRetries: ticket.botRetries + 1,
//                 lastInteractionBot: new Date(),
//             });
//             return "O nome do plano está muito curto. Tente digitar o nome completo ou uma parte mais significativa dele."
//         }
//     } else if (action === "Obsplano") {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         let cdPlano: number = 0

//         if (msg.msg.type === "reply_markup") {
//             cdPlano = msg.msg.body.toLowerCase().trim().split("_")[1]
//         }
//         if (msg.msg.type === 'list_response') {
//             cdPlano = (msg.msg.listResponse.singleSelectReply.selectedRowId).toLowerCase().trim().split("_")[1]
//         }
//         listaExames = await getListProcedimento({ integracao, cdPlano, cdEmpresa: sessao.unidadeSelecionada })
//         // planoSelecionado = cdPlano

//         sessao.planoSelecionado = cdPlano
//         const obsPlano = await ObsplanoAsync({ integracao, cdPlano })
//         const textoFinal = obsPlano
//             ? `${obsPlano}\n\nAs instruções acima descrevem como o pedido médico deve estar. Está tudo conforme para prosseguirmos?`
//             : "Este plano não possui instruções específicas. Podemos continuar?";

//         if (ticket.channel === "whatsapp") {
//             let message =
//                 `${textoFinal}\n\n` +
//                 "1 - Continuar.\n" +
//                 "2 - Cancelar\n\n" +
//                 "_Digite o número da opção desejada_."
//             return message
//         }
//         else {
//             const options = {
//                 body: textoFinal,
//                 hasButtons: true,
//                 reply_markup: {
//                     inline_keyboard: [[
//                         {
//                             callback_data: "sim",
//                             text: "Continuar",
//                         },
//                         {
//                             callback_data: "nao",
//                             text: "Cancelar",
//                         }
//                     ]]
//                 }
//             }
//             return options
//         }

//     } else if (action === "procedimento") {

//         const Fuse = require('fuse.js');
//         const options = {
//             keys: ['ds_procedimento'],
//             threshold: 0.4, // 0 = exato, 1 = qualquer coisa. 0.3–0.4 é um bom valor.
//             includeScore: true,
//         };
//         const fuse = new Fuse(listaExames, options);
//         const resultado = fuse.search(input).map((result: { item: any; }) => result.item)

//         if (resultado.length === 0) {
//             ticket.update({
//                 botRetries: ticket.botRetries + 1,
//                 lastInteractionBot: new Date(),
//             });
//             let message =
//                 `Não conseguimos localizar o exame que você digitou.
// Pode verificar se houve algum erro de digitação?
// Caso contrário, esse exame pode não estar disponível para agendamento no momento.
// Favor digitar novamente o exame que deseja agendar.\n\n`
//             return message
//         }
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         if (ticket.channel === "whatsapp") {
//             const rowsListMessage = [
//                 ...resultado.map((procedimento: { cd_procedimento: any; ds_procedimento: any; ds_modalidade: any; }) => ({
//                     rowId: `exame_${procedimento.cd_procedimento}`,
//                     title: `${procedimento.ds_procedimento}`,
//                     description: `${procedimento.ds_modalidade}`,
//                 })),
//                 {
//                     rowId: "1",
//                     title: "📞 Falar com o suporte",
//                     description: "Exame não consta na lista."
//                 },
//                 {
//                     rowId: "2",
//                     title: "⬅️ Voltar",
//                     description: "Voltar ao menu anterior."
//                 }
//             ];

//             const options =
//             {
//                 buttonText: "👉 Clique Aqui 👈",
//                 description: "Aqui está a lista de exames disponíveis para agendamento. Por favor, selecione o exame desejado diretamente na lista abaixo.",
//                 sections: [{
//                     title: "Selecione uma opção",
//                     rows: rowsListMessage
//                 }]
//             }

//             return options

//         } else {
//             const rowsListMessage = resultado.map((procedimento: { cd_procedimento: any; ds_procedimento: any; ds_modalidade: any; }) => ([
//                 {
//                     callback_data: `exame_${procedimento.cd_procedimento}`,
//                     text: `${procedimento.ds_procedimento}-${procedimento.ds_modalidade} `,
//                 }

//             ]));

//             rowsListMessage.push([{ text: "📞 Falar com o suporte", callback_data: "1" }])
//             rowsListMessage.push([{ text: "⬅️ Voltar", callback_data: "2" }])
//             const options = {
//                 body: "Aqui está a lista de exames disponíveis para agendamento. Por favor, selecione o exame desejado diretamente na lista abaixo.",
//                 hasButtons: true,
//                 reply_markup: {
//                     inline_keyboard: rowsListMessage
//                 }
//             }
//             return options
//         }

//     } else if (action === "loop") {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         let exame: any
//         if (msg.msg.type === "reply_markup") {
//             exame = msg.msg.body.toLowerCase().trim().split("_")[1]
//         }
//         if (msg.msg.type === 'list_response') {
//             exame = String(msg.msg.listResponse.singleSelectReply.selectedRowId).toLowerCase().trim().split("_")[1]
//         }
//         sessao.examesParaAgendar.push(exame);
//         return `Perfeito! Você deseja agendar mais algum outro exame?
// Caso sim, basta digitar 'Sim'.
// Se não, digite 'Não' para que possamos prosseguir com o agendamento.`
//     }

//     else if (action === "preparoAgendamento") {
//         ticket.update({
//             botRetries: ticket.botRetries + 1,
//             lastInteractionBot: new Date(),
//         });
//         const examesUnicos = sessao.examesParaAgendar.filter(
//             (exame, index, self) =>
//                 index === self.findIndex(e => e.id === exame.id)
//         );

//         const data = await Promise.all(
//             examesUnicos.map(async (procedimento) => {
//                 return await getPreparo(procedimento, integracao, ticket);
//             })
//         );
//         if (data.some(item => item === null)) {
//             let message =
//                 "📄 Procedimento não tem preparo.\n" +
//                 "Podemos prosseguir ?\n\n" +
//                 "1 - Sim.\n" +
//                 "2 - Voltar ao menu anterior.\n" +
//                 "3 - Cancelar.\n\n" +
//                 "_Digite o número da opção desejada_."

//             return message
//         }
//         let message =
//             "📄 Segue orientações a serem seguidas para realização do seu exame.\n\n" +
//             "Podemos prosseguir ?\n\n" +
//             "1 - Sim.\n" +
//             "2 - Voltar ao menu anterior.\n" +
//             "3 - Cancelar.\n\n" +
//             "_Digite o número da opção desejada_."
//         return message

//     }
//     else if (action === 'periodo') {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });

//         const periodos = ['Manha', 'Tarde', 'Noite']
//         if (ticket.channel === "whatsapp") {
//             const rowsListMessage = [
//                 ...periodos.map(periodo => ({
//                     rowId: `periodo_${periodo}`,
//                     title: `${periodo}`,
//                     description: `${periodo}`,

//                 })),
//                 {
//                     rowId: "2",
//                     title: "⬅️ Voltar",
//                     description: "Voltar ao menu anterior."
//                 }
//             ];

//             const options =
//             {
//                 buttonText: "👉 Clique Aqui 👈",
//                 description: "Selecione para qual periodo deseja agendar.",
//                 sections: [{
//                     title: "Selecione uma opção",
//                     rows: rowsListMessage
//                 }]
//             }

//             return options

//         } else {
//             const rowsListMessage = periodos.map(periodo => ([
//                 {
//                     callback_data: `periodo_${periodo}`,
//                     text: `${periodo}`,
//                 }

//             ]));

//             rowsListMessage.push([{ text: "⬅️ Voltar", callback_data: "2" }])
//             const options = {
//                 body: "Selecione para qual periodo deseja agendar.",
//                 hasButtons: true,
//                 reply_markup: {
//                     inline_keyboard: rowsListMessage
//                 }
//             }
//             return options
//         }

//     }
//     else if (action === "intervalo") {
//         ticket.update({
//             botRetries: 0,
//             lastInteractionBot: new Date(),
//         });
//         let periodo: any
//         if (msg.msg.type === "reply_markup") {
//             periodo = msg.msg.body.toLowerCase().trim().split("_")[1]
//         }
//         if (msg.msg.type === 'list_response') {
//             periodo = String(msg.msg.listResponse.singleSelectReply.selectedRowId).toLowerCase().trim().split("_")[1]
//         }
//         const intervalos = gerarIntervalosPorPeriodo(periodo)
//         if (ticket.channel === "whatsapp") {
//             const rowsListMessage = [
//                 ...intervalos.map(intervalo => ({
//                     rowId: `intervalo_${intervalo}`,
//                     title: `${intervalo}`,
//                     description: `${intervalo}`,

//                 })),
//                 {
//                     rowId: "2",
//                     title: "⬅️ Voltar",
//                     description: "Voltar ao menu anterior."
//                 }
//             ];

//             const options =
//             {
//                 buttonText: "👉 Clique Aqui 👈",
//                 description: "Selecione para qual intervalo deseja agendar.",
//                 sections: [{
//                     title: "Selecione uma opção",
//                     rows: rowsListMessage
//                 }]
//             }

//             return options

//         } else {
//             const rowsListMessage = intervalos.map(intervalo => ([
//                 {
//                     callback_data: `intervalo_${intervalo}`,
//                     text: `${intervalo}`,
//                 }

//             ]));

//             rowsListMessage.push([{ text: "⬅️ Voltar", callback_data: "2" }])
//             const options = {
//                 body: "Selecione para qual intervalo deseja agendar.",
//                 hasButtons: true,
//                 reply_markup: {
//                     inline_keyboard: rowsListMessage
//                 }
//             }
//             //console.log(rowsListMessage)
//             return options
//         }
//     }
//     else if (action === "confirmaintervalo") {

//         let intervaloSelecionado: any
//         if (msg.msg.type === "reply_markup") {

//             intervaloSelecionado = msg.msg.body.toLowerCase().trim().split("_")[1]
//         }
//         if (msg.msg.type === 'list_response') {
//             intervaloSelecionado = String(msg.msg.listResponse.singleSelectReply.selectedRowId).toLowerCase().trim().split("_")[1]
//         }
//         sessao.intervaloSelecionado = intervaloSelecionado
//         const message = `Podemos proseguir comm a pesquisa de horarios para o intervalo ${intervaloSelecionado}\n
// 1 - Continuar.
// 2 - Cancelar.
// _Digite o número da opção desejada_.`
//         return message
//     }
//     else if (action === "pesquisaHorarios") {
//         ticket.update({
//             botRetries: ticket.botRetries + 1,
//             lastInteractionBot: new Date(),
//         });
//         let proximaSemana: any
//         if (msg.msg.type === "reply_markup") {

//             proximaSemana = msg.msg.body.toLowerCase().trim()
//         }
//         if (msg.msg.type === 'list_response') {
//             proximaSemana = String(msg.msg.listResponse.singleSelectReply.selectedRowId).toLowerCase().trim()
//         }

//         if (proximaSemana === 'next') {
//             const dataBase = dayjs(sessao.ultimaDataConsulta, 'DD/MM/YYYY');
//             sessao.ultimaDataConsulta = dataBase.add(7, 'day').format('DD/MM/YYYY');
//         } else if (proximaSemana === "mais") {
//             console.log("mais")
//             // Se não for next, você pode resetar para a data atual (se quiser)
//             sessao.intervaloSelecionado = adicionarMinutos(sessao.intervaloSelecionado, 20)
//             // console.log(sessao.intervaloSelecionado)
//         }
//         // console.log(sessao)

//         const now = sessao.ultimaDataConsulta;

//         const dadosParaPesquisa = {

//             tokenPaciente: sessao.dadosPaciente.ds_token,
//             cd_paciente: sessao.dadosPaciente.cd_paciente,
//             dt_data: now,
//             dt_hora: sessao.intervaloSelecionado,
//             dt_hora_fim: '23:59',
//             js_exame: montarJsonAgendaSemanal(sessao)
//         }
//         // console.log(dadosParaPesquisa)
//         const response = await doAgendaSemanal({ integracao, dadosPesquisa: dadosParaPesquisa })
//         const horariosDisponiveis = response.filter((horario: { cod: string; }) => horario.cod.trim() !== '');
//         horariosAgendamento = horariosDisponiveis
//         if (horariosDisponiveis.length === 0) {
//             return `Não conseguimos localizar horario disponivel para o(s) exame(s) que você selecionou.
// Se precisar de ajuda ou quiser conferir outras opções, estou aqui para auxiliar!
// Como devemos prosseguir?\n\n` +
//                 "1 - 📞 Falar com o suporte.\n" +
//                 "3 - ❌ Cancelar.\n\n" +
//                 "_Digite o número da opção desejada_."
//         }
//         // console.log(horariosDisponiveis)
//         if (ticket.channel === "whatsapp") {
//             // const rowsListMessage = [
//             //     ...horariosDisponiveis.map((horario: { cod: any; dia: any; hora: any; }) => ({
//             //         rowId: `horario_${horario.cod.trim()}`,
//             //         title: `${horario.dia} - ${horario.hora}`
//             //     })),

//             // ];
//             const rowsListMessage = await Promise.all(
//                 horariosDisponiveis.map(async (horario: { cod: any; dia: any; hora: any }) => {
//                     const id = gerarIdUnico();

//                     await salvarHorarioRedis(id, {
//                         codigos: horario.cod.trim(), // ou um array, se for o caso
//                         dia: horario.dia,
//                         hora: horario.hora
//                     });

//                     return {
//                         rowId: `horario_${id}`,
//                         title: `${horario.dia} - ${horario.hora}`
//                     };
//                 })
//             );

//             rowsListMessage.push({
//                 rowId: "next",
//                 title: "Proxima semana",
//             })
//             rowsListMessage.push({
//                 rowId: "mais",
//                 title: "+ 20 minutos",
//             })
//             const options =
//             {
//                 buttonText: "📅  Horários clique aqui",
//                 description: "Aqui está a lista de horarios disponíveis para agendamento. Por favor, selecione o horario desejado diretamente na lista abaixo.",
//                 sections: [{
//                     title: "Por favor, selecione o seu horário:",
//                     rows: rowsListMessage
//                 }]
//             }
//             return options
//         } else {
//             const buttonsPerRow = 2;
//             const allButtons = await Promise.all(
//                 horariosDisponiveis.map(async (horario: { cod: any; dia: any; hora: any }) => {
//                     const id = gerarIdUnico(); // ex: 'abc123'

//                     await salvarHorarioRedis(id, {
//                         codigos: horario.cod.trim(),
//                         dia: horario.dia,
//                         hora: horario.hora
//                     });

//                     return {
//                         text: `${horario.dia} - ${horario.hora}`,
//                         callback_data: `horario_${id}`
//                     };
//                 })
//             );

//             // console.log(teste)
//             // const allButtons = horariosDisponiveis.map((horario: { cod: any; dia: any; hora: any; }) => ({
//             //     callback_data: `horario_${horario.cod.trim()}`,
//             //     text: `${horario.dia} - ${horario.hora}`
//             // }));
//             // console.log(allButtons)
//             const rowsListMessage = [];
//             for (let i = 0; i < allButtons.length; i += buttonsPerRow) {
//                 rowsListMessage.push(allButtons.slice(i, i + buttonsPerRow));
//             }
//             rowsListMessage.push([{ text: "Proxima semana", callback_data: "next" },{ text: "+ 20 minutos", callback_data: "mais" }])
//             // rowsListMessage.push([{ text: "+ 20 minutos", callback_data: "mais" }])
//             const options = {
//                 body: "Aqui está a lista de horarios disponíveis para agendamento. Por favor, selecione o horario desejado diretamente na lista abaixo.",
//                 hasButtons: true,
//                 reply_markup: {
//                     inline_keyboard: rowsListMessage
//                 }
//             }
//             return options

//         }
//     }
//     else if (action === 'confirmarHorario') {
//         ticket.update({
//             botRetries: ticket.botRetries + 1,
//             lastInteractionBot: new Date(),
//         });

//         let cd_horario: any
//         if (msg.msg.type === "reply_markup") {
//             cd_horario = msg.msg.body.split("_")[1]
//         }
//         if (msg.msg.type === 'list_response') {
//             cd_horario = String(msg.msg.listResponse.singleSelectReply.selectedRowId).toLowerCase().split("_")[1]
//         }
//         const horarioSelecionado = await obterHorarioRedis(cd_horario);

//         sessao.horarioSelecionado = horarioSelecionado
//         sessao.cdHorario = cd_horario

//         const dadosDoAgendaHorario = {
//             tokenPaciente: sessao.dadosPaciente.ds_token,
//             cd_paciente: sessao.dadosPaciente.cd_paciente,
//             dt_data: horarioSelecionado.dia,
//             dt_hora: horarioSelecionado.hora,
//             dt_hora_fim: '23:59',
//             js_exame: montarJsonAgendaSemanal(sessao)
//         }

//         const horario = await doAgendaHorario({ integracao, dadosPesquisa: dadosDoAgendaHorario })

//         if (horario) {
//             const dadosAgendamento = {
//                 dataHorario: horarioSelecionado,
//                 exame: listaExames
//                     .filter(exame => sessao.examesParaAgendar.some(exameAgendar => +exameAgendar === exame.cd_procedimento))
//                     .map(exame => exame.ds_procedimento),
//                 unidade: listaUnidades.filter(unidade => unidade.cd_empresa === +sessao.unidadeSelecionada).map(empresa => ({
//                     em: empresa.ds_empresa,
//                     endereco: empresa.ds_endereco
//                 }))[0]
//             }

//             return gerarMensagemAgendamento(dadosAgendamento)
//         }
//         return 'EM CONSTRUACAO'
//     }
//     else if (action === "concluiragendamento") {
//         ticket.update({
//             botRetries: ticket.botRetries + 1,
//             lastInteractionBot: new Date(),
//         });
//         const cd_horario = await obterHorarioRedis(sessao.cdHorario)

//         const dadosDoAgendaHorario = {
//             cd_horario: cd_horario.codigos,
//             tokenPaciente: sessao.dadosPaciente.ds_token,
//             cd_paciente: sessao.dadosPaciente.cd_paciente,
//             dt_data: sessao.horarioSelecionado.dia,
//             dt_hora: sessao.horarioSelecionado.hora,
//             dt_hora_fim: '23:59',
//             js_exame: montarJsonAgendaSemanal(sessao)
//         }

//         try {
//             const response = await doAgendaPost({ integracao, dadosPesquisa: dadosDoAgendaHorario })
//             if (response.length > 0 && response[0].cd_atendimento) {
//                 return `Agendamento realizado com suscesso!
// Podemos ajudar em algo ?\n\n` +
//                     "1 - 📞 Falar com o suporte.\n" +
//                     "3 - ❌ Cancelar.\n\n" +
//                     "_Digite o número da opção desejada_."
//             } else {
//                 return `Não conseguimos concluir o seu agendamento.
// Favor acessar o nosso suporte!
// Como devemos prosseguir?\n\n` +
//                     "1 - 📞 Falar com o suporte.\n" +
//                     "3 - ❌ Cancelar.\n\n" +
//                     "_Digite o número da opção desejada_."
//             }
//         } catch (error) {
//             return `Não conseguimos concluir o seu agendamento.
// Favor acessar o nosso suporte!
// Como devemos prosseguir?\n\n` +
//                 "1 - 📞 Falar com o suporte.\n" +
//                 "3 - ❌ Cancelar.\n\n" +
//                 "_Digite o número da opção desejada_."
//         }

//     }

// }
// type Agendamento = {
//     dataHorario: {
//         dia: string;
//         hora: string;
//     };
//     exame: string[];
//     unidade: {
//         em: string;
//         endereco: string;
//     };
// };
// function gerarMensagemAgendamento({ dataHorario, exame, unidade }: Agendamento) {
//     const { dia, hora } = dataHorario;
//     const listaExames = exame.map((item: any) => `- ${item}`).join('\n');
//     const mensagem = `
// 📋 *Informações do seu agendamento:*

// 📅 *Data e horário:* ${dia} às ${hora}
// 🧪 *Exames:*
// ${listaExames}
// 🏥 *Unidade:* ${unidade.em}
// 📍 *Endereço:* ${unidade.endereco}

// Deseja confirmar o agendamento?
// 1 - Confirmar
// 2 - Cancelar

// _Digite o número da opção desejada_.
//   `.trim();
//     return mensagem;
// }
// function buscarPorCodigos(codigosAlvo: string) {
//     const codigos = codigosAlvo.split(',').map(c => c.trim());

//     return horariosAgendamento.filter(item => {
//         const codigosItem = item.cod.split(',').map((c: string) => c.trim());
//         return codigos.some(cod => codigosItem.includes(cod));
//     }).map(item => ({
//         dia: item.dia,
//         hora: item.hora
//     }))[0];
// }
// function montarJsonAgendaSemanal(sessao: SessaoUsuario): string {
//     // 1. Contar quantidades por cd_procedimento
//     const quantidadePorProcedimento: Record<string, number> = {};

//     sessao.examesParaAgendar.forEach(exame => {
//         const cd = exame;
//         quantidadePorProcedimento[cd] = (quantidadePorProcedimento[cd] || 0) + 1;
//     });

//     // 2. Criar lista única de procedimentos (sem repetição)
//     const procedimentosUnicos = sessao.examesParaAgendar.filter(
//         (exame, index, self) =>
//             index === self.findIndex(e => e === exame)
//     );

//     // 3. Montar array com os dados completos e nr_quantidade correta
//     const examesConvertidos = procedimentosUnicos.map((exameAgendado) => {
//         const exameCompleto = listaExames.find(
//             e => e.cd_procedimento === +exameAgendado
//         );

//         if (!exameCompleto) {
//             console.warn(`Exame não encontrado para cd_procedimento: ${exameAgendado}`);
//             return null;
//         }

//         return {
//             cd_modalidade: exameCompleto.cd_modalidade,
//             cd_procedimento: exameCompleto.cd_procedimento,
//             ds_procedimento: exameCompleto.ds_procedimento,
//             cd_medico: 0,
//             cd_plano: +sessao.planoSelecionado,
//             cd_subplano: 0,
//             cd_empresa: +sessao.unidadeSelecionada,
//             nr_tempo: exameCompleto.nr_tempo,
//             nr_tempo_total: exameCompleto.nr_tempo,
//             nr_valor: exameCompleto.nr_valor,
//             sn_especial: exameCompleto.sn_especial,
//             nr_quantidade: quantidadePorProcedimento[exameAgendado]
//         };
//     }).filter(Boolean); // Remove os nulls

//     const json = JSON.stringify(examesConvertidos);
//     const base64 = Buffer.from(json).toString('base64');

//     return base64;
// }

// function gerarIdUnico() {
//     return Math.random().toString(36).substring(2, 8);
// }
// // const url = "/clinuxintegra/consultapacientes";
// // const URL_FINAL = `${sessionApiDados.baseURl}${url}`;
// // const consultaDados = {
// //     NomePaciente: params.NomePaciente,
// //     ...(params.CPF && { CPF: params.CPF }), // Inclui o CPF somente se ele estiver presente em `params`
// //   };
// //   const { data } = await apiInstance.post(URL_FINAL, consultaDados);
