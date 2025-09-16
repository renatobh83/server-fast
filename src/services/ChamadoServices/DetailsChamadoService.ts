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
      ],
    });
    if (chamado) {
      const contatoIds = chamado.contatoId;
      if (Array.isArray(contatoIds) && contatoIds.length > 0) {
        // Busca os contatos associados a esse chamado
        const contatos = await Contact.findAll({
          where: {
            id: contatoIds, // Usa os IDs para buscar os contatos
          },
          attributes: ["id", "name", "number", "email"],
        });

        return {
          ...chamado.toJSON(), // Converte o modelo para objeto JSON
          contatos, // Adiciona a propriedade contatos
        };
      }
    }
    return chamado;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_LIST_DETAILS_TICKET_SERVICE", 502);
  }
};
