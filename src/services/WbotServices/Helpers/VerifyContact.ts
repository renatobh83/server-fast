import type { Chat as WbotChat } from "wbotconnect";
import Contact from "../../../models/Contact";
import CreateOrUpdateContactService from "../../ContactServices/CreateOrUpdateContactService";

const VerifyContact = async (
  chat: WbotChat,
  tenantId: number
): Promise<Contact> => {
  const { contact: contactChat } = chat;

  const contactData: any = {
    name: contactChat.name || contactChat.pushname || null,
    number: chat.id._serialized,
    tenantId,
    pushname: contactChat.pushname,
    isUser: contactChat.isUser,
    isWAContact: contactChat.isWAContact,
    isGroup: !contactChat.isUser,
    profilePicUrl: contactChat.profilePicThumbObj.eurl,
  };

  const contact = await CreateOrUpdateContactService(contactData);
  return contact;
};

export default VerifyContact;
