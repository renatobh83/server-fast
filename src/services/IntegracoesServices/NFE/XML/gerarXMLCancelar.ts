interface DadosCancelarNota {
  id: string;
  numero: number;
  cnpj: number;
  InscricaoMunicipal: string;
  CodigoMunicipio: any;
}
export function gerarXmlCancelar({
  id,
  numero,
  cnpj,
  InscricaoMunicipal,
  CodigoMunicipio,
}: DadosCancelarNota) {
  const xmlLote = `<CancelarNfseEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
                    <Pedido xmlns="http://www.abrasf.org.br/nfse.xsd">
                        <InfPedidoCancelamento Id="${id}">
                            <IdentificacaoNfse>
                                <Numero>${numero}</Numero>
                                <Cnpj>${cnpj}</Cnpj>
                                <InscricaoMunicipal>${InscricaoMunicipal}</InscricaoMunicipal>
                                <CodigoMunicipio>${CodigoMunicipio}</CodigoMunicipio>
                            </IdentificacaoNfse>
                            <CodigoCancelamento>2</CodigoCancelamento>
                        </InfPedidoCancelamento>
                    </Pedido>
                </CancelarNfseEnvio>

`;

  return xmlLote;
}
