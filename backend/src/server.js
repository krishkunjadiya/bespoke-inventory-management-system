const app = require("./app");
const env = require("./config/env");
const connectDb = require("./config/db");
const logger = require("./config/logger");
const { ensureDemoAdmin } = require("./common/utils/devBootstrap");

async function bootstrap() {
  try {
    await connectDb();
    await ensureDemoAdmin();
    app.listen(env.port, () => {
      logger.info(`Backend API running on port ${env.port}`);
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
}

bootstrap();
