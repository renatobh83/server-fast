import { AppError } from "../../errors/errors.helper";
import Chamado from "../../models/Chamado";
import Ticket from "../../models/Ticket";

interface Props {
  empresaId: number;
  ticketId: number;
  chamadoId: number;
}
export const associarTicketChamadoService = async ({
  empresaId,
  ticketId,
  chamadoId,
}: Props) => {
  try {
    const chamadoIsExists = await Chamado.findOne({
      where: {
        empresaId,
        id: chamadoId,
      },
    });
    if (chamadoIsExists) {
      const ticketsAtualizados = chamadoIsExists.ticketsAssociados
        ? [...chamadoIsExists.ticketsAssociados]
        : [];

      // Verifica se o ticket já está associado
      if (ticketsAtualizados.includes(ticketId)) {
        throw new AppError("TICKET_ALREADY_ASSOCIATED", 409);
      }

      ticketsAtualizados.push(ticketId);
      // Atualiza o chamado
      await chamadoIsExists.update({
        ticketsAssociados: ticketsAtualizados,
      } as Partial<Chamado>);

      const ticket = await Ticket.findByPk(ticketId);
      if (ticket) {
        ticket.associatedCalls = true;
        ticket.chamadoId = chamadoIsExists.id;
        ticket.save();
      }

      return chamadoIsExists;
    }
  } catch (err: any) {
    throw new AppError("ERR_ASSOCIAR_TICKET_CHAMADO_SERVICE", 502);
  }
};
