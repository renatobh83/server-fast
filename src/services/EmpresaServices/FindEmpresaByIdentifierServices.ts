import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import EmpresaContrato from "../../models/EmpresaContrato";

export const FindEmpresaByIdentifierServices = async (
  identifier: number
): Promise<Empresa> => {
  try {
    const empresa = await Empresa.findOne({
      where: {
        identifier,
        active: true,
      },
      include: [
        {
          model: Contact,
          attributes: ["id", "name", "email", "number", "profilePicUrl"],
          as: "contacts",
          through: { attributes: [] },
        },
      ],
      order: [["name", "ASC"]],
      attributes: ["id", "name", "tenantId", "identifier"],
    });
    if (!empresa) {
      throw new AppError("ERR_NO_FOUND_CONMPANY", 404);
    }

    return empresa;
  } catch (error) {
    console.log(error);
    throw new AppError("ERR_TICKET_FOUND_CONMPANY", 403);
  }
};
// 18273094000138
