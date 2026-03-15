import dotenv from "dotenv";
import {
  BullMqPublisher,
  BullMqConsumer,
  BullMqSubmissionService,
} from "./bullmqManager.js";

dotenv.config();

export const QueuePublisherService = {
  // Factory function to create a new queue publisher instance based on the configured QUEUE_TYPE. This allows for easy switching between different queue implementations in the future if needed.
  bullmq: () => new BullMqPublisher(),
};

export const QueueConsumerService = {
  // Factory function to create a new queue consumer instance based on the configured QUEUE_TYPE. This allows for easy switching between different queue implementations in the future if needed.
  bullmq: (db, submissionService) => new BullMqConsumer(db, submissionService),
};

export const QueueSubmissionService = {
  // Factory function to create a new queue submission service instance based on the configured QUEUE_TYPE. This allows for easy switching between different queue implementations in the future if needed.
  bullmq: (db, storageService) => new BullMqSubmissionService(db, storageService),
};
