import fsPromises from "fs/promises";
import path from "path";

class Logger {
    private filePath = path.resolve(__dirname, "../log.txt");

    public async logError(err: any): Promise<void> {
        const now = new Date();
        const msg = `${now.toLocaleString()}\n${err.message}\n${err.stack}\n-----------------------\n`;
        await fsPromises.appendFile(this.filePath, msg);
    }
}

export const logger = new Logger();