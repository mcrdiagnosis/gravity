import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, BrainCircuit, ChevronLeft } from 'lucide-react';
import { UnifiedInput } from './components/UnifiedInput';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { Timeline } from './components/Timeline';
import { SearchBar } from './components/SearchBar';
import { SettingsModal } from './components/SettingsModal';
import { StorageService } from './services/storage';
import { BottomNav } from './components/BottomNav';
import { EventListView } from './components/EventListView';
import { EventConfirmationModal } from './components/EventConfirmationModal';
import { CalendarService } from './services/calendar_actions';
import { AccessibilitySetup } from './components/AccessibilitySetup';
import type { GravityAnalysisResult, CalendarEvent, Attachment } from './types/analysis';
import { App as CapApp } from '@capacitor/app';
import { Filesystem } from '@capacitor/filesystem';
import RecentRecordings from './plugins/RecentRecordings';
import AccessibilityServiceManager from './plugins/AccessibilityServiceManager';
import { RecordingContextOverlay } from './components/RecordingContextOverlay';
import { useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { SyncService } from './services/SyncService';
import { LogOut } from 'lucide-react';

function App() {
  const { isAuthenticated, token, user, logout, isLoading: isAuthLoading } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Recording Scanner State
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [foundRecording, setFoundRecording] = useState<{ path: string; filename: string } | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'recordings' | 'calendar'>('recordings');

  // Data State
  const [analysisResult, setAnalysisResult] = useState<GravityAnalysisResult | null>(null);
  const [history, setHistory] = useState<GravityAnalysisResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingEvents, setPendingEvents] = useState<CalendarEvent[]>([]);
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>([]);

  const handleConfirmEvent = async () => {
    if (pendingEvents.length === 0) return;
    const currentEvent = pendingEvents[0];

    const result = await CalendarService.handleEventAction(currentEvent);

    if (result.success) {
      // Update event status in history using content-based matching
      const updatedHistory = history.map(h => {
        if (h.calendar_events) {
          const updatedEvents = h.calendar_events.map(e => {
            // Match by title and date since we don't have stable IDs
            if (e.title === currentEvent.title && e.start_date === currentEvent.start_date) {
              return {
                ...e,
                status: 'scheduled' as const,
                notificationId: result.notificationId
              };
            }
            return e;
          });
          return { ...h, calendar_events: updatedEvents };
        }
        return h;
      });

      setHistory(updatedHistory);
      // Persist changes
      await StorageService.saveHistory(updatedHistory);
      // Force reload to ensure UI reflects changes
      await loadHistory();

      // Force status update in current view if needed
      if (analysisResult && analysisResult.calendar_events) {
        const updated = updatedHistory.find(h => h.id === analysisResult.id);
        if (updated) {
          setAnalysisResult({ ...analysisResult, calendar_events: updated.calendar_events });
        }
      }
    }

    // Remove current and move to next
    setPendingEvents(prev => prev.slice(1));
  };

  const handleSkipEvent = () => {
    setPendingEvents(prev => prev.slice(1));
  };

  const handleCancelEvents = () => {
    setPendingEvents([]);
  };

  // Removed local gravity service in favor of SyncService

  const [shouldAutoStartRecording, setShouldAutoStartRecording] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
      // Check for recordings and actions on launch
      checkLaunchActions();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      // Listen for resume
      const resumeListener = CapApp.addListener('resume', checkLaunchActions);
      return () => {
        resumeListener.then(l => l.remove());
      };
    }
  }, [isAuthenticated]);


  const checkLaunchActions = async () => {
    console.error('📡 [VERSION-ULTIMATUM] checkLaunchActions: Consultando acciones...');

    // 1. Check for Notification Actions (PRIORITY)
    try {
      const result = await AccessibilityServiceManager.getLastAction();
      console.error('📡 [VERSION-ULTIMATUM] Resultado getLastAction:', JSON.stringify(result));

      if (result && result.action === 'record_notes') {
        console.error('🚀 [VERSION-ULTIMATUM] ACCIÓN DETECTADA: record_notes. Activando auto-start.');
        setShouldAutoStartRecording(true);
      }
    } catch (e) {
      console.error("❌ [VERSION-ULTIMATUM] Error consultando lastAction:", e);
    }

    // 2. Check for recent external recordings
    await checkRecentRecordings();
  };

  const checkRecentRecordings = async () => {
    try {
      console.error('📂 [VERSION-ULTIMATUM] Escaneando grabaciones recientes...');
      const result = await RecentRecordings.scanBrief();
      console.error('📁 [VERSION-ULTIMATUM] Resultado escaneo:', JSON.stringify(result));

      if (result && result.found && result.path && result.filename) {
        console.error('✨ [VERSION-ULTIMATUM] Grabación encontrada:', result.path);
        setFoundRecording({ path: result.path, filename: result.filename });
        setShowRecordingModal(true);
      }
    } catch (e) {
      console.error("❌ [VERSION-ULTIMATUM] Error escaneando grabaciones:", e);
    }
  };

  const loadHistory = async () => {
    if (!token) return;
    try {
      const data = await SyncService.getRecordings(token);
      // Backend returns them in slightly different format, mapping if needed
      // Assuming backend matches GravityAnalysisResult shape for now as defined in prisma
      setHistory(data.map((h: any) => ({
        ...h,
        id: h.id,
        executive_summary: {
          title: h.title,
          participants: h.participants,
          context: h.context,
          summary: h.summary
        },
        metadata: {
          category: h.category,
          sentiment: h.sentiment,
          keywords: [] // Keywords not stored separately yet
        },
        calendar_events: h.actions.map((a: any) => ({
          title: a.description,
          start_date: a.dueDate || '',
          status: a.isCompleted ? 'scheduled' : 'pending'
        }))
      })));
    } catch (e) {
      console.error('Error fetching cloud history', e);
      // Fallback to local
      const localData = await StorageService.getHistory();
      setHistory(localData);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the item
    if (confirm('¿Estás seguro de querer eliminar esta grabación y su audio?')) {
      await StorageService.deleteAnalysis(id);
      await loadHistory();
      // If we are currently viewing this item, close it
      if (analysisResult?.id === id) {
        setAnalysisResult(null);
      }
    }
  };

  const processAudio = async (file: File) => {
    if (!token) return;

    setIsProcessing(true);
    try {
      // 1. Sync with cloud backend
      console.log("☁️ Sincronizando con la nube de Gravity...");
      const cloudResult = await SyncService.uploadAndAnalyze(token, file, currentAttachments);

      // 2. Map backend response to frontend types
      const analysisData = JSON.parse(cloudResult.analysisJson);

      const result: GravityAnalysisResult = {
        id: cloudResult.id,
        executive_summary: analysisData.executive_summary,
        key_points: analysisData.key_points,
        mermaid_diagram: analysisData.mermaid_diagram,
        actions: analysisData.actions,
        transcript: cloudResult.transcript,
        metadata: analysisData.metadata,
        calendar_events: cloudResult.actions.map((a: any) => ({
          title: a.description,
          start_date: a.dueDate || '',
          status: a.isCompleted ? 'scheduled' : 'pending'
        })),
        duration: cloudResult.duration || 0,
        audioSize: file.size,
        attachments: currentAttachments
      };

      // 3. Keep local copy for offline view
      await StorageService.saveAnalysis(result, file);

      await loadHistory();
      setAnalysisResult(result);

      // Clear attachments after processing
      setCurrentAttachments([]);

      // Auto-Trigger Queue
      if (result.calendar_events && result.calendar_events.length > 0) {
        setPendingEvents(result.calendar_events);
      }

    } catch (error) {
      console.error(error);
      alert("Error en la sincronización. Verifica tu conexión.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    if (terms.length === 0) return true;

    return terms.every(term => {
      const inTitle = item.executive_summary.title.toLowerCase().includes(term);
      const inSummary = item.executive_summary.summary.toLowerCase().includes(term);
      const inKeywords = item.metadata.keywords.some(k => k.toLowerCase().includes(term));
      const inTranscript = item.transcript ? item.transcript.toLowerCase().includes(term) : false;
      return inTitle || inSummary || inKeywords || inTranscript;
    });
  });



  const handleManualRecording = async (path: string) => {
    try {
      alert('Iniciando procesamiento manual para: ' + path);
      console.log('Inicio procesamiento manual:', path);
      setIsProcessing(true);

      // Leemos el archivo usando Filesystem para evitar problemas de CORS/WebView
      const fileData = await Filesystem.readFile({
        path: path,
      });

      // Filesystem devuelve data como string base64 (si no se especifica encoding, suele ser string)
      const base64Sound = fileData.data;

      // Convertir Base64 a Blob
      const byteCharacters = atob(typeof base64Sound === 'string' ? base64Sound : '');
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/m4a' });

      const filename = path.split('/').pop() || 'manual_recording.m4a';
      const file = new File([blob], filename, { type: 'audio/m4a' });

      console.log('Archivo creado:', file.name, file.size);

      // Process using existing workflow
      await processAudio(file);
      setShouldAutoStartRecording(false);
    } catch (error) {
      console.error('Manual recording import failed:', error);
      alert('Error importando grabación manual: ' + JSON.stringify(error));
      setIsProcessing(false);
    }
  };

  // Main Render View Logic
  const renderContent = () => {
    // If showing specific result, that takes precedence over tabs
    if (analysisResult) {
      return <AnalysisDashboard data={analysisResult} highlightQuery={searchQuery} />;
    }

    if (activeTab === 'calendar') {
      return (
        <EventListView
          history={history}
          onSelectOriginal={(item) => {
            setAnalysisResult(item);
          }}
          onUpdateHistory={loadHistory}
        />
      );
    }

    // Default: Recordings Tab
    return (
      <div className="space-y-8 fade-in">
        {/* Search Bar - Above recording */}
        {history.length > 0 && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
          />
        )}

        {/* Accessibility Service Status */}
        <AccessibilitySetup />

        {/* Global Recording Overlay (Page 2) */}
        {shouldAutoStartRecording && (
          <RecordingContextOverlay
            onClose={() => setShouldAutoStartRecording(false)}
            onRecordingComplete={handleManualRecording}
            attachments={currentAttachments}
            onAttachmentsChange={setCurrentAttachments}
          />
        )}

        <div className="flex flex-col items-center justify-center space-y-8 pt-4 pb-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">Nueva Sesión</h2>
            <p className="text-slate-400">Analiza tus notas de voz y llamadas con IA.</p>
          </div>
          <UnifiedInput
            onFileSelected={processAudio}
            isProcessing={isProcessing}
            attachments={currentAttachments}
            onAttachmentsChange={setCurrentAttachments}
          />

        </div>

        <div className="pt-4 pb-20">
          <Timeline
            items={filteredHistory}
            onSelect={setAnalysisResult}
            onDelete={handleDelete}
          />
        </div>
        {/* Modal for Found Recording */}
        {showRecordingModal && foundRecording && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <div className="text-center">
                <div className="bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <SettingsIcon className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Nueva Llamada Detectada</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-[250px] mx-auto">
                  Se ha encontrado "{foundRecording.filename}". ¿Quieres analizarla?
                </p>

                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      setShowRecordingModal(false);
                      // Convert path to File object via fetch (Capacitor handles file://)
                      try {
                        setIsProcessing(true);
                        const response = await fetch(foundRecording.path);
                        const blob = await response.blob();
                        const file = new File([blob], foundRecording.filename, { type: 'audio/m4a' });
                        await processAudio(file);
                      } catch (e) {
                        alert('Error importando archivo: ' + e);
                        setIsProcessing(false);
                      }
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    ✨ Analizar con IA
                  </button>
                  <button
                    onClick={() => setShowRecordingModal(false)}
                    className="w-full text-slate-400 hover:text-white text-sm font-medium py-2"
                  >
                    Ignorar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <BrainCircuit className="w-16 h-16 text-indigo-500 animate-pulse" />
        <p className="text-slate-400 font-medium">Iniciando Gravity Cloud...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-white font-sans selection:bg-indigo-500/30">

      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {analysisResult && (
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Volver
                </button>
              )}
              {!analysisResult && (
                <div className="flex items-center gap-3">
                  <BrainCircuit className="w-8 h-8 text-indigo-400" />
                  <div className="flex flex-col">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      Gravity
                    </h1>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{user?.name || 'Usuario'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => logout()}
                className="p-2 hover:bg-red-500/10 rounded-full transition-colors group"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-400" />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                title="Ajustes"
              >
                <SettingsIcon className="w-6 h-6 text-slate-400 hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - with top padding for fixed header */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-32">
        {renderContent()}
      </div>

      {/* Event Confirmation Modal (Auto-Popup) */}
      {pendingEvents.length > 0 && (
        <EventConfirmationModal
          event={pendingEvents[0]}
          onConfirm={handleConfirmEvent}
          onSkip={handleSkipEvent}
          onCancel={handleCancelEvents}
        />
      )}

      {/* Bottom Navigation (Only show if not in detail view) */}
      {!analysisResult && (
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApiKeySaved={() => { }}
      />
    </div>
  );
}

export default App;
