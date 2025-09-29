import ChatFlow from "../../models/ChatFlow";

interface Response {
  chatFlow: ChatFlow[];
}

interface Request {
  tenantId: number;
}

const ListChatFlowService = async ({
  tenantId,
}: Request): Promise<Response> => {
  const chatFlow = (await ChatFlow.findAll({
    where: { tenantId },
    raw: true,
  })) as ChatFlow[];

  return { chatFlow };
};

export default ListChatFlowService;
