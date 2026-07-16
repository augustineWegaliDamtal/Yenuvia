import User from '../models/userModel.js';
import Work from '../models/Work.js';
import { errorHandler } from '../utils/error.js';
import School from '../models/School.js';
import mongoose from 'mongoose';
import Notification from '../models/notificationModel.js';


import { getIO } from '../socket/socketManager.js';


export const uploadWork = async (req, res, next) => {
  try {
    let { title, description, category, school, mediaFiles, isForSale, price, condition, matchId, selectedMatchId } = req.body;
    const artistId = req.user._id; 
    const artistName = req.user.username;

    // 1. Safe parsing if mediaFiles arrives as a JSON string (common with FormData)
    if (typeof mediaFiles === 'string') {
      try {
        mediaFiles = JSON.parse(mediaFiles);
      } catch (e) {
        return next(errorHandler(400, "Invalid mediaFiles format sent to server"));
      }
    }

    if (!title || !description || !category || !mediaFiles?.length) {
      return next(errorHandler(400, "The Arena requires a title, story, and visuals!"));
    }

    // 2. Extract and sanitize matchId (handling both key names & casting to Mongo ObjectId)
    const rawMatchId = matchId || selectedMatchId;
    let validMatchId = null;
    if (rawMatchId && rawMatchId !== "null" && rawMatchId !== "undefined" && rawMatchId !== "") {
      validMatchId = mongoose.Types.ObjectId.isValid(rawMatchId) 
        ? new mongoose.Types.ObjectId(rawMatchId) 
        : rawMatchId;
    }

    // 3. Auto-detect video type if not explicitly set
    let workType = "image";
    if (mediaFiles.length > 1) {
      workType = "carousel";
    } else if (mediaFiles.length === 1) {
      const firstFile = mediaFiles[0];
      const url = firstFile.mediaUrl || "";
      const isVideoFile = firstFile.type === "video" || url.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i);
      workType = isVideoFile ? "video" : (firstFile.type || "image");
    }

    const sanitizeSchool = (name) => {
      if (!name) return null;
      return name
        .trim()
        .replace(/[^\w\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    };

    const sanitizedSchoolName = category === "school" ? sanitizeSchool(school) : null;

    const newWork = new Work({
      title: title.trim(),
      description: description.trim(),
      mediaUrls: mediaFiles.map(file => file.mediaUrl),
      type: workType, 
      category,
      school: sanitizedSchoolName,
      artistId: artistId,
      artistName: artistName,
      status: "pending",
      views: 0, likes: 0, comments: 0,

      isForSale: isForSale === true || isForSale === "true",
      price: (isForSale === true || isForSale === "true") ? Number(price) : 0,
      condition: (isForSale === true || isForSale === "true") ? (condition || "Original") : "Original",
      isSold: false,

      matchId: validMatchId,
    });

    const savedWork = await newWork.save();
console.log("📥 UPLOAD PAYLOAD RECEIVED:", req.body);
    if (category === "school" && sanitizedSchoolName) {
      await School.findOneAndUpdate(
        { name: sanitizedSchoolName },
        { 
          $inc: { totalPoints: 5 }, 
          $addToSet: { members: artistId } 
        },
        { upsert: true }
      );
    }

    const populatedWork = await Work.findById(savedWork._id)
      .populate("artistId", "username avatar verified school");

    // 4. Real-time socket emissions to refresh Admin Review Rooms immediately
    const io = getIO();
    
    // Broadcast to admins_room
    io.to("admins_room").emit("newWorkSubmitted", {
      message: `New Drop from @${artistName}: ${title}`,
      work: populatedWork
    });

    // Broadcast global draft events for match/tournament rooms
    if (validMatchId) {
      io.emit("new_match_draft", { matchId: validMatchId, work: populatedWork });
    }
    io.emit("work_updated", populatedWork);

    res.status(201).json({ 
      success: true, 
      message: validMatchId ? "Draft Submitted! Awaiting Superadmin selection." : "Deployed! Awaiting Arena Moderation.", 
      work: populatedWork 
    });
  } catch (error) {
    console.error("🚨 UPLOAD WORK ERROR:", error);
    next(error);
  }
}; 


export const deleteWork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const work = await Work.findById(id);
    if (!work) return next(errorHandler(404, 'Work not found'));

    if (work.artistId.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
      return next(errorHandler(403, 'Unauthorized deletion attempt'));
    }

    await Work.findByIdAndDelete(id);

   
    const io = getIO();
    io.emit("work_removed_from_feed", { workId: id });
    io.emit("work_deleted", id);
    res.status(200).json({ success: true, message: 'Work deleted successfully' });
  } catch (error) {
    next(error);
  }
};


