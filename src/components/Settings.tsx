import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, RefreshCw, Save, Check, AlertCircle, Key, Link as LinkIcon, Box, Thermometer, Bookmark, Plus, X } from 'lucide-react';

export default function Settings({ onBack }: { onBack: () => void, key?: string }) {
  const [apiProvider, setApiProvider] = useState<'gemini' | 'custom'>(
    (localStorage.getItem('ai_api_provider') as 'gemini' | 'custom') || 'gemini'
  );
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('ai_api_url') || 'https://api.openai.com');
  const [apiKey, setApiKey] = useState(localStorage.getItem('ai_api_key') || '');
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('ai_model') || '');
  const [temperature, setTemperature] = useState(parseFloat(localStorage.getItem('ai_temperature') || '0.7'));
  
  const [presets, setPresets] = useState<{id: string, name: string, provider?: string, url: string, key: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('ai_api_presets') || '[]'); } catch { return []; }
  });
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const [models, setModels] = useState<{id: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [saved, setSaved] = useState(false);

  // Load cached models on mount
  useEffect(() => {
    const cachedModels = localStorage.getItem('ai_models_cache');
    if (cachedModels) {
      try {
        setModels(JSON.parse(cachedModels));
      } catch (e) {}
    }
  }, []);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset = {
      id: Date.now().toString(),
      name: newPresetName,
      provider: apiProvider,
      url: apiUrl,
      key: apiKey
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('ai_api_presets', JSON.stringify(updated));
    setNewPresetName('');
    setShowPresetInput(false);
  };

  const handleLoadPreset = (id: string) => {
    const p = presets.find(x => x.id === id);
    if (p) {
      if (p.provider) setApiProvider(p.provider as 'gemini' | 'custom');
      setApiUrl(p.url);
      setApiKey(p.key);
    }
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter(x => x.id !== id);
    setPresets(updated);
    localStorage.setItem('ai_api_presets', JSON.stringify(updated));
  };

  const fetchModels = async () => {
    if (apiProvider === 'gemini') {
      setModels([{ id: 'gemini-3.1-pro-preview' }, { id: 'gemini-3.1-flash-preview' }, { id: 'gemini-2.5-flash' }, { id: 'gemini-2.5-pro' }]);
      if (!selectedModel) setSelectedModel('gemini-3.1-pro-preview');
      setStatus('success');
      return;
    }

    if (!apiUrl || !apiKey) {
      setStatus('error');
      setErrorMsg('请先填写 API 地址和密钥');
      return;
    }
    
    setLoading(true);
    setStatus('idle');
    
    try {
      const baseUrl = apiUrl.replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data && data.data && Array.isArray(data.data)) {
        const fetchedModels = data.data.map((m: any) => ({ id: m.id }));
        setModels(fetchedModels);
        localStorage.setItem('ai_models_cache', JSON.stringify(fetchedModels));
        setStatus('success');
        
        if (fetchedModels.length > 0 && !selectedModel) {
          setSelectedModel(fetchedModels[0].id);
        }
      } else {
        throw new Error('返回数据格式不正确，请确认这是兼容 OpenAI 的接口');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || '获取模型失败，请检查地址、密钥或网络');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('ai_api_provider', apiProvider);
    localStorage.setItem('ai_api_url', apiUrl);
    localStorage.setItem('ai_api_key', apiKey);
    localStorage.setItem('ai_model', selectedModel);
    localStorage.setItem('ai_temperature', temperature.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 bg-neutral-950 z-40 flex flex-col text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/80 backdrop-blur-xl border-b border-white/10 pt-[max(env(safe-area-inset-top),2rem)] z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-indigo-400 hover:text-indigo-300 transition-colors rounded-full active:bg-white/5">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-base font-medium tracking-wide">设置</h1>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-[max(env(safe-area-inset-bottom),3rem)] scrollbar-hide">
        
        {/* API Config Section */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-widest ml-1">API 配置</h2>
          
          <div className="bg-neutral-900/80 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5 shadow-xl">
            
            {/* Presets */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <Bookmark size={16} className="text-emerald-400" />
                  API 预设
                </label>
                <button onClick={() => setShowPresetInput(!showPresetInput)} className="text-xs text-indigo-400 flex items-center gap-1 hover:text-indigo-300">
                  <Plus size={14}/> 新增
                </button>
              </div>
              
              {showPresetInput ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2">
                  <input 
                    value={newPresetName} 
                    onChange={e => setNewPresetName(e.target.value)} 
                    placeholder="预设名称..." 
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                    autoFocus
                  />
                  <button onClick={handleSavePreset} className="bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-xl text-xs font-medium transition-colors">保存</button>
                  <button onClick={() => setShowPresetInput(false)} className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-xs font-medium transition-colors">取消</button>
                </motion.div>
              ) : (
                presets.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {presets.map(p => (
                      <div key={p.id} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl pl-3 pr-1 py-1.5 whitespace-nowrap shrink-0">
                        <button onClick={() => handleLoadPreset(p.id)} className="text-xs text-white/80 hover:text-white font-medium">{p.name}</button>
                        <button onClick={() => handleDeletePreset(p.id)} className="p-1 text-white/30 hover:text-red-400 rounded-lg transition-colors"><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-white/30 italic">暂无预设，点击右上角新增</div>
                )
              )}
            </div>

            {/* API Provider Toggle */}
            <div className="p-4 space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Box size={16} className="text-blue-400" />
                API 提供商
              </label>
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setApiProvider('gemini')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                    apiProvider === 'gemini' 
                      ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' 
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  Google Gemini
                </button>
                <button
                  onClick={() => setApiProvider('custom')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                    apiProvider === 'custom' 
                      ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' 
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  New API (自定义)
                </button>
              </div>
            </div>

            {/* API URL (Only show for custom) */}
            {apiProvider === 'custom' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 space-y-2 border-t border-white/5">
                <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <LinkIcon size={16} className="text-indigo-400" />
                  API 地址 (Base URL)
                </label>
                <input 
                  type="text" 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.openai.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all"
                />
              </motion.div>
            )}

            {/* API Key */}
            <div className="p-4 space-y-2 border-t border-white/5">
              <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Key size={16} className="text-amber-400" />
                {apiProvider === 'gemini' ? 'Gemini API Key' : '自定义 API Key'}
              </label>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={apiProvider === 'gemini' ? "AI Studio 默认已配置，可留空" : "sk-..."}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Model Selection Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">模型选择</h2>
            <button 
              onClick={fetchModels}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors active:scale-95"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              拉取列表
            </button>
          </div>

          <div className="bg-neutral-900/80 backdrop-blur-sm border border-white/5 rounded-3xl p-4 shadow-xl space-y-4">
            {status === 'error' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-start gap-2 text-xs text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </motion.div>
            )}
            {status === 'success' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 p-3 rounded-xl border border-emerald-400/20">
                <Check size={14} />
                <span>成功拉取 {models.length} 个模型</span>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Box size={16} className="text-purple-400" />
                当前模型
              </label>
              <div className="relative">
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-3 pr-10 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all appearance-none"
                >
                  <option value="" disabled>请选择一个模型</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.id}</option>
                  ))}
                  {selectedModel && !models.find(m => m.id === selectedModel) && (
                    <option value={selectedModel}>{selectedModel}</option>
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Section (Temperature) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">高级设置</h2>
          </div>
          <div className="bg-neutral-900/80 backdrop-blur-sm border border-white/5 rounded-3xl p-4 shadow-xl space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                  <Thermometer size={16} className="text-orange-400" />
                  温度 (Temperature)
                </label>
                <span className="text-xs font-mono text-white/50 bg-black/40 px-2 py-1 rounded-md border border-white/5">
                  {temperature.toFixed(1)}
                </span>
              </div>
              <input 
                type="range" 
                min="0" max="2" step="0.1" 
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[10px] text-white/40 px-1">
                <span>严谨准确 (0.0)</span>
                <span>发散创造 (2.0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button 
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
          >
            {saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? '已保存' : '保存配置'}
          </button>
        </div>
        
      </div>
    </motion.div>
  );
}
