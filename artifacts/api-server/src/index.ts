import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
const nodeEnv = process.env["NODE_ENV"] ?? "development";

if (!rawPort) {
  console.error(
    "\n" +
    "================================================================\n" +
    "FATAL: PORT environment variable is not set.\n" +
    "On Render this is provided automatically — do not set it manually.\n" +
    "================================================================\n"
  );
  process.exit(1);
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  console.error(`FATAL: Invalid PORT value: "${rawPort}"`);
  process.exit(1);
}

// Log startup config (no secrets)
console.log(`[startup] NODE_ENV=${nodeEnv}`);
console.log(`[startup] PORT=${port}`);
console.log(`[startup] DATABASE_URL=${process.env["DATABASE_URL"] ? "set" : "MISSING ← this will crash"}`);
console.log(`[startup] JWT_SECRET=${process.env["JWT_SECRET"] ? "set" : "using default (insecure)"}`);

// Bind to 0.0.0.0 explicitly — required for Render / Docker containers
app.listen(port, "0.0.0.0", (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port, host: "0.0.0.0", env: nodeEnv }, "Server listening");
});
