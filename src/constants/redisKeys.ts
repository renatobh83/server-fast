export const RedisKeys = {
  settings: (tenantId: number | string) => `settings:${tenantId}`,
  chatFlow: (tenantId: number | string) => `chatFlow:${tenantId}`,
  chamados: (pageNumber: number | string) => `chamados:${pageNumber}`,
  contatos: () => `contatos`,
  tentantServices: () => `tentantServices`,
  queues: (tenantId: number | string) => `queues:${tenantId}`,
  contact: (
    tenantId: number,
    uniqueValue: any,
    contactIdOrPhone: string | number
  ) => `contact:${tenantId}:${contactIdOrPhone}:${uniqueValue}`,
  ticket: (tenantId: number | string, ticetId: number | string) =>
    `ticket:${tenantId}:${ticetId}`,
  messages: (tenantId: number | string, ticketId: string | number) =>
    `messages:${tenantId}:${ticketId}`,
  canalService: (channel: any) => `channelService:${channel}`,
};
