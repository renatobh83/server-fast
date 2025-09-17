import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import * as Yup from "yup";

interface IRequest {
  name: string;
  address?: object;
  identifier: number;
  tenantId: number;
  acessoExterno?: any[];
}

export const CreateEmpresaServices = async ({
  identifier,
  name,
  address,
  tenantId,
  acessoExterno,
}: IRequest): Promise<Empresa> => {
  try {
    // const schema = Yup.object().shape({
    //   name: Yup.string().required().min(2),
    //   identifier: Yup.number()
    //     .required("ERR_IDENTIFIER_NO_FOUND")
    //     .test("cnpj", "ERR_IDENTIFIER_INVALID", (value) => {
    //       const cnpjRegex = /^\d{14}$/;
    //       return cnpjRegex.test(value?.toString() || "");
    //     }),
    // });
    // try {
    //   await schema.validate({ name, identifier });
    // } catch (err: any) {
    //   throw new AppError("UNPROCESSABLE_CONTENT", 422);
    // }

    const isExistsIdentifier = await Empresa.findOne({ where: { identifier } });

    if (isExistsIdentifier) {
      throw new AppError("ERR_IDENTIFIER_ALREADY_EXISTS", 409);
    }

    const empresa = await Empresa.create({
      name,
      identifier,
      address,
      tenantId,
      acessoExterno,
      active: true,
    });
    await empresa.reload({
      include: [
        {
          model: Contact,
          attributes: ["id", "name", "email", "number", "profilePicUrl"],
          as: "contacts",
          through: { attributes: [] },
        },
      ],
    });
    return empresa;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_COMPANY_CREATE", 500);
  }
};
