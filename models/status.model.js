import mongoose from 'mongoose';
import { statusMongoSchema } from "../schemas/status.schema.js";

export const StatusModel = mongoose.model('Status', statusMongoSchema);