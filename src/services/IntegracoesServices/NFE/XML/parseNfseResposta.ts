import xml2js from "xml2js";

export const parseNfseResposta = async (xml: string): Promise<any> => {
  const parser = new xml2js.Parser({ explicitArray: false });

  try {
    const result = await parser.parseStringPromise(xml);
    const resposta = result["GerarNfseResposta"];
    if (!resposta) {
      throw new Error(`Tipo GerarNfseResposta não encontrado no XML`);
    }
    const respostaRetorno = {
      numeroNota: resposta.ListaNfse.CompNfse.Nfse.InfNfse.Numero,
      codVerificacao:
        resposta.ListaNfse.CompNfse.Nfse.InfNfse.CodigoVerificacao,
      protocolo: resposta.Protocolo,
      lote: resposta.NumeroLote,
    };

    return { respostaRetorno, sucesso: true };
  } catch (err) {
    console.error("Erro ao parsear XML:", err);
    return {
      sucesso: false,
      mensagens: [{ codigo: "500", mensagem: "Erro interno ao processar XML" }],
    };
  }
};
