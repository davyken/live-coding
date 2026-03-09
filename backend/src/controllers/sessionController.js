import { chatClient, streamClient, isStreamEnabled } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res.status(400).json({ message: "Problem and difficulty are required" });
    }

    // generate a unique call id for stream video
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // create session in db
    const session = await Session.create({ problem, difficulty, host: userId, callId });

    // Try to create Stream video call (graceful failure)
    let streamCreated = false;
    if (isStreamEnabled()) {
      try {
        await streamClient.video.call("default", callId).getOrCreate({
          data: {
            created_by_id: clerkId,
            custom: { problem, difficulty, sessionId: session._id.toString() },
          },
        });
        streamCreated = true;
      } catch (streamError) {
        console.log("Stream video call creation failed:", streamError.message);
      }
    }

    // Try to create chat channel (graceful failure)
    let chatCreated = false;
    if (isStreamEnabled()) {
      try {
        const channel = chatClient.channel("messaging", callId, {
          name: `${problem} Session`,
          created_by_id: clerkId,
          members: [clerkId],
        });

        await channel.create();
        chatCreated = true;
      } catch (chatError) {
        console.log("Stream chat channel creation failed:", chatError.message);
      }
    }

    // Return session info - caller should handle case where Stream is not available
    res.status(201).json({ 
      session, 
      streamEnabled: streamCreated,
      chatEnabled: chatCreated 
    });
  } catch (error) {
    console.log("Error in createSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getActiveSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    // get sessions where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in getSessionById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    // TEMPORARY BYPASS FOR TESTING - Allow any user to join
    // In production, remove this bypass
    const TESTING_BYPASS = true;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "active") {
      return res.status(400).json({ message: "Cannot join a completed session" });
    }

    // Skip host check for testing
    if (!TESTING_BYPASS && session.host.toString() === userId.toString()) {
      return res.status(400).json({ message: "Host cannot join their own session as participant" });
    }

    // check if session is already full - has a participant
    if (session.participant) {
      // If the user is already the participant, just return success
      const participantId = session.participant.toString();
      if (participantId === userId.toString() || TESTING_BYPASS) {
        return res.status(200).json({ session, message: "Already joined this session" });
      }
      return res.status(409).json({ message: "Session is full" });
    }

    // For testing, create a mock participant if using bypass
    if (TESTING_BYPASS) {
      // Create a test user in DB if not exists
      const User = (await import("../models/User.js")).default;
      let participant = await User.findOne({ clerkId });
      
      if (!participant) {
        participant = await User.create({
          name: "Test Participant",
          email: "participant@test.com",
          clerkId: clerkId,
          profileImage: ""
        });
      }
      
      session.participant = participant._id;
    } else {
      session.participant = userId;
    }
    
    await session.save();

    // Try to add member to chat channel
    if (isStreamEnabled() && chatClient) {
      try {
        const channel = chatClient.channel("messaging", session.callId);
        await channel.addMembers([clerkId]);
      } catch (chatError) {
        console.log("Stream chat addMembers failed:", chatError.message);
      }
    }

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in joinSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    // check if user is the host
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can end the session" });
    }

    // check if session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
    }

    // Try to delete Stream video call (graceful failure)
    if (isStreamEnabled()) {
      try {
        const call = streamClient.video.call("default", session.callId);
        await call.delete({ hard: true });
      } catch (streamError) {
        console.log("Stream video call deletion failed:", streamError.message);
      }
    }

    // Try to delete Stream chat channel (graceful failure)
    if (isStreamEnabled()) {
      try {
        const channel = chatClient.channel("messaging", session.callId);
        await channel.delete();
      } catch (chatError) {
        console.log("Stream chat channel deletion failed:", chatError.message);
      }
    }

    session.status = "completed";
    await session.save();

    res.status(200).json({ session, message: "Session ended successfully" });
  } catch (error) {
    console.log("Error in endSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
