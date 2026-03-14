import dotenv from "dotenv";
import PastebinManager from "./pastebinManager.js";

dotenv.config();

export const StorageService = {
  // Factory function to create a new storage service instance based on the configured STORAGE_TYPE. This allows for easy switching between different storage implementations in the future if needed.
  pastebin: () => new PastebinManager(),
};
