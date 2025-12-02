import React from 'react';
import { Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { AppState } from '../types';

interface LoadingOverlayProps {
  state: AppState;
  analysisText?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ state, analysisText }) => {
  if (state !== AppState.ANALYZING && state !== AppState.GENERATING) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-t-4 border-brand-gold rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-brand-gold">
                {state === AppState.ANALYZING ? <BrainCircuit size={40} /> : <Sparkles size={40} />}
            </div>
        </div>
        
        <h2 className="text-3xl font-serif text-brand-cream mb-4 animate-pulse">
          {state === AppState.ANALYZING ? "Gemini 正在思考..." : "正在生成大片..."}
        </h2>
        
        <p className="text-gray-400 text-lg mb-8">
            {state === AppState.ANALYZING 
             ? "正在分析光线、构图和食物质感..." 
             : "应用专业摄影技巧，通过 Nano Banana Pro 渲染中..."}
        </p>

        {state === AppState.GENERATING && analysisText && (
          <div className="bg-white/10 rounded-lg p-4 text-left border border-white/20">
            <h3 className="text-brand-gold text-sm font-bold uppercase tracking-widest mb-2">分析完成</h3>
            <p className="text-gray-300 text-sm italic">"{analysisText}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
