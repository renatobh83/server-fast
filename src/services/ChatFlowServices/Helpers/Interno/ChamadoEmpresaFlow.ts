import { Op } from "sequelize";
import Chamado from "../../../../models/Chamado";

export const ChamadoEmpresaFlow = async (emrpesaId: number, contact: any) => {
  const tickets = await Chamado.findAll({
    where: {
      empresaId: emrpesaId,
      contatoId: {
        [Op.contains]: [contact.id], // Busca onde o array JSON contenha o userId
      },
    },
    raw: true,
  });
  const dataRecent = tickets
    .sort((a, b) => {
      return (
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );
    })
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      status: t.status,
      assunto: t.assunto,
    }));

  return dataRecent;
};

export const ConsultaChamadoFlow = async (chamadoId: number) => {
  const chamadoDetails = await Chamado.findByPk(chamadoId);
  return chamadoDetails;
};
