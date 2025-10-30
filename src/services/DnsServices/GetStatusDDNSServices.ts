import Empresa from "../../models/Empresa";
import ResultadoDDNS from "../../models/ResultadoDDNS";

export const GetStatusDDNSservices = async () => {
  const status = await ResultadoDDNS.findAll({
    include: {
      model: Empresa,
      attributes: ["name"],
      as: "empresa",
    },
    order: [
      ["empresaId", "ASC"],
      ["verificadoEm", "ASC"],
    ],
    raw: true,
  });

  const formattedData = status.reduce((acc: any, item: any) => {
    let empresa = acc.find(
      (e: { empresaId: any }) => e.empresaId === item.empresaId
    );

    if (!empresa) {
      empresa = {
        empresaId: item.empresaId,
        nome: item["empresa.name"],
        dominios: [], // Criando array para agrupar por domínio
      };
      acc.push(empresa);
    }

    // Verifica se o domínio já existe dentro da empresa
    let dominio = empresa.dominios.find(
      (d: { dominio: string }) => d.dominio === item.dominio
    );

    if (!dominio) {
      dominio = {
        dominio: item.dominio,
        historico: [],
      };
      empresa.dominios.push(dominio);
    }

    // Adiciona o histórico ao domínio correto dentro da empresa
    dominio.historico.push({
      verificadoEm: item.verificadoEm,
      status: item.status,
    });

    return acc;
  }, []);
  return formattedData;
};
