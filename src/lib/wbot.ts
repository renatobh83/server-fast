import { Whatsapp, create, defaultOptions } from "wbotconnect"
import { AppError } from "../errors/errors.helper";
interface Session extends Whatsapp {
    id: number;
}

const sessions: Session[] = [];
let sessionName: string;
let tenantId: string;
let whatsappSession: any;


export const initWbot = async (whatsapp: any): Promise<Session> => {
    let wbot: Session
    try {
        const options = {
            headless: false,
            phoneNumber: whatsapp.pairingCodeEnabled ? whatsapp.wppUser : null,
        }
        const mergedOptions = { ...defaultOptions, ...options }

        wbot = (await create(Object.assign({}, mergedOptions, {
            catchQR: (base64Qrimg: any, asciiQR: any, attempts: any, urlCode: any) => {
                // console.log("Number of attempts to read the qrcode: ", attempts);
                console.log("Terminal qrcode: ", urlCode);
                //   console.log("base64 image string qrcode: ", base64Qrimg);
                // console.log("urlCode (data-ref): ", urlCode);
            },
            statusFind: async (statusSession: string, _session: string) => {
                console.log(statusSession)
                if (statusSession === "inChat") {
                    // if (fs.existsSync(qrCodePath)) {
                    //   fs.unlink(qrCodePath, () => {});
                    // }
                }
            }

        })) as unknown as Session)

        const sessionIndex = sessions.findIndex((s) => s.id === whatsapp.id);
        if (sessionIndex === -1) {
            wbot.id = whatsapp.id;
            sessions.push(wbot);
        } else {
            sessions[sessionIndex] = wbot;
        }
        return wbot
    } catch (error) {
        throw new AppError("ERR_NO_PERMISSION", 403);
    }



}

