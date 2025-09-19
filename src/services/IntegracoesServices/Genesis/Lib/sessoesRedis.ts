import { format } from "date-fns";
import { redisClient } from "../../../../lib/redis";
import { SessaoUsuario } from "../types";

const getRedisKey = (ticketId: number) => `sessao:${ticketId}`;
export async function obterSessaoUsuarioRedis(
  ticketId: number
): Promise<SessaoUsuario> {
  const key = getRedisKey(ticketId);
  const data = await redisClient.get(key);
  if (data) {
    return JSON.parse(data);
  }
  const novaSessao: SessaoUsuario = {
    dadosPaciente: {},
    unidadeSelecionada: null,
    planoSelecionado: null,
    examesParaAgendar: [],
    ultimaDataConsulta = format(new Date(), "dd/MM/yyyy"),
    horarioSelecionado: null,
    cadastro: null,
    cdHorario: null,
    intervaloSelecionado: "",
    medicosSelecionados: null,
    ultimoExameSelecionado: null,
    valorTotalExames: 0,
    listaAtendimentos: [],
    listaAgendamentos: [],
    listaPlanos: [],
    listaUnidades: [],
    listaExames: [],
    examesComMedicos: [],
    errosResponse: 0,
  };
  await redisClient.set(key, JSON.stringify(novaSessao), "EX", 900); // TTL de 1h
  return novaSessao;
}

export async function salvarSessaoUsuario(
  userId: number,
  sessao: SessaoUsuario
): Promise<void> {
  const key = getRedisKey(userId);
  await redisClient.set(key, JSON.stringify(sessao), "EX", 900); // renova o TTL sempre
}
