import mongoose from "mongoose";

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig();

  // Guard: prevent duplicate connections on hot-reload
  if (mongoose.connection.readyState === 1) {
    console.log("[mongoose] reusing existing connection");
    return;
  }

  try {
    await mongoose.connect(config.mongoUri);
    console.log("[mongoose] connected");
  } catch (err) {
    console.error("[mongoose] connection failed", err);
    throw err;
  }
});
