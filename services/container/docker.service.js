import ContainerManager from "./containerManager.js";
import Docker from "dockerode";
import {
  containerImages,
  fileExtensions,
  executionCommands,
} from "./containerConfig.js";

class DockerService extends ContainerManager {
  constructor() {
    super();
    // Initialize Docker client or any necessary setup here
    this.docker = new Docker({ socketPath: "/var/run/docker.sock" });
  }

  async startContainer(language) {
    // Implement logic to start a new Docker container
    console.log("Starting Docker container...");
    this.container = await this.docker.createContainer({
      Image: containerImages[language], // Assuming you have pre-built images for each language
      Tty: true,
      name: language + "_container_" + Date.now(), // Unique name for the container
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: false,
      StdinOnce: false,
    });
    await this.container.start();
    console.log(`Docker container started with ID ${this.container.id}`);
    return this.container.id;
  }

  async getContainerStatus(containerId) {
    // Implement logic to get the status of a Docker container by its ID
    console.log(`Getting status of Docker container with ID ${containerId}...`);
    const container = this.docker.getContainer(containerId);
    const inspectData = await container.inspect();
    return inspectData.State.Status;
  }

  getExecutionCommand(filename, language) {
    return executionCommands[language](filename);
  }

  async executeCode(code, language, submission_id) {
    // Implement logic to execute code in a Docker container and capture the output and status
    const EXECUTION_TIMEOUT = 30000; // 30 seconds timeout
    
    const containerId = await this.startContainer(language);
    const container = this.docker.getContainer(containerId);
    const fileName = `${submission_id}.${fileExtensions[language]}`;
    
    // Sanitize code to prevent shell injection
    // Use base64 encoding to safely pass code to the container
    const sanitizedCode = Buffer.from(code).toString('base64');
    
    // Create /code directory and write file using base64 decode (prevents injection)
    const createDirCmd = `mkdir -p /code`;
    const writeFileCmd = `echo "${sanitizedCode}" | base64 -d > /code/${fileName}`;
    const chmodCmd = `chmod +x /code/${fileName}`;
    const execCmd = this.getExecutionCommand(fileName, language);
    
    const fullCommand = `${createDirCmd} && ${writeFileCmd} && ${chmodCmd} && cd /code && ${execCmd}`;
    
    return new Promise(async (resolve, reject) => {
      let output = "";
      let timeoutId;
      
      // Set timeout to reject promise if execution takes too long
      timeoutId = setTimeout(async () => {
        console.log(`Execution timed out for submission ${submission_id}`);
        try {
          await this.stopContainer(containerId);
          await this.removeContainer(containerId);
        } catch (e) {
          // Ignore cleanup errors
        }
        reject(new Error(`Execution timed out after ${EXECUTION_TIMEOUT / 1000} seconds`));
      }, EXECUTION_TIMEOUT);
      
      container.exec({
        Cmd: ["sh", "-c", fullCommand],
        AttachStdout: true,
        AttachStderr: true,
      }, (err, exec) => {
        if (err) {
          clearTimeout(timeoutId);
          reject(new Error(`Failed to create exec: ${err.message}`));
          return;
        }
        
        exec.start({ hijack: true, stdin: false }, (err, stream) => {
          if (err) {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to start exec: ${err.message}`));
            return;
          }
          
          stream.on("data", (chunk) => {
            output += chunk.toString();
          });
          
          stream.on("end", async () => {
            clearTimeout(timeoutId);
            console.log("Execution completed. Stopping and removing container...");
            await this.stopContainer(containerId);
            await this.removeContainer(containerId);
            resolve(output);
          });
        });
      });
    });
  }

  async stopContainer(containerId) {
    // Implement logic to stop a Docker container by its ID
    console.log(`Stopping Docker container with ID ${containerId}...`);
    const container = this.docker.getContainer(containerId);
    await container.stop();
    console.log(`Docker container with ID ${containerId} stopped.`);
  }

  async removeContainer(containerId) {
    // Implement logic to remove a Docker container by its ID
    console.log(`Removing Docker container with ID ${containerId}...`);
    const container = this.docker.getContainer(containerId);
    await container.remove();
    console.log(`Docker container with ID ${containerId} removed.`);
  }
}

export default DockerService;
