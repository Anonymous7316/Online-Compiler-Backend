import dotenv from "dotenv";
import SQLDB from "./sqlDB.js";
import MongoDB from "./mongoDB.js";

dotenv.config();

export const DatabaseService = {
    // Factory function to create a new database instance based on the configured DB_TYPE. This allows for easy switching between different database implementations in the future if needed.
    mssql: ()=> new SQLDB(),
    mongo: ()=> new MongoDB(),
}