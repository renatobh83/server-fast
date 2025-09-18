import { AppError } from "../../errors/errors.helper";
import UpdateDeletedUserOpenTicketsStatus from "../../helpers/UpdateDeletedUserOpenTicketsStatus";
import { getIO } from "../../lib/socket";
import Chamado from "../../models/Chamado";
import Ticket from "../../models/Ticket";
import User from "../../models/User";

const DeleteUserService = async (
  id: string | number,
  tenantId: number,
  userIdRequest: number
): Promise<void> => {
  const user = await User.findOne({
    where: { id, tenantId },
  });

  if (!user || tenantId !== user.tenantId) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const userOpenTickets: Ticket[] = await Ticket.findAll({
    where: { status: "open", tenantId, userid: user.id },
  });

  const chamados: Chamado[] = await Chamado.findAll({
    where: { userId: user.id },
  });

  if (chamados.length > 0) {
    await user.update({ ativo: false }); // Define a coluna 'ativo' como false
    const io = getIO();
    io.emit(`${tenantId}:user`, {
      action: "update",
      user: user.ativo,
    });

    throw new AppError("ERROR_USER_CHAMADO_EXISTS", 404);
  }
  if (userOpenTickets.length > 0) {
    UpdateDeletedUserOpenTicketsStatus(userOpenTickets, tenantId, +id);
  }

  try {
    await user.destroy();
  } catch (error) {
    throw new AppError("ERROR_USER_MESSAGES_NOT_EXISTS", 404);
  }
};

export default DeleteUserService;
