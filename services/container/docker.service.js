import ContainerManager from "./containerManager.js";
import Docker from 'dockerode';
import { containerImages } from "./containerConfig.js";

class DockerService extends ContainerManager {
  constructor() {
    super();
    // Initialize Docker client or any necessary setup here
    this.docker = new Docker({
        socketPath: '/var/run/docker.sock'
    });
 }
    async startContainer(language) {
        // Implement logic to start a new Docker container
        console.log("Starting Docker container...");
        this.container = await this.docker.createContainer({
            Image: containerImages[language],
            Tty: true,
            HostConfig: {
                AutoRemove: true,
            }
        });
        await this.container.start();
        console.log(`Docker container started with ID ${this.container.id}`);
        return this.container.id;
    }
    async stopContainer(containerId) {
        // Implement logic to stop a Docker container by its ID
        console.log(`Stopping Docker container with ID ${containerId}...`);
        const container = this.docker.getContainer(containerId);
        await container.stop();
        console.log(`Docker container with ID ${containerId} stopped.`);
    }
    async getContainerStatus(containerId) {
        // Implement logic to get the status of a Docker container by its ID
        console.log(`Getting status of Docker container with ID ${containerId}...`);
        const container = this.docker.getContainer(containerId);
        const inspectData = await container.inspect();
        return inspectData.State.Status;
    }
    async executeCodeInContainer(containerId, code, language) {
        // Implement logic to execute code in a specified Docker container and return the output
        console.log(`Executing code in Docker container with ID ${containerId}...`);
        const container = this.docker.getContainer(containerId);
        // Here you would implement the logic to copy the code into the container, execute it based on the language, and capture the output.  
    }
    async removeContainer(containerId) {
        // Implement logic to remove a Docker container by its ID
        console.log(`Removing Docker container with ID ${containerId}...`);
        const container = this.docker.getContainer(containerId);
        await container.remove();
    }
}

export default DockerService;