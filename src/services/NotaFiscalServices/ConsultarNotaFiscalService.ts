import NotaFiscal from "../../models/NotaFiscal";

interface Request {
  empresaId: number;
  numeroNota?: string;
  page?: number;
  limit?: number;
  cancelada?: boolean;
}

export const ConsultarNotaFiscalService = async ({
  empresaId,
  numeroNota,
  page = 1,
  limit = 10,
  cancelada,
}: Request): Promise<any> => {
  const where: any = {
    empresaId,
    ...(numeroNota && { rps: numeroNota }),
    ...(cancelada !== undefined && { cancelada }),
  };

  const notas = await NotaFiscal.findAll({
    where,
    raw: true, // Retorna objetos simples (não instâncias do modelo)
  });

  // Formata as datas após a consulta
  const notasFormatadas = notas.map((nota) => ({
    ...nota,
    status: nota.cancelada ? "Cancelada" : "Ativa",
    dataCancelamentoFormatada: nota.datacancelamento
      ? new Date(nota.datacancelamento).toLocaleString("pt-BR")
      : null,
  }));

  return notasFormatadas;
};
