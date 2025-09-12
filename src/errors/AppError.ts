// Interface genérica para o cliente da fila (adapte conforme necessário)
interface QueueClient {
  add(jobName: string, data: any): Promise<any>;
  // Adicione outros métodos necessários do seu cliente de fila
}

class AppError extends Error {
  public readonly message: string;
  public readonly statusCode: number;
  public readonly origin?: string;
  public readonly cause?: Error; // Propriedade para armazenar o erro original

  // Propriedades estáticas para configuração da fila
  private static queueClient: QueueClient | null = null;
  private static queueName: string | null = null;

  /**
   * Configura o cliente e o nome da fila para despacho automático de erros.
   * Deve ser chamado uma vez na inicialização da sua aplicação.
   */
  public static setupQueueDispatcher(
    client: QueueClient,
    queueName: string
  ): void {
    if (!client || typeof client.add !== "function") {
      console.warn(
        "AppError.setupQueueDispatcher: Cliente de fila inválido ou sem método 'add'. Despacho automático desabilitado."
      );
      this.queueClient = null;
      this.queueName = null;
      return;
    }
    this.queueClient = client;
    this.queueName = queueName;
    console.log(
      `AppError: Despacho automático configurado para a fila '${queueName}'.`
    );
  }
  /**
   * Cria uma instância de AppError.
   *
   * @param message Mensagem do erro encapsulado.
   * @param statusCode Código de status HTTP (padrão 400).
   * @param options (Opcional) Objeto contendo:
   *   - origin?: Identificador da origem do erro (ex: 'DatabaseService'). Ativa o despacho automático se configurado.
   *   - cause?: O erro original que causou este AppError.
   */
  constructor(
    message: string,
    statusCode = 400,
    options?: { origin?: string; cause?: Error }
  ) {
    // Passa a mensagem para o construtor Error. Se houver 'cause', anexa sua mensagem.

    const fullMessage = options?.cause
      ? `${message} (Caused by: ${options.cause.message})`
      : message;
    super(fullMessage);

    this.message = message;
    this.name = "AppError";
    this.statusCode = statusCode;
    this.origin = options?.origin;
    this.cause = options?.cause;

    // Captura o stack trace corretamente, preservando o do AppError
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      // Fallback para ambientes sem captureStackTrace
      this.stack = new Error(fullMessage).stack;
    }

    // Anexa o stack da causa, se existir, para melhor depuração
    if (this.cause?.stack) {
      this.stack = `${this.stack}\n\n--- Caused by: ---\n${this.cause.stack}`;
    }

    // Despacho automático se a origem for fornecida e a fila estiver configurada
    if (this.origin) {
      AppError._dispatchToQueue(this).catch((dispatchError) => {
        console.error(
          `AppError: Falha ao despachar erro automaticamente para a fila '${AppError.queueName}':`,
          dispatchError
        );
      });
    }
  }
  /**
   * Método estático privado para enviar o erro para a fila.
   */
  private static async _dispatchToQueue(error: AppError): Promise<void> {
    // Prepara o payload, incluindo detalhes da causa se existir
    const jobPayload: Record<string, any> = {
      appError: {
        message: error.message.split(" (Caused by:")[0], // Mensagem principal do AppError
        statusCode: error.statusCode,
        origin: error.origin,
        stack: error.stack?.split("\n\n--- Caused by: ---")[0], // Stack principal do AppError
        name: error.name,
      },
      timestamp: new Date().toISOString(),
    };
    if (error.cause) {
      jobPayload.cause = {
        message: error.cause.message,
        name: error.cause.name,
        stack: error.cause.stack,
      };
    }
  }
}

export default AppError;
