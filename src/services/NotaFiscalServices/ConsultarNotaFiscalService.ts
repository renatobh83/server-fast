import NotaFiscal from "../../models/NotaFiscal";

interface Request {
  empresaId: number;
  notaNumero?: string;
  page?: number;
  limit?: number;
  cancelada?: boolean;
}

export const ConsultarNotaFiscalService = async ({
  empresaId,
  notaNumero,
  page = 1,
  limit = 10,
  cancelada,
}: Request): Promise<any> => {
  const where: any = {
    empresaId,
    ...(notaNumero && { rps: notaNumero }),
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
