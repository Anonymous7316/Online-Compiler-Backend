import { QueueConsumerService } from "../queue/queueConfig.js";
import { DatabaseService } from "../../config/database/databaseConfig.js";
import { StorageService } from "../../services/storage/storageConfig.js";
import dotenv from 'dotenv';

dotenv.config({ path: "../../.env" });

const DB = DatabaseService[process.env.DB_TYPE]();
const storageService = StorageService[process.env.STORAGE_TYPE]();
const consumer = QueueConsumerService[process.env.QUEUE_TYPE](DB, storageService);

const startWorker = async () => {
    console.log("Submission worker started...");
    await consumer.pollAndProcess();
};

startWorker();