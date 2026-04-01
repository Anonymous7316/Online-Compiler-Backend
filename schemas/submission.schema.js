import joi from 'joi';
import mongoose from 'mongoose';

export const  submissionSchema = joi.object({
    submission_id: joi.string().uuid({version: 'uuidv7'}).required(),
    code: joi.string().required(),
    language: joi.string().valid('python', 'javascript', 'java','cpp','ruby','go').required()
});

export const submissionMongoSchema = new mongoose.Schema(
  {
    submission_id: { type: String, required: true, unique: true },
    submission_date: { type: Date, default: Date.now },
    code_language: { type: String, required: true },
    code: { type: String, required: true }
  },
  { collection: 'submissions' }
);