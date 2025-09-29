import { AppError } from "../../errors/errors.helper";
import Chamado from "../../models/Chamado";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import Media from "../../models/Media";
import User from "../../models/User";

export const detailsChamadoService = async (
  chamadoId: number
): Promise<any | null> => {
  try {
    const chamado = await Chamado.findOne({
      where: { id: chamadoId },
      include: [
        {
          model: Empresa,
          as: "empresa",
          attributes: ["name"],
          where: {
            active: true,
          },
        },
        {
          model: User,
          as: "usuario",
          attributes: ["id", "name"],
        },
        {
          model: Media,
          as: "media",
        },
        {
          model: Contact,
          as: "contatos",
          attributes: ["id", "name", "number", "email"],
        },
      ],
    });

    return chamado;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    console.log(error);
    throw new AppError("ERR_LIST_DETAILS_TICKET_SERVICE", 502);
  }
};
