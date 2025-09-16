import { FastifyRequest, FastifyReply } from 'fastify';
import { ERRORS } from '../errors/errors.helper';
import { utils } from '../utils/utils';



export const checkValidRequest = (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const token = utils.getTokenFromHeader(request.headers.authorization);
  if (!token) {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }

  const decoded = request.server.jwt.verify(token);
  

  if (!decoded) {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
};

export const checkValidUser = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const token = utils.getTokenFromHeader(request.headers.authorization);
  if (!token) {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }


  const decoded = request.server.jwt.verify(token) as any;
  console.log(decoded)
  if (!decoded || !decoded.id) {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }

  try {
    // const userData = await prisma.user.findUnique({
    //   where: { id: decoded.id },
    // });
    // if (!userData) {
    //   return reply
    //     .code(ERRORS.unauthorizedAccess.statusCode)
    //     .send(ERRORS.unauthorizedAccess.message);
    // }

    // request['authUser'] = userData;
  } catch (e) {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
};