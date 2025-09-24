import { logger } from "../utils/logger";

export default {
  key: "SendMessageSchenduled",
  options: {
    removeOnComplete: 2,
    removeOnFail: 5,
  },
  async handle() {
    try {
      logger.info("SendMessageSchenduled Initiated");
      // await SendMessagesSchenduleWbot();
      logger.info("Finalized SendMessageSchenduled");
    } catch (error) {
      logger.error({ message: "Error send messages", error });
    }
  },
};
