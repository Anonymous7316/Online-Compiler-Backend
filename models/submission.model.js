import mongoose from 'mongoose';
import { submissionMongoSchema } from "../schemas/submission.schema.js";

export const SubmissionModel = mongoose.model('Submission', submissionMongoSchema);