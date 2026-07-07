import School from "../models/School.js";
import Work from "../models/Work.js";
import { errorHandler } from "../utils/error.js";

// --- 📺 FEED ENGINES ---

export const getSchools = async (req, res, next) => {
  try {
    const posts = await Work.find({ category: "school", status: { $in: ["approved", "billboard"] } })
      .sort({ createdAt: -1 })
      .populate("artistId", "username avatar verified school")
      .populate("commentsList.user", "username avatar");
    res.status(200).json({ success: true, posts });
  } catch (err) { next(err); }
};

export const getProfessionals = async (req, res, next) => {
  try {
    const { type } = req.query; // 1. Catch the UI filter (All, Image, Video, Carousel)

    // 2. Your flawless base query
    let query = { 
      category: "professional", 
      status: { $in: ["approved", "billboard"] } 
    };

    // 3. Inject the dynamic type filter if it's not "All"
    if (type && type !== "All") {
      query.type = type.toLowerCase(); 
    }

    const rawPosts = await Work.find(query)
      .sort({ createdAt: -1 })
      .populate("artistId", "username avatar verified school")
      .populate("commentsList.user", "username avatar");

    // 4. Flatten the artistName so the React Grid doesn't say @undefined
    const posts = rawPosts.map(post => ({
      ...post._doc, // Get the core MongoDB document
      artistName: post.artistId ? post.artistId.username : "Arena Pro"
    }));

    res.status(200).json({ success: true, posts });
  } catch (err) { 
    next(err); 
  }
};

export const getForYou = async (req, res, next) => {
  try {
    const works = await Work.find({
      status: { $in: ["approved", "billboard"] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }).populate("artistId", "username avatar verified school").populate("commentsList.user", "username avatar");

    const sortedWorks = works.map((work) => {
        const now = new Date();
        const ageInHours = (now - new Date(work.createdAt)) / (1000 * 60 * 60);
        const engagement = (work.likes || 0) + (work.comments || 0) * 2 + (work.shares || 0);
        const score = engagement / Math.pow(ageInHours + 2, 1.5);
        return { ...work._doc, trendingScore: score };
      }).sort((a, b) => b.trendingScore - a.trendingScore);

    res.status(200).json({ success: true, posts: sortedWorks.slice(0, 30) });
  } catch (error) { next(error); }
};

export const getBillboard = async (req, res, next) => {
  try {
    const { mode, artistId } = req.query;
    let query = { status: "billboard" };
    if (mode === "artist" && artistId) query.artistId = artistId;

    const posts = await Work.find(query)
      .sort({ updatedAt: -1 })
      .limit(6)
      .populate("artistId", "username avatar verified");

    res.json({ success: true, posts });
  } catch (err) { next(err); }
};

export const getSchoolLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await School.find({}).sort({ totalPoints: -1 }).limit(10);
    const formatted = leaderboard.map(s => ({
      _id: s._id,
      school: s.name,
      totalEngagement: s.totalPoints,
      logo: s.logo,
      tier: s.tier
    }));
    res.status(200).json({ success: true, leaderboard: formatted });
  } catch (err) { next(err); }
};

// --- 🛡️ ADMIN ACTIONS (Matches your Routes) ---

export const approvePost = async (req, res, next) => {
  try {
    const post = await Work.findByIdAndUpdate(
      req.params.id,
      { status: "approved", moderatedAt: new Date(), moderatedBy: req.user?._id },
      { new: true }
    );
    
    // 📢 SOCKET TRIGGER: If it was on the billboard and gets demoted to regular 'approved', remove it from screens
    if (req.io) {
      req.io.emit("work_removed_from_feed", { workId: req.params.id });
    }

    res.json({ success: true, post });
  } catch (err) { next(err); }
};

export const rejectPost = async (req, res, next) => {
  try {
    const post = await Work.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", moderatedAt: new Date(), moderatedBy: req.user?._id },
      { new: true }
    );

    // 📢 SOCKET TRIGGER: If an admin rejects a post, rip it off the live billboard instantly
    if (req.io) {
      req.io.emit("work_removed_from_feed", { workId: req.params.id });
    }

    res.json({ success: true, post });
  } catch (err) { next(err); }
};

export const promoteToBillboard = async (req, res, next) => {
  try {
    const post = await Work.findByIdAndUpdate(
      req.params.id,
      { status: "billboard", moderatedAt: new Date(), moderatedBy: req.user?._id },
      { new: true }
    ).populate("artistId", "username avatar verified school"); // 🔥 ADDED POPULATE HERE

    // 📢 SOCKET TRIGGER: Shout to all screens that a new masterpiece is ready!
    if (req.io) {
      req.io.emit("new_global_feed_item", {
        destination: 'billboard',
        work: post // Sending the fully populated post
      });
    }

    res.json({ success: true, post });
  } catch (err) { next(err); }
};

// --- ⚡ ENGAGEMENT ---

export const likePost = async (req, res, next) => {
  try {
    const post = await Work.findById(req.params.id);
    if (!post) return next(errorHandler(404, "Post not found"));

    const userId = req.user._id.toString();
    if (post.likedBy.includes(userId)) return res.status(400).json({ success: false, message: "Already liked!" });

    post.likes += 1;
    post.likedBy.push(userId);
    await post.save();

    if (post.category === "school" && post.school) {
      await School.findOneAndUpdate({ name: post.school.trim() }, { $inc: { totalPoints: 1 } }, { upsert: true });
    }

    const updatedPost = await Work.findById(post._id).populate("artistId", "username avatar verified");
    res.json({ success: true, data: updatedPost });
  } catch (err) { next(err); }
};

export const commentPost = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const post = await Work.findById(req.params.id);
    if (!post) return next(errorHandler(404, "Post not found"));

    post.commentsList.push({ user: req.user._id, text: comment.trim() });
    post.comments += 1;
    await post.save();

    if (post.category === "school" && post.school) {
      await School.findOneAndUpdate({ name: post.school.trim() }, { $inc: { totalPoints: 2 } }, { upsert: true });
    }

    const updatedPost = await Work.findById(req.params.id)
      .populate("artistId", "username avatar verified")
      .populate("commentsList.user", "username avatar");

    res.status(200).json({ success: true, data: updatedPost });
  } catch (err) { next(err); }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Work.findById(postId);
    if (!post) return next(errorHandler(404, "Post not found"));

    const comment = post.commentsList.id(commentId);
    if (!comment) return next(errorHandler(404, "Comment not found"));

    comment.deleteOne();
    post.comments = Math.max(0, post.comments - 1);
    await post.save();

    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (err) { next(err); }
};

export const sharePost = async (req, res, next) => {
  try {
    await Work.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } });
    const updatedPost = await Work.findById(req.params.id).populate("artistId", "username avatar verified");
    res.json({ success: true, data: updatedPost });
  } catch (err) { next(err); }
};