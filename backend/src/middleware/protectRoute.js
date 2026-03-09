import { requireAuth } from "@clerk/express";
import User from "../models/User.js";

// TEMPORARY BYPASS FOR TESTING - Set to true to disable auth
const DISABLE_AUTH = true;

export const protectRoute = [
  async (req, res, next) => {
    // Skip auth check if bypass is enabled
    if (DISABLE_AUTH) {
      // Create a mock user for testing
      req.user = {
        _id: "69a1868596ece77ace23225d",
        clerkId: "test_user_123",
        name: "Test User",
        email: "test@example.com"
      };
      return next();
    }

    // If not bypassed, use Clerk's requireAuth
    return requireAuth()(req, res, next);
  },
  async (req, res, next) => {
    // If we're already authenticated (either via bypass or requireAuth)
    if (req.user) return next();

    try {
      const clerkId = req.auth().userId;

      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      // find user in db by clerk ID
      const user = await User.findOne({ clerkId });

      if (!user) return res.status(404).json({ message: "User not found" });

      // attach user to req
      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
