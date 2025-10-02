import { Op } from "sequelize";
import Chamado from "../../models/Chamado";
import { AppError } from "../../errors/errors.helper";

export const listaChamadoEmpresaService = async (empresaId: string) => {
  try {
    const chamadosEmpresa = await Chamado.findAll({
      where: {
        empresaId,
        closedAt: {
          [Op.is]: null,
        },
      },
    });
    return chamadosEmpresa;
  } catch (error) {
    throw new AppError("ERR_LIST_CHAMADO_SERVICE", 502);
  }
};
