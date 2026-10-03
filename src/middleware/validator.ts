import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "validation_error",
          message: "Invalid request payload parameters",
          issues: error.issues.map((issue) => ({
            field: issue.path.join("."),
            rule: issue.code,
            message: issue.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
