import React, { useEffect, useState } from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';

interface KeySelectorProps {
  onKeySelected: () => void;
}

const KeySelector: React.FC<KeySelectorProps> = ({ onKeySelected }) => {
  const [hasKey, setHasKey] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
      if (selected) {
        onKeySelected();
      }
    }
    setChecking(false);
  };

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions to avoid race condition
      setHasKey(true);
      onKeySelected();
    }
  };

  if (checking) return null;
  if (hasKey) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-brand-dark/95 backdrop-blur-lg flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-gold">
          <KeyRound size={32} />
        </div>
        
        <h2 className="text-3xl font-serif text-white mb-4">解锁专业模式</h2>
        <p className="text-gray-300 mb-8 leading-relaxed">
          美食滤镜 AI 使用 <strong>Gemini 3 Pro</strong> 和高清图像模型。
          要访问这些高级功能，请选择一个链接到付费 GCP 项目的 API 密钥。
        </p>

        <button 
          onClick={handleSelectKey}
          className="w-full bg-gradient-to-r from-brand-gold to-yellow-600 text-black font-bold py-4 px-6 rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 text-lg"
        >
          选择 API Key
        </button>

        <div className="mt-6 pt-6 border-t border-white/10">
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-brand-gold transition-colors inline-flex items-center gap-1"
          >
            了解 API 计费 <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default KeySelector;
