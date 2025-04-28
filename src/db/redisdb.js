import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

redis.on("connect", () => {
  console.log(`Connected to Redis on port ${process.env.REDIS_PORT}`);
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default redis;
