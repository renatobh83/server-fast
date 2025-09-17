import Ticket from "../../../../models/Ticket";
import {
  SemEmpresaAssociadoTbot,
  SemEmpresaAssociadoWpp,
  TemplateMessage,
} from "../optionsListMensagens";
import { ContatoEmpresaFlow } from "./ContatoEmpresaFlow";
import { ChamadoEmpresaFlow, ConsultaChamadoFlow } from "./ChamadoEmpresaFlow";
import {
  TemplateChamadoSelecaoWpp,
  TemplateEmpresaSelecaoWpp,
} from "../TemplateMessage/WhatsApp";
import {
  TemplateChamadoSelecaoTbot,
  TemplateEmpresaSelecaoTbot,
} from "../TemplateMessage/Telegram";
import { FlowConfig } from "../../types";

interface IActionsChatFlow {
  msg: any;
  ticket: Ticket | any;
  tenantId: number;
  action: string | undefined;
}
let PREVIOUS_STEPID = "";
export const actionsChatFlow = async ({
  action,
  msg,
  tenantId,
  ticket,
}: IActionsChatFlow): Promise<any> => {
  // const chatFlow = await ticket.getChatFlow();
  // const flowConfig = chatFlow.flow.nodeList.find(
  //   (node: { type: string }) => node.type === "configurations"
  // ) as FlowConfig;

  if (action?.toLowerCase().trim() === "consultar") {
    const contact = ticket.contact;
    PREVIOUS_STEPID = ticket.stepChatFlow;
    try {
      const contatoEmpresa = await ContatoEmpresaFlow(contact);

      if (contatoEmpresa.length === 0) {
        if (ticket.channel === "whatsapp") {
          const options = SemEmpresaAssociadoWpp([
            {
              rowId: "suporte",
              title: "Falar no suporte.",
              description: "🏷️ Falar no suporte.",
            },
            {
              rowId: "3",
              title: "Finalizar atendimento.",
              description: "❌ Finalizando o seu atendimento.",
            },
          ]);
          return options;
        } else {
          const rows = [
            [
              {
                callback_data: "suporte",
                text: "🏷️ Falar no suporte",
              },
            ],
          ];
          rows.push([
            {
              callback_data: "3",
              text: "❌ Finalizar Atendimento",
            },
          ]);
          const options = SemEmpresaAssociadoTbot(rows);
          return options;
        }
      }

      if (contatoEmpresa.length > 1) {
        if (ticket.channel === "whatsapp") {
          return TemplateEmpresaSelecaoWpp(contatoEmpresa);
        } else {
          return TemplateEmpresaSelecaoTbot(contatoEmpresa);
        }
      } else {
        const chamadosRecente = await ChamadoEmpresaFlow(
          contatoEmpresa[0]!.id,
          contact
        );
        if (ticket.channel === "whatsapp") {
          return TemplateChamadoSelecaoWpp(chamadosRecente);
        } else {
          return TemplateChamadoSelecaoTbot(chamadosRecente);
        }
      }
    } catch (error) {
      console.log(error);
    }
  } else if (action?.toLowerCase().trim() === "empresaselecionada") {
    const contact = ticket.contact;

    if (ticket.channel === "whatsapp") {
      const idEmpresa =
        msg.msg.listResponse.singleSelectReply.selectedRowId.split("_")[1];
      const chamadosRecente = await ChamadoEmpresaFlow(idEmpresa, contact);
      return TemplateChamadoSelecaoWpp(chamadosRecente);
    } else {
      const idEmpresa = msg.msg.body.split("_")[1];
      const chamadosRecente = await ChamadoEmpresaFlow(idEmpresa, contact);
      return TemplateChamadoSelecaoTbot(chamadosRecente);
    }
  } else if (action?.toLowerCase().trim() === "consultachamado") {
    if (!msg.msg) {
      ticket.update({
        stepChatFlow: PREVIOUS_STEPID,
        botRetries: ticket.botRetries + 1,
        lastInteractionBot: new Date(),
      });
      return;
    }
    PREVIOUS_STEPID = ticket.stepChatFlow;
    const chamadoId =
      msg.msg.listResponse?.singleSelectReply.selectedRowId.split("_")[1] ||
      msg.msg.body.split("_")[1];
    const chamadoDetails = await ConsultaChamadoFlow(chamadoId);
    return TemplateMessage(chamadoDetails);
  }
};
