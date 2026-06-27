import React from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Flame, TrendingUp } from "lucide-react";

const Leaderboard = ({ data }) => {
  // Empty State: When no one has engaged yet
  if (!data || data.length === 0) {
    return (
      <div className="bg-zinc-950/80 border border-white/5 rounded-3xl p-8 mt-4 text-center backdrop-blur-xl shadow-2xl">
        <Trophy size={40} className="text-zinc-800 mx-auto mb-4" />
        <h3 className="text-white text-sm font-black uppercase tracking-widest italic mb-2">
          The Board is Empty
        </h3>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
          Be the first to secure points for your school.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <ul className="space-y-4">
        {data.map((school, index) => {
          // Dynamic Styling based on Rank
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;

          let cardStyle = "bg-zinc-900/40 border-white/5";
          let badgeStyle = "bg-zinc-800 text-white font-black";
          let icon = null;

          if (isFirst) {
            cardStyle = "bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]";
            badgeStyle = "bg-yellow-500 text-black shadow-lg shadow-yellow-500/30";
            icon = <Trophy size={18} />;
          } else if (isSecond) {
            cardStyle = "bg-gradient-to-r from-slate-400/20 to-slate-300/10 border-slate-400/30";
            badgeStyle = "bg-slate-300 text-black";
            icon = <Medal size={18} />;
          } else if (isThird) {
            cardStyle = "bg-gradient-to-r from-amber-700/20 to-amber-600/10 border-amber-700/30";
            badgeStyle = "bg-amber-600 text-white";
            icon = <Medal size={18} />;
          }

          return (
            <motion.li
              key={school._id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
              className={`relative flex justify-between items-center p-4 rounded-[2rem] border backdrop-blur-md overflow-hidden ${cardStyle}`}
            >
              {/* Massive subtle background number for rank */}
              <div className="absolute -right-2 -bottom-6 text-8xl font-black italic text-white/[0.02] select-none pointer-events-none">
                {index + 1}
              </div>

              <div className="flex items-center gap-4 relative z-10">
                {/* Rank Badge */}
                <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${badgeStyle}`}>
                  {icon || <span className="text-sm">{index + 1}</span>}
                </div>

                {/* School Name */}
                <div className="flex flex-col">
                  <span className="font-black text-white text-xs md:text-sm uppercase tracking-widest line-clamp-1">
                    {school.school || "Unknown School"}
                  </span>
                  {isFirst && (
                    <span className="text-yellow-500 text-[8px] font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-1">
                      <TrendingUp size={10} /> Dominating
                    </span>
                  )}
                </div>
              </div>

              {/* Score / Points */}
              <div className="relative z-10 flex items-center gap-1.5 bg-black/40 px-3 py-2 rounded-full border border-white/10">
                <Flame size={14} className={isFirst ? "text-yellow-500 animate-pulse" : "text-gray-400"} />
                <span className="text-white font-black text-[10px] md:text-xs tracking-widest">
                  {school.totalEngagement?.toLocaleString() || 0}
                </span>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};

export default Leaderboard;