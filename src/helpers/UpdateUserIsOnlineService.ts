import { AppError } from "../errors/errors.helper";
import User from "../models/User";
import GetDefaultWhatsApp from "./GetDefaultWhatsApp";

export const UpdateUserIsOnlineService = async ({
  userData,
  userId,
  tenantId,
}: any) => {
  const userKey = { id: userId, tenantId: tenantId };

  const findOptions = {
    where: userKey,
    attributes: ["id", "isOnline", "status"],
  };
  const user = await User.findOne(findOptions);
  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const { isOnline, status } = userData;

  await user.update({ isOnline, status });
  const reloadOptions = {
    attributes: ["id", "name", "email", "profile", "isOnline", "status"],
  };
  await user.reload(reloadOptions);
  const defaultWhatsapp = await GetDefaultWhatsApp(tenantId);

  if (typeof defaultWhatsapp === "object") {
    // const wbot = getWbot(defaultWhatsapp.id);
    // wbot.setOnlinePresence(userData.isOnline);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    isOnline: user.isOnline,
    status: user.status,
  };
};
