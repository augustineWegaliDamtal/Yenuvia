import React from "react";

const EngagementBar = ({ post, handleLike, handleShare, toggleComments, currentUserId }) => {
  // Check if the current user has already liked this post
  const alreadyLiked = post.likedBy?.includes(currentUserId);

  return (
    <div className="flex space-x-6 mt-3 text-sm">
      {/* Like */}
      <button
        onClick={() => handleLike(post._id)}
        disabled={alreadyLiked}
        className={`flex items-center space-x-1 ${
          alreadyLiked
            ? "text-gray-400 cursor-not-allowed"
            : "text-blue-500 hover:text-blue-600"
        }`}
      >
        <span>👍</span>
        <span>{post.likes} Likes</span>
      </button>

      {/* Share */}
      <button
        onClick={() => handleShare(post._id)}
        className="flex items-center space-x-1 text-green-500 hover:text-green-600"
      >
        <span>🔗</span>
        <span>{post.shares} Shares</span>
      </button>

      {/* Comment toggle */}
      <button
        onClick={toggleComments}
        className="flex items-center space-x-1 text-gray-500 hover:text-gray-600"
      >
        <span>💬</span>
        <span>{post.comments} Comments</span>
      </button>
    </div>
  );
};

export default EngagementBar;
