import { AppError } from "../../errors/errors.helper";
import Email from "../../models/Email";

interface ParamsEmailServiceCreate {
  email: string;
  senha: string;
  ssl?: boolean;
  tsl?: string;
  smtp: string;
  tenantId: number;
  portaSMTP: number;
}

export const CreateEmailService = async ({
  email,
  senha,
  smtp,
  ssl,
  tsl,
  tenantId,
  portaSMTP,
}: ParamsEmailServiceCreate) => {
  const emailUpdate = await Email.findOne({ where: { tenantId } });
  try {
    if (emailUpdate) {
      const updateEmail = await emailUpdate.update({
        email,
        senha,
        smtp,
        ssl: ssl ? ssl : false,
        tsl: tsl ? tsl : null,
        tenantId,
        portaSMTP,
      });
      return updateEmail;
    } else {
      const emailCreate = await Email.create({
        email,
        senha,
        smtp,
        ssl: ssl ? ssl : false,
        tsl: tsl ? tsl : null,
        tenantId,
        portaSMTP,
      });
      return emailCreate;
    }
  } catch (error) {
    throw new AppError("ERR_EMAIL_CREATE", 502);
  }
};
