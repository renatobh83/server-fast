import forge from "node-forge";
import config from "./config";
import fs from "node:fs";

export const extractPfxToPem = (): any => {
  try {
    const pfxBuffer = fs.readFileSync(config.certificadoPath);

    //converter o buffer para objs ASN.1
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"), false);

    // decodificar
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, config.senhaCertificado);

    let privateKeyPem = null;
    let certificatePem = null;
    let caCertificatePem = [];

    const keyBags = p12.getBags({
      bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    });

    const pkcs8Bags = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
    if (pkcs8Bags && pkcs8Bags?.length > 0) {
      const privateKeyBag = pkcs8Bags[0];
      const privateKey = privateKeyBag.key as any;
      privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    }
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const cert8Bags = certBags[forge.pki.oids.certBag];

    if (cert8Bags && cert8Bags.length > 0) {
      const certificateBags = cert8Bags[0];
      const certificate = certificateBags.cert as any;
      certificatePem = forge.pki.certificateToPem(certificate);
    }

    const cleanCert = certificatePem!
      .replace(/-----BEGIN CERTIFICATE-----/, "")
      .replace(/-----END CERTIFICATE-----/, "")
      .replace(/\r?\n|\r/g, "");
    if (cert8Bags && cert8Bags.length > 0) {
      for (let i = 0; i < cert8Bags.length; i++) {
        const caCertBag = cert8Bags[i];
        caCertificatePem.push(caCertBag.cert);
      }
    }
    return {
      cleanCert,
      certificatePem,
      privateKeyPem,
    };
  } catch (error) {
    console.log(error);
  }
};
// export const getInfoCert = (certificate: any) => {
//   const binaryStr = forge.util.binary.raw.encode(certificate);
//   const forgeBuffer = forge.util.createBuffer(binaryStr);
//   const asn1 = forge.asn1.fromDer(forgeBuffer);

//   const pkcs12 = forge.pkcs12.pkcs12FromAsn1(
//     asn1,
//     false,
//     config.senhaCertificado
//   );

//   let privateKey: forge.pki.PrivateKey | undefined;
//   const keyBags =
//     pkcs12.getBags({
//       bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
//     })[forge.pki.oids.pkcs8ShroudedKeyBag] ||
//     pkcs12.getBags({
//       bagType: forge.pki.oids.keyBag,
//     })[forge.pki.oids.keyBag];

//   if (keyBags && keyBags.length > 0) {
//     privateKey = keyBags[0].key;
//   }

//   if (!privateKey) {
//     throw new Error("Chave privada não encontrada no certificado PFX.");
//   }

//   // 5. Extrai o certificado público
//   const certBags = pkcs12.getBags({ bagType: forge.pki.oids.certBag })[
//     forge.pki.oids.certBag
//   ];
//   if (!certBags || certBags.length === 0) {
//     throw new Error("Certificado não encontrado no arquivo PFX.");
//   }

//   const cert = certBags[0].cert as any;
//   const certPem = forge.pki.certificateToPem(cert);
//   const cleanCert = certPem
//     .replace(/-----BEGIN CERTIFICATE-----/, "")
//     .replace(/-----END CERTIFICATE-----/, "")
//     .replace(/\r?\n|\r/g, "");

//   return {
//     privateKey,
//     cleanCert,
//     certPem,
//   };
// };
