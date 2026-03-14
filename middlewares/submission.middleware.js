import { submissionSchema } from "../schemas/submission.schema.js";

export const validateSubmission = (req, res, next)=>{
    const {error} = submissionSchema.validate(req.body);
    if(error){
        return res.status(400).json({error: error.details[0].message});
    }
    next();
}