import { chatClient, isStreamEnabled } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    // Check if Stream is enabled
    if (!isStreamEnabled() || !chatClient) {
      return res.status(503).json({ 
        message: "Stream chat is not available. Please configure valid Stream API credentials." 
      });
    }

    // use clerkId for Stream (not mongodb _id)=> it should match the id we have in the stream dashboard
    const token = chatClient.createToken(req.user.clerkId);

    res.status(200).json({
      token,
      userId: req.user.clerkId,
      userName: req.user.name,
      userImage: req.user.image,
    });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
