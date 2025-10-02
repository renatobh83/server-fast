import ListChatFlowService from "../AdminServices/AdminListChatFlowService";
import ListContactsService from "../ContactServices/ListContactsService";
import { ListEmpresaService } from "../EmpresaServices/ListEmpresaService";
import ListQueueService from "../QueueServices/ListQueueService";
import ListSettingsService from "../SettingServices/ListSettingsService";
import ListUsersService from "../UserServices/ListUsersService";
import ListWhatsAppsService from "../WhatsappService/ListWhatsAppsService";

interface loadProps {
  tenantId: number;
  profile: string;
  userId: number;
}
export const LoadInitialAplicationService = async ({
  tenantId,
  profile,
  userId,
}: loadProps) => {
  const contatos = await ListContactsService({
    tenantId,
    profile,
    userId,
  });

  const queues = await ListQueueService({ tenantId });
  const settigns = await ListSettingsService(tenantId);
  const channels = await ListWhatsAppsService(tenantId);
  const empresas = await ListEmpresaService(tenantId);
  const usuarios = await ListUsersService({ tenantId });
  const chatFlow = await ListChatFlowService({ tenantId });
  return { contatos, queues, settigns, channels, empresas, usuarios, chatFlow };
};
