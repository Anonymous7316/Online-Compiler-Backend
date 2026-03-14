import { DatabaseService } from "../config/database/databaseConfig.js";
import { StorageService } from "../services/storage/storageConfig.js";
import { QueuePublisherService } from "../services/queue/queueConfig.js";
import dotenv from "dotenv";

dotenv.config();

const DB = DatabaseService[process.env.DB_TYPE]();
const publisher = QueuePublisherService[process.env.QUEUE_TYPE]();
const storageService = StorageService[process.env.STORAGE_TYPE]();

export const getSubmissionStatus = async (req, res) => {
  const submissionId = req.params.id;
  try {
    const result = await DB.getSubmissionStatus(submissionId);
    if (result.error) {
      res.status(404).json({ status: "error", message: result.error });
    } else {
      res.status(200).json(result);
    }
  } catch (err) {
    console.error(
      `Error fetching submission status for submissionId ${submissionId}:`,
      err,
    );
    res.status(500).json({ status: "error", message: "Failed to fetch submission status" });
  }
};

const enqueueSubmission = async ({ submission_id }) => {
  try {
    const message = submission_id;
    await publisher.pushToQueue(message);
  } catch (err) {
    console.error("Error adding submission to Kafka queue: ", err);
    throw err;
  }
};

export const submitCode = async (req, res) => {
  let fileURL = null; // Initialize fileURL to null to ensure it's defined in the catch block for cleanup if needed.
  try {
    /*
     *Before insterting submission we need to add file to storage and get the file URL and then add that URL to the submission details before inserting into database.
     *And store URL in database instead of code.
     *This is to avoid storing large code in database and also to make it easier to retrieve code for processing.
     */
    const { submission_id, code, language } = req.body;
    fileURL = await storageService.saveCode(submission_id, code, language);
    const submissionData = {
      ...req.body,
      code: fileURL,
    };
    // Insert submission into the database and get transaction.
    const dbResult = await DB.addToDB(submissionData);

    if (
      dbResult &&
      typeof dbResult.commit === "function" &&
      typeof dbResult.rollback === "function"
    ) {
      try {
        // Add submission to processing queue
        await enqueueSubmission({ submission_id });
        await dbResult.commit();
        res.status(201).json({
          submission_id,
          status: "success",
          message: "Submission added to queue",
        });
      } catch (err) {
        console.error("Error adding submission to submission queue: ", err);
        await dbResult.rollback();
        if (fileURL) {
          await storageService.deleteFile(fileURL); // Clean up the file from storage since the submission failed
        }
        res.status(500).json({ status: "error", message: "Failed to process submission" });
      }
    } else {
      // Handle unexpected return value
      console.error(
        "DB.addToDB did not return expected commit/rollback functions.",
      );
      if (fileURL) {
        await storageService.deleteFile(fileURL); // Clean up the file from storage since the submission failed
      }
      res.status(500).json({ status: "error", message: "Failed to process submission" });
    }
  } catch (err) {
    console.error("Error processing submission: ", err);
    if (fileURL) {
      await storageService.deleteFile(fileURL); // Clean up the file from storage since the submission failed
    }
    res.status(500).json({ status: "error", message: "Failed to process submission" });
  }
};
