import dotenv from 'dotenv';
import SQLDB from './config/database/sqlDB.js';
import { app } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const DB = process.env.DB_TYPE === 'mssql' ? new SQLDB() : null;

await DB.connectToDb().then(() => {
  console.log('Connected to the database successfully.');
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to connect to the database:', err);
});