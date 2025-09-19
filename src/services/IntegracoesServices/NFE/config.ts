import path from "path";
const pastaPublic = path.join(process.cwd(), "public");
export default {
  cnpj: "21693445000120",
  inscricaoMunicipal: "03116040011",
  certificadoPath: path.resolve(pastaPublic, "certs/21693445000174.pfx"),
  senhaCertificado: "210976",
  ambiente: "homologacao", // ou 'producao'
};
