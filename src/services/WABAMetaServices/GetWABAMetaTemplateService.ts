// import axios from "axios";
// import { logger } from "../../utils/logger";

// export const GetWABAMetaTemplateService = () => {
//   class GetTemplate {
//     async getTemplate({ whatsapp }) {
//       try {
//         const url = `https://graph.facebook.com/v${whatsapp?.wabaVersion}/${whatsapp?.wabaId}/message_templates`;

//         const response = await axios.get(url, {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${whatsapp?.bmToken}`,
//           },
//         });

//         return response.data;
//       } catch (error: any) {
//         logger.warn("WABA get template error ", error.message);
//         throw error;
//       }
//     }
//   }

//   // ✅ Retorna a instância da classe para uso
//   return new GetTemplate();
// };
