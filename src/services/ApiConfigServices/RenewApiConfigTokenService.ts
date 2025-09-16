import { sign } from "jsonwebtoken";
import ApiInstance from "../../models/ApiConfig";
import { AppError } from "../../errors/errors.helper";

interface Request {
  apiId: string;
  sessionId: string | number;
  userId: string | number;
  tenantId: string | number;
}

const RenewApiConfigTokenService = async ({
  apiId,
  sessionId,
  tenantId,
}: Request): Promise<ApiInstance> => {
  try {
    const secret = process.env.JWT_API_CONFIG!;

    const api = await ApiInstance.findByPk(apiId);

    if (!api) {
      throw new AppError("ERR_API_CONFIG_NOT_FOUND", 404);
    }

    const token = sign(
      {
        tenantId,
        profile: "admin",
        sessionId,
      },
      secret,
      {
        expiresIn: "730d",
      }
    );

    api.update({ token });
    api.reload();

    return api;
  } catch (err: any) {
    throw new AppError("RENEW_API_CONFIG_TOKEN_SERVICE", 502);
  }
};

export default RenewApiConfigTokenService;
