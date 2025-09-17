import { AppError } from "../../errors/errors.helper";
import socketEmit from "../../helpers/socketEmit";
import Chamado from "../../models/Chamado";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import Media from "../../models/Media";
import PauseHistory from "../../models/PauseHistoryChamado";
import Setting from "../../models/Setting";
import User from "../../models/User";

interface IUpdateChamadoService {
  userIdUpdate: string;
  chamadoId: number;
  ticketId?: number;
  userId?: number;
  descricao?: string;
  contatoId: any;
  assunto?: string;
  conclusao?: string;
  comentarios?: string[];
  files?: any[];
  status?: "ABERTO" | "EM_ANDAMENTO" | "CONCLUIDO" | "PAUSADO";
  tenantId: number;
}

export const updateChamadoService = async ({
  comentarios,
  userIdUpdate,
  ticketId,
  userId,
  descricao,
  contatoId,
  assunto,
  chamadoId,
  conclusao,
  status,
  files,
  tenantId,
}: IUpdateChamadoService) => {
  let parsedComentarios;
  if (typeof comentarios === "string") {
    try {
      parsedComentarios = JSON.parse(comentarios);
    } catch {
      parsedComentarios = []; // ou o valor padrão desejado caso o parse falhe
    }
  } else if (typeof comentarios === "object" && comentarios !== null) {
    parsedComentarios = comentarios; // já é um objeto válido
  } else {
    parsedComentarios = []; // ou outro valor padrão
  }

  const findChamado = await Chamado.findOne({
    where: {
      id: chamadoId ? chamadoId : ticketId,
    },
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["name"],
        where: {
          active: true,
        },
      },
      {
        model: Media,
        as: "media",
      },
      {
        model: User,
        as: "usuario",
        attributes: ["id", "name"],
      },
      {
        model: Contact,
        as: "contatos",
        attributes: ["id", "name", "number", "email"],
      },
    ],
  });
  if (!findChamado) {
    throw new AppError("ERR_NO_CHAMADO_FOUND", 404);
  }
  if (findChamado.userId !== +userIdUpdate && findChamado.userId === userId) {
    userId = +userIdUpdate;
  }
  if (findChamado.status === "CONCLUIDO") {
    throw new AppError("ERR_CHAMADO_IS_CLOSED", 404);
  }
  if (parsedComentarios && !Array.isArray(parsedComentarios)) {
    throw new AppError("ERR_INVALID_COMENTARIOS_FORMAT", 400);
  }
  if (parsedComentarios) {
    findChamado.comentarios = [...parsedComentarios]; // Substitui o array de comentários pelo novo array
  }
  if (status === "PAUSADO") {
    await pausarTicket(findChamado);
  }
  if (status === "ABERTO") {
    await retomarTicket(findChamado.id);
  }
  if (status === "CONCLUIDO") {
    await fecharTicket(findChamado.id, conclusao!);
  }

  findChamado.setContatos(contatoId);

  await findChamado.update({
    userId,
    descricao,
    assunto,
    conclusao,
    comentarios: findChamado.comentarios,
  });

  await findChamado.reload({
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["name"],
        where: {
          active: true,
        },
      },
      {
        model: Media,
        as: "media",
      },
      {
        model: User,
        as: "usuario",
        attributes: ["id", "name"],
      },
      {
        model: Contact,
        as: "contatos",
        attributes: ["id", "name", "number", "email"],
      },
    ],
  });

  socketEmit({
    tenantId: tenantId,
    type: "chamado:update",
    payload: findChamado,
  });

  return findChamado;
};

async function pausarTicket(chamado: Chamado) {
  if (chamado.status.includes("PAUSADO")) {
    return;
  }
  if (!chamado || chamado.status !== "ABERTO") {
    throw new AppError("ERROR_UPDATE_TICKET", 404);
  }
  chamado.status = "PAUSADO";
  await chamado.save();
  await PauseHistory.create({
    chamadoId: chamado.id,
    startTime: new Date(),
  });
}

async function retomarTicket(chamadoId: number) {
  const ticket = await Chamado.findByPk(chamadoId, {
    include: [{ model: PauseHistory, as: "pauseHistory" }],
  });
  if (!ticket || ticket.status.includes("ABERTO")) {
    return;
  }

  if (!ticket || ticket.status !== "PAUSADO") {
    throw new AppError("ERROR_UPDATE_TICKET", 404);
  }

  ticket.status = "ABERTO";
  await ticket.save();

  const lastPause = await PauseHistory.findOne({
    where: {
      chamadoId: ticket.id,
      endTime: null, // Encontra a pausa em andamento
    },
    order: [["startTime", "DESC"]],
  });

  if (lastPause) {
    lastPause.endTime = new Date();
    await lastPause.save();
  }
}

async function fecharTicket(chamadoId: number, conclusao: string) {
  const ticket = await Chamado.findByPk(chamadoId, {
    include: [{ model: PauseHistory, as: "pauseHistory" }],
  });

  if (!ticket || ticket.status === "CONCLUIDO") {
    throw new AppError("ERROR_UPDATE_TICKET_NO_FOUND", 404);
  }

  if (ticket.status === "PAUSADO") {
    await retomarTicket(chamadoId); // Retoma o ticket para finalizar corretamente
  }
  const settings = await Setting.findAll();
  const sendEmail = settings.find(
    (s: { key: string }) => s.key === "sendEmailOpenClose"
  )?.value;
  ticket.status = "CONCLUIDO";
  ticket.closedAt = new Date();
  //   if (sendEmail !== "disabled") {
  //     sendEmailOpenClose(ticket, conclusao);
  //   }
  await ticket.save();
}
