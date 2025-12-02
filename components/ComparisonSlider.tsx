import React, { useState, useRef, useEffect } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);
  const handleTouchStart = () => setIsResizing(true);
  const handleTouchEnd = () => setIsResizing(false);

  const handleMove = (clientX: number) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isResizing]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square md:aspect-[4/3] max-w-4xl mx-auto overflow-hidden rounded-xl shadow-2xl border border-white/10 select-none group"
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
    >
      {/* After Image (Base) */}
      <img 
        src={afterImage} 
        alt="Enhanced" 
        className="absolute top-0 left-0 w-full h-full object-cover" 
      />
      
      {/* Before Image (Overlay) */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeImage} 
          alt="Original" 
          className="absolute top-0 left-0 w-full h-full object-cover max-w-none" 
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
        />
        {/* Label Before */}
        <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
          原图
        </div>
      </div>

       {/* Label After (positioned right) */}
       <div className="absolute top-4 right-4 bg-brand-gold/90 text-black text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm shadow-lg">
          美化后
        </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-xl text-brand-dark">
          <MoveHorizontal size={20} />
        </div>
      </div>
    </div>
  );
};

export default ComparisonSlider;
