import Empresa from "../../models/Empresa";
import NotaFiscal from "../../models/NotaFiscal";
// import NotaFiscalLog from "../../models/NotaFiscalLog";
import Tenant from "../../models/Tenant";
import { GerarNFE } from "../IntegracoesServices/NFE";
import { DadosNota } from "../IntegracoesServices/NFE/XML/gerarXmlGinfes";

import { pupa } from "../../utils/pupa";
import { addJob } from "../../lib/Queue";
interface NotaFiscalRequest {
  tenantId: number;
  data: any;
  res: any;
}

function convertToNumbers(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      // Ignora valores vazios ou não conversíveis
      const num = Number(value);
      return [key, value === "" || isNaN(num) ? value : num];
    })
  );
}

export const GerarNotaFiscalService = async ({
  tenantId,
  data,
  res,
}: NotaFiscalRequest) => {
  const {
    empresa,
    descricao,
    valorFloat: valor,
    dataEmissao,
    impostosParaEnviar,
    descontos,
  } = data;

  const lastRps = await NotaFiscal.findOne({
    where: {
      tenantId,
    },
    order: [["rps", "DESC"]], // Busca o último chamado criado
  });
  const novoNumeroRps = lastRps?.rps ? lastRps.rps + 1 : 1;
  const Tomador = await Empresa.findOne({
    where: {
      id: empresa,
    },
    attributes: ["address", "name", "identifier"],
    raw: true,
  });

  const emissor = await Tenant.findOne({
    where: {
      id: tenantId,
    },
    attributes: ["name", "dadosNfe", "address"],
    raw: true,
  });
  if (!emissor || !Tomador) {
    throw new Error("Erro");
  }

  // Transformar os valores em números onde possível
  const emissorConvertido = {
    ...emissor,
    dadosNfe: convertToNumbers(emissor.dadosNfe),
    address: convertToNumbers(emissor.address),
  };
  const tomadorConvertido = {
    ...Tomador,
    address: convertToNumbers(Tomador.address),
  };
  const idRps = `${novoNumeroRps}_${emissorConvertido.dadosNfe.serie}_1`;
  const descontosNota = convertToNumbers(descontos) as any;

  const dadosParaXML: DadosNota = {
    numeroLote: novoNumeroRps as string,
    idRps: idRps,
    rps: {
      numero: novoNumeroRps as number,
      serie: emissorConvertido.dadosNfe.serie as number,
      tipo: 1,
      dataEmissao: new Date(dataEmissao).toISOString(),
      naturezaOperacao: emissorConvertido.dadosNfe.naturezaOperacao as number,
      simples: emissorConvertido.dadosNfe.simplesNacional as number,
      incentivo: emissorConvertido.dadosNfe.incentivoCultural as number,
      status: 1,
    },
    valorTotal: parseFloat(valor),
    valorCofins: parseFloat(impostosParaEnviar.COFINS),
    valorCsll: parseFloat(impostosParaEnviar.CSLL),
    valorIr: parseFloat(impostosParaEnviar.IRRF),
    valorPis: parseFloat(impostosParaEnviar.PIS),
    valorInss: parseFloat(impostosParaEnviar.INSS),
    IssRetido: emissorConvertido.dadosNfe.reteriss as number,
    descontoCondicionado: descontosNota.CONDICIONADO,
    descontoIncondicionado: descontosNota.INCONDICIONADO,
    aliquota: parseBrazilianFloat(emissorConvertido.dadosNfe.iss),

    itemListaServico: emissorConvertido.dadosNfe.codigoServico as number,
    codTributacao: emissorConvertido.dadosNfe.codigoTributacao as number,
    descricao: pupa(descricao || "", {
      endereco: tomadorConvertido.address.rua as string,
      numero: tomadorConvertido.address.numero as string,
      complemento: tomadorConvertido.address.complemento as string,
      bairro: tomadorConvertido.address.bairro as string,
      codigoMunicipio: tomadorConvertido.address.ibge as string,
      uf: tomadorConvertido.address.estado as string,
      empresa: tomadorConvertido.name,
      cnpj: tomadorConvertido.identifier,
    }) as string,
    codigoMunicipio: emissorConvertido.address.ibge as number,
    prestador: {
      cnpj: emissorConvertido.dadosNfe.cnpj as number,
      inscricaoMunicipal: emissorConvertido.dadosNfe
        .inscricaoMunicipal as number,
    },

    tomador: {
      nome: tomadorConvertido.name,
      cpf: tomadorConvertido.identifier,
      endereco: tomadorConvertido.address.rua as string,
      numero: tomadorConvertido.address.numero as string,
      complemento: tomadorConvertido.address.complemento as string,
      bairro: tomadorConvertido.address.bairro as string,
      codigoMunicipio: tomadorConvertido.address.ibge as string,
      uf: tomadorConvertido.address.estado as string,

      cep: tomadorConvertido.address.cep as number,
    },
  };

  const response = await GerarNFE(dadosParaXML);

  if (response?.sucesso) {
    await NotaFiscal.findOrCreate({
      where: {
        tenantId,
        rps: response.mensagens.lote,
      },
      defaults: {
        tenantId,
        empresaId: empresa,
        rps: response.mensagens.lote,
        codVerificacao: response.mensagens.codVerificacao,
        numeroNota: response.mensagens.numeroNota,
        protocolo: response.mensagens.protocolo,
      },
    });
    const jobId = `pdf_${response.mensagens.lote}`;

    await addJob("pdfQueue", {
      payload: response.mensagens.link,
      jobId: jobId,
    });
    res.status(202).json({
      message: "PDF em processamento",
      jobId,
      rps: response.mensagens.lote,
    });
  } else {
    try {
      for (const erro of response?.mensagens) {
        const codigoErro = erro.codigo;
        const numeroRps = String(novoNumeroRps) || "N/A"; // ou outro valor default

        const [log, criado] = await NotaFiscalLog.findOrCreate({
          where: {
            codigo: codigoErro,
            numeroRps,
          },
          defaults: {
            codigo: codigoErro,
            numeroRps,
            mensagem: erro.mensagem,
          },
          ignoreDuplicates: true,
        });

        if (!criado) {
          console.log("Erro já registrado:", codigoErro, numeroRps);
          return res.status(500).send({ message: response });
        }
      }
    } catch (error) {
      return res.status(500).send({ message: response });
    }
    return res.status(500).send({ message: response });
  }
};

function parseBrazilianFloat(value: unknown): number {
  if (typeof value === "string") {
    const normalized = value.replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed / 100;
  }
  return 0;
}
