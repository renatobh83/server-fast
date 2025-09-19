import { SignedXml } from "xml-crypto";

import { extractPfxToPem } from "./getInfoCert";

export default function assinarXml(xml: string): string {
  console.log("Iniciando processo de assinatura XML...");

  const { cleanCert, certificatePem, privateKeyPem } = extractPfxToPem();

  let signedXml1 = signXmlDocument(
    xml,
    privateKeyPem,
    cleanCert,
    "//*[local-name(.)='InfRps']",
    { reference: "//*[local-name(.)='InfRps']", action: "after" },
    certificatePem
  );

  let signedXml2 = signXmlDocument(
    signedXml1,
    privateKeyPem,
    cleanCert,
    "//*[local-name(.)='LoteRps']",
    { reference: "//*[local-name(.)='LoteRps']", action: "after" },
    certificatePem
  );
  return signedXml2;
}

export function signXmlDocument(
  xmlString: string,
  privateKeyPem: any,
  cleanCert: any,
  xpathReference: any,
  signatureLocation: any,
  certificatePem: any
) {
  const sig = new SignedXml({
    privateKey: privateKeyPem,
    publicCert: certificatePem,
  }) as any;

  sig.signatureAlgorithm = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";

  sig.canonicalizationAlgorithm =
    "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";

  sig.addReference({
    xpath: xpathReference,
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
  });

  sig.signingKey = privateKeyPem;
  sig.keyInfoProvider = {
    getKeyInfo: () => `
      <X509Data>
        <X509Certificate>${cleanCert}</X509Certificate>
      </X509Data>
    `,
  };
  sig.computeSignature(xmlString, {
    location: signatureLocation,
  });

  return sig.getSignedXml();
}
