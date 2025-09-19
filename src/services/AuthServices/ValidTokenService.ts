import { AppError } from "../../errors/errors.helper";
import { FastifyRequest } from "fastify";

export const ValidateTokenService = async (
  request: FastifyRequest
): Promise<any> => {
  try {
    request.jwtVerify();
  } catch (err) {
    throw new AppError("ERR_SESSION_EXPIRED", 403);
  }
  return { valid: true };
};
