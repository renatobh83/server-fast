import { AppError } from "../../errors/errors.helper";
import Chamado from "../../models/Chamado";
import User from "../../models/User";

export const ListTempoChamado = async (empresaId: number) => {
  try {
    const chamados = await Chamado.findAll({
      where: {
        empresaId,
      },
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["name", "email"],
        },
      ],
      attributes: ["descricao", "status", "tempoChamado"],
    });
    if (!chamados) {
      throw new AppError("ERR_NO_CHAMADO_FOUND_TO_COMPANY", 404);
    }
    return formatarChamados(chamados);
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    console.log(error);
    throw new AppError("ERR_LIST_TIME_CHAMADO", 500);
  }
};

function formatarTempo(ms: number): string {
  const segundos = Math.floor((ms / 1000) % 60);
  const minutos = Math.floor((ms / (1000 * 60)) % 60);
  const horas = Math.floor(ms / (1000 * 60 * 60));

  return `${horas}h ${minutos}m ${segundos}s`;
}

const formatarChamados = (chamados: any[]) => {
  return chamados.map((chamado: { dataValues: any }) => {
    const { dataValues } = chamado; // Extrai apenas os valores reais do Sequelize
    return {
      ...dataValues, // Inclui os valores atuais
      tempoChamado: formatarTempo(dataValues.tempoChamado), // Formata o tempoChamado
    };
  });
};
