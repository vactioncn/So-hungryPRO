import React, { useState, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Wand2, ChefHat, Info, Link as LinkIcon, ImagePlus, History as HistoryIcon, X, Trash2, Receipt } from 'lucide-react';
import { AppState, AnalysisResult, CostBreakdown, HistoryItem } from './types';
import { analyzeFoodImage, generateEnhancedFood, fileToBase64, urlToBase64 } from './services/geminiService';
import { saveHistoryItem, getHistoryItems, deleteHistoryItem } from './services/historyDb';
import LoadingOverlay from './components/LoadingOverlay';
import ComparisonSlider from './components/ComparisonSlider';
import KeySelector from './components/KeySelector';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  // Current Session Data
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentCost, setCurrentCost] = useState<CostBreakdown | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isKeyReady, setIsKeyReady] = useState(false);
  
  // Input State
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const items = await getHistoryItems();
      setHistoryItems(items);
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        setOriginalImage(base64);
        setEnhancedImage(null); // Clear previous result
        setAnalysis(null);
        setCurrentCost(null);
        setError(null);
      } catch (err) {
        setError("加载图片失败，请重试。");
      }
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;

    setIsLoadingUrl(true);
    setError(null);
    try {
        const base64 = await urlToBase64(imageUrlInput);
        setOriginalImage(base64);
        setEnhancedImage(null);
        setAnalysis(null);
        setCurrentCost(null);
        setImageUrlInput(""); 
    } catch (err: any) {
        setError(err.message || "无法加载该链接的图片。");
    } finally {
        setIsLoadingUrl(false);
    }
  };

  const processImage = async () => {
    if (!originalImage) return;

    try {
      setAppState(AppState.ANALYZING);
      
      // Step 1: Analyze
      const { result: analysisResult, cost: analysisCost, tokens } = await analyzeFoodImage(originalImage);
      setAnalysis(analysisResult);

      setAppState(AppState.GENERATING);
      
      // Step 2: Generate
      const { image: enhanced, cost: genCost } = await generateEnhancedFood(originalImage, analysisResult);
      setEnhancedImage(enhanced);
      
      const totalCostObj: CostBreakdown = {
        analysisCost: analysisCost,
        generationCost: genCost,
        totalCost: analysisCost + genCost,
        tokenUsage: tokens
      };
      setCurrentCost(totalCostObj);
      setAppState(AppState.COMPLETE);

      // Save to History
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        originalImage: originalImage,
        enhancedImage: enhanced,
        analysis: analysisResult,
        cost: totalCostObj
      };
      
      await saveHistoryItem(newItem);
      await loadHistory(); // Refresh list

    } catch (err: any) {
      console.error(err);
      setError(err.message || "处理过程中发生了意外错误。");
      setAppState(AppState.ERROR);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setOriginalImage(item.originalImage);
    setEnhancedImage(item.enhancedImage);
    setAnalysis(item.analysis);
    setCurrentCost(item.cost);
    setAppState(AppState.COMPLETE);
    setShowHistory(false);
  };

  const deleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("确定要删除这条记录吗？")) {
        await deleteHistoryItem(id);
        await loadHistory();
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setOriginalImage(null);
    setEnhancedImage(null);
    setAnalysis(null);
    setCurrentCost(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-brand-dark bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] font-sans overflow-x-hidden">
      <KeySelector onKeySelected={() => setIsKeyReady(true)} />
      
      {/* Header */}
      <header className="fixed w-full top-0 z-40 bg-brand-dark/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetApp}>
            <div className="bg-brand-gold p-2 rounded-lg text-black">
              <ChefHat size={24} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
              美食滤镜 <span className="text-brand-gold">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-brand-gold transition-colors"
             >
                <HistoryIcon size={20} />
                <span className="hidden md:inline">历史记录</span>
             </button>
          </div>
        </div>
      </header>

      {/* History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
            <div className="relative w-full max-w-md bg-brand-dark border-l border-white/10 shadow-2xl h-full overflow-y-auto p-6 animate-slide-in-right">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-serif text-white">创作历史</h2>
                    <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white p-2">
                        <X size={24} />
                    </button>
                </div>
                
                {historyItems.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <HistoryIcon size={48} className="mx-auto mb-4 opacity-50" />
                        <p>暂无历史记录</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {historyItems.map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => loadFromHistory(item)}
                                className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-brand-gold/50 transition-all"
                            >
                                <div className="flex h-24">
                                    <img src={item.originalImage} className="w-24 h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Before" />
                                    <div className="w-px bg-white/10"></div>
                                    <img src={item.enhancedImage} className="w-24 h-full object-cover" alt="After" />
                                    <div className="flex-1 p-3 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-white font-medium text-sm truncate">{item.analysis.dishName}</h4>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(item.timestamp).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-brand-gold text-xs font-mono">${item.cost.totalCost.toFixed(4)}</span>
                                            <button 
                                                onClick={(e) => deleteHistory(e, item.id)}
                                                className="text-gray-500 hover:text-red-400 p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-28 pb-12 px-4 max-w-7xl mx-auto min-h-screen flex flex-col items-center">
        
        {/* Intro Text */}
        {appState === AppState.IDLE && !originalImage && (
          <div className="text-center max-w-2xl mx-auto mb-10 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">
              将随手拍变成<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-200">
                米其林级大片
              </span>
            </h2>
            <p className="text-gray-400 text-lg">
              我们利用 <strong>Gemini 3 Pro</strong> 进行专业摄影分析，修正畸变与光影，打造完美视觉盛宴。
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="w-full max-w-lg bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-center gap-3 animate-fade-in">
            <Info size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* Upload State */}
        {appState === AppState.IDLE && !originalImage && (
          <div className="w-full max-w-xl space-y-6">
            
            {/* File Upload Box */}
            <label className="group block w-full aspect-[16/9] rounded-3xl border-2 border-dashed border-white/20 hover:border-brand-gold/50 bg-white/5 hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center gap-4">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect} 
                disabled={!isKeyReady}
              />
              <div className="w-16 h-16 bg-black/30 rounded-full flex items-center justify-center text-gray-400 group-hover:text-brand-gold group-hover:scale-110 transition-all">
                <Camera size={32} />
              </div>
              <div className="text-center px-6">
                <p className="text-xl font-medium text-white mb-1">上传美食照片</p>
                <p className="text-sm text-gray-400">支持 JPG, PNG, WEBP</p>
              </div>
            </label>

            <div className="flex items-center gap-4 w-full">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-gray-500 text-sm">或</span>
                <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {/* URL Input */}
            <form onSubmit={handleUrlSubmit} className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                    <LinkIcon size={18} />
                </div>
                <input 
                    type="text"
                    placeholder="粘贴图片链接 URL"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    disabled={!isKeyReady || isLoadingUrl}
                    className="w-full bg-white/5 border border-white/20 rounded-xl py-4 pl-12 pr-32 text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold transition-colors"
                />
                <button 
                    type="submit"
                    disabled={!imageUrlInput.trim() || !isKeyReady || isLoadingUrl}
                    className="absolute right-2 top-2 bottom-2 bg-white/10 hover:bg-brand-gold hover:text-black text-white px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoadingUrl ? <RefreshCw size={14} className="animate-spin" /> : <ImagePlus size={16} />}
                    {isLoadingUrl ? "加载中" : "获取"}
                </button>
            </form>

          </div>
        )}

        {/* Preview State */}
        {appState === AppState.IDLE && originalImage && (
          <div className="w-full max-w-xl animate-fade-in">
             <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-8 bg-black/40 group">
               <img src={originalImage} alt="Preview" className="w-full h-full object-contain" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button 
                  onClick={() => setOriginalImage(null)}
                  className="bg-red-500/80 text-white px-4 py-2 rounded-full backdrop-blur-sm hover:bg-red-600 transition-colors flex items-center gap-2"
                 >
                   <Trash2 size={16} /> 移除
                 </button>
               </div>
             </div>
             
             <button
              onClick={processImage}
              className="w-full py-4 bg-gradient-to-r from-brand-gold to-yellow-600 text-black font-bold text-lg rounded-xl shadow-lg shadow-brand-gold/20 hover:shadow-brand-gold/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
             >
               <Wand2 size={24} />
               开始 AI 美化
             </button>
          </div>
        )}

        {/* Result State */}
        {appState === AppState.COMPLETE && originalImage && enhancedImage && analysis && (
          <div className="w-full animate-fade-in pb-20">
            <ComparisonSlider beforeImage={originalImage} afterImage={enhancedImage} />

            {/* Cost Tag */}
            {currentCost && (
                <div className="max-w-4xl mx-auto mt-6 flex justify-end">
                    <div className="bg-brand-dark border border-brand-gold/30 rounded-lg px-4 py-2 flex items-center gap-3 text-sm text-brand-gold shadow-lg shadow-black/50">
                        <Receipt size={16} />
                        <span className="text-gray-400">本次制作成本:</span>
                        <span className="font-mono font-bold text-white">${currentCost.totalCost.toFixed(4)}</span>
                        <div className="w-px h-4 bg-brand-gold/20 mx-1"></div>
                        <span className="text-xs text-gray-500">(思考: ${currentCost.analysisCost.toFixed(4)} + 生成: ${currentCost.generationCost.toFixed(2)})</span>
                    </div>
                </div>
            )}

            {/* Analysis Details Card */}
            <div className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                 <h3 className="text-brand-gold font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                    <Info size={16} /> AI 诊断报告
                 </h3>
                 <div className="space-y-4">
                    <div>
                      <span className="text-gray-500 text-xs uppercase block mb-1">识别菜品</span>
                      <p className="text-white text-lg font-serif">{analysis.dishName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs uppercase block mb-1">问题分析</span>
                      <p className="text-gray-300 text-sm leading-relaxed">{analysis.critique}</p>
                    </div>
                 </div>
               </div>

               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                 <h3 className="text-brand-gold font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                    <Wand2 size={16} /> 美化策略
                 </h3>
                 <div className="space-y-4">
                    <div>
                      <span className="text-gray-500 text-xs uppercase block mb-1">优化方案</span>
                      <p className="text-gray-300 text-sm leading-relaxed">{analysis.improvementStrategy}</p>
                    </div>
                 </div>
               </div>
            </div>

            <div className="max-w-md mx-auto mt-12 text-center">
              <button
                onClick={resetApp}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center gap-2 mx-auto border border-white/10"
              >
                <RefreshCw size={18} />
                处理下一张
              </button>
            </div>
          </div>
        )}

      </main>

      <LoadingOverlay state={appState} analysisText={analysis?.improvementStrategy} />
    </div>
  );
};

export default App;