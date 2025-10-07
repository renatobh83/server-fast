import { Op } from "sequelize";
import Chamado from "../../models/Chamado";
import { AppError } from "../../errors/errors.helper";

interface IEditarTempoChamadoService {
  ticketId: number;
  tempoAjusteMinutos: number;
  motivo: string;
}

export const EditarTempoChamadoService = async ({
  ticketId,
  motivo,
  tempoAjusteMinutos,
}: IEditarTempoChamadoService): Promise<boolean> => {
  try {
    const chamado = await Chamado.findOne({
      where: {
        ticketsAssociados: {
          [Op.contains]: [Number(ticketId)],
        },
      },
    });
    if (!chamado) {
      throw new AppError("ERR_NO_TICKET_FOUND", 404);
    }

    // Tempo total atual antes do ajuste
    const tempoTotalAtual = chamado.tempoChamado!;

    // Converte o tempo de minutos para milissegundos
    // const tempoAjusteMs = tempoAjusteMinutos * 60 * 1000;
    const tempoAjusteMs = tempoAjusteMinutos;

    // Ajusta o tempo total (positivo para adicionar, negativo para remover)
    const novoTempoTotal = tempoTotalAtual + tempoAjusteMs;

    if (novoTempoTotal < 0) {
      throw new AppError("ERR_TIME_NEGATIVE", 422);
    }
    chamado.motivo = motivo;
    // Atualiza o chamado com o novo tempo total
    chamado.tempoChamado = novoTempoTotal;
    await chamado.save();

    return true;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    console.log(error);
    throw new AppError("ERR_EDITAR_TEMPO_CHAMADO_SERVICE", 502);
  }
};
