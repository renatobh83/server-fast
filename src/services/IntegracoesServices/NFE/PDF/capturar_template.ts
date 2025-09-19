// // capturar_template.js
// // OBJETIVO: Acessar uma NFS-e real, salvar seu HTML e CSS para usar como template.
// // EXECUTE ESTE SCRIPT APENAS UMA VEZ.

// import puppeteer from "puppeteer";
// const fs = require("fs").promises;
// import path from "path";

// // ----------------------------------------------------------------------------------
// // IMPORTANTE: Insira aqui o link completo e válido para uma nota fiscal real.
// const urlDaNotaFiscalReal =
//   "https://bhissdigital.pbh.gov.br/nfse/pages/exibicaoNFS-e.jsf";
// // ----------------------------------------------------------------------------------

// export async function capturarTemplate() {
//   //   if (
//   //     urlDaNotaFiscalReal ===
//   //     "https://bhissdigital.pbh.gov.br/nfse/pages/exibicaoNFS-e.jsf"
//   //   ) {
//   //     console.error(
//   //       '❌ ERRO: Por favor, edite o arquivo "capturar_template.js" e insira uma URL válida para uma NFS-e.'
//   //     );
//   //     return;
//   //   }

//   console.log("Iniciando o Puppeteer para capturar o template...");
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();

//   try {
//     console.log(`Acessando a URL: ${urlDaNotaFiscalReal}`);
//     // Aumentamos o timeout para garantir que páginas complexas carreguem completamente
//     await page.goto(urlDaNotaFiscalReal, {
//       //   waitUntil: "networkidle0",
//       //   timeout: 60000,
//     });

//     console.log("Página carregada. Extraindo o HTML completo...");
//     // page.content() retorna o HTML completo da página, incluindo <html>, <head> e <body>
//     const htmlCompleto = await page.content();

//     const outputPath = path.join(__dirname, "template_capturado.html");
//     await fs.writeFile(outputPath, htmlCompleto);

//     console.log(
//       `\n✅ Sucesso! O layout foi capturado e salvo em: ${outputPath}`
//     );
//     console.log(
//       "\nPróximo passo: Edite este arquivo e substitua os dados fixos pelos marcadores do Mustache (ex: {{Numero}})."
//     );
//   } catch (error) {
//     console.error("❌ Ocorreu um erro ao tentar capturar o template:", error);
//     console.log(
//       "Dicas: Verifique se a URL está correta e se o site da prefeitura está acessível."
//     );
//   } finally {
//     await browser.close();
//     console.log("Puppeteer finalizado.");
//   }
// }
