import { Sequelize, Op } from "sequelize";
import Empresa from "../../models/Empresa";
import Chamado from "../../models/Chamado";

export const formatDateForQuery = (date: Date) => {
  return date.toISOString().slice(0, 19) + ".000 -03:00";
};

export async function ChamadosByPeriodo(dataPesquisa: string) {
  // Converter a data para um objeto Date no JS
  const dataPesquisaObj = new Date(dataPesquisa);
  // Obter o primeiro dia do mês da data informada
  const primeiroDiaMes = new Date(
    dataPesquisaObj.getFullYear(),
    dataPesquisaObj.getMonth(),
    1
  );

  const a = formatDateForQuery(new Date(primeiroDiaMes));
  const b = formatDateForQuery(new Date(dataPesquisaObj));

  const relatorio = await Chamado.findAll({
    attributes: [
      "empresaId",
      [Sequelize.fn("COUNT", Sequelize.col("Chamado.id")), "total_chamados"],

      // Contar chamados abertos no período
      [
        Sequelize.fn(
          "COUNT",
          Sequelize.literal(`
                CASE
                    WHEN "Chamado"."closedAt" IS NULL THEN 1
                END
            `)
        ),
        "chamados_abertos",
      ],

      // Contar chamados fechados no período
      [
        Sequelize.fn(
          "COUNT",
          Sequelize.literal(`
                CASE
                    WHEN "Chamado"."closedAt" IS NOT NULL
                    AND "Chamado"."closedAt" BETWEEN '${a}' AND '${b}'
                THEN 1
                END
            `)
        ),
        "chamados_fechados",
      ],

      // Contar chamados que foram abertos no período, mas fechados em outro período
      [
        Sequelize.fn(
          "COUNT",
          Sequelize.literal(`
                CASE
                    WHEN "Chamado"."createdAt" BETWEEN '${a}' AND '${b}'
                    AND "Chamado"."closedAt" IS NOT NULL
                    AND "Chamado"."closedAt" NOT BETWEEN '${a}' AND '${b}'
                THEN 1
                END
            `)
        ),
        "chamados_transferidos",
      ],

      [
        Sequelize.fn(
          "COALESCE",
          Sequelize.fn(
            "SUM",
            Sequelize.literal(`
                CASE
                    -- Quando o chamado foi fechado no período, sempre contabiliza o tempo
                    WHEN DATE_PART('month', CAST("Chamado"."closedAt" AS TIMESTAMP)) = DATE_PART('month', CAST('${a}' AS TIMESTAMP))
                    AND DATE_PART('year', CAST("Chamado"."closedAt" AS TIMESTAMP)) = DATE_PART('year', CAST('${a}' AS TIMESTAMP))
                THEN "Chamado"."tempoChamado"
                ELSE 0
                END
            `)
          ),
          0
        ),
        "tempo_total_horas",
      ],
    ],
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: ["name"], // Nome da empresa
      },
    ],
    where: {
      [Op.or]: [
        // Chamados abertos no período
        {
          createdAt: {
            [Op.between]: [primeiroDiaMes, dataPesquisaObj],
          },
        },
        // Chamados fechados no período
        {
          closedAt: {
            [Op.between]: [primeiroDiaMes, dataPesquisaObj],
          },
        },
      ],
    },
    group: ["Chamado.empresaId", "empresa.id"], // Agrupa por empresa
    raw: true, // Retorna JSON puro
    // logging: console.log
  });

  return relatorio;
}
