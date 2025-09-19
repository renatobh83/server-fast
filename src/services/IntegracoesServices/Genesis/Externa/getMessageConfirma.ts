import { addJob } from "../../../../lib/Queue";

const MessageForCancel = [
  "nao",
  "não",
  2,
  "2",
  "cancelar",
  "cancela",
  "cancelamento",
];
const MessageForConfirm = [
  "sim",
  1,
  "1",
  "confirma",
  "confirmar",
  "confirmacao",
];

export const GetMessageConfirma = (
  response: string | number,
  tenantId: number,
  contatoSend: string
): void => {
  const responseFormatted =
    typeof response === "string" ? response.trim().toLowerCase() : response;

  let status: string;

  // Permite apenas respostas únicas, sem espaços extras
  if (
    typeof responseFormatted === "string" &&
    responseFormatted.includes(" ")
  ) {
    status = "invalid"; // Resposta inválida
  } else if (MessageForCancel.includes(responseFormatted)) {
    status = "cancel";
  } else if (MessageForConfirm.includes(responseFormatted)) {
    status = "confirm";
  } else {
    status = "invalid"; // Resposta não reconhecida
  }
  const dataToJob = {
    contatoSend,
    tenantId,
    response, // Adiciona a resposta original do cliente
    status, // Adiciona o status identificado
  };
  addJob("WebHookConfirma", dataToJob);
};
