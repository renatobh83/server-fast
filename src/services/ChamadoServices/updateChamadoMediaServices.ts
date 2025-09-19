import { AppError } from "../../errors/errors.helper";
import Chamado from "../../models/Chamado";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import Media from "../../models/Media";
import User from "../../models/User";

export const updateChamadoMediaServices = async (
  files: any,
  chamadoId: any
) => {
  try {
    if (Array.isArray(files) && files.length > 0) {
      const mediaData = files.map((file) => {
        const { url, type } = prepareMediaFile(file);
        return { url, type, chamadoId };
      }) as unknown as Media[];
      await Media.bulkCreate(mediaData);
    }
    const chamado = await Chamado.findByPk(chamadoId, {
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
          model: Media,
          as: "media",
        },
        {
          model: User,
          as: "usuario",
          attributes: ["id", "name"],
        },
        {
          model: Contact,
          as: "contatos",
          attributes: ["id", "name", "number", "email"],
        },
      ],
    });

    return chamado;
  } catch (error) {
    throw new AppError("ERR_ATTCHMENTS_CHAMADO_SERVICE", 502);
  }
};

function prepareMediaFile(file: any): { url: string; type: string } {
  const { originalname, filename, mimetype } = file; // Nomes corretos dos campos

  const { BACKEND_URL, NODE_ENV, PROXY_PORT } = process.env;

  let url = `${BACKEND_URL}/public/attachments/${filename}`;
  if (NODE_ENV === "development") {
    url = `${BACKEND_URL}:${PROXY_PORT}/public/attachments/${filename}`;
  }

  const type = mimetype;
  return { url, type };
}
