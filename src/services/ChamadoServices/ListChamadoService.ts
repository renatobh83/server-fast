import { literal, Op } from "sequelize";
import Chamado from "../../models/Chamado";
import Media from "../../models/Media";
import Empresa from "../../models/Empresa";
import User from "../../models/User";
import Contact from "../../models/Contact";
import { getCache, setCache } from "../../utils/cacheRedis";
import Redis from "ioredis";
import { RedisKeys } from "../../constants/redisKeys";

interface Response {
  chamados: any[];
  count: number;
  hasMore: boolean;
}

interface IListaTodosChamados {
  pageNumber: string;
}

export const ListaTodosChamadosService = async ({
  pageNumber = "1",
}: IListaTodosChamados): Promise<Response> => {
  const limit = 10;
  const offset = limit * (+pageNumber - 1);
  let chamados = (await getCache(RedisKeys.chamados(pageNumber))) as Chamado[];
  if (!chamados) {
    chamados = await Chamado.findAll({
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
        {
          model: Contact,
          as: "contatos",
          attributes: ["id", "name", "number", "email"],
        },
      ],
    });
    await setCache(RedisKeys.chamados(pageNumber), chamados, 60);
  }

  let count = 0;
  let chamadosLength = 0;
  if (chamados?.length) {
    count = chamados[0]!.dataValues.count!;
    chamadosLength = chamados.length;
  }
  const hasMore = count > offset + chamadosLength;
  const dataReturn = {
    chamados: chamados,
    count,
    hasMore,
  };
  return dataReturn;
};
