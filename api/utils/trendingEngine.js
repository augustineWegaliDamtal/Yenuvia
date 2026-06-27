export const calculateTrendingScore = (work) => {
  const now = new Date();
  const ageInHours = (now - new Date(work.createdAt)) / (1000 * 60 * 60);
  
  // Comments are worth more than likes because they take more effort (Engagement)
  const engagement = (work.likes || 0) + ((work.comments || 0) * 2) + (work.shares || 0);
  
  // Gravity: Older posts lose score faster to keep the feed fresh
  const gravity = 1.5;
  const score = engagement / Math.pow(ageInHours + 2, gravity);
  
  return score;
};