import { Markup } from "telegraf";
import {
  gerarMensagemExame,
  gerarMensagemListaMedicos,
} from "../services/IntegracoesServices/Genesis/utils/gerarMensagemExame";
// import {
//   gerarMensagemExame,
//   gerarMensagemListaMedicos,
//   gerarMensagemLoopProcedimento,
// } from "../services/IntegracoesServices/Genesis/utils/gerarMensagemExame";

export function gerarMensagemWpp(
  precoExame: string,
  perguntarPreferencia: boolean
): any {
  const { texto, opcoes } = gerarMensagemExame(
    precoExame,
    perguntarPreferencia
  );

  return {
    sections: [
      {
        title: "Opções disponíveis",
        rows: opcoes.map(
          (opcao: { id: any; texto: any; description: any }) => ({
            rowId: opcao.id,
            title: opcao.texto,
            description: opcao.description, // você pode colocar descrições extras aqui
          })
        ),
      },
    ],
    buttonText: "Escolha uma opção",
    description: texto,
    footer: "_Selecione a opção desejada_",
  };
}

export function gerarMensagemTelegram(
  precoExame: string,
  perguntarPreferencia: boolean
) {
  const { texto, opcoes } = gerarMensagemExame(
    precoExame,
    perguntarPreferencia
  );

  const botoes = opcoes.map((opcao: { texto: string; id: string }) =>
    Markup.button.callback(opcao.texto, opcao.id)
  );

  return {
    texto,
    markup: Markup.inlineKeyboard(botoes, { columns: 1 }),
  };
}
export function gerarMensagemExamesMedicosWpp(exames: any[]): any {
  const { texto, opcoes } = gerarMensagemListaMedicos(exames);
  const rowsListMessage = [
    ...opcoes.map((opcao: { id: any; texto: any; description: any }) => ({
      rowId: opcao.id,
      title: opcao.texto,
      description: opcao.description, // descrição opcional
    })),
    {
      rowId: "suporte",
      title: "📞 Falar no suporte",
      description: "Desejo falar no suporte.",
    },
  ];

  return {
    sections: [
      {
        title: "Opções disponíveis",
        rows: rowsListMessage,
      },
    ],
    buttonText: "Escolha uma opção",
    description: texto,
    footer: "_Selecione a opção desejada_",
  };
}
export function gerarMensagemExamesMedicosTelegram(exames: any[]) {
  const { texto, opcoes } = gerarMensagemListaMedicos(exames);

  const botoes = opcoes.map((opcao: { texto: string; id: string }) =>
    Markup.button.callback(opcao.texto, opcao.id)
  );
  // Agrupa os botões em colunas de 2
  const botoesAgrupados = Markup.inlineKeyboard([
    ...Markup.inlineKeyboard(botoes, { columns: 2 }).reply_markup
      .inline_keyboard,
    [Markup.button.callback("📞 Falar no suporte", "suporte")], // nova linha com 1 botão
  ]);
  return {
    texto,
    markup: botoesAgrupados,
  };
}

export function loopTelegram(mensagem: { opcoes: any[]; texto: string }) {
  const { opcoes, texto } = mensagem;
  const botoes = opcoes.map((opcao: { texto: string; id: string }) =>
    Markup.button.callback(opcao.texto, opcao.id)
  );
  // Agrupa os botões em colunas de 2
  const botoesAgrupados = Markup.inlineKeyboard([
    ...Markup.inlineKeyboard(botoes, { columns: 2 }).reply_markup
      .inline_keyboard,
    // [Markup.button.callback("📞 Falar no suporte", "suporte")], // nova linha com 1 botão
  ]);
  return {
    texto,
    markup: botoesAgrupados,
  };
}

export function loopWpp(mensagem: { opcoes: any[]; texto: string }) {
  const { opcoes, texto } = mensagem;
  const rowsListMessage = [
    ...opcoes.map((opcao) => ({
      rowId: opcao.id,
      title: opcao.texto,
      description: opcao.description, // descrição opcional
    })),
    //     {
    //   rowId: "suporte",
    //   title: "📞 Falar no suporte",
    //   description: "Desejo falar no suporte.",
    // },
  ];

  return {
    sections: [
      {
        title: "Opções disponíveis",
        rows: rowsListMessage,
      },
    ],
    buttonText: "Escolha uma opção",
    description: texto,
    footer: "_Selecione a opção desejada_",
  };
}
