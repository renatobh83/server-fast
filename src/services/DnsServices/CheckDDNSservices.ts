import { AppError } from "../../errors/errors.helper";
import Empresa from "../../models/Empresa";
import ResultadoDDNS from "../../models/ResultadoDDNS";
import { Op } from "sequelize";
const net = require("net");

// Interface para garantir que `checkOnlineStatus` retorna o tipo correto
interface IResultadoDDNS {
  empresaId: number;
  dominio: string;
  status: "online" | "offline";
  verificadoEm: Date;
}

export const CheckDDNSservices = async () => {
  try {
    const empresas = await Empresa.findAll({
      where: {
        acessoExterno: {
          [Op.ne]: [], // Filtra empresas que possuem pelo menos um domínio cadastrado
        },
      },
    });

    const resultados: IResultadoDDNS[] = await Promise.all(
      empresas.flatMap((empresa) =>
        (empresa.acessoExterno ?? []) // garante que é sempre um array
          .filter((acesso: { ddns: string; ativo: boolean }) => acesso.ativo)
          .map((acesso: { ddns: string }) =>
            checkOnlineStatus(empresa.id, acesso.ddns)
          )
      )
    );

    await ResultadoDDNS.bulkCreate(resultados, {
      updateOnDuplicate: ["status", "dominio", "verificadoEm"], // Atualiza caso o registro já exista
    });
  } catch (error) {
    throw new AppError("Erro ao verificar serviços DDNS:", 500);
  }
};

async function checkOnlineStatus(
  empresaId: number,
  dominio: string
): Promise<IResultadoDDNS> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000); // Tempo limite de conexão
    const [host, port] = dominio.split(":");

    socket.connect(port, host, () => {
      socket.destroy();
      resolve({
        empresaId,
        dominio,
        status: "online",
        verificadoEm: new Date(),
      });
    });

    socket.on("error", () => {
      socket.destroy();
      resolve({
        empresaId,
        dominio,
        status: "offline",
        verificadoEm: new Date(),
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        empresaId,
        dominio,
        status: "offline",
        verificadoEm: new Date(),
      });
    });
  });
}
