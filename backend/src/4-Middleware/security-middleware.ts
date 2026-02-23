import { NextFunction, Request, Response } from "express";
import { cyber } from "../2-utils/cyber";
import { UnauthorizedError } from "../3-Models/client-errors";

class SecurityMiddleware {

    // Verify user logged in (authorization: "Bearer <the-token>"):
    //                                        01234567
    public verifyLoggedIn(request: Request, response: Response, next: NextFunction): void {

        // Get authorization header: 
        const authorizationHeader = request.header("authorization");

        // Get the token:
        const token = authorizationHeader?.substring(7); // 7 --> token index

        // If token not valid:
        if (!token || !cyber.isTokenValid(token)) {
            const err = new UnauthorizedError("You are not logged in.");
            next(err);
        }
        else {
            next();
        }

    }

    // Verify admin:
    public verifyAdmin(request: Request, response: Response, next: NextFunction): void {

        // Get authorization header: 
        const authorizationHeader = request.header("authorization");

        // Get the token:
        const token = authorizationHeader?.substring(7); // 7 --> token index

        // If user is not admin:
        if (!token || !cyber.isAdmin(token)) {
            const err = new UnauthorizedError("You are not authorized.");
            next(err);
        }
        else {
            next();
        }
    }

}

export const securityMiddleware = new SecurityMiddleware();
