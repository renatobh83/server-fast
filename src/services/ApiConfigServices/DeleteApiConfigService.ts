import { AppError } from "../../errors/errors.helper";
import ApiConfig from "../../models/ApiConfig";

interface Request {
  apiId: string | number;
  tenantId: string | number;
}

const DeleteApiConfigService = async ({
  apiId,
  tenantId,
}: Request): Promise<void> => {
  try {
    const api = await ApiConfig.findOne({
      where: { id: apiId, tenantId },
    });

    if (!api) {
      throw new AppError("ERR_API_CONFIG_NOT_FOUND", 404);
    }

    await api.destroy();
  } catch (err: any) {
    throw new AppError("ERR_DELETE_API_CONFIG_SERVICE", 502);
  }
};

export default DeleteApiConfigService;
