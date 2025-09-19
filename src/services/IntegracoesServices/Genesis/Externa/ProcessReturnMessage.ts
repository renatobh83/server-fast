import { GetMessageConfirma } from "./getMessageConfirma"

interface ListResponseProps {
    title: string
    singleSelectReply: { selectedRowId: string },

}
interface ResquestProps {
    id: string,
    body?: string
    from: string
    listResponse?: ListResponseProps
    content: string
}


export const ProcessReturnMessage = async (msg: ResquestProps, tenantId: number): Promise<void> => {
    let responseFromClient: string | null = null
    if (msg.listResponse) {
        responseFromClient = msg.listResponse.singleSelectReply.selectedRowId
    }
    else {
        responseFromClient = msg.body || msg.content
    }
    const contatoSend = msg.from
    GetMessageConfirma(responseFromClient, tenantId, contatoSend)
}