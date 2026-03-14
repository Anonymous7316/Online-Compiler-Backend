class QueuePublisher {
  //This class defines the interface for a queue publisher. This should be singleton and can be implemented for different queue systems (e.g., Kafka, RabbitMQ).
  pushToQueue() {
    throw new Error("Method 'pushToQueue()' must be implemented.");
  }
}

class QueueConsumer {
  recieveFromQueue() {
    throw new Error("Method 'recieveFromQueue()' must be implemented.");
  }
  pollAndProcess() {
    throw new Error("Method 'pollAndProcess()' must be implemented.");
  }
  acknowledgeMessage() {
    throw new Error("Method 'acknowledgeMessage()' must be implemented.");
  }
}

class QueueSubmissionService {
  processSubmission(submission_id) {
    throw new Error("Method 'processSubmission()' must be implemented.");
  }
  handleError(submission_id, err) {
    throw new Error("Method 'handleError()' must be implemented.");
  }
}

export { QueuePublisher, QueueConsumer, QueueSubmissionService };
