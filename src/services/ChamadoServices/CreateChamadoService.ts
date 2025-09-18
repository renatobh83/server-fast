import { AppError } from "../../errors/errors.helper";
import socketEmit from "../../helpers/socketEmit";
import Chamado from "../../models/Chamado";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import Media from "../../models/Media";
import Setting from "../../models/Setting";
import Ticket from "../../models/Ticket";
import User from "../../models/User";

export type dataChamado = {
  ticket?: any;
  descricao: string;
  assunto: string;
  contatoId: any;
  empresaId: number;
};
type CreateChamadoProps = {
  userId: number;
  data: dataChamado;
  tenantId: number;
};

export const CreateChamadoService = async ({
  data,
  tenantId,
  userId,
}: CreateChamadoProps) => {
  const { assunto, contatoId, ticket, descricao, empresaId } = data;
  const numeroChamado = await getNumber(ticket);
  const empresaExists = await Empresa.findOne({
    where: {
      id: empresaId,
      active: true,
    },
  });
  if (!empresaExists) {
    throw new AppError("ERR_COMPANY_NOT_FOUND", 404);
  }
  const created: Chamado = await Chamado.create({
    id: numeroChamado,
    ticketId: ticket?.id,
    empresaId,
    userId,
    tenantId,
    status: "ABERTO",
    descricao,
    assunto,
    createdAt: ticket ? new Date(ticket.createdAt) : new Date(),
  });
  created.setContatos(contatoId);

  if (ticket?.id) {
    await Ticket.update(
      { chamadoId: numeroChamado },
      { where: { id: ticket.id } }
    );
  }
  const settings = await Setting.findAll();
  const sendEmail = settings.find(
    (s: { key: string }) => s.key === "sendEmailOpenClose"
  )?.value;

  if (sendEmail !== "disabled") {
    //   sendEmailOpenClose(dataCreateChamado);
  }
  const chamadoCompleto = await Chamado.findByPk(created.id, {
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["name"],
        where: { active: true },
      },
      {
        model: Media,
        as: "media",
      },
      {
        model: User,
        as: "usuario",
        attributes: ["name", "email"],
      },
      {
        model: Contact,
        as: "contatos",
        attributes: ["name", "email"],
      },
    ],
  });

  socketEmit({
    tenantId: tenantId,
    type: "chamado:create",
    payload: {
      chamadoCompleto, // Adiciona a propriedade contatos
    },
  });
  return chamadoCompleto;
};
const getNumber = async (ticket: any | undefined): Promise<number> => {
  let numeroChamado: number;

  if (ticket) {
    const ticketId = ticket.id;

    // Verifica se já existe um chamado com esse número (baseado no ticketId)
    const chamadoExistente = await Chamado.findOne({
      where: { id: ticketId },
    });

    if (!chamadoExistente) {
      numeroChamado = ticketId;
    } else {
      // Gera um novo número incremental
      const ultimoChamado = await Chamado.findOne({
        order: [["id", "DESC"]],
      });
      const ultimoNumero = ultimoChamado?.id || 0;
      numeroChamado = ultimoNumero + 1;
    }
  } else {
    // Geração manual
    const ultimoChamado = await Chamado.findOne({
      order: [["id", "DESC"]],
    });
    const ultimoNumero = ultimoChamado?.id || 0;
    numeroChamado = ultimoNumero + 1;
  }

  return numeroChamado;
};
