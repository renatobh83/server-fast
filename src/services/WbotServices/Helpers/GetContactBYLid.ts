import { Whatsapp } from "wbotconnect";
import Contact from "../../../models/Contact";
import CreateOrUpdateContactService from "../../ContactServices/CreateOrUpdateContactService";

export const GetContactByLid = async (lid: string, wbot: Whatsapp) => {
  try {
    const number = await wbot.getContactLid(lid);

    let contato = await Contact.findOne({
      where: { serializednumber: number },
    });

    if (!contato) {
      const isContact = await wbot.getContact(number);
      const contactData: any = {
        name:
          isContact?.name ||
          isContact?.pushname ||
          isContact?.shortName ||
          null,
        number: number.replace("@c.us", ""),
        tenantId: 1,
        pushname: isContact?.pushname,
        isUser: isContact?.isUser,
        isWAContact: isContact?.isWAContact,
        isGroup: !isContact?.isUser,
        profilePicUrl: isContact?.profilePicThumbObj.eurl,
      };

      contato = await CreateOrUpdateContactService(contactData);
    }
    return contato.id;
  } catch (error) {}
};
