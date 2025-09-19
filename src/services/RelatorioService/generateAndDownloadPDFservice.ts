import { Op, Sequelize } from "sequelize";
import Empresa from "../../models/Empresa";
import { generatePDF } from "./ReportPdf";
import path from "path";
import fs from "fs";
import EmpresaContrato from "../../models/EmpresaContrato";
import { formatDateForQuery } from "./ChamadosByPeriodo";
import Chamado from "../../models/Chamado";
import { FastifyReply } from "fastify";
interface generateAndDownloadPDFRequest {
  period: any;
  empresaId: string;
  dataReport: Date;
}
export const formatador = new Intl.DateTimeFormat("pt-BR");

function msToHms(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const remainingSeconds = seconds % 60;
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

export const generateAndDownloadPDF = async (
  { empresaId, period, dataReport }: generateAndDownloadPDFRequest,
  reply: FastifyReply
) => {
  // Converter a data para um objeto Date no JS
  const dataPesquisaObj = new Date(period);
  // Obter o primeiro dia do mês da data informada
  const primeiroDiaMes = new Date(
    dataPesquisaObj.getFullYear(),
    dataPesquisaObj.getMonth(),
    1
  );
  const a = formatDateForQuery(new Date(primeiroDiaMes));
  const chamados = await Chamado.findAll({
    include: [
      {
        model: Empresa,
        as: "empresa",
        attributes: [
          "name",
          "address",
          "identifier",

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
        ], // Nome da empresa
        include: [
          {
            model: EmpresaContrato,
            as: "contratos",
            attributes: ["id", "dataContrato", "totalHoras"],
            where: {
              dataContrato: {
                [Op.eq]: Sequelize.literal(`(
                               SELECT MAX("EmpresaContrato"."dataContrato")
                                FROM "EmpresaContrato"
                                WHERE "EmpresaContrato"."empresaId" = Empresa.id
                            )`),
              },
            },
            required: false,
          },
        ],
      },
    ],
    where: {
      [Op.and]: [
        {
          closedAt: {
            [Op.between]: [primeiroDiaMes, dataPesquisaObj], // Apenas chamados fechados no período atual
          },
        },
        {
          [Op.or]: [
            {
              createdAt: {
                [Op.between]: [primeiroDiaMes, dataPesquisaObj], // Chamados abertos dentro do período
              },
            },
            {
              createdAt: {
                [Op.lt]: primeiroDiaMes, // Chamados abertos em um período anterior
              },
            },
          ],
        },
      ],
      empresaId, // Filtrar por empresaId
    },
    group: [
      "Chamado.id",
      "empresa.name",
      "empresa.address",
      "empresa.identifier",
      "empresa->contratos.id",
    ], // Agrupa por empresa
    raw: true, // Retorna JSON puro
    // logging: console.log
  });
  // console.log(chamados)
  if (!chamados.length)
    return reply
      .code(404)
      .send({ message: "Nenhum chamado encontrado para esse período." });
  const empresa = chamados[0] as any; // Como há apenas um objeto, pegamos o primeiro
  const dadosEmpresa = {
    name: empresa["empresa.name"],
    cpnj: empresa["empresa.identifier"],
  };
  let tempoTotalChamados = 0;
  let totalHorasContrato = 0;

  chamados.forEach((chamado) => {
    tempoTotalChamados += +(chamado as any)["empresa.tempo_total_horas"] || 0;
    if (
      !totalHorasContrato &&
      (chamado as any)["empresa.contratos.totalHoras"]
    ) {
      totalHorasContrato = (chamado as any)["empresa.contratos.totalHoras"];
    }
  });

  const totalHorasContratoMs = totalHorasContrato * 60 * 60 * 1000; // horas → ms
  const excedenteMs = tempoTotalChamados - totalHorasContratoMs;
  const horasExcedentesFormatadas = msToHms(excedenteMs);

  const dadosContrato = {
    empresa: (chamados as any)[0]?.["empresa.name"] || "Desconhecida",
    horasUtilizadas: tempoTotalChamados,
    horasContratadas: totalHorasContrato,
    horasExcedentes: excedenteMs > 0 ? horasExcedentesFormatadas : "0:00",
    excedeu: excedenteMs > 0,
  };

  const filePath = path.join(
    __dirname,
    `../../../public/relatorio-${dadosEmpresa.name}.pdf`
  );
  // Criando o PDF e esperando a finalização
  await new Promise((resolve, reject) => {
    generatePDF(
      dadosEmpresa,
      `${formatador.format(primeiroDiaMes)} à ${formatador.format(
        dataPesquisaObj
      )}`,
      chamados,
      dataReport,
      dadosContrato
    );
    // Espera o arquivo ser realmente criado antes de continuar
    setTimeout(() => {
      if (fs.existsSync(filePath)) {
        resolve(true);
      } else {
        reject(new Error("Falha ao gerar o PDF"));
      }
    }, 2000); // Aguarda 2 segundos antes de verificar se o arquivo foi salvo
  });

  // 📌 Fastify -> enviar arquivo como download
  reply.header(
    "Content-Disposition",
    `attachment; filename=relatorio-${dadosEmpresa.name}.pdf`
  );
  reply.type("application/pdf");

  const stream = fs.createReadStream(filePath);

  // remove o arquivo após enviar
  stream.on("close", () => {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Erro ao excluir o arquivo:", err);
    });
  });

  return reply.send(stream);
};
