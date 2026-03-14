import DB from "./dbAbstract.js";
import sql from "mssql";
import dotenv from "dotenv";
import { statusSchema } from "../../schemas/status.schema.js";

dotenv.config();

class SQLDB extends DB {
  static instance;

  constructor() {
    if (SQLDB.instance) {
      return SQLDB.instance;
    }
    super();
    this.config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER_NAME,
      database: process.env.DB_NAME,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    };
    this.pool = null;
    SQLDB.instance = this;
  }
  connectToDb = async () => {
    try {
      if (this.pool) {
        return this.pool;
      }
      this.pool = await sql.connect(this.config, { timeout: 30000 }); // Increase the timeout to 30 seconds (30000ms)
      return this.pool;
    } catch (err) {
      console.error("Database connection failed: ", err);
      throw err;
    }
  };
  addToDB = async (submission) => {
    const SQL = await this.connectToDb();
    const transaction = SQL.transaction();
    try {
      await transaction.begin();
      await transaction
        .request()
        .input("submission_id", submission.submission_id)
        .input("submission_date", new Date())
        .input("code_language", submission.language)
        .input("code", submission.code).query(`INSERT INTO dbo.SubmissionDB 
                    (submission_id, submission_date, code_language, code) 
                    VALUES 
                    (@submission_id, @submission_date, @code_language, @code)
                `);

      await transaction
        .request()
        .input("submission_id", submission.submission_id)
        .input("status", "NEW").query(`INSERT INTO dbo.StatusDB
                    (submission_id, status) 
                    VALUES 
                    (@submission_id, @status)
                `);
      return {
        commit: () => transaction.commit(),
        rollback: () => transaction.rollback(),
      };
    } catch (err) {
      await transaction.rollback();
      console.error("Error adding submission to DB: ", err);
      throw err;
    }
  };

  getFromDB = async (submission_id) => {
    const SQL = await this.connectToDb();
    try {
      const request = SQL.request();
      const result = await request
        .input("submission_id", submission_id)
        .query(
          `SELECT * FROM dbo.SubmissionDB WHERE submission_id = @submission_id`,
        );
      return result.recordset[0] || null;
    } catch (err) {
      console.error("Error fetching submission from DB: ", err);
      throw err;
    }
  };

  setSubmissionStatus = async (submission_id, status) => {
    const SQL = await this.connectToDb();
    const transaction = SQL.transaction();
    try {
      await transaction.begin();
      await transaction
        .request()
        .input("submission_id", submission_id)
        .input("status", status)
        .query(
          `UPDATE dbo.StatusDB SET status = @status WHERE submission_id = @submission_id`,
        );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error("Error updating submission status: ", err);
      throw err;
    }
  };

  getSubmissionStatus = async (submission_id) => {
    const SQL = await this.connectToDb();
    try {
      const request = SQL.request();
      const result = await request
        .input("submission_id", submission_id)
        .query(
          `SELECT status FROM dbo.StatusDB WHERE submission_id = @submission_id`,
        );
      if (result.recordset.length === 0) {
        return { error: "Submission ID not found" };
      }
      const { error } = statusSchema.validate({
        submission_id,
        status: result.recordset[0].status,
      });
      if (error) {
        throw new Error(
          `Invalid data format for submission status: ${error.message}`,
        );
      }
      return { id: submission_id, status: result.recordset[0].status };
    } catch (err) {
      throw err;
    }
  };
}

export default SQLDB;
