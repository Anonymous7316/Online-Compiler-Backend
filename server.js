import dotenv from 'dotenv';
import { app } from './app.js';
import { createServer } from 'http';
import { connectToSocketServer } from './sockets/server.socket.js';
import { DatabaseService } from './config/database/databaseConfig.js';

dotenv.config();

const PORT = process.env.PORT;

const DB = DatabaseService[process.env.DB_TYPE]();

const httpServer = createServer(app);

// Initialize WebSocket server
connectToSocketServer(httpServer);

await DB.connectToDb().then(() => {
  console.log('Connected to the database successfully.');
  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to connect to the database:', err);
});