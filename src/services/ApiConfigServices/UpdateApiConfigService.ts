import { AppError } from "../../errors/errors.helper";
import ApiConfig from "../../models/ApiConfig";

interface ApiData {
  name: string;
  sessionId: number;
  urlServiceStatus?: string;
  urlMessageStatus?: string;
  userId: number;
  tenantId: number;
  authToken?: string;
  isActive?: boolean;
}

interface Request {
  apiData: ApiData;
  apiId: string;
  tenantId: number;
}

const UpdateApiConfigService = async ({
  apiData,
  apiId,
  tenantId,
}: Request): Promise<ApiConfig> => {
  try {
    const api = await ApiConfig.findOne({
      where: { id: apiId, tenantId },
    });

    if (!api) {
      throw new AppError("ERR_API_CONFIG_NOT_FOUND", 404);
    }

    const {
      name,
      sessionId,
      urlServiceStatus,
      urlMessageStatus,
      userId,
      authToken,
      isActive,
    } = apiData;

    await api.update({
      name,
      sessionId,
      urlServiceStatus,
      urlMessageStatus,
      userId,
      authToken,
      isActive,
    });

    await api.reload();

    return api;
  } catch (err: any) {
    throw new AppError("ERR_UPDATE_API_CONFIG_SERVICE", 502);
  }
};

export default UpdateApiConfigService;
