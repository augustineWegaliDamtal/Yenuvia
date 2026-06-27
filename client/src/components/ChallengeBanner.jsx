import React from "react";

const ChallengeBanner = ({ topic, description, startDate, endDate }) => {
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md mb-4">
      <h3 className="text-lg font-bold">🎨 Weekly Challenge</h3>
      {topic ? (
        <>
          <p className="text-sm mt-1 font-semibold">{topic}</p>
          {description && (
            <p className="text-sm mt-2 text-gray-700">{description}</p>
          )}
          {(startDate || endDate) && (
            <p className="text-xs mt-2 text-gray-500 italic">
              {startDate && `Starts: ${new Date(startDate).toLocaleDateString()}`}{" "}
              {endDate && `Ends: ${new Date(endDate).toLocaleDateString()}`}
            </p>
          )}
        </>
        
      ) : (
        <p className="text-sm mt-1">
          No challenge set yet. Stay tuned!
        </p>
      )}
    </div>
  );
};

export default ChallengeBanner;

 