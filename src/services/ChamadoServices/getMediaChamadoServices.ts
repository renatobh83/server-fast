import { AppError } from "../../errors/errors.helper";
import Media from "../../models/Media";

export const GetMediaChamadoService = async (id: number) => {
  try {
    const findMedia = await Media.findOne({
      where: { id },
    });
    if (!findMedia) {
      throw new AppError("MEDIA_NO_FOUND", 404);
    }

    return findMedia;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_REMOVE_MEDIA_CHAMADO_SERVICE", 502);
  }
};
