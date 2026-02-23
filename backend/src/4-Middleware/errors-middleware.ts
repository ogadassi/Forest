import { NextFunction, Request, Response } from "express";
import { StatusCode } from "../3-Models/enums";
import { RouteNotFoundError } from "../3-Models/client-errors";
import { logger } from "../2-utils/logger";
import { appConfig } from "../2-utils/app-config";

class ErrorsMiddleware {

    // Route not found (404):
    public routeNotFound(request: Request, response: Response, next: NextFunction): void {
        const err = new RouteNotFoundError(request.originalUrl);
        next(err);
    }

    // Catch-all Error Handler: 
    public catchAll(err: any, request: Request, response: Response, next: NextFunction): void {

        // Log to console for you (the dev)
        console.log(err);

        // Log to file for the "Details Guy" history
        if (logger) logger.logError(err);

        const status = err.status || StatusCode.InternalServerError;

        // Security check: Don't show technical db errors in production
        const message = (status === StatusCode.InternalServerError && appConfig.isProduction)
            ? "Some error, please try again later."
            : err.message;

        response.status(status).send(message);
    }
}

export const errorsMiddleware = new ErrorsMiddleware();