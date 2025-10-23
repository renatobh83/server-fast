import { Op, Sequelize } from "sequelize";
import IntegracaoGenesisConfirmacao from "../../../../models/IntegracaoGenesisConfirmacao";

interface Request {
  paciente_nome: string;
  atendimento_data: string;
  bot: string;
  dados_agendamentos: any[];
}
interface PropsBody {
  bodyProcessed: Request;
  tenantId: number;
  idNumber: any;
  contato: string;
  integracaoId: string;
}
export const FindOrCreateConfirmacaoservice = async ({
  bodyProcessed,
  tenantId,
  idNumber,
  contato,
  integracaoId,
}: PropsBody): Promise<any> => {
  try {
    const idsExternos = bodyProcessed.dados_agendamentos.map(
      (item) => item.idExterno
    );
    const horarioMaisCedo = bodyProcessed.dados_agendamentos.reduce(
      (min, agendamento) => {
        return agendamento.Hora < min.Hora ? agendamento : min;
      },
      bodyProcessed.dados_agendamentos[0]
    );

    const confirmacao = await IntegracaoGenesisConfirmacao.findOne({
      where: {
        tenantId,
        atendimentoData: bodyProcessed.atendimento_data,
        answered: false,
        closedAt: null,
        [Op.and]: [
          Sequelize.where(
            Sequelize.literal(`"idexterno"`),
            "@>",
            JSON.stringify(idsExternos)
          ),
        ],
      },
      raw: true,
      // logging: console.log,
    });
    if (!confirmacao) {
      const novosProcedimentos: any[] = [];
      const novosIdExternos: any[] = [];

      for (const agendamento of bodyProcessed.dados_agendamentos) {
        const { idExterno, Procedimento } = agendamento;

        // Verifique se idExterno já existe em novosIdExternos antes de adicionar
        if (!novosIdExternos.includes(idExterno)) {
          novosIdExternos.push(idExterno);
        }

        // Verifique se Procedimento já existe em novosProcedimentos antes de adicionar
        if (!novosProcedimentos.includes(Procedimento)) {
          novosProcedimentos.push(Procedimento);
        }
      }
      const confirmacaoObj: any = {
        contato: idNumber.id._serialized,
        contatoSend: contato,
        procedimentos: novosProcedimentos,
        idexterno: novosIdExternos,
        channel: "Whatsapp",
        atendimentoData: bodyProcessed.atendimento_data,
        atendimentoHora: horarioMaisCedo.Hora,
        tenantId: tenantId,
        integracaoId,
      };

      const ticketConfirmacao = await IntegracaoGenesisConfirmacao.create(
        confirmacaoObj
      );
      return ticketConfirmacao;
    }
    for (const agendamento of bodyProcessed.dados_agendamentos) {
      const { idExterno, Procedimento } = agendamento;
      await IntegracaoGenesisConfirmacao.update(
        {
          procedimentos: Sequelize.literal(`
              CASE
                WHEN NOT EXISTS (
                  SELECT 1
                  FROM jsonb_array_elements_text(procedimentos) AS elem
                  WHERE elem::int = ANY(ARRAY[${Procedimento}]::int[])
                )
                THEN procedimentos || '${Procedimento}'
                ELSE procedimentos
              END
            `),
          atendimentoHora: Sequelize.fn(
            "LEAST",
            Sequelize.col("atendimentoHora"),
            horarioMaisCedo.Hora
          ),
          idexterno: Sequelize.literal(`
              CASE
                WHEN NOT EXISTS (
                  SELECT 1
                  FROM jsonb_array_elements_text(idexterno) AS elem
                  WHERE elem::int = ANY(ARRAY[${idExterno}]::int[])
                )
                THEN idexterno || '${JSON.stringify(idExterno)}'
                ELSE idexterno
              END
            `),
        },
        {
          where: {
            id: confirmacao.id,
          },
        }
      );
    }
    return confirmacao;
  } catch (error) {
    console.error("Error in FindOrCreateConfirmacaoService:", error);
    throw new Error(
      "An unexpected error occurred while processing the confirmation service."
    );
  }
};
