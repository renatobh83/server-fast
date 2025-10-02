import axios from "axios";
import { getApiInstance } from "./authService";
import FormData from "form-data";
const unidades = "doListaEmpresa";
const planos = "doListaPlano";
const avisoPLano = "doPlanoAviso";
const procedimento = "doListaProcedimento";
const agendaSemanal = "doAgendaSemanal";

export const ListarUnidades = async (integracao: any, token: string) => {
  const url = `/${unidades}`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}?token=${token}`;

  try {
    const instanceApi = await getApiInstance(integracao, true);
    const { data } = await instanceApi.post(URL_FINAL, {});
    return data;
  } catch (error) {
    console.error("Erro ao confirmar exame:", error);
    throw error;
  }
};

export const ListarPlanos = async (integracao: any, token: string) => {
  const url = `/${planos}`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}?token=${token}`;

  try {
    const instanceApi = await getApiInstance(integracao, true);
    const { data } = await instanceApi.post(URL_FINAL, {});
    return data;
  } catch (error) {
    console.error("Erro ao confirmar exame:", error);
    throw error;
  }
};
interface GetObsPlanoProps {
  integracao: any;
  cdPlano: number;
  token: string;
}
export const ObsplanoAsync = async ({
  integracao,
  cdPlano,
  token,
}: GetObsPlanoProps) => {
  const url = `${avisoPLano}?cd_plano=${cdPlano}&token=${token}`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;

  try {
    const instanceApi = await getApiInstance(integracao, true);
    const body = new URLSearchParams();
    body.append("cd_plano", cdPlano.toString());
    body.append("token", token);

    const { data } = await instanceApi.post(URL_FINAL, body);

    const infoPlano = data[0];
    1;
    if (!infoPlano.ds_infoweb) return false;
    const decoded = Buffer.from(infoPlano.ds_infoweb, "base64").toString(
      "utf-8"
    );
    return decoded;
  } catch (error) {
    console.error("Erro observacao plano:", error);
    throw error;
  }
};
interface GetListProcedimento {
  integracao: any;
  cdPlano: number;
  cdEmpresa: number;
  token: string;
}
export const getListaProcedimento = async ({
  integracao,
  cdPlano,
  cdEmpresa,
  token,
}: GetListProcedimento) => {
  const url = `${procedimento}?cd_plano=${cdPlano}&cd_empresa=${cdEmpresa}&token=${token}`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;
  try {
    const instanceApi = await getApiInstance(integracao, true);
    const { data } = await instanceApi.post(URL_FINAL, {});

    return data;
  } catch (error) {
    console.error("Erro ao confirmar exame:", error);
    throw error;
  }
};
interface GetListProcedimentoIntegraca {
  integracao: any;
  cdPlano: number;
  procedimento: string;
}
export const getListProcedimentoIntegra = async ({
  integracao,
  cdPlano,
  procedimento,
}: GetListProcedimentoIntegraca) => {
  const URL_FINAL = `${integracao.config_json.urlIntegra}obterprocedimentos`;
  const data = {
    codPlano: +cdPlano,
    procedimento,
  };
  try {
    const instanceApi = await getApiInstance(integracao, false);
    const response = await instanceApi.post(URL_FINAL, data);
    return response.data;
  } catch (error) {
    console.error("Erro ao confirmar exame:", error);
    throw error;
  }
};
interface doAgendaHorario {
  integracao: any;
  token: string;
  dadosPesquisa: {
    cd_horario?: string;
    tokenPaciente: string;
    cd_paciente: string;
    dt_data: string;
    dt_hora: string;
    dt_hora_fim: string;
    js_exame: any;
  };
}

export const doAgendaHorario = async ({
  integracao,
  dadosPesquisa,
  token,
}: doAgendaHorario) => {
  const URL_FINAL = `${integracao.config_json.baseUrl}doAgendaHorario?token=${token}`;
  // 1. Criar o form-data real
  const form = new FormData();
  form.append("dt_data", dadosPesquisa.dt_data); // '14/05/2025'
  form.append("dt_hora", dadosPesquisa.dt_hora); // '08:00'
  form.append("dt_hora_fim", dadosPesquisa.dt_hora_fim); // '23:49'
  form.append("js_exame", JSON.stringify(dadosPesquisa.js_exame));
  try {
    const instanceApi = await getApiInstance(integracao, true);
    const { data } = await instanceApi.post(URL_FINAL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${dadosPesquisa.tokenPaciente}`, // ou onde estiver seu token
      },
    });
    return data;
  } catch (error) {
    console.error("Erro ao confirmar exame:", error);
    throw error;
  }
};
interface GetPropsAgendaSemanal {
  integracao: any;
  dadosPesquisa: {
    cd_horario?: string;
    tokenPaciente: string;
    cd_paciente: string;
    dt_data: string;
    dt_hora: string;
    dt_hora_fim: string;
    js_exame: any;
  };
  token: string;
}

export const doAgendaSemanal = async ({
  integracao,
  dadosPesquisa,
  token,
}: GetPropsAgendaSemanal) => {
  const URL_FINAL = `${integracao.config_json.baseUrl}doAgendaSemanal?token=${token}`;
  // 1. Criar o form-data real
  const form = new FormData();
  form.append("dt_data", dadosPesquisa.dt_data); // '14/05/2025'
  form.append("dt_hora", dadosPesquisa.dt_hora); // '08:00'
  form.append("dt_hora_fim", dadosPesquisa.dt_hora_fim); // '23:49'
  form.append("js_exame", JSON.stringify(dadosPesquisa.js_exame));
  try {
    console.log(form);
    const instanceApi = await getApiInstance(integracao, true);
    const { data } = await instanceApi.post(URL_FINAL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${dadosPesquisa.tokenPaciente}`, // ou onde estiver seu token
      },
    });
    return data;
  } catch (error) {
    console.error("Erro ao confirmar exame:", error);
    throw error;
  }
};
interface GetPropsAgendaPost {
  integracao: any;
  dadosPesquisa: {
    cd_horario?: string;
    tokenPaciente: string;
    cd_paciente: string;
    dt_data: string;
    dt_hora: string;
    dt_hora_fim: string;
    js_exame: any;
  };
}

export const doAgendaPost = async ({
  integracao,
  dadosPesquisa,
}: GetPropsAgendaPost) => {
  const URL_FINAL = `${integracao.config_json.baseUrl}doAgendaPost`;
  // 1. Criar o form-data real
  const form = new FormData();
  form.append("cd_paciente", dadosPesquisa.cd_paciente);
  form.append("cd_horario", dadosPesquisa.cd_horario);
  form.append("dt_data", dadosPesquisa.dt_data);
  form.append("dt_hora", dadosPesquisa.dt_hora);
  form.append("dt_hora_fim", dadosPesquisa.dt_hora_fim);
  form.append("js_exame", JSON.stringify(dadosPesquisa.js_exame));
  try {
    const instanceApi = await getApiInstance(integracao, true);
    const { data } = await instanceApi.post(URL_FINAL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${dadosPesquisa.tokenPaciente}`, // ou onde estiver seu token
      },
    });
    return data;
  } catch (error) {
    console.error("Erro ao confirmar exame:", error);
    throw error;
  }
};
