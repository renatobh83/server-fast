const soap = require("soap");
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import config from "./config";
import assinarXml, { signXmlDocument } from "./assinatura";
import { gerarXmlGinfes } from "./XML/gerarXmlGinfes";
import { extractPfxToPem } from "./getInfoCert";
import { gerarXmlConsulta } from "./XML/gerarXMLConsulta";
import { parserXmlRetorno } from "./XML/parseRetorno";
import { gerarXmlCancelar } from "./XML/gerarXMLCancelar";
import { parseNfseResposta } from "./XML/parseNfseResposta";
import { parseNfseRespostaCancelamento } from "./XML/ParseNfseCancelamento";
import { AppError } from "../../../errors/errors.helper";

const url =
  config.ambiente === "homologacao"
    ? "https://bhisshomologaws.pbh.gov.br/bhiss-ws/nfse?wsdl"
    : "https://bhissdigitalws.pbh.gov.br/bhiss-ws/nfse?wsdl";

const tmpDir = os.tmpdir();

export async function GerarNFE(dadosNota: any) {
  const keyPath = path.join(tmpDir, "cert_key.pem");
  const certPath = path.join(tmpDir, "cert_cert.pem");

  const xml = gerarXmlGinfes(dadosNota);

  let xmlAssinado = assinarXml(xml);

  // 210976;
  const { certificatePem, privateKeyPem } = extractPfxToPem();

  fs.writeFileSync(keyPath, privateKeyPem);
  fs.writeFileSync(certPath, certificatePem);

  try {
    const httpsAgent = new https.Agent({
      cert: certificatePem,
      key: privateKeyPem,
      rejectUnauthorized: true,
    });
    const args = {
      nfseCabecMsg:
        '<![CDATA[ <cabecalho xmlns="http://www.abrasf.org.br/nfse.xsd" versao="1.00"> <versaoDados>1.00</versaoDados> </cabecalho> ]]>',
      nfseDadosMsg: `<![CDATA[ ${xmlAssinado} ]]>`,
    };
    const client = await soap.createClientAsync(url, {
      wsdl_options: {
        httpsAgent,
      },
    });

    client.setSecurity(new soap.ClientSSLSecurity(keyPath, certPath));
    // console.log(client.describe());
    // const data = await client.GerarNfseAsync(args);

    // MOCK DATA APAGAR
    const xmlResposta = fs.readFileSync(
      path.resolve(__dirname, "./mock/retornoEmissao.xml"),
      "utf-8"
    );
    const data = [
      {
        outputXML: xmlResposta,
      },
    ];
    const { sucesso, mensagens } = await parserXmlRetorno(
      data[0]!.outputXML,
      "GerarNfseResposta"
    );

    if (!sucesso) {
      return {
        sucesso: false,
        mensagens,
      };
    }
    const { respostaRetorno, sucesso: respostaSucess } =
      await parseNfseResposta(data[0]!.outputXML);

    if (respostaSucess) {
      const response = await ConsultaNfseRpsEnvio(respostaRetorno.lote);

      return {
        ...response,
        mensagens: {
          ...respostaRetorno,
          link: response?.mensagens,
        },
      };
    }
  } catch (error: any) {
    console.log(error);
    throw new AppError(error.message, 900);
  }
}

export async function ConsultaNfseRpsEnvio(rps: number) {
  const keyPath = path.join(tmpDir, "cert_key.pem");
  const certPath = path.join(tmpDir, "cert_cert.pem");

  const xml = gerarXmlConsulta(rps);
  const args = {
    nfseCabecMsg:
      '<![CDATA[ <cabecalho xmlns="http://www.abrasf.org.br/nfse.xsd" versao="1.00"> <versaoDados>1.00</versaoDados> </cabecalho> ]]>',
    nfseDadosMsg: `<![CDATA[ ${xml} ]]>`,
  };

  const { certificatePem, privateKeyPem } = extractPfxToPem();

  fs.writeFileSync(keyPath, privateKeyPem);
  fs.writeFileSync(certPath, certificatePem);

  try {
    const httpsAgent = new https.Agent({
      cert: certificatePem,
      key: privateKeyPem,
      rejectUnauthorized: true,
    });

    const client = await soap.createClientAsync(url, {
      wsdl_options: {
        httpsAgent,
      },
    });

    client.setSecurity(new soap.ClientSSLSecurity(keyPath, certPath));
    // console.log(client.describe());
    const data = await client.ConsultarNfsePorRpsAsync(args);

    const { sucesso, mensagens } = await parserXmlRetorno(
      data[0].outputXML,
      "ConsultarNfseRpsResposta"
    );

    if (!sucesso) {
      return {
        sucesso: false,
        mensagens,
      };
    }
    fs.unlinkSync(keyPath);
    fs.unlinkSync(certPath);
    return {
      sucesso: true,
      mensagens: data[0].outputXML,
    };
  } catch (error: any) {
    fs.unlinkSync(keyPath);
    fs.unlinkSync(certPath);
    throw new AppError(error.message, 900);
  }
}

export const cancelarNfe = async (dadosCancelamento: any) => {
  const keyPath = path.join(tmpDir, "cert_key.pem");
  const certPath = path.join(tmpDir, "cert_cert.pem");

  const xml = gerarXmlCancelar(dadosCancelamento);
  const { cleanCert, certificatePem, privateKeyPem } = extractPfxToPem();
  const xmlAssinado = signXmlDocument(
    xml,
    privateKeyPem,
    cleanCert,
    "//*[local-name(.)='InfPedidoCancelamento']",
    {
      reference: "//*[local-name(.)='InfPedidoCancelamento']",
      action: "after",
    },
    certificatePem
  );

  const args = {
    nfseCabecMsg:
      '<![CDATA[ <cabecalho xmlns="http://www.abrasf.org.br/nfse.xsd" versao="1.00"> <versaoDados>1.00</versaoDados> </cabecalho> ]]>',
    nfseDadosMsg: `<![CDATA[ ${xmlAssinado} ]]>`,
  };

  fs.writeFileSync(keyPath, privateKeyPem);
  fs.writeFileSync(certPath, certificatePem);

  try {
    const httpsAgent = new https.Agent({
      cert: certificatePem,
      key: privateKeyPem,
      rejectUnauthorized: true,
    });

    const client = await soap.createClientAsync(url, {
      wsdl_options: {
        httpsAgent,
      },
    });

    client.setSecurity(new soap.ClientSSLSecurity(keyPath, certPath));

    // const data = await client.CancelarNfseAsync(args);

    // MOCK DATA APAGAR
    const xmlResposta = fs.readFileSync(
      path.resolve(__dirname, "./mock/retornoCancelamento.xml"),
      "utf-8"
    );
    const data = [
      {
        outputXML: xmlResposta,
      },
    ];
    const response = await parseNfseRespostaCancelamento(data[0]!.outputXML);
    fs.unlinkSync(keyPath);
    fs.unlinkSync(certPath);
    return response;
  } catch (error: any) {
    fs.unlinkSync(keyPath);
    fs.unlinkSync(certPath);
    console.log(error.message);
    throw error;
  }
};
