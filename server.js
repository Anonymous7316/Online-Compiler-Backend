import dotenv from 'dotenv';
import { app } from './app.js';
import { DatabaseService } from './config/database/databaseConfig.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const DB = DatabaseService[process.env.DB_TYPE]();

await DB.connectToDb().then(() => {
  console.log('Connected to the database successfully.');
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to connect to the database:', err);
});