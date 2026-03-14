class StorageManager{

    async connect() {
        throw new Error("connect() method must be implemented by subclass");
    }

    async createFile(submission_id, code){
        throw new Error("createFile() method must be implemented by subclass");
    }

    async updateFile(submission_id, code){
        throw new Error("updateFile() method must be implemented by subclass");
    }

    async saveCode(submission_id, code) {
        throw new Error("saveCode() method must be implemented by subclass");
    }

    async getCode(submission_id) {
        throw new Error("getCode() method must be implemented by subclass");
    }

    async deleteFile(submission_id) {
        throw new Error("deleteFile() method must be implemented by subclass");
    }
}

export default StorageManager;