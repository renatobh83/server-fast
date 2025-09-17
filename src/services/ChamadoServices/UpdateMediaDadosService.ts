import { AppError } from "../../errors/errors.helper";
import Media from "../../models/Media";

export const UpdateMediaDadosService = async (anexo: any) => {
  try {
    const findMedia = await Media.findOne({ where: { id: anexo.id } });
    if (!findMedia) {
      throw new AppError("MEDIA_NO_FOUND", 404);
    }

    const novoDado = anexo.dadosenvio;

    if (!novoDado || typeof novoDado !== "object" || Array.isArray(novoDado)) {
      throw new AppError("INVALID_DADOSENVIO", 400);
    }

    const chaveNova = Object.keys(novoDado)[0]!; // mensagemEnviadoEm ou emailEnviadoEm

    if (!["mensagemEnviadoEm", "emailEnviadoEm"].includes(chaveNova)) {
      throw new AppError("CHAVE_DADOSENVIO_INVALIDA", 400);
    }

    const dadosAnteriores = Array.isArray(findMedia.dadosenvio)
      ? findMedia.dadosenvio
      : [];

    // Remove qualquer objeto com a mesma chave (mensagemEnviadoEm ou emailEnviadoEm)
    const dadosAtualizados = [
      ...dadosAnteriores.filter((item: any) => !item.hasOwnProperty(chaveNova)),
      novoDado, // adiciona o novo dado
    ];

    await Media.update(
      { dadosenvio: dadosAtualizados },
      { where: { id: anexo.id } }
    );
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_REMOVE_MEDIA_CHAMADO_SERVICE", 502);
  }
};
