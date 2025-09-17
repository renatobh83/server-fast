import { Sequelize } from "sequelize";

import Email from "./Email";
import User from "./User";
import Tenant from "./Tenant";
import ApiConfig from "./ApiConfig";
import Chamado from "./Chamado";
import ChatFlow from "./ChatFlow";
import Contact from "./Contact";
import ContactCustomField from "./ContactCustomField";
import ContactTag from "./ContactTag";
import ContactWallet from "./ContactWallet";
import EmpresaContact from "./EmpresaContact";
import EmpresaContrato from "./EmpresaContrato";
import Integracoes from "./Integracoes";
import Media from "./Media";
import Message from "./Message";
import NotaFiscal from "./NotaFiscal";
import PauseHistory from "./PauseHistoryChamado";
import Queue from "./Queue";
import ResultadoDDNS from "./ResultadoDDNS";
import Setting from "./Setting";
import Tags from "./Tag";
import Ticket from "./Ticket";
import UsersQueues from "./UsersQueues";
import UserMessagesLog from "./UserMessagesLog";
import Whatsapp from "./Whatsapp";
import Empresa from "./Empresa";
import FastReply from "./FastReply";

// recebe a instância do sequelize
export function initModels(sequelize: Sequelize) {
  const models = {
    ApiConfig: ApiConfig.initModel(sequelize),
    ChatFlow: ChatFlow.initModel(sequelize),
    Integracoes: Integracoes.initModel(sequelize),
    Media: Media.initModel(sequelize),
    Message: Message.initModel(sequelize),
    PauseHistory: PauseHistory.initModel(sequelize),
    Queue: Queue.initModel(sequelize),
    Setting: Setting.initModel(sequelize),
    Tags: Tags.initModel(sequelize),
    UsersQueues: UsersQueues.initModel(sequelize),
    UserMessagesLog: UserMessagesLog.initModel(sequelize),
    Whatsapp: Whatsapp.initModel(sequelize),
    Empresa: Empresa.initModel(sequelize),
    User: User.initModel(sequelize),
    Email: Email.initModel(sequelize),
    Tenant: Tenant.initModel(sequelize),
    EmpresaContact: EmpresaContact.initModel(sequelize),
    Ticket: Ticket.initModel(sequelize),
    Chamado: Chamado.initModel(sequelize),
    ContactCustomField: ContactCustomField.initModel(sequelize),
    ContactWallet: ContactWallet.initModel(sequelize),
    Contact: Contact.initModel(sequelize),
    ContactTag: ContactTag.initModel(sequelize),
    NotaFiscal: NotaFiscal.initModel(sequelize),
    EmpresaContrato: EmpresaContrato.initModel(sequelize),
    ResultadoDDNS: ResultadoDDNS.initModel(sequelize),
    FastReply: FastReply.initModel(sequelize),
  };

  // associações
  Object.values(models).forEach((model: any) => {
    if (typeof model.associate === "function") {
      model.associate(models);
    }
  });

  return models;
}
