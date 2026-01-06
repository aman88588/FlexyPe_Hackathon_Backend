// const mongoose = require("mongoose");

// /**
//  * Establish a MongoDB connection.
//  * Uses MONGODB_URI (production) or DEV_MONGODB_URI (local fallback).
//  */
// const connectToDB = async () => {
//   try {
//     const uri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;

//     if (!uri) {
//       throw new Error("Missing MONGODB_URI/DEV_MONGODB_URI");
//     }

//     mongoose.set("strictQuery", true);

//     await mongoose.connect(uri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log("✅ MongoDB connected");
//   } catch (error) {
//     console.error("MongoDB connection failed:", error.message);
//     process.exit(1);
//   }
// };

// /**
//  * Graceful shutdown
//  * Ensures DB connection is closed on app termination
//  */
// process.on("SIGINT", async () => {
//   await mongoose.connection.close();
//   console.log("🔌 MongoDB connection closed");
//   process.exit(0);
// });

// module.exports = {
//   connectToDB,
// };
// =================================
const mongoose  = require('mongoose');
require('dotenv').config();
// =================================

// ========= env config =============
const NODE_ENV = process.env.NODE_ENV;
const DEV_MONGODB_URI = process.env.DEV_MONGODB_URI;
// =================================


// ========= connect to db ==========
async function connectToDB() {
    try {
        if(!DEV_MONGODB_URI){
            throw new Error(`MongoDB URI is not found in .env file`);
        }
        const connection = await mongoose.connect(DEV_MONGODB_URI);
        console.log(`Database connected successfully - ${NODE_ENV} environment`);
        return connection;
    } catch (error) {
        console.error(`Error while connecting to db ${error}`);
        process.exit(1);
    }
};
// =================================

module.exports = {
    connectToDB
};