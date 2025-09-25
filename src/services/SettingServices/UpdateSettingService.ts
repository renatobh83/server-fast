import { RedisKeys } from "../../constants/redisKeys";
import { AppError } from "../../errors/errors.helper";
import { redisClient } from "../../lib/redis";
import Setting from "../../models/Setting";

interface Request {
  key: string;
  value: string;
  tenantId: string | number;
}

const UpdateSettingService = async ({
  key,
  value,
  tenantId,
}: Request): Promise<Setting> => {
  try {
    const setting = await Setting.findOne({
      where: { key, tenantId },
    });

    if (!setting) {
      throw new AppError("ERR_NO_SETTING_FOUND", 404);
    }

    await setting.update({ value });
    redisClient.del(RedisKeys.settings(tenantId));
    return setting;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_UPDATE_SETTING_SERVICE", 500);
  }
};

export default UpdateSettingService;
