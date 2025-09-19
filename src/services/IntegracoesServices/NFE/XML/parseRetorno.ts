import xml2js from "xml2js";

export const parserXmlRetorno = async (
  xml: string,
  tipo: string
): Promise<any> => {
  const parser = new xml2js.Parser({ explicitArray: false });

  try {
    const result = await parser.parseStringPromise(xml);
    const resposta = result[tipo];

    if (!resposta) {
      throw new Error(`Tipo ${tipo} não encontrado no XML`);
    }

    // Pode ser ListaMensagemRetorno ou ListaMensagemRetornoLote
    const lista =
      resposta.ListaMensagemRetornoLote || resposta.ListaMensagemRetorno;

    if (!lista) {
      return { mensagens: [], sucesso: true };
    }

    let mensagens = lista.MensagemRetorno;

    // Normaliza para array mesmo que seja um único item
    if (!Array.isArray(mensagens)) {
      mensagens = [mensagens];
    }

    const erros = mensagens.map((msg: any) => ({
      codigo: msg.Codigo,
      mensagem: msg.Mensagem,
      numeroRps: msg.IdentificacaoRps?.Numero,
    }));

    return {
      sucesso: false,
      mensagens: erros,
    };
  } catch (err) {
    console.error("Erro ao parsear XML:", err);
    return {
      sucesso: false,
      mensagens: [{ codigo: "500", mensagem: "Erro interno ao processar XML" }],
    };
  }
};
