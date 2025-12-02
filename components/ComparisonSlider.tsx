
import React, { useState, useRef, useEffect } from 'react';
import { MoveHorizontal, Quote } from 'lucide-react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  literaryText?: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ beforeImage, afterImage, literaryText }) => {
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
      className="relative w-full aspect-square md:aspect-[4/3] max-w-4xl mx-auto overflow-hidden rounded-xl shadow-2xl border border-white/10 select-none group bg-black"
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
    >
      {/* After Image (Base - Enhanced) */}
      <div className="absolute top-0 left-0 w-full h-full">
        <img 
            src={afterImage} 
            alt="Enhanced" 
            className="w-full h-full object-cover" 
        />
        
        {/* Literary Text Overlay (Only on After Image) */}
        {literaryText && (
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end text-center z-10">
                <div className="max-w-xl">
                    <Quote size={20} className="text-brand-gold/80 mx-auto mb-3 rotate-180" />
                    <p className="text-white/95 font-serif text-lg md:text-xl tracking-wide leading-relaxed drop-shadow-md">
                        {literaryText}
                    </p>
                    <div className="w-12 h-px bg-brand-gold/60 mx-auto mt-4"></div>
                </div>
            </div>
        )}
      </div>
      
      {/* Before Image (Overlay - Original) */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden z-20"
        style={{ width: `${sliderPosition}%`, borderRight: '1px solid white' }}
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

       {/* Label After (positioned right, on top of everything except before image) */}
       <div className="absolute top-4 right-4 bg-brand-gold/90 text-black text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm shadow-lg z-10">
          美化后
        </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-0 z-30 flex flex-col justify-center items-center"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-xl text-brand-dark cursor-ew-resize hover:scale-110 transition-transform">
          <MoveHorizontal size={20} />
        </div>
      </div>
    </div>
  );
};

export default ComparisonSlider;
