export default {
  key: "SendMessageLaudoPronto",
  options: {
    delay: 6000,
    attempts: 2,
    removeOnComplete: 5,
    removeOnFail: 100,
    backoff: {
      type: "fixed",
      delay: 60000 * 3, // 3 min
    },
  },

  async handle(data: any) {
    // try {
    //     logger.info("SendMessageLaudoPronto Initiated");
    //     const { externalKey, apiConfig, tenantId, sessionId } = data
    //     const [{ contato }] = data.contatos;
    //     const wbot = getWbot(data.sessionId);
    //     if (!contato) {
    //         logger.error('Cotnato nao informado')
    //         throw new Error("Contato não informado");
    //     }
    //     const idNumber = await wbot.checkNumberStatus(contato)
    //     const { paciente_nome, procedimento_nome, link_la } = JSON.parse(data.contatos[0].notificacao)
    //     const templateMessage = `Olá ${paciente_nome}, gostaria de informar que o laudo do seu exame de ${procedimento_nome} já está pronto.\nPara acessá-lo, por favor, clique no link abaixo:\n${link_la}`
    //     const sendMessage: Message = await wbot.sendText(idNumber.id._serialized, templateMessage)
    //     const messageData: ApiMessage = {
    //         messageId: sendMessage.id,
    //         externalKey: externalKey,
    //         body: sendMessage.body,
    //         ack: sendMessage.ack,
    //         number: idNumber.id._serialized,
    //         timestamp: sendMessage.timestamp,
    //         sessionId: sessionId,
    //         tenantId: tenantId,
    //         apiConfig,
    //     } as unknown as ApiMessage
    //     await ApiMessage.create(messageData)
    //     logger.info("Finalized SendMessageLaudoPronto");
    // } catch (error) {
    //     throw new Error(error);
    // }
  },
};
