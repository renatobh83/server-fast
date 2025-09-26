import { sign } from "jsonwebtoken";
import ApiConfig from "../../models/ApiConfig";
import { AppError } from "../../errors/errors.helper";
import * as Yup from "yup";
import { FastifyRequest } from "fastify";

interface Request {
  request: FastifyRequest;
  userId: number;
  tenantId: number;
}
interface ApiData {
  name: string;
  sessionId: number;
  urlServiceStatus?: string;
  urlMessageStatus?: string;
  authToken: string;
  isActive?: boolean;
}

const CreateApiConfigService = async ({
  request,
  userId,
  tenantId,
}: Request): Promise<ApiConfig> => {
  try {
    const { sessionId, ...rest } = request.body as ApiData;
    const payload = {
      tenantId,
      profile: "admin",
      sessionId,
    };
    const token = request.server.jwt.sign(payload, { expiresIn: "100d" });

    const api = await ApiConfig.create({
      ...rest,
      sessionId,
      userId,
      tenantId,
      token,
    });

    return api;
  } catch (error: any) {
    console.log(error);
    throw new AppError("ERROR_CREATE_API_CONIG", 500);
  }
};

export default CreateApiConfigService;
