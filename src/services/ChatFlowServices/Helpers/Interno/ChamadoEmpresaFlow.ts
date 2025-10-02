import Chamado from "../../../../models/Chamado";
import Contact from "../../../../models/Contact";

export const ChamadoEmpresaFlow = async (empresaId: number, contact: any) => {
  const tickets = await Chamado.findAll({
    where: {
      empresaId: empresaId
    },
    include: [
      {
        model: Contact,
        as: "contatos",
        where: { id: contact.id } // garante que o chamado tenha esse contato
      }
    ],
    order: [["createdAt", "DESC"]],
    limit: 5
  });

  return tickets.map((t) => ({
    id: t.id,
    status: t.status,
    assunto: t.assunto
  }));
};

export const ConsultaChamadoFlow = async (chamadoId: number) => {
  const chamadoDetails = await Chamado.findByPk(chamadoId, {
    include: [
      {
        model: Contact,
        as: "contatos"
      }
    ]
  });

  return chamadoDetails;
};
