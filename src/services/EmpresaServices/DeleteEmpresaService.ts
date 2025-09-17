import { AppError } from "../../errors/errors.helper";
import Chamado from "../../models/Chamado";
import Empresa from "../../models/Empresa";

interface IDeleteEmpresaService {
  tenantId: number;
  empresaId: number;
}
export const DeleteEmpresaService = async ({
  empresaId,
  tenantId,
}: IDeleteEmpresaService): Promise<boolean> => {
  const empresa = await Empresa.findOne({
    where: {
      tenantId,
      id: empresaId,
    },
  });
  if (!empresa) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }
  const count = await Chamado.count({
    where: { empresaId },
  });

  if (count > 0) {
    throw new AppError("ERR_TICKET_FOUND_CONMPANY", 409);
  }
  await empresa.destroy();
  return true;
};
