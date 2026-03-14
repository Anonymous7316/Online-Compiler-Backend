import StorageManager from "./storageManager.js";
import { PasteClient, Publicity, ExpireDate } from "pastebin-api";
import dotenv from "dotenv";

dotenv.config();

class PastebinManager extends StorageManager {
  static instance;

  constructor() {
    if (PastebinManager.instance) {
      return PastebinManager.instance;
    }
    super();
    PastebinManager.instance = this;
  }

  async ensureConnected() {
    if (!this.client) {
      await this.connect();
    }
  }

  async connect() {
    // Implement logic to connect to Pastebin API if necessary (e.g., for authentication)
    this.client = new PasteClient(process.env.PASTEBIN_API_KEY);
    this.token = await this.client.login({
      name: process.env.PASTEBIN_USERNAME,
      password: process.env.PASTEBIN_PASSWORD,
    });
  }

  async createFile(submission_id, code, format) {
    // Implement logic to create a new paste on Pastebin with the given code and return the paste URL or ID
    await this.ensureConnected();
    try {
      const fileURL = await this.client.createPaste({
        code,
        expireDate: ExpireDate.Never,
        format,
        name: `${submission_id}`,
        publicity: Publicity.Unlisted,
      });
      return fileURL;
    } catch (error) {
      console.error("Error saving file:", error);
      throw error;
    }
  }

  async updateFile(submission_id, code) {
    // Since Pastebin does not support updating existing pastes, we will delete the old paste and create a new one with the updated code. This is a workaround to achieve the update functionality.
  }
  async saveCode(submission_id, code, format, url = "") {
    // Since Pastebin does not support updating existing pastes, we will delete the old paste and create a new one with the updated code. This is a workaround to achieve the update functionality.
    await this.ensureConnected();
    try {
      const fileURL = await this.createFile(submission_id, code, format);
      if (url) {
        await this.deleteFile(url);
      }
      return fileURL;
    } catch (error) {
      console.error("Error saving code:", error);
      throw error;
    }
  }

  async getCode(url) {
    try {
      const key = url.split("/").pop();
      const rawUrl = `https://pastebin.com/raw/${key}`;
      
      const response = await fetch(rawUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const code = await response.text();
      console.log("✅ Successfully fetched");
      return code;
    } catch (error) {
      console.error("Error fetching raw paste:", error);
      throw error;
    }
  }


  async deleteFile(url) {
    // Implement logic to delete code from Pastebin using the paste URL or ID
    await this.ensureConnected();
    try {
      const deleted = await this.client.deletePasteByKey({
        userKey: this.token,
        pasteKey: url.split("/").pop(),
      });
      return deleted;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }
}

export default PastebinManager;
