export function gerarXmlConsulta(rps: number) {
  const xmlLote = `<ConsultarNfseRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
                    <IdentificacaoRps>
                        <Numero>${rps}</Numero>
                        <Serie>1</Serie>
                        <Tipo>1</Tipo>
                    </IdentificacaoRps>
                    <Prestador>
                        <Cnpj>21693445000174</Cnpj>
                        <InscricaoMunicipal>03116040011</InscricaoMunicipal>
                    </Prestador>
</ConsultarNfseRpsEnvio>

`;

  return xmlLote;
}
