import {
  QueuePublisher,
  QueueConsumer,
  QueueSubmissionService,
} from "./queueManager.js";
import DB from "../../config/database/dbAbstract.js";
import dotenv from "dotenv";

dotenv.config();

class KafkaPublisher extends QueuePublisher {
  // This class implements the QueuePublisher interface for Kafka. It should be implemented as a singleton to manage Kafka producer instance efficiently.
  static instance;

  constructor() {
    if (KafkaPublisher.instance) {
      return KafkaPublisher.instance;
    }
    super();
    KafkaPublisher.instance = this;
  }

  pushToQueue(submission_id) {
    // Implementation for pushing message to Kafka topic
    console.log(`Pushing submission ${submission_id} to Kafka queue...`);
  }
}

class KafkaConsumer extends QueueConsumer {
  constructor(db, submissionService) {
    super();
    if (!db || !(db instanceof DB)) {
      throw new Error("A valid DB instance must be provided to KafkaConsumer.");
    }
    this.DB = db;
    this.processor = new KafkaSubmissionService(db, submissionService);
  }
  recieveFromQueue() {
    // Implementation for consuming messages from Kafka topic
    console.log("Receiving message from Kafka queue...");
    return new Promise((resolve, reject) => {
      // Simulate async message retrieval
      setTimeout(() => {
        resolve();
      }, 10000);
    });
  }
  acknowledgeMessage(submission_id) {
    // Implementation for acknowledging submission processing in Kafka
    return new Promise((resolve, reject) => {
      // Simulate async acknowledgment
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }
  negativeAcknowledgeMessage(submission_id) {
    // Implementation for negative acknowledgment in case of processing failure
    return new Promise((resolve, reject) => {
      // Simulate async negative acknowledgment
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }
  async pollAndProcess() {
    // Implementation for polling Kafka topic and processing submissions
    let submission_id = null;
    while (true) {
      try {
        submission_id = await this.recieveFromQueue();
        const { result } =
          await this.processor.processSubmission(submission_id);
        await this.acknowledgeMessage(submission_id);
      } catch (err) {
        await this.negativeAcknowledgeMessage(submission_id);
        console.error(
          `Error processing submission from Kafka for submission_id: ${submission_id} with error: `,
          err,
        );
      }
    }
  }
}

class KafkaSubmissionService extends QueueSubmissionService {
  constructor(db, storageService) {
    super();
    if (!db || !(db instanceof DB)) {
      throw new Error("A valid DB instance must be provided.");
    }
    this.db = db;
    this.storageService = storageService;
  }

  async processSubmission(submission_id) {
    try {
      // Fetch submission details from database
      console.log(`Processing submission with ID ${submission_id}...`);
      const submission = await this.db.getFromDB(submission_id);
      if (!submission || !submission.code) {
        throw new Error(`Submission with ID ${submission_id} not found.`);
      }

      // Update status to processing
      await this.db.setSubmissionStatus(submission_id, "RUNNING");

      // retrieve code from storage service
      const code = await this.storageService.getCode(submission_id);

      // Get the programming laguage from the submission details from the database. This is needed to determine how to compile and run the code in the docker container.
      const language = submission.language;

      // After getting the code and language, you would implement the actual logic to compile and run the code in the docker container, and capture the output and status.
      const result = await this.compileAndRunCode(code, language);

      // Update status to completed with result
      await this.db.setSubmissionStatus(submission_id, "COMPLETED");

      return { submission_id, result };
    } catch (error) {
      // Re-throw to let the processor handle it
      throw error;
    }
  }

  async handleError(submission_id, error) {
    try {
      // Log the error (optional)
      console.error(`Error processing submission ${submission_id}:`, error);

      // Update status to error
      await this.db.setSubmissionStatus(submission_id, "ERROR");
    } catch (dbError) {
      console.error(
        `Failed to update error status for submission ${submission_id}:`,
        dbError,
      );
    }
  }

  async compileAndRunCode(code, language) {
    // Implement actual logic to compile and run code in a docker container based on the language
    // This is a placeholder implementation and should be replaced with actual logic.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ output: "Code executed successfully", status: "success" });
      }, 1000);
    });
  }
}

export { KafkaPublisher, KafkaConsumer, KafkaSubmissionService };
