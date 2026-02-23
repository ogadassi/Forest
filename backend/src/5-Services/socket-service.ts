import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "https";

class SocketService {
    private io: SocketIOServer | null = null;

    public init(server: HttpServer): void {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "*", // allow frontend access
                methods: ["GET", "POST", "PUT", "DELETE"]
            }
        });

        this.io.on("connection", (socket) => {
            console.log(`[Socket.io] Client connected: ${socket.id}`);

            socket.on("disconnect", () => {
                console.log(`[Socket.io] Client disconnected: ${socket.id}`);
            });
        });
    }

    public broadcast(event: string, data?: any): void {
        if (!this.io) {
            console.error("[Socket.io] Service not initialized, cannot broadcast event:", event);
            return;
        }
        this.io.emit(event, data);
    }
}

export const socketService = new SocketService();
