import React from 'react';

interface Props {
  isActive: boolean;
  volume: number; // 0 to 255
}

const Visualizer: React.FC<Props> = ({ isActive, volume }) => {
  const bars = 7;
  
  return (
    <div className="flex items-center justify-center gap-1.5 h-8">
      {isActive ? (
        Array.from({ length: bars }).map((_, i) => {
           // Center focus
           const isCenter = i === 3;
           const isMid = i === 2 || i === 4;
           
           // Scale logic
           const volFactor = volume / 255;
           const baseHeight = 6;
           const variableHeight = isCenter ? 24 : isMid ? 16 : 10;
           const height = Math.max(baseHeight, variableHeight * volFactor * 2 + baseHeight);

           return (
             <div 
               key={i}
               className={`w-1.5 rounded-full transition-all duration-75 ${isCenter ? 'bg-amber-500' : 'bg-amber-600/70'}`}
               style={{ height: `${height}px` }}
             />
           );
        })
      ) : (
        <div className="flex gap-1">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="w-1 h-1 rounded-full bg-amber-900/40"></div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Visualizer;