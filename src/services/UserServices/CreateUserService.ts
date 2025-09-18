import * as Yup from "yup";
import User from "../../models/User";
import { AppError } from "../../errors/errors.helper";

interface Request {
  email: string;
  password: string;
  name: string;
  tenantId: number;
  profile?: string;
}

interface Response {
  email: string;
  name: string;
  id: number;
  profile: string | undefined;
  ativo: boolean;
}

const CreateUserService = async ({
  email,
  password,
  name,
  tenantId,
  profile = "admin",
}: Request): Promise<Response> => {
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

    const serializedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      ativo: user.ativo,
    };

    return serializedUser;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_CREATE_USER_SERICE", 500);
  }
};

export default CreateUserService;
