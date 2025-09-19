import { SessaoUsuario } from "../types";

export const adicionarMinutos = (horario: string, minutos: number): string => {
  const [hora, minuto] = horario.split(":").map(Number);
  const data = new Date();
  data.setHours(hora!, minuto! + minutos, 0, 0);

  const novaHora = data.getHours().toString().padStart(2, "0");
  const novoMinuto = data.getMinutes().toString().padStart(2, "0");

  return `${novaHora}:${novoMinuto}`;
};

export const gerarIntervalosPorPeriodo = (
  periodo: "manha" | "tarde" | "noite"
): string[] => {
  const intervalos: string[] = [];
  let horaInicial: number;
  let horaFinal: number;

  switch (periodo) {
    case "manha":
      horaInicial = 7;
      horaFinal = 12;
      break;
    case "tarde":
      horaInicial = 13;
      horaFinal = 18;
      break;
    case "noite":
      horaInicial = 19;
      horaFinal = 22;
      break;
    default:
      return [];
  }

  for (let h = horaInicial; h <= horaFinal; h++) {
    intervalos.push(`${String(h).padStart(2, "0")}:00`);
  }

  return intervalos;
};
export function examesUnico(sessao: SessaoUsuario): any[] {
  // 1. Contar quantidades por cd_procedimento
  const quantidadePorProcedimento: Record<string, number> = {};

  sessao.examesParaAgendar.forEach((exame) => {
    const cd = exame;
    quantidadePorProcedimento[cd] = (quantidadePorProcedimento[cd] || 0) + 1;
  });

  // 2. Criar lista única de procedimentos (sem repetição)
  const procedimentosUnicos = sessao.examesParaAgendar.filter(
    (exame, index, self) => index === self.findIndex((e) => e === exame)
  );

  // 3. Montar array com os dados completos e nr_quantidade correta
  const examesConvertidos = procedimentosUnicos
    .map((exameAgendado) => {
      const exameCompleto = sessao.listaExames.find(
        (e) => e.cd_procedimento === +exameAgendado
      );

      if (!exameCompleto) {
        console.warn(
          `Exame não encontrado para cd_procedimento: ${exameAgendado}`
        );
        return null;
      }

      return {
        cd_modalidade: exameCompleto.cd_modalidade,
        cd_procedimento: exameCompleto.cd_procedimento,
        ds_procedimento: exameCompleto.ds_procedimento,
        cd_medico: 0,
        cd_plano: +sessao.planoSelecionado,
        cd_subplano: 0,
        cd_empresa: +sessao.unidadeSelecionada,
        nr_tempo: exameCompleto.nr_tempo,
        nr_tempo_total: exameCompleto.nr_tempo,
        nr_valor: exameCompleto.nr_valor,
        sn_especial: exameCompleto.sn_especial,
        nr_quantidade: quantidadePorProcedimento[exameAgendado],
      };
    })
    .filter(Boolean); // Remove os nulls
  return examesConvertidos ? examesConvertidos : [];
}
export function montarJsonAgendaSemanal(sessao: SessaoUsuario): string {
  // 1. Contar quantidades por cd_procedimento
  const quantidadePorProcedimento: Record<string, number> = {};

  sessao.examesParaAgendar.forEach((exame) => {
    const cd = exame;
    quantidadePorProcedimento[cd] = (quantidadePorProcedimento[cd] || 0) + 1;
  });

  // 2. Criar lista única de procedimentos (sem repetição)
  const procedimentosUnicos = sessao.examesParaAgendar.filter(
    (exame, index, self) => index === self.findIndex((e) => e === exame)
  );

  // 3. Montar array com os dados completos e nr_quantidade correta
  const examesConvertidos = procedimentosUnicos
    .map((exameAgendado) => {
      const exameCompleto = sessao.listaExames.find(
        (e) => e.cd_procedimento === +exameAgendado
      );

      if (!exameCompleto) {
        console.warn(
          `Exame não encontrado para cd_procedimento: ${exameAgendado}`
        );
        return null;
      }
      const cd_medico_selecionado =
        sessao.medicosSelecionados?.[exameCompleto.cd_modalidade] || 0;

      return {
        cd_modalidade: exameCompleto.cd_modalidade,
        cd_procedimento: exameCompleto.cd_procedimento,
        ds_procedimento: exameCompleto.ds_procedimento,
        cd_medico: cd_medico_selecionado,
        cd_plano: +sessao.planoSelecionado,
        cd_subplano: 0,
        cd_empresa: +sessao.unidadeSelecionada,
        nr_tempo: exameCompleto.nr_tempo,
        nr_tempo_total: exameCompleto.nr_tempo,
        nr_valor: exameCompleto.nr_valor,
        sn_especial: exameCompleto.sn_especial,
        nr_quantidade: quantidadePorProcedimento[exameAgendado],
      };
    })
    .filter(Boolean); // Remove os nulls

  const json = JSON.stringify(examesConvertidos);
  const base64 = Buffer.from(json).toString("base64");

  return base64;
}

export function gerarIdUnico() {
  return Math.random().toString(36).substring(2, 8);
}