export const approveWork = async (req, res, next) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) return next(errorHandler(403, 'Admin only'));

    const { id } = req.params;
    const { destination } = req.body; 

    const work = await Work.findById(id).populate("artistId", "username avatar verified school");
    if (!work) return next(errorHandler(404, 'Work not found'));

    if (destination === 'billboard') {
      const count = await Work.countDocuments({ status: "billboard" });
      if (count >= 10) return next(errorHandler(400, "Billboard is full!"));
      work.status = 'billboard';
      work.billboardEligible = true;
      work.feedEligible = true;
    } else {
      work.status = 'approved';
      work.feedEligible = true;
      work.billboardEligible = false;
    }

    if (work.mediaUrls) work.mediaUrls = work.mediaUrls.map(url => url.replace(/\\/g, '/'));

    work.moderatedBy = req.user._id;
    work.moderatedAt = new Date();
    await work.save();

    await Notification.create({
      recipient: work.artistId._id,
      sender: req.user._id, 
      type: "approval",
      message: `Your work "${work.title}" is now LIVE on the ${destination}!`,
      relatedWork: work._id
    });

const io = getIO();
    
    const artistRoom = work.artistId._id.toString();


    io.to(artistRoom).emit("newNotification", { 
      message: `Your work "${work.title}" is now LIVE on the ${destination}!`,
      type: "approval",
      relatedWork: { _id: work._id }
    });

    
    io.to(artistRoom).emit("work_approved", {
      message: `Your work "${work.title}" is now LIVE on the ${destination}!`
    });

    
    io.emit("new_global_feed_item", {
      destination: destination,
      work: work
    });
    io.emit("work_updated", work);
    res.status(200).json({ success: true, message: `Approved to ${destination}`, work });

  } catch (error) {
    next(error);
  }
};


export const rejectWork = async (req, res, next) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) return next(errorHandler(403, 'Admin only'));
    const { id } = req.params;
    const { reason } = req.body;

    const work = await Work.findById(id);
    if (!work) return next(errorHandler(404, 'Work not found'));

    work.status = 'rejected';
    work.rejectionReason = reason || 'No reason provided';
    work.moderatedBy = req.user._id;
    work.moderatedAt = new Date();
    await work.save();

    const io = getIO();
    
    const artistRoom = work.artistId.toString();

    io.to(artistRoom).emit("newNotification", {
      message: `Your work "${work.title}" was rejected: ${reason}`,
      type: "rejection",
      title: work.title
    });

   
    io.to(artistRoom).emit("work_rejected", {
      message: `Your work "${work.title}" was rejected: ${reason}`
    });

    res.status(200).json({ success: true, message: 'Work rejected', work });
  } catch (error) {
    next(error);
  }
};


export const removeWork = async (req, res, next) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) return next(errorHandler(403, 'Admin only'));
    const { id } = req.params;
    const work = await Work.findById(id);
    if (!work) return next(errorHandler(404, 'Work not found'));

    work.status = 'removed';
    work.moderatedBy = req.user._id;
    work.moderatedAt = new Date();
    await work.save();

    const io = getIO();
    
 
    io.to(work.artistId.toString()).emit("newNotification", {
      message: `Your work "${work.title}" was removed from the Arena by a moderator.`,
      type: "removed",
      title: work.title
    });

    
    io.emit("work_removed_from_feed", { workId: work._id });
    io.emit("work_deleted", work._id);
    res.status(200).json({ success: true, message: 'Work removed', work });
  } catch (error) {
    next(error);
  }
};


export const getUserWorks = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const { tab } = req.query; 

    if (!id) return next(errorHandler(400, "Artist ID is required"));
    const objectId = new mongoose.Types.ObjectId(id);

    let query = { artistId: objectId };

    if (tab === "shop") {
      query.isForSale = true;
    } else {
      query.isForSale = { $ne: true }; 
    }

    const isOwner = req.user && req.user._id.toString() === id;
    if (!isOwner) {
      query.status = { $in: ["approved", "billboard"] };
    }

    const works = await Work.find(query)
      .sort({ createdAt: -1 })
      .populate("artistId", "username avatar verified school paystackSubaccountCode");

    res.status(200).json({ 
      success: true, 
      count: works.length, 
      works 
    });
  } catch (error) {
    console.error("🚨 ARENA QUERY ERROR:", error.message);
    next(error);
  }
};


