import { AppError } from "../../errors/errors.helper";
import Setting from "../../models/Setting";
import { scheduleOrUpdateDnsJob } from "../../utils/scheduleDnsJob";

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
    await scheduleOrUpdateDnsJob();
    return setting;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_UPDATE_SETTING_SERVICE", 500);
  }
};

export default UpdateSettingService;
