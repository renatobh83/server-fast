import * as Yup from "yup";
import Queue from "../../models/Queue";
import User from "../../models/User";
import UsersQueues from "../../models/UsersQueues";
import { AppError } from "../../errors/errors.helper";

interface UserQueues {
  id?: number;
  queue?: number;
}

interface UserData {
  email?: string;
  password?: string;
  name?: string;
  profile?: string;
  ativo?: boolean;
  queues?: UserQueues[];
}

interface Request {
  userData: UserData;
  userId: number;
  tenantId: number;
}

interface Response {
  id: number;
  name: string;
  email: string;
  profile: string;
}

const UpdateUserService = async ({
  userData,
  userId,
  tenantId,
}: Request): Promise<Response | undefined> => {
  try {
    const user = await User.findOne({
      where: { id: userId, tenantId },
      attributes: ["name", "id", "email", "profile", "ativo"],
    });
    if (!user) {
      throw new AppError("ERR_NO_USER_FOUND", 404);
    }

    const schema = Yup.object().shape({
      name: Yup.string().min(2),
      email: Yup.string().email(),
      profile: Yup.string(),
      password: Yup.string(),
    });

    const { email, password, profile, name, queues, ativo } = userData;

    try {
      await schema.validate({ email, password, profile, name });
    } catch (err: any) {
      throw new AppError("ERRO_VALIDATE", 404);
    }

    if (queues) {
      await UsersQueues.destroy({ where: { userId } });

      await Promise.all(
        queues.map(async (queue: any) => {
          const queueId: number = queue.id;
          await UsersQueues.upsert({ queueId, userId });
        })
      );
    }

    await user.update({
      email,
      password,
      profile,
      name,
      ativo,
    });

    await user.reload({
      attributes: ["id", "name", "email", "profile", "ativo"],
      include: [{ model: Queue, attributes: ["id", "queue"] }],
    });

    const serializedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile!,
      queues: user.queues,
      ativo: user.ativo,
    };
    return serializedUser;
  } catch (err: any) {
    throw new AppError("ERR_UPADATE_USERS_SERVICE", 502);
  }
};

export default UpdateUserService;
