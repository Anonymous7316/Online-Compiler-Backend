import joi from 'joi';
import mongoose from 'mongoose';

export const statusSchema = joi.object({
    submission_id: joi.string().uuid({version: 'uuidv7'}).required(),
    status: joi.string().valid('NEW', 'RUNNING', 'COMPLETED', 'ERROR').required(),
});

export const statusMongoSchema = new mongoose.Schema(
  {
    submission_id: { type: String, required: true, unique: true },
    status: { type: String, enum: ['NEW', 'RUNNING', 'COMPLETED', 'ERROR'], default: 'NEW' }
  },
  { collection: 'statuses' }
);