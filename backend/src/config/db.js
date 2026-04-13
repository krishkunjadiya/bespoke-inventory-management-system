const mongoose = require("mongoose");
const env = require("./env");
const logger = require("./logger");

let memoryServer = null;

async function connectDb() {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    logger.info({ mongoUri: env.mongoUri }, "MongoDB connected");
  } catch (error) {
    const canFallback = env.nodeEnv === "development" && env.mongoAutoMemoryFallback;
    if (!canFallback) {
      throw error;
    }

    logger.warn(
      { err: error, mongoUri: env.mongoUri },
      "Primary MongoDB unavailable. Falling back to in-memory MongoDB for development"
    );

    const { MongoMemoryServer } = require("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create({ instance: { dbName: "inventory_saas" } });
    const memoryUri = memoryServer.getUri();

    await mongoose.connect(memoryUri);
    logger.info({ mongoUri: memoryUri }, "In-memory MongoDB connected");
  }
}

async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

process.on("SIGINT", async () => {
  await disconnectDb();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDb();
  process.exit(0);
});

module.exports = connectDb;
