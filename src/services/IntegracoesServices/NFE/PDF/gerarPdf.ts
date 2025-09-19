// gerar_pdf.js

// 1. Importar as bibliotecas necessárias
const fs = require("fs").promises; // Usamos a versão de promessas do 'fs' para código mais limpo (async/await)
import xml2js from "xml2js";
import path from "path";
import { format, parseISO } from "date-fns";
import axios from "axios";

import { HttpsProxyAgent } from "https-proxy-agent";
import { AppError } from "../../../../errors/errors.helper";

const agent = new HttpsProxyAgent("http://proxies:renato@152.67.48.199:42827");
export async function gerarNfsePDF(xml: any) {
  try {
    console.log("Iniciando a geração da NFS-e em PDF...");
    // Converter o XML para um objeto JavaScript
    const parser = new xml2js.Parser({ explicitArray: false, trim: true });
    const result = await parser.parseStringPromise(xml);
    // O objeto de dados que será usado no template.
    // A estrutura (InfNfse) vem da raiz do nosso XML.
    const infNfse = result?.ConsultarNfseRpsResposta?.CompNfse?.Nfse?.InfNfse;
    const infNfseCancelamento =
      result?.ConsultarNfseRpsResposta?.CompNfse?.NfseCancelamento?.Confirmacao;

    // Verificação para garantir que encontramos os dados
    if (!infNfse) {
      throw new Error(
        'A estrutura do XML não corresponde ao esperado. Não foi possível encontrar o nó "InfNfse". Verifique o arquivo nota.xml.'
      );
    }

    // Agora, 'infNfse' contém o objeto que usaremos como base.
    let dadosParaTemplate = infNfse;

    if (infNfseCancelamento && infNfseCancelamento.DataHora) {
      const dataObj = parseISO(infNfseCancelamento.DataHora);
      // Usamos a função 'format' para criar as strings no formato desejado
      dadosParaTemplate.cancelamento = format(dataObj, "dd/MM/yyyy"); // Cria '01/07/2025'
    }
    // console.log(JSON.stringify(infNfseCancelamento, null, 2));
    // --- APLICAÇÃO DAS FORMATAÇÕES ---
    console.log("Aplicando formatações nos dados...");

    // 1. Formatar o Número da Nota
    if (dadosParaTemplate.Numero) {
      dadosParaTemplate.Numero = formatarNumeroNfse(dadosParaTemplate.Numero);
    }

    // 2.   Formatar a Data de Emissão
    // 2. Formatar e Separar Data e Hora de Emissão
    if (dadosParaTemplate.DataEmissao) {
      const dataOriginal = dadosParaTemplate.DataEmissao; // Ex: '2025-07-01T11:48:44'
      // parseISO converte a string ISO para um objeto Date de forma confiável
      const dataObj = parseISO(dataOriginal);
      // Usamos a função 'format' para criar as strings no formato desejado
      dadosParaTemplate.DataEmissaoFormatada = format(dataObj, "dd/MM/yyyy"); // Cria '01/07/2025'
      dadosParaTemplate.HoraEmissaoFormatada = format(dataObj, "HH:mm:ss"); // Cria '11:48:44'
    }

    // 3. Adicionar Data de Geração
    dadosParaTemplate.DataGeracao = format(new Date(), "dd/MM/yyyy HH:mm:ss");

    // 4. CONSULTAR API DO IBGE E ADICIONAR NOME DA CIDADE
    // O código do município geralmente está nos dados do prestador.

    dadosParaTemplate = await atualizarNomesCidades(dadosParaTemplate);
    const codigoItem = await buscarDescricaoPorCodigo(
      dadosParaTemplate.Servico.ItemListaServico
    );
    dadosParaTemplate.Servico.DescricaoCodigoItem = `${dadosParaTemplate.Servico.ItemListaServico} - ${codigoItem}`;

    // 5. BUSCAR DESCRIÇÃO DO SERVIÇO
    const codigoServico = dadosParaTemplate.Servico?.CodigoTributacaoMunicipio;
    if (codigoServico) {
      const codigoFormatado = formatarCodigoTributacao(codigoServico);
      const descricaoServico = await buscarDescricaoServico(codigoFormatado);

      // Adicionamos a nova informação ao objeto de dados do template
      dadosParaTemplate.Servico.DescricaoCodigoTributacao = `${codigoFormatado} / ${descricaoServico}`;
    }

    // 6. UNIFICAR DOCUMENTO DO TOMADOR (CPF OU CNPJ)
    if (dadosParaTemplate.TomadorServico?.IdentificacaoTomador?.CpfCnpj) {
      const tomadorDoc =
        dadosParaTemplate.TomadorServico.IdentificacaoTomador.CpfCnpj;

      // Cria uma nova propriedade 'Documento' que conterá o CPF ou o CNPJ.
      // O operador '||' aqui no JavaScript funciona perfeitamente.
      tomadorDoc.Documento =
        tomadorDoc.Cpf || tomadorDoc.Cnpj || "Não informado";
    }
    // 7. Formatacao valores

    dadosParaTemplate.Servico.Valores.ValorServicos = `R$ ${dadosParaTemplate.Servico.Valores.ValorServicos}`;
    dadosParaTemplate.Servico.Valores.ValorIss = `R$ ${dadosParaTemplate.Servico.Valores.ValorIss}`;
    dadosParaTemplate.Servico.Valores.BaseCalculo = `R$ ${dadosParaTemplate.Servico.Valores.BaseCalculo}`;

    dadosParaTemplate.Servico.Valores.ValorIssRetido = `R$ ${
      dadosParaTemplate.Servico.Valores.ValorIssRetido || "0.00"
    }`;

    const impostosFederais = `R$ ${
      dadosParaTemplate.Servico.Valores.ValorPis +
        dadosParaTemplate.Servico.Valores.ValorCofins +
        dadosParaTemplate.Servico.Valores.ValorCsll +
        dadosParaTemplate.Servico.Valores.ValorIr || "0.00"
    }`;

    dadosParaTemplate.Servico.Valores.DescontoIncondicionado = `R$ ${
      dadosParaTemplate.Servico.Valores.DescontoIncondicionado || "0.00"
    }`;
    dadosParaTemplate.Servico.Valores.ValorDeducoes = `R$ ${
      dadosParaTemplate.Servico.Valores.ValorDeducoes || "0.00"
    }`;
    dadosParaTemplate.Servico.Valores.impostosFederais = impostosFederais;
    dadosParaTemplate.Servico.Valores.DescontoCondicionado = `R$ ${
      dadosParaTemplate.Servico.Valores.DescontoCondicionado || "0.00"
    }`;

    const aliquotaPercentual =
      parseFloat(dadosParaTemplate.Servico.Valores.Aliquota) * 100;
    dadosParaTemplate.Servico.Valores.Aliquota = `${aliquotaPercentual.toFixed(
      2
    )} %`;

    // 8 - Descricao natureza operacao

    const descricaoNaturezaOperacao = await buscarDescricaoNaturezaOperacao(
      dadosParaTemplate.NaturezaOperacao
    );
    dadosParaTemplate.descricaoNaturezaOperacao = descricaoNaturezaOperacao;
    // Formatar a data de emissão para um formato mais legível
    dadosParaTemplate.DataEmissao = new Date(
      dadosParaTemplate.DataEmissao
    ).toLocaleString("pt-BR");

    return {
      dadosParaTemplate,
    };
  } catch (error: any) {
    throw new AppError(error.message, 400);
  }
}
/**
 * Formata o número da NFS-e para o padrão ANO/NÚMERO.
 * Exemplo: '202500000000001' se torna '2025/1'.
 * @param {string} numeroLongo O número da nota vindo do XML.
 * @returns {string} O número formatado.
 */
