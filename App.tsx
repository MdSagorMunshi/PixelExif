import React, { useState, useRef, useEffect } from 'react';
import { AppState, ParsedExifData, Theme } from './types';
import { SplashScreen } from './components/SplashScreen';
import { RetroButton } from './components/RetroButton';
import { ExifTerminal } from './components/ExifTerminal';
import { BatchView } from './components/BatchView';
import { CompareView } from './components/CompareView';
import { ModernUI } from './components/ModernUI';
import { parseFileExif } from './services/exifService';
import { playRetroSound } from './utils/sound';
import { Upload, Volume2, VolumeX, Info, Shield, Disc, Grid, List, History, Monitor } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.BOOTING);
  
  // State for multiple files
  const [files, setFiles] = useState<ParsedExifData[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  
  // Compare State
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  
  // Theme & Favorites
  const [theme, setTheme] = useState<Theme>('green');
  const [favorites, setFavorites] = useState<ParsedExifData[]>(() => {
    const saved = localStorage.getItem('pixelExif_favs');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Modern Mode State
  const [isModern, setIsModern] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply Theme
  useEffect(() => {
    if (isModern) {
        document.body.className = 'modern-mode';
    } else {
        document.body.className = `theme-${theme}`;
    }
  }, [theme, isModern]);

  // Keybind for Modern Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'm') {
            e.preventDefault();
            setIsModern(prev => !prev);
            if (!isMuted) playRetroSound('success');
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMuted]);

  // Save Favorites
  useEffect(() => {
    // Strip blobs before saving to local storage to prevent quota errors
    const safeFavs = favorites.map(({ blob, ...rest }) => rest);
    localStorage.setItem('pixelExif_favs', JSON.stringify(safeFavs));
  }, [favorites]);

  // Paste Support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files.length) {
         processFiles(Array.from(e.clipboardData.files));
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted) playRetroSound('click');
  };

  const handleBootComplete = () => {
    setAppState(AppState.IDLE);
  };

  const processFiles = async (fileList: File[]) => {
    if (!isMuted) playRetroSound('click');
    setAppState(AppState.PROCESSING);
    
    try {
      // Small retro delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const promises = fileList.map(f => parseFileExif(f));
      const results = await Promise.all(promises);
      
      setFiles(prev => [...prev, ...results]);
      
      if (!isMuted) playRetroSound('success');
      
      // If single file and no previous files, view it directly
      if (results.length === 1 && files.length === 0 && !isModern) {
        setActiveFileId(results[0].id);
        setAppState(AppState.VIEWING_SINGLE);
      } else {
        setAppState(AppState.VIEWING_BATCH);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Unknown error occurred');
      if (!isMuted) playRetroSound('error');
      setAppState(AppState.ERROR);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (appState === AppState.BOOTING) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const toggleFavorite = (data: ParsedExifData) => {
     if (favorites.some(f => f.id === data.id)) {
        setFavorites(favorites.filter(f => f.id !== data.id));
     } else {
        setFavorites([...favorites, data]);
     }
  };

  const switchTheme = () => {
     const themes: Theme[] = ['green', 'amber', 'magenta', 'bw'];
     const currentIdx = themes.indexOf(theme);
     setTheme(themes[(currentIdx + 1) % themes.length]);
     if (!isMuted) playRetroSound('click');
  };

  // View Routing Logic
  const renderMainContent = () => {
    switch (appState) {
      case AppState.IDLE:
        return (
          <div className="text-center w-full max-w-lg">
              <div 
                className="bg-[#c0c0c0] border-t-white border-l-white border-b-[#404040] border-r-[#404040] border-4 p-8 flex flex-col items-center cursor-pointer hover:bg-[#d0d0d0] active:border-t-[#404040] active:border-l-[#404040] active:border-b-white active:border-r-white transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mb-4 relative">
                  <div className="w-20 h-20 bg-yellow-200 border-4 border-black border-r-8 border-b-8 skew-x-[-10deg] flex items-center justify-center">
                    <Upload size={40} className="text-black" />
                  </div>
                </div>
                <h1 className="font-pixel text-black text-xl mb-2">DRAG IMAGES HERE</h1>
                <p className="font-terminal text-black text-xl mb-6">- OR PASTE / CLICK -</p>
                <p className="text-gray-600 font-pixel text-xs mt-4">SUPPORTS: JPG, PNG, WEBP, GIF, RAW</p>
              </div>
          </div>
        );
        
      case AppState.PROCESSING:
        return (
          <div className="w-full max-w-md bg-black border-2 border-[var(--primary-color)] p-4 text-[var(--primary-color)] font-terminal shadow-[0_0_20px_var(--primary-color)]">
              <h2 className="text-xl mb-4 animate-pulse">PROCESSING_DATA...</h2>
              <div className="w-full h-6 border-2 border-[var(--primary-color)] p-1">
                <div className="h-full bg-[var(--primary-color)] animate-[width_1.5s_ease-in-out_forwards] w-0"></div>
              </div>
          </div>
        );

      case AppState.VIEWING_SINGLE:
        const currentFile = files.find(f => f.id === activeFileId) || favorites.find(f => f.id === activeFileId);
        if (!currentFile) return <div>ERR: FILE NOT FOUND</div>;
        return (
           <div className="w-full h-[80vh]">
              <ExifTerminal 
                data={currentFile} 
                onClose={() => {
                  setActiveFileId(null);
                  setAppState(files.length > 1 ? AppState.VIEWING_BATCH : AppState.IDLE);
                }}
                onToggleFavorite={toggleFavorite}
                isFavorite={favorites.some(f => f.id === currentFile.id)}
              />
           </div>
        );

      case AppState.VIEWING_BATCH:
        return (
           <div className="w-full h-[80vh]">
              <BatchView 
                 files={files}
                 onSelect={(id) => { setActiveFileId(id); setAppState(AppState.VIEWING_SINGLE); }}
                 onRemove={(id) => {
                    const newFiles = files.filter(f => f.id !== id);
                    setFiles(newFiles);
                    if (newFiles.length === 0) setAppState(AppState.IDLE);
                 }}
                 onClear={() => { setFiles([]); setAppState(AppState.IDLE); }}
                 onCompare={(ids: any) => {
                    if (Array.isArray(ids) && ids.length === 2) {
                       setCompareIds(ids as [string, string]);
                       setAppState(AppState.COMPARE);
                    }
                 }}
              />
           </div>
        );

      case AppState.HISTORY:
        return (
           <div className="w-full h-[80vh] flex flex-col items-center">
              <h2 className="font-pixel text-[var(--primary-color)] mb-4">FAVORITES ({favorites.length})</h2>
              {favorites.length === 0 ? (
                 <p className="font-terminal text-[var(--primary-color)]">NO SAVED ITEMS. CLICK THE HEART ICON IN VIEWER.</p>
              ) : (
                 <BatchView 
                    files={favorites}
                    onSelect={(id) => { setActiveFileId(id); setAppState(AppState.VIEWING_SINGLE); }}
                    onRemove={(id) => toggleFavorite({ id } as ParsedExifData)}
                    onClear={() => setFavorites([])}
                    onCompare={(ids: any) => {
                       if (Array.isArray(ids) && ids.length === 2) {
                         setCompareIds(ids as [string, string]);
                         setAppState(AppState.COMPARE);
                       }
                    }}
                 />
              )}
              <RetroButton onClick={() => setAppState(files.length > 0 ? AppState.VIEWING_BATCH : AppState.IDLE)} className="mt-4">BACK</RetroButton>
           </div>
        );

      case AppState.COMPARE:
         if (!compareIds) return null;
         const left = files.find(f => f.id === compareIds[0]) || favorites.find(f => f.id === compareIds[0]);
         const right = files.find(f => f.id === compareIds[1]) || favorites.find(f => f.id === compareIds[1]);
         if (!left || !right) return <div>ERR: COMPARE DATA MISSING</div>;
         
         return (
            <div className="w-full h-[80vh]">
               <CompareView 
                  left={left} 
                  right={right} 
                  onBack={() => setAppState(AppState.VIEWING_BATCH)} 
               />
            </div>
         );

      case AppState.ERROR:
        return (
            <div className="bg-[#000080] text-white p-8 border-4 border-white shadow-xl max-w-md text-center font-pixel">
              <h2 className="text-xl bg-white text-[#000080] px-2 mb-4">FATAL ERROR</h2>
              <p className="font-terminal text-lg mb-6">{errorMsg}</p>
              <div className="flex justify-center gap-4">
                 <RetroButton onClick={() => {
                   setAppState(AppState.IDLE);
                   setErrorMsg('');
                 }}>RESTART</RetroButton>
              </div>
            </div>
        );
        
      default: return null;
    }
  };

  // Render Functions
  if (appState === AppState.BOOTING && !isModern) {
    return <SplashScreen onComplete={handleBootComplete} muted={isMuted} />;
  }
  
  // SHARED INPUT
  const fileInput = (
     <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        className="hidden" 
        multiple
        accept="image/*,.heic,.heif,.cr2,.nef,.arw,.dng,.tiff,.bmp"
     />
  );

  // MODERN MODE RENDER
  if (isModern) {
    return (
        <>
            <ModernUI 
                files={files}
                favorites={favorites}
                onUpload={onFileChange}
                onDrop={onDrop}
                onDelete={(ids) => setFiles(files.filter(f => !ids.includes(f.id)))}
                onClear={() => setFiles([])}
                onToggleFavorite={toggleFavorite}
                fileInputRef={fileInputRef}
                isMuted={isMuted}
                toggleMute={toggleMute}
            />
            {fileInput}
        </>
    );
  }

  // RETRO MODE RENDER
  return (
    <div 
      className="min-h-screen bg-[var(--bg-color)] text-[#c0c0c0] font-sans overflow-hidden flex flex-col"
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* Windows 95 Style Navbar */}
      <nav className="bg-[#c0c0c0] border-b-4 border-white border-b-[#808080] p-2 flex justify-between items-center select-none shadow-md z-30">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-blue-700 to-blue-900 w-8 h-8 flex items-center justify-center border-2 border-white shadow-inner">
            <Disc size={20} className="text-white" />
          </div>
          <span className="font-pixel font-bold text-black text-lg hidden sm:inline">PixelExif 98</span>
        </div>
        
        <div className="flex gap-2">
           <RetroButton onClick={switchTheme} className="!px-2 !py-1" title="Change Theme">
              <Monitor size={16} />
           </RetroButton>
           <RetroButton onClick={() => setAppState(AppState.HISTORY)} className="!px-2 !py-1" title="Favorites">
              <History size={16} />
           </RetroButton>
           {files.length > 0 && (
             <RetroButton onClick={() => setAppState(AppState.VIEWING_BATCH)} className="!px-2 !py-1" title="Current Batch">
               <List size={16} />
             </RetroButton>
           )}
           <RetroButton onClick={toggleMute} className="!px-2 !py-1">
             {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
           </RetroButton>
           <RetroButton onClick={() => setShowAbout(true)} className="!px-2 !py-1">
             <Info size={16} />
           </RetroButton>
        </div>
      </nav>

      {/* Main Desktop Area */}
      <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center relative z-20 overflow-y-auto">
        
        {/* About Modal */}
        {showAbout && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowAbout(false)}>
             <div className="bg-[#c0c0c0] border-2 border-white border-r-black border-b-black p-1 w-[90%] max-w-lg" onClick={e => e.stopPropagation()}>
               <div className="bg-[#000080] text-white px-2 py-1 font-pixel flex justify-between items-center">
                 <span>About PixelExif</span>
                 <button onClick={() => setShowAbout(false)} className="bg-[#c0c0c0] text-black px-1 border border-white border-b-black border-r-black text-xs">X</button>
               </div>
               <div className="p-4 text-black font-terminal text-lg leading-tight">
                 <pre className="text-xs mb-4 text-center font-bold">
{`
 ____  _          _ _____      _  __
|  _ \\(_)_  _____| | ____|__ _(_)/ _|
| |_) | \\ \\/ / _ \\ |  _| \\ \\/ / | |_ 
|  __/| |>  <  __/ | |___ >  <| |  _|
|_|   |_/_/\\_\\___|_|_____/_/\\_\\_|_|  
`}
                 </pre>
                 <p className="mb-4">Version 2.0.0 Pro</p>
                 
                 <div className="border-2 border-black p-2 mb-4 bg-[#fff]">
                    <p className="font-bold underline mb-1">DEVELOPER:</p>
                    <p>Ryan Shelby</p>
                    <div className="text-sm mt-1">
                      <p>GitHub: MdSagorMunshi</p>
                      <p>GitLab: rynex</p>
                      <p>Telegram: leesiwoo_s</p>
                    </div>
                 </div>
                 <div className="mt-4 flex justify-end">
                   <RetroButton onClick={() => setShowAbout(false)}>OK</RetroButton>
                 </div>
               </div>
             </div>
          </div>
        )}

        {/* Privacy Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#000] border border-[var(--primary-color)] text-[var(--primary-color)] px-4 py-2 font-pixel text-xs flex items-center gap-2 shadow-[0_0_10px_var(--primary-color)] animate-pulse opacity-80 pointer-events-none z-10">
          <Shield size={14} />
          <span>OFFLINE MODE // LOCAL ONLY</span>
        </div>

        {/* Main Content Switch */}
        <div className="w-full max-w-4xl h-full flex flex-col items-center justify-center min-h-[400px]">
           {renderMainContent()}
           {fileInput}
        </div>
      </main>

      {/* Footer / Taskbar */}
      <footer className="bg-[#c0c0c0] border-t-2 border-white p-1 flex justify-between items-center text-xs font-sans text-black select-none z-30">
        <div className="border border-gray-500 border-b-white border-r-white px-2 py-0.5 inset-shadow bg-[#d4d0c8]">
          READY
        </div>
        <div className="flex gap-4 px-2">
           <span>{files.length} ITEMS</span>
           <span>{new Date().toLocaleDateString()}</span>
           <span>THEME: {theme.toUpperCase()}</span>
        </div>
      </footer>
      
      <style>{`
        @keyframes width { from { width: 0%; } to { width: 100%; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pixelated { image-rendering: pixelated; }
        .inset-shadow { box-shadow: inset 1px 1px 0px #000, inset -1px -1px 0px #fff; }
      `}</style>
    </div>
  );
};

export default App;