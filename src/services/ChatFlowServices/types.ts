export interface Ticket {
    id: string;
    tenantId: string;
    chatFlowId?: string | null;
    stepChatFlow?: string | null;
    botRetries: number;
    lastInteractionBot: Date;
    status: "pending" | "closed" | "open";
    lastMessage?: string;
    closedAt?: number;
    queueId?: string | null;
    userId?: string | null;
    isGroup: boolean;
    answered: boolean;
    isCreated: boolean;
    contact: {
        number: string;
    };
    channel: string;
    getChatFlow: () => Promise<ChatFlow>;
    update: (data: Partial<Ticket>) => Promise<void>;
    reload: () => Promise<void>;
}

export interface ChatFlow {
    flow: {
        nodeList: Array<Step | FlowConfig>;
    };
    celularTeste?: string;
}

export interface Step {
    id: string;
    data: {
        conditions: StepCondition[];
        interactions: any[]; // Melhorar tipagem aqui se possível
    };
    type?: string; // Ex: 'boasVindas', 'configurations'
}

export interface FlowConfig {
    type: "configurations";
    data: {
        autoDistributeTickets?: boolean;
        maxRetryBotMessage?: {
            number: number;
            type: RetryDestinyType;
            destiny: string; // queueId ou userId
        };
        notOptionsSelectMessage?: {
            message: string;
        };
        welcomeMessage?: {
            message: string;
        };
        notResponseMessage?: {
            message: string;
        };
        answerCloseTicket?: string[];
    };
}

export interface StepCondition {
    action: ChatFlowAction;
    nextStepId?: string;
    queueId?: string;
    userIdDestination?: string;
    closeTicket?: string;
    type: ConditionType;
    condition?: string[];
}

export enum ChatFlowAction {
    NextStep = 0,
    QueueDefine = 1,
    UserDefine = 2,
    CloseTicket = 3,
    AdvancedStep = 4,
}

export enum ConditionType {
    UserSelection = "US",
    Automatic = "A",
}

export enum RetryDestinyType {
    Queue = 1,
    User = 2,
    Close = 3,
}

export interface MessageData {
    body: string;
    fromMe: boolean;
    read: boolean;
    sendType: "bot" | "chat";
}

export enum MessageType {
    MessageField = "MessageField",
    MessageOptionsField = "MessageOptionsField",
    MediaField = "MediaField",
    WebhookField = "WebhookField",
}


