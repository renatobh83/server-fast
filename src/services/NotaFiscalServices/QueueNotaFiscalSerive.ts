import { FastifyReply } from "fastify";
import { addJob } from "../../lib/Queue";
import { ConsultaNfseRpsEnvio } from "../IntegracoesServices/NFE";

export const QueueNotaFiscalService = async (
  rps: string,
  res: FastifyReply
) => {
  const nota = await ConsultaNfseRpsEnvio(+rps);
  const jobId = `pdf_${rps}`;

  await addJob("pdfQueue", {
    payload: nota.mensagens,
    jobId: jobId,
  });

  // Retorna immediateamente com ID do job
  res.code(202).send({
    message: "PDF em processamento",
    jobId,
  });
};