export const getWorkById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const work = await Work.findById(id).populate("artistId", "username avatar verified school");
    if (!work) return next(errorHandler(404, 'Work not found'));
    res.status(200).json({ success: true, work });
  } catch (error) {
    next(error);
  }
};


export const searchWorks = async (req, res, next) => {
  try {
    const { title, category, school, status, artistId } = req.query;
    const query = {};
    
    const isAdmin = req.user && ['admin', 'superadmin'].includes(req.user.role);

    if (status) {
      if (['approved', 'billboard'].includes(status)) {
        query.status = status;
      } else {
        if (!isAdmin) return next(errorHandler(403, 'Unauthorized access to restricted content'));
        query.status = status;
      }
    } else {
      if (!isAdmin) query.status = { $in: ['approved', 'billboard'] };
    }

    if (title) query.title = { $regex: title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    if (category) query.category = category;
    if (school) query.school = { $regex: school.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    if (artistId) query.artistId = artistId;

    const works = await Work.find(query)
      .sort({ createdAt: -1 })
      .populate({ path: "artistId", select: "username avatar verified school paystackSubaccountCode" });

    const sanitizedWorks = works.map(work => {
      const workObj = work.toObject();
      if (!workObj.artistId) {
        workObj.artistId = { 
          username: "Deleted User", 
          avatar: "https://i.imgur.com/5cLDezU.png",
          school: "The Arena" 
        };
      }
      return workObj;
    });

    res.status(200).json({ success: true, count: sanitizedWorks.length, works: sanitizedWorks });
  } catch (error) {
    console.error("Search Logic Crash:", error);
    next(error);
  }
};


export const getDashboardData = async (req, res, next) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return next(errorHandler(403, 'Unauthorized Access'));
    }

    const [admins, superadmins, artists, pending, approved, rejected, billboard] = await Promise.all([
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "superadmin" }),
      User.countDocuments({ role: "artist" }),
      Work.countDocuments({ status: "pending" }),
      Work.countDocuments({ status: "approved" }),
      Work.countDocuments({ status: "rejected" }),
      Work.countDocuments({ status: "billboard" })
    ]);

    const pendingContent = await Work.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: "artistId", select: "username avatar verified school" });

    const safePendingContent = pendingContent.map(item => {
      const itemObj = item.toObject();
      if (!itemObj.artistId) itemObj.artistId = { username: "Unknown Artist", avatar: "" };
      return itemObj;
    });

    res.status(200).json({ 
      success: true, 
      admins, superadmins, artists, 
      pendingPosts: pending, approvedPosts: approved,
      rejectedPosts: rejected, billboardPosts: billboard,
      pendingContent: safePendingContent 
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedWorks = async (req, res) => {
  try {
    const status = req.query.status || 'approved';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 1. Calculate the math and sort the feed (REMOVED $lookup and $unwind)
    let works = await Work.aggregate([
      { $match: { status: status } },
      { 
        $addFields: {
          ageInHours: { 
            $divide: [
              { $subtract: [new Date(), { $ifNull: ["$moderatedAt", "$createdAt"] }] }, 
              3600000 
            ] 
          }
        } 
      },
      {
        $addFields: {
          hotScore: { 
            $divide: [
              { $add: [{ $size: { $ifNull: ["$likedBy", []] } }, 1] }, 
              { $add: ["$ageInHours", 2] }
            ] 
          }
        }
      },
      { $sort: { hotScore: -1, _id: -1 } }, 
      { $skip: skip },
      { $limit: limit }
    ]);

     works = await Work.populate(works, { 
        path: 'artistId', 
        select: 'username avatar verified paystackSubaccountCode momoName momoNumber school' 
    });

    res.status(200).json({
      success: true,
      works: works,
      currentPage: page
    });

  } catch (error) {
    console.error("Feed Error:", error);
    res.status(500).json({ success: false, message: "Failed to load feed" });
  }
};

// DELETE /api/work/:id/comment/:commentId
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    
    // Assuming your auth middleware attaches the verified user to req.user
    const userId = req.user._id; 

    const work = await Work.findById(id);
    if (!work) {
      return res.status(404).json({ success: false, message: "Post not found in the Arena" });
    }

    // Find the exact comment in the array
    const commentIndex = work.commentsList.findIndex(
      (c) => c._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Security Check: Ensure the user deleting the comment is the one who wrote it
    if (work.commentsList[commentIndex].user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized: You can only delete your own comments" });
    }

    // Remove the comment from the array
    work.commentsList.splice(commentIndex, 1);
    await work.save();

    // The frontend only needs success: true to update the UI
    res.status(200).json({ 
      success: true, 
      message: "Comment deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, message: "Server error while deleting comment" });
  }
};