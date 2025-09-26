import { FastifyReply, FastifyRequest } from "fastify";
import { handleServerError } from "../errors/errors.helper";
import { STANDARD } from "../constants/request";
import { sendMenssageApiService } from "../services/ApiExternaService/SendMessageApiService";
import { ConfirmacaoIntegracaoService } from "../services/IntegracoesServices/Genesis/Externa/ConfirmacaoService";

export const sendMenssageApi = async (
  request: FastifyRequest<{
    Body: {
      number: string;
      message: string;
      externalKey: string;
    };
  }>,
  reply: FastifyReply
) => {
  const { sessionId, tenantId } = request.user as any;

  const { apiId } = request.params as any;
  try {
    const payload = {
      ...request.body,
      sessionId,
      tenantId,
      apiId,
    };
    await sendMenssageApiService(payload);
    return reply.code(STANDARD.OK.statusCode).send({ message: "Add job " });
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const integracaoConfirmacao = async (
  request: FastifyRequest<{
    Body: {
      contatos: object[];
    };
  }>,
  reply: FastifyReply
) => {
  const { apiId, idIntegracao, authToken } = request.params as any;
  const dadosConfirmacao = request.body.contatos[0] as any;
  try {
    const payload = { ...dadosConfirmacao, apiId, idIntegracao, authToken };

    await ConfirmacaoIntegracaoService(payload);
    return reply.code(STANDARD.OK.statusCode).send({ message: "Add job " });
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
// {
//   expiraLista: 60,
//   cancelarPendentes: false,
//   contatos: [
//     {
//       contato: '31985683733',
//       cliente: '31985683733',
//       idExterno: 232867,
//       notificacao: '{"paciente_nome":"Renato Mendonca","atendimento_data":"25/06/2025","dados_agendamentos":"[(232864,30,10:55:00,RAIOX)]","bot":"agenda"}'
//     }
//   ]
// }
