import joi from 'joi';

export const statusSchema = joi.object({
    submission_id: joi.string().uuid({version: 'uuidv7'}).required(),
    status: joi.string().valid('NEW', 'RUNNING', 'COMPLETED', 'ERROR').required(),
});