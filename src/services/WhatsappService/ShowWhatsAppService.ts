import { RedisKeys } from "../../constants/redisKeys";
import { AppError } from "../../errors/errors.helper";
import Whatsapp from "../../models/Whatsapp";
import { getCache, setCache } from "../../utils/cacheRedis";

interface Data {
  id: string | number;
  tenantId?: string | number;
  isInternal?: boolean;
}

const ShowWhatsAppService = async ({
  id,
  tenantId,
}: Data): Promise<Whatsapp> => {
  const attr = [
    "id",
    "qrcode",
    "name",
    "status",
    "plugged",
    "isDefault",
    "tokenTelegram",
    "type",
    "createdAt",
    "updatedAt",
    "number",
    "phone",
    "tenantId",
    "wabaBSP",
    "tokenAPI",
    "farewellMessage",
    "chatFlowId",
    "pairingCode",
    "pairingCodeEnabled",
    "wppUser",
  ];
  let whatsapp = (await getCache(RedisKeys.canalService(id))) as Whatsapp;
  if (!whatsapp) {
    whatsapp = (await Whatsapp.findByPk(id, {
      attributes: attr,
    })) as Whatsapp;
    await setCache(RedisKeys.canalService(id), whatsapp); // cache por 60s
  }

  if (!whatsapp || (tenantId && whatsapp.tenantId !== tenantId)) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  return whatsapp;
};

export default ShowWhatsAppService;
