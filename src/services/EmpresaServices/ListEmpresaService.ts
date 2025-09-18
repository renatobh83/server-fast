import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import EmpresaContrato from "../../models/EmpresaContrato";

export const ListEmpresaService = async (
  tenantId: number
): Promise<Empresa[]> => {
  try {
    const empresas = await Empresa.findAll({
      where: {
        tenantId,
      },
      include: [
        {
          model: Contact,
          attributes: ["id", "name", "email", "number", "profilePicUrl"],
          as: "contacts",
          through: { attributes: [] },
        },
        {
          model: EmpresaContrato,
          as: "contratos",
          attributes: ["id", "dataContrato", "totalHoras"],
          // separate: true,
          order: [["dataContrato", "DESC"]],
        },
      ],
      order: [["name", "ASC"]],
    });

    return empresas;
  } catch (error: any) {
    console.log(error);
    throw new AppError("ERR_LIST_CONMPANY_SERVICE", 500);
  }
};
