import * as Yup from "yup";
import User from "../../models/User";
import { AppError } from "../../errors/errors.helper";
import UsersQueues from "../../models/UsersQueues";
import Queue from "../../models/Queue";

interface UserQueues {
  id?: number;
  queue?: number;
}
interface Request {
  email: string;
  password: string;
  name: string;
  tenantId: number;
  profile?: string;
  queues?: UserQueues[];
}

const CreateUserService = async ({
  email,
  password,
  name,
  tenantId,
  profile = "admin",
  queues,
}: Request): Promise<any> => {
  try {
    const schema = Yup.object().shape({
      name: Yup.string().required().min(2),
      tenantId: Yup.number().required(),
      email: Yup.string()
        .email()
        .required()
        .test(
          "Check-email",
          "An user with this email already exists.",
          async (value: string) => {
            const emailExists = await User.findOne({
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              where: { email: value! },
            });
            return !emailExists;
          }
        ),
      password: Yup.string().required().min(5),
    });

    try {
      await schema.validate({ email, password, name, tenantId });
    } catch (err) {
      console.log(err);
      throw new AppError("ERR_EMAIL_ALREADY_EXISTS", 409);
    }

    const user = await User.create({
      email,
      password,
      name,
      profile,
      tenantId,
      ativo: true,
    });
    if (queues) {
      await UsersQueues.destroy({ where: { userId: user.id } });

      await Promise.all(
        queues.map(async (queue: any) => {
          const queueId: number = queue.id;
          await UsersQueues.upsert({ queueId, userId: user.id });
        })
      );
    }
    await user.reload({
      attributes: ["id", "name", "email", "profile", "ativo"],
      include: [{ model: Queue, attributes: ["id", "queue"] }],
    });

    const serializedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      ativo: user.ativo,
      queues: user.queues,
    };
    console.log(serializedUser);
    console.log(user.toJSON());
    return user.toJSON();
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_CREATE_USER_SERICE", 500);
  }
};

export default CreateUserService;
