import axios from "axios";
import Integracoes from "../../../../models/Integracoes";
import https from "https";
import { isTokenExpired } from "../../../../utils/isTokenExpired";

const agent = new https.Agent({
  rejectUnauthorized: false, // IGNORA erros de certificado SSL
});
export async function getApiInstance(integracao: any, jwt: boolean) {
  let token = integracao.config_json.tokenJwt;

  let url = "";
  try {
    if (!token || !token.trim() || isTokenExpired(token)) {
      const { user, baseUrl, password } = integracao.config_json;
      url = `${baseUrl}doFuncionarioLogin?id=${user}&pw=${encodeURIComponent(
        password
      )}`;

      const response = await axios.get(url, {
        httpsAgent: agent,
      });
      token = response.data[0].ds_token;
      // Atualiza o objeto config_json com o novo token
      const updatedConfigJson = {
        ...integracao.config_json,
        tokenJwt: token,
      };

      await Integracoes.update(
        { config_json: updatedConfigJson },
        { where: { id: integracao.id } }
      );
    } else {
      token = integracao.config_json.tokenJwt; // Se for JWT, usa o token direto
    }

    const authorizationHeader = jwt
      ? `Bearer ${token}`
      : integracao.config_json.token;

    return axios.create({
      baseURL: integracao.config_json.baseUrl,
      httpsAgent: agent,
      headers: {
        Authorization: authorizationHeader,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Erro ao obter token:", url);
    throw error;
  }
}
