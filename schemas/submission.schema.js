import joi from 'joi';

export const  submissionSchema = joi.object({
    submission_id: joi.string().uuid({version: 'uuidv7'}).required(),
    code: joi.string().required(),
    language: joi.string().valid('python', 'javascript', 'java','cpp','ruby','go').required()
});