import {
  QueuePublisher,
  QueueConsumer,
  QueueSubmissionService,
} from "./queueManager.js";
import { Queue, Worker } from "bullmq";
import DB from "../../config/database/dbAbstract.js";
import dotenv from "dotenv";
import DockerService from "../container/docker.service.js";

dotenv.config();

class BullMqPublisher extends QueuePublisher {
  // This class implements the QueuePublisher interface for BullMQ. It should be implemented as a singleton to manage BullMQ producer instance efficiently.
  static instance;

  constructor() {
    if (BullMqPublisher.instance) {
      return BullMqPublisher.instance;
    }
    super();
    BullMqPublisher.instance = this;
    this.config = {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    };
    this.queue = new Queue("submissionQueue", this.config);
  }

  async pushToQueue(submission_id) {
    // Implementation for pushing message to BullMQ queue
    console.log(`Pushing submission ${submission_id} to BullMQ queue...`);
    await this.queue.add(
      "submissionJob",
      { submission_id },
      {
        attempts: 1,
        backoff: { type: 'fixed', delay: 5000 },
        timeout: 20000,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }
}

class BullMqConsumer extends QueueConsumer {
  constructor(db, submissionService) {
    super();
    if (!db || !(db instanceof DB)) {
      throw new Error(
        "A valid DB instance must be provided to BullMqConsumer.",
      );
    }
    this.DB = db;
    this.processor = new BullMqSubmissionService(db, submissionService);
    this.config = {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    };
    // this.jobQueue = [];
    this.queue = new Queue("failedSubmissionJob", this.config);
    this.worker = new Worker(
      "submissionQueue",
      async (job) => {
        await this.processor.processSubmission(job.data.submission_id);
      },
      {
        ...this.config,
        concurrency: Number(process.env.PROCESS_COUNT) || 1,
      },
    );
    this.worker.on("completed", (job) => {
      console.log(`Job ${job.id} completed`);
    });
    this.worker.on("failed", async (job, err) => {
      console.error(
        `Job ${job?.id} failed for submission ${job?.data?.submission_id}`,
        err,
      );
      if (job?.data?.submission_id) {
        await this.queue.add("failedSubmissionJob", {
          submission_id: job.data.submission_id,
        });
      }
    });
    const shutdown = async () => {
      console.log("Shutting down worker...");
      const timeout = setTimeout(() => {
        console.log("Force exit after 5s");
        process.exit(1);
      }, 5000);
      
      await this.worker.close();
      clearTimeout(timeout);
      console.log("Worker closed cleanly.");
      process.exit(0);
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }
  pollAndProcess() {
    // BullMQ polls automatically; this is no-op or manual drain
    return this.worker; // Or throw if unused
  }
}

class BullMqSubmissionService extends QueueSubmissionService {
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
      if (!submission || !submission.submission_id) {
        throw new Error(`Submission with ID ${submission_id} not found.`);
      }

      // Update status to processing
      await this.db.setSubmissionStatus(submission_id, "RUNNING");

      // retrieve code from storage service

      const code = await this.storageService.getCode(submission.code);

      // Get the programming laguage from the submission details from the database. This is needed to determine how to compile and run the code in the docker container.
      const language = submission.code_language;

      // After getting the code and language, you would implement the actual logic to compile and run the code in the docker container, and capture the output and status.
      const result = await this.compileAndRunCode(code, language, submission_id);

      // Update status to completed with result
      await this.db.setSubmissionStatus(submission_id, "COMPLETED");

      return { submission_id, result };
    } catch (error) {
      // Re-throw to let the processor handle it
      if (submission_id) {
        await this.handleError(submission_id, error);
      }
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

  async compileAndRunCode(code, language, submission_id) {
    // Implement actual logic to compile and run code in a docker container based on the language
    // This is a placeholder implementation and should be replaced with actual logic.
    const dockerService = new DockerService();
    const result = await dockerService.executeCode(code, language, submission_id);
    return result;
  }
}

export { BullMqPublisher, BullMqConsumer, BullMqSubmissionService };