function formatarNumeroNfse(numeroLongo: string): string {
  if (
    !numeroLongo ||
    typeof numeroLongo !== "string" ||
    numeroLongo.length < 5
  ) {
    return numeroLongo; // Retorna o original se for inválido
  }

  // Extrai os 4 primeiros dígitos para o ano
  const ano = numeroLongo.substring(0, 4);

  // Pega o restante da string e converte para número para remover os zeros à esquerda
  const sequencial = parseInt(numeroLongo.substring(4), 10);

  return `${ano}/${sequencial}`;
}

/**
 * Busca o nome de um município na API do IBGE usando seu código.
 * @param {string} codigoMunicipio O código IBGE do município (ex: '3106200').
 * @returns {Promise<string>} O nome do município.
 * @throws {Error} Lança um erro se a API do IBGE não puder ser contatada, demorar muito ou retornar um erro.
 */
async function buscarNomeCidadePorCodigo(
  codigoMunicipio: string
): Promise<string> {
  if (!codigoMunicipio) {
    // É importante tratar isso como um erro, pois o código é esperado.
    throw new Error("Código do município não foi fornecido.");
  }

  try {
    const url = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${codigoMunicipio}`;
    console.log(`Consultando API do IBGE: ${url}`);

    const response = await axios.get(url, {
      timeout: 15000, // Timeout de 15 segundos
      httpAgent: agent,
    });

    if (response.data && response.data.nome) {
      return response.data.nome;
    } else {
      throw new Error("INVALID_MUNICIPALITY_CODE");
      throw new Error(
        `Resposta da API inválida para o código ${codigoMunicipio}.`
      );
    }
  } catch (error: any) {
    console.error(
      `Erro ao consultar a API do IBGE para o código ${codigoMunicipio}:`,
      error.message
    );

    if (error.code === "ECONNABORTED") {
      throw new Error("ECONNABORTED");
      // throw new Error(
      //   "A consulta ao serviço do IBGE demorou muito para responder (timeout). O PDF não pode ser gerado."
      // );
    }

    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND" ||
      !error.response
    ) {
      throw new Error("ENOTFOUND");
      //  throw new Error("Não foi possível se comunicar com o serviço do IBGE. O servidor pode estar fora do ar.");
    }

    if (error.response) {
      throw new Error("ERROR_RESPONSE");
      throw new Error(
        `Erro ${error.response.status} ao buscar dados do município. O PDF não pode ser gerado.`
      );
    }

    // Repassa qualquer outro erro inesperado
    throw error;
  }
}
// Função para formatar o código de tributação
/**
 * Formata o código de tributação do município.
 * Ex: '40200388' se torna '0402-0/03-88'.
 * @param {string} codigo O código numérico de 8 dígitos.
 * @returns {string} O código formatado ou o original em caso de erro.
 */
function formatarCodigoTributacao(codigo: string): string {
  // Garante que o código tenha 8 dígitos
  const str = codigo.toString().padStart(9, "0");

  // Quebra nos pedaços e formata
  const parte1 = str.slice(0, 4); // 0402
  const parte2 = str.slice(4, 5); // 0
  const parte3 = str.slice(5, 7); // 03
  const parte4 = str.slice(7); // 88

  return `${parte1}-${parte2}/${parte3}-${parte4}`;
}

// Função para buscar a descrição do serviço
// Usamos um 'cache' simples para não ler o arquivo JSON toda vez que a função for chamada.
let tabelaServicosCache: any = null;

/**
 * Busca a descrição de um serviço com base no código formatado.
 * @param {string} codigoFormatado O código no formato 'XXXX-X/XX-XX'.
 * @returns {string} A descrição do serviço ou uma mensagem padrão.
 */
async function buscarDescricaoServico(codigoFormatado: string) {
  if (!tabelaServicosCache) {
    try {
      // Carrega e parseia o arquivo JSON. 'readFileSync' é aceitável aqui pois
      // é uma tabela de configuração que só precisa ser lida uma vez.

      const jsonPath = path.join(
        __dirname,
        "CodigoTributacao/tabela_servicos.json"
      );

      const jsonData = await fs.readFile(jsonPath, "utf-8");
      tabelaServicosCache = JSON.parse(jsonData);
    } catch (error) {
      console.error(
        "Erro ao carregar a tabela de serviços (tabela_servicos.json):",
        error
      );
      tabelaServicosCache = {};
      return "Erro ao carregar tabela de serviços";
    }
  }
  return tabelaServicosCache[codigoFormatado] || "Descrição não encontrada";
}

let tabelaNaturezaOperacaoCache: any = null;
/**
 * Busca a descrição de um serviço com base no código formatado.
 * @param {string} codigo O código no formato 'XXXX-X/XX-XX'.
 * @returns {string} A descrição do serviço ou uma mensagem padrão.
 */
async function buscarDescricaoNaturezaOperacao(codigo: string) {
  if (!tabelaNaturezaOperacaoCache) {
    try {
      // Carrega e parseia o arquivo JSON. 'readFileSync' é aceitável aqui pois
      // é uma tabela de configuração que só precisa ser lida uma vez.

      const jsonPath = path.join(
        __dirname,
        "CodigoTributacao/natureza_operacao.json"
      );

      const jsonData = await fs.readFile(jsonPath, "utf-8");
      tabelaNaturezaOperacaoCache = JSON.parse(jsonData);
    } catch (error) {
      console.error(
        "Erro ao carregar a tabela de serviços (natureza_operacao.json):",
        error
      );
      tabelaNaturezaOperacaoCache = {};
      return "Erro ao carregar tabela de natureza_operacao";
    }
  }
  return tabelaNaturezaOperacaoCache[codigo] || "Descrição não encontrada";
}

async function atualizarNomesCidades(dados: any) {
  // Validação inicial do objeto
  if (!dados || typeof dados !== "object") {
    throw new Error("Dados inválidos para atualização de cidades");
  }

  // Cria cópia para não modificar o original diretamente
  const dadosAtualizados = JSON.parse(JSON.stringify(dados));
  try {
    const codigos = {
      prestador: dadosAtualizados?.PrestadorServico?.Endereco?.CodigoMunicipio,
      tomador: dadosAtualizados?.TomadorServico?.Endereco?.CodigoMunicipio,
    };

    let resultados = [];
    if (codigos.prestador === codigos.tomador) {
      // Faz apenas uma consulta
      const nomeCidade = await buscarNomeCidadePorCodigo(codigos.prestador);
      resultados = [nomeCidade, nomeCidade]; // duplica o valor para manter compatibilidade
    } else {
      // Faz duas consultas em paralelo
      resultados = await Promise.all([
        buscarNomeCidadePorCodigo(codigos.prestador),
        buscarNomeCidadePorCodigo(codigos.tomador),
      ]);
    }

    // Atualizações condicionais
    if (resultados[0] && dadosAtualizados.PrestadorServico?.Endereco) {
      dadosAtualizados.PrestadorServico.Endereco.NomeCidade = resultados[0];
    }

    if (resultados[1] && dadosAtualizados.TomadorServico?.Endereco) {
      dadosAtualizados.TomadorServico.Endereco.NomeCidade = resultados[1];
    }

    return dadosAtualizados;
  } catch (error: any) {
    throw new AppError(error.message, 400);
  }
}

// Função para buscar a descrição pelo código do subitem (ex: "4.02")
async function buscarDescricaoPorCodigo(codigoSubitem: any) {
  const jsonPath = path.join(__dirname, "CodigoTributacao/item.json");

  const jsonData = await fs.readFile(jsonPath, "utf-8");
  const todosItens = JSON.parse(jsonData);

  for (const item of todosItens) {
    for (const subitem of item.subitens) {
      if (subitem.codigo === codigoSubitem) {
        return subitem.descricao;
      }
    }
  }

  return "Subitem não encontrado.";
}
