import { AppError } from "../../../../errors/errors.helper";
import Ticket from "../../../../models/Ticket";
import { getApiInstance } from "./authService";

interface ConsultaPacienteProps {
  ticket: Ticket;
  integracao: any;
  codPaciente: string;
  sessao: any;
}

export const ConsultaAgendamentos = async ({
  sessao,
  integracao,
  codPaciente,
}: ConsultaPacienteProps) => {
  try {
    const body = new URLSearchParams();
    body.append("cd_paciente", codPaciente);
    body.append("token", sessao.dadosPaciente.ds_token);

    const url = `doListaAgendamento`;

    const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;
    const instanceApi = await getApiInstance(integracao, true);

    const { data } = await instanceApi.post(URL_FINAL, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (data.length) {
      return data
        .filter(
          (i: { ds_status: string; dt_data: string; dt_hora: string }) => {
            if (i.ds_status === "CANCELADO") return false;

            const [dia, mes, ano] = i.dt_data.split("/");
            const hora = i.dt_hora?.split(" - ")[0] || "00:00";
            const [h, m] = hora.split(":").map(Number);

            const dataAgendada = new Date(
              `${ano}-${mes}-${dia}T${String(h).padStart(2, "0")}:${String(
                m
              ).padStart(2, "0")}:00`
            );

            return dataAgendada.getTime() > Date.now(); // só mantém se a data/hora for no futuro
          }
        )
        .sort(
          (
            a: {
              dt_data: { split: (arg0: string) => [any, any, any] };
              dt_hora: string;
            },
            b: {
              dt_data: { split: (arg0: string) => [any, any, any] };
              dt_hora: string;
            }
          ) => {
            const [diaA, mesA, anoA] = a.dt_data.split("/");
            const [diaB, mesB, anoB] = b.dt_data.split("/");

            const dataA = new Date(`${anoA}-${mesA}-${diaA}`);
            const dataB = new Date(`${anoB}-${mesB}-${diaB}`);

            if (dataA.getTime() !== dataB.getTime()) {
              return dataA.getTime() - dataB.getTime(); // primeiro por data (decrescente)
            }

            const horaA = a.dt_hora?.split(" - ")[0] || "00:00";
            const horaB = b.dt_hora?.split(" - ")[0] || "00:00";

            const [hA, mA] = horaA.split(":").map(Number);
            const [hB, mB] = horaB.split(":").map(Number);

            const minutosA = hA! * 60 + mA!;
            const minutosB = hB! * 60 + mB!;

            return minutosA - minutosB; // ordem decrescente por hora
          }
        )
        .slice(0, 5);
    }
    return [];
  } catch (error: any) {
    throw new AppError(error, 500);
  }
};
