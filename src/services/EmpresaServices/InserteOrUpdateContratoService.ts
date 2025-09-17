import { Op } from "sequelize";
import EmpresaContrato from "../../models/EmpresaContrato";
import { startOfDay, endOfDay } from "date-fns";

interface ContratoServiceProps {
  empresaId: number;
  tenantId: number;
  totalHoras: number;
  dataContrato: Date;
}

export const InserteOrUpdateContratoService = async ({
  dataContrato,
  empresaId,
  tenantId,
  totalHoras,
}: ContratoServiceProps): Promise<EmpresaContrato> => {
  const start = startOfDay(dataContrato);
  const end = endOfDay(dataContrato);

  const contratoUpdate = await EmpresaContrato.findOne({
    where: {
      dataContrato: {
        [Op.between]: [start, end],
      },
      empresaId,
    },
  });

  if (contratoUpdate) {
    await contratoUpdate.update({
      totalHoras,
    });
    return contratoUpdate;
  }

  const contrato = await EmpresaContrato.create({
    dataContrato,
    tenantId,
    empresaId,
    totalHoras,
  });

  return contrato;
};
