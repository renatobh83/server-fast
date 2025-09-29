export const RedisKeys = {
  settings: (tenantId: number | string) => `settings:${tenantId}`,
  chatFlow: (tenantId: number | string) => `chatFlow:${tenantId}`,
  chamados: (pageNumber: number | string) => `chamados:${pageNumber}`,
  DashTicketsAndTimes: (startDate: string, endDate: string, profile: string) =>
    `DashTicketsAndTimes:${startDate}:${endDate}:${profile}`,
  DashTicketsChannel: (startDate: string, endDate: string, profile: string) =>
    `DashTicketsChannel:${startDate}:${endDate}:${profile}`,
  DashTicketsEvolutionChannels: (
    startDate: string,
    endDate: string,
    profile: string
  ) => `DashTicketsEvolutionChannels:${startDate}:${endDate}:${profile}`,
  DashTicketsEvolutionByPeriod: (
    startDate: string,
    endDate: string,
    profile: string
  ) => `DashTicketsEvolutionByPeriod:${startDate}:${endDate}:${profile}`,
  DashTicketsPerUsersDetail: (
    startDate: string,
    endDate: string,
    profile: string
  ) => `DashTicketsPerUsersDetail:${startDate}:${endDate}:${profile}`,
  DashTicketsQueue: (startDate: string, endDate: string, profile: string) =>
    `DashTicketsQueue:${startDate}:${endDate}:${profile}`,
  contactTicket: (tenantId: number, contactIdOrPhone: string | number) =>
    `contact:${tenantId}:${contactIdOrPhone}`,

  tentantServices: () => `tentantServices`,
  queues: (tenantId: number | string) => `queues:${tenantId}`,
  contact: (
    tenantId: number,
    uniqueValue: any,
    contactIdOrPhone: string | number
  ) => `contact:${tenantId}:${contactIdOrPhone}:${uniqueValue}`,
  ticketService: (tenantId: number | string, ticketId: number | string) =>
    `ticket:${tenantId}:${ticketId}`,
  ticketFindOrCreate: (
    tenantId: number | string,
    sessionId: number | string,
    contatoId: number
  ) => `ticket:${tenantId}:${sessionId}:${contatoId}`,
  messages: (tenantId: number | string, ticketId: string | number) =>
    `messages:${tenantId}:${ticketId}`,
  canalService: (channel: any) => `channelService:${channel}`,
};
