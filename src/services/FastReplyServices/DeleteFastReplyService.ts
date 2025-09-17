import { AppError } from "../../errors/errors.helper";
import FastReply from "../../models/FastReply";

interface Request {
  id: string;
  tenantId: number | string;
}

const DeleteFastReplyService = async ({
  id,
  tenantId,
}: Request): Promise<boolean> => {
  const reply = await FastReply.findOne({
    where: { id, tenantId },
  });

  if (!reply) {
    throw new AppError("ERR_NO_FAST_REPLY_FOUND", 404);
  }
  try {
    await reply.destroy();
    return true;
  } catch (error) {
    throw new AppError("ERR_FAST_REPLY_EXISTS", 404);
  }
};

export default DeleteFastReplyService;
