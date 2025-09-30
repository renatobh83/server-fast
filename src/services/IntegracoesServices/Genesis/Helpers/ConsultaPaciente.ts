import axios from "axios";

interface ConsultaPacienteProps {
  senha: string;
  integracao: any;
  cpf: string;
}
// http://otrsweb.zapto.org/cgi-bin/dwserver.cgi/se1/doPacienteLogin?id=01330415655&pw=1
export const ConsultaPaciente = async ({
  senha,
  integracao,
  cpf,
}: ConsultaPacienteProps) => {
  try {
    const url = "doPacienteLogin";
    const body = new URLSearchParams();
    body.append("id", cpf);
    body.append("pw", senha);

    const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;

    const { data } = await axios.post(URL_FINAL, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return data;
  } catch (error: any) {
    return error.response.data;
  }
};
