// NOTE: we can name this file createDatabase.ts instead of mongoose.ts
import mongoose from "mongoose";

let isConnected: boolean = false;

export async function connectToDatabase() {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URL) {
    return console.log("MISSING MONGODB_URL");
  }

  if (isConnected) {
    return console.log("MongoDB is already connected");
  }

  // CONNECTING TO OUR MONGODB DATABASE
  try {
    console.log(process.env.MONGODB_URL);
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: "dev-flow",
    });

    isConnected = true;
    console.log("MONGODB is connected");
  } catch (error) {
    console.log("MongoDB connection failed", error);
  }
}
