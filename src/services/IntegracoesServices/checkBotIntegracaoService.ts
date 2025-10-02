import { ConfirmacaoIntegracaoService } from "./Genesis/Externa/ConfirmacaoService";

export const checkBotIntegracaoService = async (
  dadosConfirmacao: any,
  payload: any
): Promise<void> => {
  const bot = JSON.parse(dadosConfirmacao.notificacao).bot;

  if (bot === "agenda") {
    await ConfirmacaoIntegracaoService(payload);
  } else {
    console.log(bot);
  }
};
