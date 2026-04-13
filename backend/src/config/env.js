const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory_saas",
  mongoAutoMemoryFallback:
    process.env.MONGO_AUTO_MEMORY_FALLBACK === undefined
      ? true
      : process.env.MONGO_AUTO_MEMORY_FALLBACK === "true",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret",
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  devBootstrapDemoAdmin:
    process.env.DEV_BOOTSTRAP_DEMO_ADMIN === undefined
      ? true
      : process.env.DEV_BOOTSTRAP_DEMO_ADMIN === "true",
  devDemoAdminName: process.env.DEV_DEMO_ADMIN_NAME || "Krish",
  devDemoAdminEmail: process.env.DEV_DEMO_ADMIN_EMAIL || "krish@gmail.com",
  devDemoAdminPassword: process.env.DEV_DEMO_ADMIN_PASSWORD || "krish@123",
  devDemoStoreId: process.env.DEV_DEMO_STORE_ID || "STORE_DEMO_001",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  logLevel: process.env.LOG_LEVEL || "info"
};

module.exports = env;
