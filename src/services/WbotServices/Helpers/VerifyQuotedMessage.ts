import type { Message as WbotMessage } from "wbotconnect";
import Message from "../../../models/Message";

const VerifyQuotedMessage = async (
  msg: WbotMessage
): Promise<Message | null> => {
  let quotedMsg: Message | null = null;

  const wbotQuotedMsg = msg.quotedMsgId;

  if (!wbotQuotedMsg) return null;

  if (wbotQuotedMsg) {
    quotedMsg = (await Message.findOne({
      where: { messageId: wbotQuotedMsg },
    })) as Message;
  }

  return quotedMsg;
};

export default VerifyQuotedMessage;
