import { AppError } from "../../errors/errors.helper";
import NotaFiscal from "../../models/NotaFiscal";
import Tenant from "../../models/Tenant";
import { cancelarNfe } from "../IntegracoesServices/NFE";

interface Request {
  tenantId: number;
  rps: string;
}
export const CancelarNotaFiscalService = async ({ tenantId, rps }: Request) => {
  const nota = await NotaFiscal.findOne({
    include: [
      { model: Tenant, attributes: ["dadosNfe", "address"], required: true },
    ],
    where: {
      rps,
      tenantId,
    },
    raw: true,
    nest: true, // Importante para estruturar corretamente os includes
  });
  if (!nota) {
    throw new AppError("ERR_NO_NFE_FOUND", 404);
  }

  const tenant = nota.tenant as any; // Acessa o Tenant carregado via include

  const dadosNotaParaCancelar = {
    id: `Cancelamento_${nota.numeroNota}`,
    numero: nota.numeroNota,
    cnpj: tenant.dadosNfe.cnpj,
    InscricaoMunicipal: tenant.dadosNfe.inscricaoMunicipal,
    CodigoMunicipio: tenant.dadosNfe.ibge,
  };
  
  const response = await cancelarNfe(dadosNotaParaCancelar);
  if (response.sucesso) {
    await NotaFiscal.update(
      {
        cancelada: true,
        datacancelamento: new Date(),
        status: "Cancelada", // Atualiza o campo virtual (se estiver usando)
      },
      {
        where: { id: nota.id },
      }
    );
    const notaAtualizada = await NotaFiscal.findByPk(nota.id, {
      attributes: [
        "id",
        "numeroNota",
        "cancelada",
        "datacancelamento",
        "createdAt",
      ],
      include: [
        {
          model: Tenant,
          attributes: ["dadosNfe", "address"],
        },
      ],
    });

    return {
      ...response,
      nota: notaAtualizada,
    };
  }
  return response;
};

//   const id = "Cancelamento_202500000000003";
//   const numero = 202500000000003;
//   const cnpj = 21693445000174;
//   const InscricaoMunicipal = "03116040011";
//   const CodigoMunicipio = 3106200;
