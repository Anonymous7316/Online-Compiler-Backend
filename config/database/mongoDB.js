import DB from "./dbAbstract.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { statusSchema } from "../../schemas/status.schema.js";
import { SubmissionModel } from "../../models/submission.model.js";
import { StatusModel } from "../../models/status.model.js";

dotenv.config();

class MongoDB extends DB {
  static instance;

  constructor() {
    if (MongoDB.instance) {
      return MongoDB.instance;
    }
    super();
    this.pool = null;
    MongoDB.instance = this;
  }

  connectToDb = async () => {
    try {
      if (this.pool) {
        return this.pool;
      }
      this.pool = await mongoose.connect(process.env.MONGO_URI, {
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PASSWORD,
        dbName: process.env.MONGO_DB,
        appName: process.env.MONGO_APP_NAME
      });
      return this.pool;
    } catch (err) {
      console.error("Database connection failed: ", err);
      throw err;
    }
  };

  addToDB = async (submission) => {
    await this.connectToDb();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Insert submission document
      await SubmissionModel.create(
        [
          {
            submission_id: submission.submission_id,
            submission_date: new Date(),
            code_language: submission.language,
            code: submission.code
          }
        ],
        { session }
      );

      // Insert initial status "NEW"
      await StatusModel.create(
        [
          {
            submission_id: submission.submission_id,
            status: 'NEW'
          }
        ],
        { session }
      );

      return {
        commit: async () => {
          await session.commitTransaction();
          session.endSession();
        },
        rollback: async () => {
          await session.abortTransaction();
          session.endSession();
        }
      };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error adding submission to DB: ", err);
      throw err;
    }
  };

  getFromDB = async (submission_id) => {
    await this.connectToDb();
    try {
      const submission = await SubmissionModel.findOne({ submission_id });
      return submission ? submission.toObject() : null;
    } catch (err) {
      console.error("Error fetching submission from DB: ", err);
      throw err;
    }
  };

  setSubmissionStatus = async (submission_id, status) => {
    await this.connectToDb();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await StatusModel.updateOne(
        { submission_id },
        { status },
        { session }
      );
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      console.error("Error updating submission status: ", err);
      throw err;
    } finally {
      session.endSession();
    }
  };

  getSubmissionStatus = async (submission_id) => {
    await this.connectToDb();
    try {
      const statusDoc = await StatusModel.findOne({ submission_id });

      if (!statusDoc) {
        return { error: "Submission ID not found" };
      }

      const { error } = statusSchema.validate({
        submission_id,
        status: statusDoc.status
      });

      if (error) {
        throw new Error(
          `Invalid data format for submission status: ${error.message}`
        );
      }

      return { id: submission_id, status: statusDoc.status };
    } catch (err) {
      throw err;
    }
  };
}

export default MongoDB;