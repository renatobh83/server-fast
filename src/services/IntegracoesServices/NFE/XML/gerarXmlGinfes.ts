export interface DadosNota {
  numeroLote: string;
  prestador: {
    cnpj: number;
    inscricaoMunicipal: number;
  };
  idRps: string;
  rps: {
    numero: number;
    serie: number;
    tipo: number;
    dataEmissao: string;
    naturezaOperacao: number;
    simples: number;
    incentivo: number;
    status: number;
  };
  valorTotal: number;
  valorPis: number;
  valorCofins: number;
  valorIr: number;
  valorCsll: number;
  valorInss: number;
  deducoes?: number;
  descontoIncondicionado?: number;
  descontoCondicionado?: number;
  outrasRetencoes?: number;
  IssRetido: number;
  aliquota: number;
  itemListaServico: number;
  codTributacao: number;
  descricao: string;
  codigoMunicipio: number;
  tomador: {
    cpf: any;
    nome: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    uf: string;
    cep: number;
    telefone?: string;
    email?: string;
    codigoMunicipio: string;
  };
}
export function gerarXmlGinfes(dados: DadosNota) {
  const documentoTomador =
    dados.tomador.cpf.length > 11
      ? `<Cnpj>${dados.tomador.cpf}</Cnpj>`
      : `<Cpf>${dados.tomador.cpf}</Cpf>`;

  const complemento = dados.tomador.complemento
    ? `<Complemento>${dados.tomador.complemento}</Complemento>`
    : "";

  const telefone = dados.tomador.telefone
    ? `<Telefone>${dados.tomador.telefone}</Telefone>`
    : "";

  const email = dados.tomador.email
    ? `<Email>${dados.tomador.email}</Email>`
    : "";

  const numero = dados.tomador.numero
    ? `<Numero>${dados.tomador.numero}</Numero>`
    : "";

  const bairro = dados.tomador.bairro
    ? `<Bairro>${dados.tomador.bairro}</Bairro>`
    : "";

  const endereco = dados.tomador.endereco
    ? `<Endereco>${dados.tomador.endereco}</Endereco>`
    : "";

  const razaoSocial = dados.tomador.nome
    ? `<RazaoSocial>${dados.tomador.nome}</RazaoSocial>`
    : "";

  const contato =
    telefone || email ? `<Contato>${telefone}${email}</Contato>` : "";

  const enderecoBlock =
    endereco || numero || complemento || bairro
      ? `<Endereco>
          ${endereco}
          ${numero}
          ${complemento}
          ${bairro}
          <CodigoMunicipio>${dados.tomador.codigoMunicipio}</CodigoMunicipio>
          <Uf>${dados.tomador.uf}</Uf>
          <Cep>${dados.tomador.cep}</Cep>
        </Endereco>`
      : "";

  const deducoes = dados.deducoes || 0;

  const descontoIncondicionado = dados.descontoIncondicionado || 0;
  const DescontoCondicionado = dados.descontoCondicionado || 0;
  const outrasRetencoes = dados.outrasRetencoes || 0;
  const BaseCalculo = dados.valorTotal - deducoes - descontoIncondicionado;
  const valorIss = BaseCalculo * dados.aliquota;
  const ValorIssRetido = dados.IssRetido === 1 ? valorIss : 0;

  const totalImpostosFederais =
    dados.valorCofins +
    dados.valorCsll +
    dados.valorIr +
    dados.valorPis +
    dados.valorInss;

  const ValorLiquidoNfse = (
    dados.valorTotal -
    totalImpostosFederais -
    outrasRetencoes -
    ValorIssRetido -
    descontoIncondicionado -
    DescontoCondicionado
  ).toFixed(2);
  const xmlLote = `<GerarNfseEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
  <LoteRps Id="LOTE_${dados.numeroLote}" versao="1.00">
    <NumeroLote>${dados.numeroLote}</NumeroLote>
    <Cnpj>${dados.prestador.cnpj}</Cnpj>
    <InscricaoMunicipal>${
      dados.prestador.inscricaoMunicipal
    }</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfRps Id="${dados.idRps}">
          <IdentificacaoRps>
            <Numero>${dados.rps.numero}</Numero>
            <Serie>${dados.rps.serie}</Serie>
            <Tipo>${dados.rps.tipo}</Tipo>
          </IdentificacaoRps>
          <DataEmissao>${dados.rps.dataEmissao}</DataEmissao>
          <NaturezaOperacao>${dados.rps.naturezaOperacao}</NaturezaOperacao>
          <OptanteSimplesNacional>${dados.rps.simples}</OptanteSimplesNacional>
          <IncentivadorCultural>${dados.rps.incentivo}</IncentivadorCultural>
          <Status>${dados.rps.status}</Status>
          <Servico>
            <Valores>
              <ValorServicos>${dados.valorTotal.toFixed(2)}</ValorServicos>
              <ValorDeducoes>${deducoes.toFixed(2)}</ValorDeducoes>
              <ValorPis>${dados.valorPis.toFixed(2)}</ValorPis>
              <ValorCofins>${dados.valorCofins.toFixed(2)}</ValorCofins>
              <ValorInss>${dados.valorInss.toFixed(2)}</ValorInss>
              <ValorIr>${dados.valorIr.toFixed(2)}</ValorIr>
              <ValorCsll>${dados.valorCsll.toFixed(2)}</ValorCsll>
              <IssRetido>${dados.IssRetido}</IssRetido>
              <ValorIss>${valorIss.toFixed(2)}</ValorIss>
              <ValorIssRetido>${ValorIssRetido.toFixed(2)}</ValorIssRetido>
              <OutrasRetencoes>${outrasRetencoes.toFixed(2)}</OutrasRetencoes>
              <BaseCalculo>${BaseCalculo.toFixed(2)}</BaseCalculo>
              <Aliquota>${dados.aliquota}</Aliquota>
              <ValorLiquidoNfse>${ValorLiquidoNfse}</ValorLiquidoNfse>
              <DescontoIncondicionado>${descontoIncondicionado.toFixed(
                2
              )}</DescontoIncondicionado>
              <DescontoCondicionado>${DescontoCondicionado.toFixed(
                2
              )}</DescontoCondicionado>
            </Valores>
            <ItemListaServico>${dados.itemListaServico}</ItemListaServico>
            <CodigoTributacaoMunicipio>${
              dados.codTributacao
            }</CodigoTributacaoMunicipio>
            <Discriminacao>${dados.descricao}</Discriminacao>
            <CodigoMunicipio>${dados.codigoMunicipio}</CodigoMunicipio>
          </Servico>
          <Prestador>
            <Cnpj>${dados.prestador.cnpj}</Cnpj>
            <InscricaoMunicipal>${
              dados.prestador.inscricaoMunicipal
            }</InscricaoMunicipal>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj>
                ${documentoTomador}
              </CpfCnpj>
            </IdentificacaoTomador>
            ${razaoSocial}
            ${enderecoBlock}
            ${contato}
          </Tomador>
        </InfRps>
      </Rps>
    </ListaRps>
  </LoteRps>
</GerarNfseEnvio>`;

  return xmlLote;
}
