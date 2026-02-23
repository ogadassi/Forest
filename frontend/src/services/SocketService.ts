import { io, Socket } from "socket.io-client";

class SocketService {
    private socket: Socket | null = null;
    private listeners: Record<string, Function[]> = {};

    public connect(): void {
        if (this.socket) return; // Already connected

        // The Vite proxy handles routing `/socket.io` to the backend.
        // We connect to the current origin.
        this.socket = io({
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        this.socket.on("connect", () => {
            console.log("[SocketService] Connected to real-time updates");
        });

        this.socket.on("disconnect", () => {
            console.warn("[SocketService] Disconnected from real-time updates");
        });

        // Listen for specific business logic events
        this.socket.on("note-updated", (data) => this.trigger("note-updated", data));
        this.socket.on("category-updated", (data) => this.trigger("category-updated", data));
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Custom Event Emitter Logic for React Components to hook into
    public on(event: string, callback: Function): void {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    public off(event: string, callback: Function): void {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    private trigger(event: string, data?: any): void {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

export const socketService = new SocketService();
