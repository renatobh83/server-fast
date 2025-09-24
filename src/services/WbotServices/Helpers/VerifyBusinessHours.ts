import type { Message as WbotMessage } from "wbotconnect";
import {
  differenceInMinutes,
  fromUnixTime,
  isWithinInterval,
  parse,
} from "date-fns";
import type Ticket from "../../../models/Ticket";
import ShowBusinessHoursAndMessageService from "../../TenantServices/ShowBusinessHoursAndMessageService";
import { CreateMessageSystemService } from "../../MessageServices/CreateMessageSystemService";

const BLOCK_TIME_MINUTES = 30; // Tempo mínimo entre mensagens de ausência

function parseTimestamp(timestamp: any) {
  // Se o timestamp for maior que 10^11, provavelmente está em milissegundos
  if (timestamp > 10 ** 11) {
    timestamp = timestamp / 1000; // Converte para segundos
  }

  return fromUnixTime(timestamp);
}
const verifyBusinessHours = async (
  msg: WbotMessage | any,
  ticket: Ticket
): Promise<boolean> => {
  let isBusinessHours = true;
  // Considerar o envio da mensagem de ausência se:
  // Ticket não está no fluxo de autoresposta
  // Ticket não estiver fechado
  // Mensagem não enviada por usuário via sistema
  // Não é um ticket referente a um grupo do whatsapp
  if (ticket.status !== "closed" && !msg.fromMe && !ticket.isGroup) {
    const tenant = await ShowBusinessHoursAndMessageService({
      tenantId: ticket.tenantId,
    });

    const dateMsg = parseTimestamp(msg.timestamp);

    const businessDay: any = Object.values(tenant.businessHours).find(
      (d: any) => d.day === dateMsg.getDay()
    );

    // Não existir configuração para a data, não deverá enviar
    // mensagem de ausencia
    if (!businessDay) return isBusinessHours;

    // Se o tipo for "O" open - significa que o estabelecimento
    // funciona o dia inteiro e deve desconsiderar o envio de mensagem de ausência
    if (businessDay.type === "O") return isBusinessHours;

    // verificar se data da mensagem está dendo do primerio período de tempo
    const isHoursFistInterval = isWithinInterval(dateMsg, {
      start: parse(businessDay.hr1, "HH:mm", new Date()),
      end: parse(businessDay.hr2, "HH:mm", new Date()),
    });

    // verificar se data da mensagem está dendo do segundo período de tempo
    const isHoursLastInterval = isWithinInterval(dateMsg, {
      start: parse(businessDay.hr3, "HH:mm", new Date()),
      end: parse(businessDay.hr4, "HH:mm", new Date()),
    });

    // se o tipo for C - Closed significa que o estabelecimento está
    // fechado o dia inteiro ou se a data/hora da mensagens estiver
    // fora dos horários de funcionamento da empresa, a mensagem deverá
    // ser enviada.
    if (
      businessDay.type === "C" ||
      (!isHoursFistInterval && !isHoursLastInterval)
    ) {
      // Verificar se já foi enviada recentemente
      if (
        ticket.lastAbsenceMessageAt &&
        differenceInMinutes(new Date(), new Date(ticket.lastAbsenceMessageAt)) <
          BLOCK_TIME_MINUTES
      ) {
        return false;
      }

      // Marcar o horário do último envio
      ticket.lastAbsenceMessageAt = new Date();
      await ticket.save();
      // await sleepRandomTime({
      //   minMilliseconds: +(process.env.MIN_SLEEP_BUSINESS_HOURS || 10000),
      //   maxMilliseconds: +(process.env.MAX_SLEEP_BUSINESS_HOURS || 20000)
      // });
      // await SendWhatsAppMessage({
      //   body: tenant.messageBusinessHours,
      //   ticket,
      //   quotedMsg: undefined
      // });

      isBusinessHours = false;
      const messageData = {
        body: tenant.messageBusinessHours,
        fromMe: true,
        read: true,
        sendType: "bot",
        tenantId: ticket.tenantId,
      };
      await CreateMessageSystemService({
        message: messageData,
        tenantId: ticket.tenantId,
        ticket,
        status: "pending",
      });
    }
  }
  return isBusinessHours;
};

export default verifyBusinessHours;
