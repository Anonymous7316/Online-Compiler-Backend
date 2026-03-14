import express from 'express';
import cors from 'cors';
import SubmissionRouter from './routes/submission.route.js';
import healthCheckRouter from './routes/ping.route.js';
import authRouter from './routes/auth.route.js';
import { loggingMiddleware } from './middlewares/logging.middleware.js';
import { errorHandlingMiddleware } from './middlewares/error.middleware.js';

export const app = express();

app.use(express.json());
app.use(cors());
// Add a middleware to log incoming requests for debugging purposes with timestamps
app.use(loggingMiddleware);

app.use('/api/v1/ping', healthCheckRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/submission', SubmissionRouter);

// Global error handling middleware
app.use(errorHandlingMiddleware);