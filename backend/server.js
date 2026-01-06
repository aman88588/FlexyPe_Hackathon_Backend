// ============ Imports ============
const path = require("path");
const express = require("express");
require("dotenv").config();
const cors = require("cors");

const v1Router = require("./src/routers/v1/v1.router");
const {
  RequestLoggerMiddleware,
} = require("./src/middlewares/requestlogger.middleware");
const { connectToDB } = require("./src/db/db.connect");
const { clearAllLocks } = require("./src/utils/lock.util");
const {
  cleanupExpiredReservations,
  scheduleExpiryCleanup,
} = require("./src/utils/expiry.util");
// =================================

// ========== ENVIRONMENT VARIABLES ==========
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
// =========================================

// ============ Server ============
const server = express();

server.use(express.json());
server.use(RequestLoggerMiddleware);
server.use(cors());

// ============ Static Frontend ============
const frontendDir = path.join(__dirname, "frontend");
server.use(express.static(frontendDir));
// =========================================

// ============ Routes ============
server.use("/api/v1", v1Router);
// ================================

// Serve index.html for root
server.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

// ============ Graceful Shutdown ============
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down server...");
  clearAllLocks(); // ✅ release in-memory locks
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 Server terminated");
  clearAllLocks(); // ✅ release in-memory locks
  process.exit(0);
});
// ==========================================

// ============ Start Server ============
async function startServer() {
  try {
    await connectToDB();
    // Kick off expiry cleanup loop (best-effort, safe on restart)
    await cleanupExpiredReservations();
    scheduleExpiryCleanup();

    server.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} | environment: ${NODE_ENV}`
      );
    });
  } catch (error) {
    console.error("❌ Error while starting the server:", error);
  }
}

startServer();
// ================================
