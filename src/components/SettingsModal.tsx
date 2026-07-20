import React, { useState } from 'react';
import { useFrisbeeStore } from '../services/store';
import { Settings, Save, Server, Cpu, Bell, Check, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const settings = useFrisbeeStore((state) => state.settings);
  const updateSettings = useFrisbeeStore((state) => state.updateSettings);

  const [searxngUrl, setSearxngUrl] = useState(settings.searxngUrl);
  const [aiProvider, setAiProvider] = useState(settings.aiProvider);
  const [aiApiKey, setAiApiKey] = useState(settings.aiApiKey);
  const [aiEndpoint, setAiEndpoint] = useState(settings.aiEndpoint);
  const [aiModel, setAiModel] = useState(settings.aiModel);
  const [notifyOnFetchComplete, setNotifyOnFetchComplete] = useState(settings.notifyOnFetchComplete);
  const [isSaved, setIsSaved] = useState(false);

  // Connection & Model Fetch state
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testErrorMsg, setTestErrorMsg] = useState<string | null>(null);

  // Fetch Available Models from API Endpoint
  const handleFetchModels = async () => {
    setIsFetchingModels(true);
    setTestStatus('idle');
    setTestErrorMsg(null);

    const baseUrl = aiEndpoint.replace(/\/$/, '');
    let url = `${baseUrl}/models`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (aiApiKey) {
      headers['Authorization'] = `Bearer ${aiApiKey}`;
    }

    if (aiProvider === 'ollama' && !baseUrl.endsWith('/api')) {
      url = `${baseUrl}/api/tags`;
    }

    try {
      const response = await fetch(url, { method: 'GET', headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let modelList: string[] = [];

      if (data.data && Array.isArray(data.data)) {
        // OpenAI format
        modelList = data.data.map((m: any) => m.id);
      } else if (data.models && Array.isArray(data.models)) {
        // Ollama format
        modelList = data.models.map((m: any) => m.name || m.id);
      } else if (Array.isArray(data)) {
        modelList = data.map((m: any) => (typeof m === 'string' ? m : m.id || m.name));
      }

      if (modelList.length === 0) {
        throw new Error('モデルリストを取得できましたが、有効なモデルが含まれていませんでした。');
      }

      // Sort & filter text generation models
      modelList.sort();
      setFetchedModels(modelList);
      setTestStatus('success');

      // If current selected model is not in list, pick the first one
      if (!modelList.includes(aiModel)) {
        setAiModel(modelList[0]);
      }
    } catch (err: any) {
      console.error('Fetch models failed:', err);
      setTestStatus('error');
      setTestErrorMsg(err.message || 'APIエンドポイントへの接続に失敗しました。');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      searxngUrl,
      aiProvider,
      aiApiKey,
      aiEndpoint,
      aiModel,
      notifyOnFetchComplete,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold flex items-center gap-2 text-white">
          <Settings className="w-7 h-7 text-amber-400" />
          システム & エージェント設定
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Web検索エンジン (SearXNG) および情報要約・分類 AI エージェントのプロバイダを設定します。
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        {/* SearXNG Section */}
        <div className="bg-[#171a29] p-5 rounded-2xl border border-slate-700/80 space-y-3">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4" /> Web検索エンジン設定 (SearXNG API)
          </h3>
          <p className="text-xs text-slate-400">
            プライバシー保護型メタ検索エンジン SearXNG の URL エンドポイントを指定します。(例: https://searx.be やローカル Docker)
          </p>
          <input
            type="url"
            value={searxngUrl}
            onChange={(e) => setSearxngUrl(e.target.value)}
            placeholder="https://searx.be"
            className="w-full bg-[#0f111a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        {/* AI Provider Section */}
        <div className="bg-[#171a29] p-5 rounded-2xl border border-slate-700/80 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4" /> AI要約・分類プロバイダ
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'demo', label: 'デモAI (組込)', desc: 'APIキー不要・シミュレーション' },
              { id: 'openai', label: 'OpenAI 互換 API', desc: 'ChatGPT, DeepSeek, Groq等' },
              { id: 'ollama', label: 'Ollama (ローカル)', desc: 'Local LLM (llama3, mistral)' },
            ].map((prov) => (
              <button
                key={prov.id}
                type="button"
                onClick={() => {
                  setAiProvider(prov.id as any);
                  setTestStatus('idle');
                  if (prov.id === 'ollama') {
                    setAiEndpoint('http://localhost:11434');
                  } else if (prov.id === 'openai' && !aiEndpoint) {
                    setAiEndpoint('https://api.openai.com/v1');
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  aiProvider === prov.id
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-[#0f111a] border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-bold text-xs block text-white">{prov.label}</span>
                <span className="text-[11px] text-slate-400 mt-1 block">{prov.desc}</span>
              </button>
            ))}
          </div>

          {aiProvider !== 'demo' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API Key {aiProvider === 'ollama' && '(ローカルAPIの場合は空欄可)'}
                </label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder={aiProvider === 'openai' ? 'sk-...' : '任意'}
                  className="w-full bg-[#0f111a] border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API Base Endpoint
                </label>
                <input
                  type="text"
                  value={aiEndpoint}
                  onChange={(e) => setAiEndpoint(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-[#0f111a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Fetch Models & Connection Test Action */}
              <div className="p-4 rounded-xl bg-[#0f111a] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    🤖 利用可能モデルの選択 (API疎通チェック)
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchModels}
                    disabled={isFetchingModels || !aiEndpoint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingModels ? 'animate-spin' : ''}`} />
                    <span>{isFetchingModels ? '接続確認中...' : 'モデルリストを取得'}</span>
                  </button>
                </div>

                {/* Connection Status Feedback */}
                {testStatus === 'success' && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>API疎通成功！{fetchedModels.length}件のモデルを取得しました。</span>
                  </div>
                )}

                {testStatus === 'error' && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/30">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>疎通エラー: {testErrorMsg}</span>
                  </div>
                )}

                {/* Model Selector Dropdown */}
                {fetchedModels.length > 0 ? (
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full bg-[#171a29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  >
                    {fetchedModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      placeholder="例: gpt-4o-mini / llama3"
                      className="w-full bg-[#171a29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications & System Tray */}
        <div className="bg-[#171a29] p-5 rounded-2xl border border-slate-700/80 space-y-3">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4" /> 常駐 & デスクトップ通知
          </h3>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOnFetchComplete}
              onChange={(e) => setNotifyOnFetchComplete(e.target.checked)}
              className="w-4 h-4 accent-amber-400 rounded"
            />
            <span className="text-xs text-slate-200 font-medium">
              探索完了・ユーザー評価待ちカード到着時にデスクトップ通知を表示
            </span>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-fade-in">
              <Check className="w-4 h-4" /> 設定を保存しました
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            設定を保存
          </button>
        </div>
      </form>
    </div>
  );
};
