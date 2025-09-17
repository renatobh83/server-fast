import { AppError } from "../../errors/errors.helper";
import Email from "../../models/Email";

export const ListEmailService = async ({ tenantId }: { tenantId: number }) => {
  try {
    const email = await Email.findOne({ where: { tenantId } });
    return email;
  } catch (error) {
    throw new AppError("ERR_EMAIL_LIST", 502);
  }
};
