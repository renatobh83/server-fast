import { Op } from "sequelize";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import { AppError } from "../../errors/errors.helper";

export const ListContactEmpresaService = async (
  empresaId: number | undefined
) => {
  try {
    const empresa = await Empresa.findByPk(empresaId, {
      include: [
        {
          model: Contact,
          attributes: ["id", "name", "email", "number", "profilePicUrl"],
          as: "contacts",
          through: { attributes: [] },
          where: {
            id: {
              [Op.gt]: 0,
            },
          },
        },
      ],
      attributes: ["name"],
    });

    if (!empresa) {
      return [];
    }

    return empresa.contacts || []; // Retorna os contatos relacionados
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_LIST_CONTACT_COMPANY", 500);
  }
};
