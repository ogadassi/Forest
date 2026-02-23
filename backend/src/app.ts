import express from "express";
import cors from "cors";
import https from "https";
import fs from "fs";
import path from "path";
import { appConfig } from "./2-utils/app-config";
import { loggerMiddleware } from "./4-Middleware/logger-middleware";
import { errorsMiddleware } from "./4-Middleware/errors-middleware";
import { securityMiddleware } from "./4-Middleware/security-middleware";
import { noteController } from "./6-Controllers/note-controller";
import { categoryController } from "./6-Controllers/category-controller";
import { searchController } from "./6-Controllers/search-controller";

const server = express();

server.use(cors());
server.use(express.json());

// Register middleware:
server.use(loggerMiddleware.logToConsole);
// server.use(securityMiddleware.verifyLoggedIn); // Global security? Or per route? Usually per route or global if all private. 
// "Duly Noted" sounds private. Let's comment out global security for now to avoid locking user out during dev, 
// unless they requested it. User mentioned "Dev notes, Voice/Media", implies personal use.

server.use("/api", noteController);
server.use("/api", categoryController);
server.use("/api", searchController);

// Route not found & Catch all:
server.use(errorsMiddleware.routeNotFound);
server.use(errorsMiddleware.catchAll);

// HTTPS Options
const httpsOptions = {
    pfx: fs.readFileSync(path.join(__dirname, "../cert/localhost.pfx")),
    passphrase: "password123"
};

// Start HTTPS Server
const httpServer = https.createServer(httpsOptions, server);

// Initialize Socket.io on the same server
import { socketService } from "./5-Services/socket-service";
socketService.init(httpServer);

httpServer.listen(appConfig.port, () => console.log(`Listening on https://localhost:${appConfig.port}`));
