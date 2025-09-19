import { ConsultaPaciente } from "../Helpers/ConsultaPaciente";
import { RecuperarAcesso } from "../Helpers/recuperar";
import { generateRegistrationLink } from "../Lib/RegistrationLink";
import { ConsultaAgendamentos } from "../Helpers/ConsultaAgendamentos";
import { ConsultaAtendimentos } from "../Helpers/ConsultaAtendimentos";
import { GetLaudo } from "../Helpers/GetLaudo";
import { getPreparo } from "../Helpers/GetPreparo";
import {
  doAgendaHorario,
  doAgendaPost,
  doAgendaSemanal,
  getListaProcedimento,
  ListarPlanos,
  ListarUnidades,
  ObsplanoAsync,
} from "../Helpers/AgendarExame";
import { Confirmar } from "../Helpers/Confirmar";
import {
  obterHorarioRedis,
  salvarHorarioRedis,
} from "../Lib/horarioStoreRedis";
import { ListaMedicoExame } from "../Helpers/ListaMedicoAgenda";
import { PrecoExame } from "../Helpers/PrecoExame";

export const AgendarExameHelpers = {
  doAgendaHorario,
  doAgendaPost,
  doAgendaSemanal,
  getListaProcedimento,
  ListarPlanos,
  ListarUnidades,
  ObsplanoAsync,
};

export const ConfirmarHelper = Confirmar;
export const ListaMedicosHelper = ListaMedicoExame;
export const ConsultaAgendamentosHelper = ConsultaAgendamentos;
export const ConsultaAtendimentosHelper = ConsultaAtendimentos;
export const ConsultaPacienteHelper = ConsultaPaciente;
export const ConsultaPrecoExameHelper = PrecoExame;
export const GetLaudoHelper = GetLaudo;
export const GetPreparoHelper = getPreparo;
export const RecuperarAcessoHelper = RecuperarAcesso;
export const RegistrationLinkHelper = generateRegistrationLink;
export const HorarioRedisHelper = {
  obterHorarioRedis,
  salvarHorarioRedis,
};
