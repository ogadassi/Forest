import { PrismaClient } from "@prisma/client";

// One instance for the whole app
const dal = new PrismaClient();

export default dal;