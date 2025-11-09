import FastReply from "../../models/FastReply";

interface Request {
  key: string;
  message: string;
  userId: number;
  tenantId: number;
}

const CreateFastReplyService = async ({
  key,
  message,
  userId,
  tenantId,
}: Request): Promise<FastReply> => {
  
  const fastReplyData = await FastReply.create({
    key,
    message,
    userId,
    tenantId,
  });
  return fastReplyData;
};

export default CreateFastReplyService;
