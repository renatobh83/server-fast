import { AppError } from "../../errors/errors.helper";
import Queue from "../../models/Queue";
import User from "../../models/User";

const ShowUserService = async (
  id: string | number,
  tenantId: string | number
): Promise<User> => {
  const user = await User.findByPk(id, {
    attributes: ["name", "id", "email", "profile", "tokenVersion", "tenantId"],
    include: [{ model: Queue, as: "queues" }],
  });

  if (!user || user.tenantId !== tenantId) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  return user;
};

export default ShowUserService;
