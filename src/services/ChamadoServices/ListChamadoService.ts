import { literal, Op } from "sequelize";
import Chamado from "../../models/Chamado";
import Media from "../../models/Media";
import { AppError } from "../../errors/errors.helper";
import Empresa from "../../models/Empresa";
import User from "../../models/User";
import Contact from "../../models/Contact";

interface IListChamadoService {
  empresaId: number;
}
interface Response {
  chamados: any[];
  count: number;
  hasMore: boolean;
}

export const ListChamadoService = async ({
  empresaId,
}: IListChamadoService): Promise<Chamado[]> => {
  try {
    const list = await Chamado.findAll({
      where: {
        empresaId,
        closedAt: {
          [Op.is]: null,
        },
      },
      include: {
        model: Media,
      },
    });

    return list;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_LIST_CHAMADO_SERVICE", 502);
  }
};

export const listDetailsTicket = async (
  chamadoId: number
): Promise<any | null> => {
  try {
    const chamado = await Chamado.findOne({
      where: { id: chamadoId },
      include: [
        {
          model: Empresa,
          attributes: ["name"],
          where: {
            active: true,
          },
        },
        {
          model: User,
          attributes: ["id", "name"],
        },
        {
          model: Media,
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

interface IListaTodosChamados {
  pageNumber: string;
}

export const ListaTodosChamadosService = async ({
  pageNumber = "1",
}: IListaTodosChamados): Promise<Response> => {
  const limit = 10;
  const offset = limit * (+pageNumber - 1);

  const list = await Chamado.findAll({
    offset: offset,
    limit: limit,
    order: [["createdAt", "DESC"]],
    attributes: {
      include: [
        [literal(`(SELECT COUNT(*) FROM public."Chamados")`), "count"], // Subquery para contar todos os registros
      ],
    },
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

  // Criar uma estrutura customizada para garantir que o front-end receba contatos
  const chamadosComContatos = await Promise.all(
    list.map(async (chamado) => {
      const contatoIds = chamado.contatoId;
      let contatos: Contact[] = [];

      if (Array.isArray(contatoIds) && contatoIds.length > 0) {
        // Busca os contatos associados
        contatos = await Contact.findAll({
          where: {
            id: contatoIds,
          },
          attributes: ["id", "name", "number", "email"],
        });
      }

      // Retorna um objeto customizado contendo tanto os chamados quanto seus contatos associados
      return {
        ...chamado.toJSON(), // Converte o modelo para objeto JSON
        contatos, // Adiciona a propriedade contatos
      };
    })
  );

  let count = 0;
  let chamadosLength = 0;
  if (list?.length) {
    count = list[0]!.dataValues.count!;
    chamadosLength = list.length;
  }
  const hasMore = count > offset + chamadosLength;
  const dataReturn = {
    chamados: chamadosComContatos,
    count,
    hasMore,
  };
  return dataReturn;
};
