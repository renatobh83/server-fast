import { sign } from "jsonwebtoken";
import ApiConfig from "../../models/ApiConfig";
import { AppError } from "../../errors/errors.helper";
import * as Yup from "yup";

interface Request {
  name: string;
  sessionId: number;
  urlServiceStatus?: string;
  urlMessageStatus?: string;
  authToken: string;
  userId: number;
  tenantId: number;
}

const CreateApiConfigService = async ({
  name,
  sessionId,
  urlServiceStatus,
  urlMessageStatus,
  userId,
  authToken,
  tenantId,
}: Request): Promise<ApiConfig> => {
  try {
    const secret = process.env.JWT_API_CONFIG!;
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

    const api = await ApiConfig.create({
      name,
      sessionId,
      token,
      authToken,
      urlServiceStatus,
      urlMessageStatus,
      userId,
      tenantId,
    });

    return api;
  } catch (error: any) {
    console.log(error);
    throw new AppError("ERROR_CREATE_API_CONIG", 500);
  }
};

export default CreateApiConfigService;
