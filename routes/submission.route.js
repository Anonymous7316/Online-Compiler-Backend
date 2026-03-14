import express from 'express';
import { submitCode } from '../controllers/submission.controller.js';
import { validateSubmission } from '../middlewares/submission.middleware.js';
import { getSubmissionStatus } from '../controllers/submission.controller.js';

const SubmissionRouter = express.Router();

SubmissionRouter.get('/:id', getSubmissionStatus).post('/', validateSubmission, submitCode);

export default SubmissionRouter;