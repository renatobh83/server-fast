import xml2js from "xml2js";

export const parseNfseRespostaCancelamento = async (
  xml: string
): Promise<any> => {
  const parser = new xml2js.Parser({ explicitArray: false });

  try {
    const result = await parser.parseStringPromise(xml);
    const resposta = result["CancelarNfseResposta"];
    if (!resposta) {
      throw new Error(`Tipo CancelarNfseResposta não encontrado no XML`);
    }
    const lista =
      resposta.ListaMensagemRetornoLote || resposta.ListaMensagemRetorno;

    if (lista) {
      let mensagens = lista.MensagemRetorno;

      // Normaliza para array mesmo que seja um único item
      if (!Array.isArray(mensagens)) {
        mensagens = [mensagens];
      }

      const erros = mensagens.map((msg: any) => ({
        codigo: msg.Codigo,
        mensagem: msg.Mensagem,
      }));
      return {
        sucesso: false,
        mensagens: erros,
      };
    }
    const identificacaoNfse =
      resposta.RetCancelamento.NfseCancelamento.Confirmacao.Pedido
        .InfPedidoCancelamento.IdentificacaoNfse;
    return {
      sucesso: true,
      mensagens: identificacaoNfse,
    };
  } catch (err) {
    console.error("Erro ao parsear XML:", err);
    return {
      sucesso: false,
      mensagens: [{ codigo: "500", mensagem: "Erro interno ao processar XML" }],
    };
  }
};
