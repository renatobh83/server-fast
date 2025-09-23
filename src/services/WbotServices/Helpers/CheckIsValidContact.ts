import { WhatsappProfile } from "wbotconnect";
import GetDefaultWhatsApp from "../../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../../lib/wbot";
import { AppError } from "../../../errors/errors.helper";

interface WhatsappProfileUser extends WhatsappProfile {
  user: string;
}
const CheckIsValidContact = async (
  number: string,
  tenantId: string | number
): Promise<any> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(tenantId);
  const wbot = getWbot(defaultWhatsapp.id);
  const idNumber = (await wbot.checkNumberStatus(
    number
  )) as WhatsappProfileUser;

  if (!idNumber.numberExists) {
    throw new AppError("ERR_WAPP_INVALID_CONTACT", 400);
  }

  let isContact = await wbot.getContact(idNumber.id._serialized);

  if (
    isContact &&
    (!isContact.profilePicThumbObj ||
      Object.keys(isContact.profilePicThumbObj).length === 0)
  ) {
    const profilePicUrl = await wbot.getProfilePicFromServer(
      idNumber.id._serialized
    );

    isContact.profilePicThumbObj = profilePicUrl;
  }
  if (isContact) {
    return isContact;
  } else {
    const profilePicUrl = await wbot.getProfilePicFromServer(
      idNumber.id._serialized
    );
    return profilePicUrl;
  }
};

export default CheckIsValidContact;
