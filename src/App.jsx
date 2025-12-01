import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Upload, 
  FileSpreadsheet, 
  Search, 
  Download, 
  RefreshCw,
  Globe,
  LayoutDashboard,
  AlertCircle
} from 'lucide-react';

// Logo da UFPR (URL pública)
const UFPR_LOGO_URL = "https://ufpr.br/wp-content/uploads/2015/11/ufpr_1000.jpg";

const App = () => {
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'batch'
  
  // Library Load State
  const [isXLSXLoaded, setIsXLSXLoaded] = useState(false);

  // Single Check State
  const [singleUrl, setSingleUrl] = useState('');
  const [singleResult, setSingleResult] = useState(null);
  const [isCheckingSingle, setIsCheckingSingle] = useState(false);

  // Batch Check State
  const [batchData, setBatchData] = useState([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Effect: Load XLSX Library Dynamically
  useEffect(() => {
    if (window.XLSX) {
      setIsXLSXLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    script.onload = () => setIsXLSXLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // --- LÓGICA DE VERIFICAÇÃO 3.0 (CORREÇÃO DE FALSOS POSITIVOS) ---

  // 1. Tenta via Proxy 
  // Retorna NULL se falhar a conexão (rede/timeout)
  // Retorna o objeto { ok, status } se conectar (mesmo que seja 404 ou 500)
  const fetchWithProxy = async (url, proxyType) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      let proxyUrl = '';
      if (proxyType === 'primary') {
        proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      } else {
        proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&timestamp=${Date.now()}`;
      }

      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      // AQUI ESTÁ A CORREÇÃO:
      // Se recebemos uma resposta (seja 200, 404, 500), retornamos ela.
      // Não tratamos 404 como "falha de conexão", mas sim como "falha do site".
      return { 
        connected: true, 
        ok: response.ok, 
        status: response.status 
      };

    } catch (error) {
      clearTimeout(timeoutId);
      // Retorna null apenas se NÃO conseguimos nem falar com o servidor (timeout/rede)
      return null;
    }
  };

  // 2. Tenta Direto (Fallback último caso)
  const fetchDirectNoCors = async (url) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); 

    try {
      await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return true; // Sucesso (Opaco)
    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  };

  const realCheck = async (url) => {
    const startTime = Date.now();
    
    // Normalização
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let finalStatus = 'Offline';
    let finalCode = 'ERR';
    let isOpaque = false;

    // TENTATIVA 1: Proxy Primário
    let proxyResult = await fetchWithProxy(cleanUrl, 'primary');

    // TENTATIVA 2: Proxy Secundário (Só se o primário deu erro de REDE, não 404)
    if (!proxyResult) {
       await new Promise(r => setTimeout(r, 200));
       proxyResult = await fetchWithProxy(cleanUrl, 'backup');
    }

    if (proxyResult) {
      // Se conectou via proxy (mesmo que seja 404 ou 500)
      if (proxyResult.ok) {
        finalStatus = 'Online';
        finalCode = proxyResult.status;
      } else {
        finalStatus = 'Offline'; // 404 ou 500 é considerado Offline/Erro
        finalCode = proxyResult.status;
      }
    } else {
      // TENTATIVA 3: Se ambos proxies falharam na REDE (timeout/block), tentamos direto
      // Isso salva sites como LinkedIn/Google que bloqueiam proxies mas estão UP
      const directSuccess = await fetchDirectNoCors(cleanUrl);
      if (directSuccess) {
        finalStatus = 'Online';
        finalCode = '200 (Restrito)';
        isOpaque = true;
      } else {
        finalCode = 'TIMEOUT/DNS';
      }
    }

    const duration = Date.now() - startTime;
    const timeString = new Date().toLocaleTimeString();

    return {
      url: cleanUrl,
      status: finalStatus,
      code: finalCode,
      time: `${duration}ms`,
      timestamp: timeString,
      isOpaque: isOpaque
    };
  };

  const checkUrl = async (url) => {
    return realCheck(url);
  };
  // --- FIM DA NOVA LÓGICA ---

  // Handlers for Single Check
  const handleSingleCheck = async (e) => {
    e.preventDefault();
    if (!singleUrl) return;

    setIsCheckingSingle(true);
    setSingleResult(null);

    const result = await checkUrl(singleUrl);
    
    setSingleResult(result);
    setIsCheckingSingle(false);
  };

  // Handlers for Batch Check
  const handleFileUpload = (e) => {
    if (!isXLSXLoaded) {
      alert("A biblioteca de planilhas ainda está carregando. Tente novamente em alguns segundos.");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = window.XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      let urlColumnIndex = 0;
      
      const headerRow = data[0];
      if (Array.isArray(headerRow)) {
         const foundIndex = headerRow.findIndex(cell => 
           cell && typeof cell === 'string' && 
           ['url', 'site', 'website', 'link'].some(term => cell.toLowerCase().includes(term))
         );
         if (foundIndex !== -1) urlColumnIndex = foundIndex;
      }

      const rawUrls = [];
      const startIndex = (urlColumnIndex !== 0 || (typeof data[0][0] === 'string' && data[0][0].toLowerCase().includes('url'))) ? 1 : 0;

      for (let i = startIndex; i < data.length; i++) {
        const row = data[i];
        if (row && row[urlColumnIndex]) {
           rawUrls.push(String(row[urlColumnIndex]));
        }
      }
      
      const initialBatch = rawUrls.map(url => ({
        url,
        status: 'Pendente',
        code: '-',
        time: '-',
        timestamp: '-'
      }));
      
      setBatchData(initialBatch);
      runBatchCheck(initialBatch);
    };
    reader.readAsBinaryString(file);
  };

  // Helper para processar chunks
  const processChunk = async (chunk, startIndex, allData, setBatchData) => {
    const promises = chunk.map((item, idx) => {
        const realIndex = startIndex + idx;
        
        allData[realIndex] = { ...allData[realIndex], status: 'Verificando...' };
        
        return checkUrl(item.url).then(result => ({ result, index: realIndex }));
    });

    setBatchData([...allData]);

    const results = await Promise.all(promises);

    results.forEach(({ result, index }) => {
        allData[index] = result;
    });

    setBatchData([...allData]);
    return results.length;
  };

  const runBatchCheck = async (items) => {
    setIsProcessingBatch(true);
    setProgress(0);
    
    let completed = 0;
    const newBatchData = [...items];
    const CHUNK_SIZE = 3; 

    for (let i = 0; i < newBatchData.length; i += CHUNK_SIZE) {
      const chunk = newBatchData.slice(i, i + CHUNK_SIZE);
      
      if (i > 0) await new Promise(r => setTimeout(r, 1000));

      await processChunk(chunk, i, newBatchData, setBatchData);
      
      completed += chunk.length;
      setProgress((completed / newBatchData.length) * 100);
    }

    setIsProcessingBatch(false);
  };

  const exportToExcel = () => {
    if (!isXLSXLoaded || !window.XLSX) return;
    
    const ws = window.XLSX.utils.json_to_sheet(batchData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    window.XLSX.writeFile(wb, "inova_status_report.xlsx");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">INOVA STATUS CHECK</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">MONITORAMENTO DE URLS</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-slate-900">UNIVERSIDADE FEDERAL DO PARANÁ</span>
              <span className="text-[10px] text-slate-500">PROJETO DE INOVAÇÃO TECNOLÓGICA</span>
            </div>
            <img 
              src={UFPR_LOGO_URL} 
              alt="Logo UFPR" 
              className="h-12 w-auto object-contain mix-blend-multiply opacity-90" 
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'single' 
                  ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Search size={16} />
              Verificação Única
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'batch' 
                  ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard size={16} />
              Verificação em Lote
            </button>
          </div>
        </div>

        {activeTab === 'single' && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Verificar Disponibilidade</h2>
                <p className="text-slate-500 mb-6">Insira a URL completa (ex: google.com) para testar a conexão.</p>
                
                <form onSubmit={handleSingleCheck} className="flex gap-3 mb-6">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="exemplo.com.br"
                      value={singleUrl}
                      onChange={(e) => setSingleUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isCheckingSingle || !singleUrl}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isCheckingSingle ? <RefreshCw className="animate-spin" /> : 'Verificar'}
                  </button>
                </form>

                {singleResult && (
                  <div className={`rounded-xl p-6 border-l-4 ${
                    singleResult.status === 'Online' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {singleResult.status === 'Online' 
                            ? <CheckCircle2 className="text-green-600" size={24} />
                            : <XCircle className="text-red-600" size={24} />
                          }
                          <h3 className={`text-lg font-bold ${
                            singleResult.status === 'Online' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {singleResult.status === 'Online' ? 'Site Operacional' : 'Site Indisponível'}
                          </h3>
                        </div>
                        <p className="text-slate-600 font-medium">{singleResult.url}</p>
                        {singleResult.isOpaque && (
                           <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                             <AlertCircle size={12} />
                             Acesso verificado via modo restrito (no-cors)
                           </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="block text-2xl font-bold text-slate-800 truncate max-w-[120px]" title={singleResult.code}>
                          {singleResult.code}
                        </span>
                        <span className="text-xs text-slate-500 uppercase font-semibold">Status Code</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200/50 flex gap-6 text-sm">
                      <div>
                        <span className="text-slate-400 block text-xs mb-0.5">Tempo de Resposta</span>
                        <span className="font-mono font-medium text-slate-700">{singleResult.time}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-xs mb-0.5">Última Checagem</span>
                        <span className="font-mono font-medium text-slate-700">{singleResult.timestamp}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {batchData.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileSpreadsheet className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload de Planilha</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  Carregue um arquivo Excel (.xlsx) ou CSV contendo URLs na primeira coluna.
                </p>
                <div className="flex justify-center">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    ref={fileInputRef}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isXLSXLoaded}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 flex items-center gap-3"
                  >
                    <Upload size={20} />
                    {isXLSXLoaded ? 'Selecionar Arquivo' : 'Carregando Biblioteca...'}
                  </button>
                </div>
                <p className="mt-6 text-xs text-slate-400">Suporta arquivos .xlsx e .csv</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col h-[600px]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Resultados da Análise</h3>
                    <p className="text-sm text-slate-500">
                      Processando {batchData.length} URLs • {Math.round(progress)}% Concluído
                    </p>
                  </div>
                  <div className="flex gap-3">
                      <button 
                      onClick={() => { setBatchData([]); setProgress(0); }}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      Nova Análise
                    </button>
                    <button 
                      onClick={exportToExcel}
                      disabled={isProcessingBatch || !isXLSXLoaded}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <Download size={16} />
                      Exportar Relatório
                    </button>
                  </div>
                </div>

                {isProcessingBatch && (
                  <div className="w-full bg-slate-100 h-1">
                    <div 
                      className="bg-blue-600 h-1 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">URL</th>
                        <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Código</th>
                        <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tempo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchData.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-6 text-sm font-medium text-slate-700 font-mono truncate max-w-xs" title={item.url}>
                            {item.url}
                          </td>
                          <td className="py-3 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              item.status === 'Online' 
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : item.status === 'Offline'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {item.status === 'Online' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                              {item.status === 'Offline' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                              {item.status === 'Verificando...' && <RefreshCw size={10} className="animate-spin" />}
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-sm text-slate-600 font-mono">
                            {item.isOpaque ? '200 (Restrito)' : item.code}
                          </td>
                          <td className="py-3 px-6 text-sm text-slate-600 font-mono">{item.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-12 py-8 bg-slate-900 text-slate-400 text-sm text-center">
        <p>© {new Date().getFullYear()} Inova Status Check. Desenvolvido para UFPR.</p>
        <p className="mt-1 text-xs opacity-60">Esta ferramenta é para fins educacionais e de monitoramento.</p>
      </footer>
    </div>
  );
};

export default App;