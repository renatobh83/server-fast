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
