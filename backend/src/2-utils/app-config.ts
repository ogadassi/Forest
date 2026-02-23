import dotenv from "dotenv";

// Load ".env" file into process.env object:
dotenv.config();

class AppConfig {
    public readonly isDevelopment = process.env.ENVIRONMENT === "development";
    public readonly isProduction = process.env.ENVIRONMENT === "production";
    public readonly port = process.env.PORT || 3001;

    // We only need the one URL for Prisma/Postgres
    public readonly databaseUrl = process.env.DATABASE_URL;

    // Keep these if you plan to use them later for auth/images
    public readonly jwtSecretKey = process.env.JWT_SECRET_KEY || "default-secret-key";
    public readonly passwordSalt = process.env.PASSWORD_SALT || "default-password-salt";
    public readonly baseImageUrl = process.env.BASE_IMAGE_URL || "";
}

export const appConfig = new AppConfig();