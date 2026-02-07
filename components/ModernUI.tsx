import React, { useState, useMemo } from 'react';
import { ParsedExifData } from '../types';
import { 
  Upload, Image as ImageIcon, MapPin, Camera, Aperture, 
  Maximize2, Shield, Hash, Layers, ChevronRight, X, Heart,
  Download, RefreshCw, Copy, Check, Volume2, VolumeX, Info, 
  Trash2, Code, Split, CheckSquare, Settings, ArrowLeft,
  Search, Filter, Calendar, SortAsc, SortDesc
} from 'lucide-react';
import { generateChecksum, generateMD5, generateCRC32, downloadFile } from '../utils/imageProcessing';

interface ModernUIProps {
  files: ParsedExifData[];
  favorites: ParsedExifData[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDelete: (ids: string[]) => void;
  onClear: () => void;
  onToggleFavorite: (data: ParsedExifData) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isMuted: boolean;
  toggleMute: () => void;
}

export const ModernUI: React.FC<ModernUIProps> = ({ 
  files, favorites, onUpload, onDrop, onDelete, onClear, onToggleFavorite, fileInputRef, isMuted, toggleMute 
}) => {
  const [viewId, setViewId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'info' | 'gps' | 'tech' | 'raw'>('info');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Filtering & Sorting State
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCamera, setFilterCamera] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Derived state for the inspector
  const activeFile = useMemo(() => 
    files.find(f => f.id === viewId) || favorites.find(f => f.id === viewId), 
  [files, favorites, viewId]);

  // Unique options for filters
  const cameras = useMemo(() => Array.from(new Set(files.map(f => f.model).filter(Boolean))).sort(), [files]);
  const fileTypes = useMemo(() => Array.from(new Set(files.map(f => f.mimeType.split('/')[1]?.toUpperCase()).filter(Boolean))).sort(), [files]);

  const filteredFiles = useMemo(() => {
    let result = files;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(f => f.filename.toLowerCase().includes(q));
    }

    // Camera Filter
    if (filterCamera !== 'all') {
      result = result.filter(f => f.model === filterCamera);
    }

    // File Type Filter
    if (filterType !== 'all') {
      result = result.filter(f => f.mimeType.toUpperCase().includes(filterType));
    }

    // Date Range Filter
    if (dateStart) {
        // Exif format: "YYYY:MM:DD HH:MM:SS" -> Comparable string "YYYY-MM-DD"
        result = result.filter(f => {
            if (!f.dateTimeOriginal) return false;
            const fileDate = f.dateTimeOriginal.substring(0, 10).replace(/:/g, '-');
            return fileDate >= dateStart;
        });
    }
    if (dateEnd) {
        result = result.filter(f => {
            if (!f.dateTimeOriginal) return false;
            const fileDate = f.dateTimeOriginal.substring(0, 10).replace(/:/g, '-');
            return fileDate <= dateEnd;
        });
    }

    // Sorting
    return result.sort((a, b) => {
       switch (sort) {
         case 'newest': return (b.dateTimeOriginal || '').localeCompare(a.dateTimeOriginal || '');
         case 'oldest': return (a.dateTimeOriginal || '').localeCompare(b.dateTimeOriginal || '');
         case 'name': return a.filename.localeCompare(b.filename);
         case 'size': return (b.blob?.size || 0) - (a.blob?.size || 0);
         default: return 0;
       }
    });
  }, [files, search, sort, filterCamera, filterType, dateStart, dateEnd]);

  const toggleCheck = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSet = new Set(checkedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCheckedIds(newSet);
  };

  const handleBatchDelete = () => {
    onDelete(Array.from(checkedIds));
    setCheckedIds(new Set());
    if (activeFile && checkedIds.has(activeFile.id)) setViewId(null);
  };

  const handleExportCSV = () => {
    const targetFiles = checkedIds.size > 0 
        ? files.filter(f => checkedIds.has(f.id)) 
        : files;
    
    if (targetFiles.length === 0) return;

    const headers = ['Filename', 'Date', 'Camera', 'Lens', 'ISO', 'Aperture', 'Shutter', 'GPS'];
    const rows = targetFiles.map(f => [
      f.filename,
      f.dateTimeOriginal || 'N/A',
      `${f.make || ''} ${f.model || ''}`,
      f.lens || '',
      f.iso || '',
      f.fNumber || '',
      f.exposureTime || '',
      f.gps ? `${f.gps.latitude},${f.gps.longitude}` : ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    downloadFile(csvContent, 'pixel_exif_export.csv', 'text/csv');
  };

  const handleGenerateScript = () => {
    const targetFiles = checkedIds.size > 0 
        ? files.filter(f => checkedIds.has(f.id)) 
        : files;

    if (targetFiles.length === 0) return;

    let script = "#!/bin/bash\n# Rename script generated by PixelExif\n\n";
    targetFiles.forEach(f => {
      if (f.dateTimeOriginal) {
        const dateStr = f.dateTimeOriginal.replace(/:/g, '-').replace(' ', '_');
        const ext = f.filename.split('.').pop();
        const newName = `${dateStr}_${f.model?.replace(/ /g, '') || 'IMG'}.${ext}`;
        script += `mv "${f.filename}" "${newName}"\n`;
      }
    });
    downloadFile(script, 'rename_files.sh', 'text/plain');
  };

  const startCompare = () => {
    if (checkedIds.size === 2) {
      setIsCompareMode(true);
    }
  };

  if (isCompareMode) {
     const selected = files.filter(f => checkedIds.has(f.id));
     return (
        <ModernCompareView 
          left={selected[0]} 
          right={selected[1]} 
          onBack={() => setIsCompareMode(false)} 
        />
     );
  }

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-500 relative"
      onDrop={onDrop}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
              <Camera className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">PixelExif <span className="text-indigo-600">Pro</span></span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
             <div className="hidden lg:flex text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full items-center gap-2">
                <Shield size={12} className="text-emerald-500" />
                Local & Encrypted
             </div>
             <button onClick={toggleMute} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
             </button>
             <button onClick={() => setShowAbout(true)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                <Info size={20} />
             </button>
             <div className="h-6 w-px bg-slate-200 mx-1"></div>
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
             >
                <Upload size={16} /> Upload
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex gap-6">
        
        {/* Left Column: Gallery / List */}
        <div className={`flex-1 transition-all duration-500 flex flex-col ${viewId ? 'w-1/2 hidden md:flex' : 'w-full'}`}>
           <div className="flex justify-between items-end mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500 text-sm mt-1">{filteredFiles.length} Active Files • {favorites.length} Favorites</p>
              </div>
              <div className="flex gap-2">
                 {files.length > 0 && (
                     <button onClick={onClear} className="text-xs font-medium text-slate-400 hover:text-red-500 px-3 py-1 border border-transparent hover:border-red-100 hover:bg-red-50 rounded-full transition-all">
                        Clear All
                     </button>
                 )}
              </div>
           </div>

           {files.length === 0 && favorites.length === 0 ? (
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-12 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group"
             >
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Upload className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Drop images here</h3>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">Support for JPG, PNG, RAW, WEBP. <br/> Everything is processed instantly in your browser.</p>
             </div>
           ) : (
             <div className="flex flex-col h-full overflow-hidden">
                {/* Modern Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search filenames..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                            title="Filter Options"
                        >
                            <Filter size={20} />
                        </button>
                        <div className="h-8 w-px bg-slate-100 mx-1"></div>
                        <select 
                            value={sort}
                            onChange={(e) => setSort(e.target.value as any)}
                            className="bg-slate-50 text-slate-600 text-sm py-2 px-3 rounded-lg outline-none border-r-8 border-transparent cursor-pointer hover:bg-slate-100"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="size">Size (Big-Small)</option>
                        </select>
                    </div>
                    
                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-2 pt-0 animate-in slide-in-from-top-2">
                             <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Camera Model</label>
                                <select 
                                    value={filterCamera} 
                                    onChange={e => setFilterCamera(e.target.value)}
                                    className="w-full text-sm p-2 bg-slate-50 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="all">All Cameras</option>
                                    {cameras.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                             </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">File Type</label>
                                <select 
                                    value={filterType} 
                                    onChange={e => setFilterType(e.target.value)}
                                    className="w-full text-sm p-2 bg-slate-50 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="all">All Types</option>
                                    {fileTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                             </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Start Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                    <input 
                                        type="date" 
                                        value={dateStart}
                                        onChange={e => setDateStart(e.target.value)}
                                        className="w-full text-xs p-2 pl-8 bg-slate-50 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600"
                                    />
                                </div>
                             </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">End Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                    <input 
                                        type="date" 
                                        value={dateEnd}
                                        onChange={e => setDateEnd(e.target.value)}
                                        className="w-full text-xs p-2 pl-8 bg-slate-50 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600"
                                    />
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pb-32 pr-2 custom-modern-scroll content-start">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Active Files */}
                        {filteredFiles.map(file => (
                        <FileCard 
                            key={file.id} 
                            file={file} 
                            isSelected={viewId === file.id}
                            isChecked={checkedIds.has(file.id)}
                            onCheck={(e) => toggleCheck(file.id, e)}
                            onClick={() => setViewId(file.id)}
                            onDelete={() => onDelete([file.id])}
                        />
                        ))}
                        {/* Favorites Section if files exist */}
                        {favorites.length > 0 && !search && filterCamera === 'all' && filterType === 'all' && !dateStart && !dateEnd && (
                        <div className="col-span-full mt-8 mb-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Heart size={12} className="text-rose-500" /> Saved Favorites
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {favorites.map(file => (
                                    <FileCard 
                                    key={file.id} 
                                    file={file} 
                                    isSelected={viewId === file.id} 
                                    isChecked={checkedIds.has(file.id)}
                                    onCheck={(e) => toggleCheck(file.id, e)}
                                    onClick={() => setViewId(file.id)}
                                    onDelete={() => onToggleFavorite(file)}
                                    isFav
                                    />
                                ))}
                            </div>
                        </div>
                        )}
                        {filteredFiles.length === 0 && favorites.length === 0 && (
                            <div className="col-span-full text-center py-20 text-slate-400">
                                <p>No files match your filters.</p>
                                <button onClick={() => { setSearch(''); setFilterCamera('all'); setFilterType('all'); setDateStart(''); setDateEnd(''); }} className="text-indigo-500 text-sm mt-2 hover:underline">Reset Filters</button>
                            </div>
                        )}
                    </div>
                </div>
             </div>
           )}
        </div>

        {/* Right Column: Inspector */}
        {viewId && activeFile && (
          <div className="w-full md:w-[400px] xl:w-[480px] bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col overflow-hidden animate-slide-in absolute md:relative z-20 h-full">
             {/* Preview Header */}
             <ModernImagePreview 
                file={activeFile} 
                onClose={() => setViewId(null)} 
                isFav={favorites.some(f => f.id === activeFile.id)}
                onToggleFav={() => onToggleFavorite(activeFile)}
             />

             {/* Tab Navigation */}
             <div className="flex border-b border-slate-100 px-4">
               {['info', 'tech', 'gps', 'raw'].map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab as any)}
                   className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                     activeTab === tab 
                     ? 'border-indigo-600 text-indigo-600' 
                     : 'border-transparent text-slate-500 hover:text-slate-800'
                   }`}
                 >
                   {tab}
                 </button>
               ))}
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6 custom-modern-scroll bg-slate-50/50">
               {activeTab === 'info' && <InfoPanel data={activeFile} />}
               {activeTab === 'tech' && <TechPanel data={activeFile} />}
               {activeTab === 'gps' && <GPSPanel data={activeFile} />}
               {activeTab === 'raw' && <RawPanel data={activeFile} />}
             </div>
          </div>
        )}
      </main>

      {/* Floating Action Bar */}
      {checkedIds.size > 0 && (
         <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-slide-up z-50">
             <span className="text-sm font-medium border-r border-slate-700 pr-4">{checkedIds.size} Selected</span>
             
             {checkedIds.size === 2 && (
               <button onClick={startCompare} className="flex items-center gap-2 hover:text-indigo-400 transition-colors text-sm">
                  <Split size={16} /> Compare
               </button>
             )}
             
             <button onClick={handleExportCSV} className="flex items-center gap-2 hover:text-emerald-400 transition-colors text-sm">
                <Download size={16} /> CSV
             </button>
             
             <button onClick={handleGenerateScript} className="flex items-center gap-2 hover:text-amber-400 transition-colors text-sm">
                <Code size={16} /> Script
             </button>
             
             <button onClick={handleBatchDelete} className="flex items-center gap-2 hover:text-red-400 transition-colors text-sm pl-2 border-l border-slate-700">
                <Trash2 size={16} /> Delete
             </button>

             <button onClick={() => setCheckedIds(new Set())} className="ml-2 bg-white/20 hover:bg-white/30 rounded-full p-1">
                <X size={14} />
             </button>
         </div>
      )}

      {/* About Modal */}
      {showAbout && <ModernAbout onClose={() => setShowAbout(false)} />}
      
      <style>{`
        .custom-modern-scroll::-webkit-scrollbar { width: 6px; }
        .custom-modern-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-modern-scroll::-webkit-scrollbar-track { background: transparent; }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
        @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

// --- Subcomponents ---

const FileCard = ({ file, isSelected, isChecked, onCheck, onClick, onDelete, isFav }: any) => (
  <div 
    onClick={onClick}
    className={`group relative bg-white rounded-xl shadow-sm border transition-all cursor-pointer overflow-hidden ${
       isSelected ? 'ring-2 ring-indigo-500 border-transparent shadow-md scale-[1.02]' : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
    } ${isChecked ? 'bg-indigo-50 border-indigo-200' : ''}`}
  >
     <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {file.thumbnailUrl ? (
           <img src={file.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
        ) : (
           <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ImageIcon size={32} />
           </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
        
        {/* Checkbox Overlay */}
        <button 
           onClick={onCheck}
           className={`absolute top-2 left-2 p-1.5 rounded-lg shadow-sm transition-all z-10 ${
             isChecked ? 'bg-indigo-600 text-white opacity-100' : 'bg-white/90 text-slate-400 opacity-0 group-hover:opacity-100'
           }`}
        >
           <Check size={14} />
        </button>

        <button 
           onClick={(e) => { e.stopPropagation(); onDelete(); }}
           className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-white shadow-sm z-10"
        >
           {isFav ? <Heart size={14} fill="currentColor" className="text-rose-500" /> : <X size={14} />}
        </button>
     </div>
     <div className="p-3">
        <h4 className="font-medium text-sm text-slate-800 truncate">{file.filename}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{file.dateTimeOriginal?.split(' ')[0] || 'Unknown Date'}</p>
     </div>
  </div>
);

const ModernImagePreview = ({ file, onClose, isFav, onToggleFav }: any) => {
    const [filter, setFilter] = useState('none');
    
    return (
        <div className="relative h-64 bg-slate-900 flex items-center justify-center group overflow-hidden">
            {file.thumbnailUrl ? (
                <img 
                    src={file.thumbnailUrl} 
                    className={`w-full h-full object-contain transition-all duration-300 ${filter}`} 
                    style={{ filter: filter === 'sepia' ? 'sepia(1)' : filter === 'grayscale' ? 'grayscale(1)' : 'none' }}
                    alt="Preview" 
                />
            ) : (
                <ImageIcon className="text-slate-700 w-16 h-16" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 pointer-events-none"></div>

            {/* Filter Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setFilter('none')} className={`px-2 py-1 text-[10px] rounded backdrop-blur-md border ${filter === 'none' ? 'bg-white text-black border-white' : 'bg-black/30 text-white border-white/30'}`}>Norm</button>
                <button onClick={() => setFilter('grayscale')} className={`px-2 py-1 text-[10px] rounded backdrop-blur-md border ${filter === 'grayscale' ? 'bg-white text-black border-white' : 'bg-black/30 text-white border-white/30'}`}>B&W</button>
                <button onClick={() => setFilter('sepia')} className={`px-2 py-1 text-[10px] rounded backdrop-blur-md border ${filter === 'sepia' ? 'bg-white text-black border-white' : 'bg-black/30 text-white border-white/30'}`}>Sepia</button>
            </div>

            {/* Top Actions */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button onClick={onToggleFav} className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition-colors text-white">
                    <Heart size={18} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-rose-500" : ""} />
                </button>
                <button onClick={onClose} className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition-colors text-white">
                    <Maximize2 size={18} />
                </button>
                <button onClick={onClose} className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition-colors text-white">
                    <X size={18} />
                </button>
            </div>

            <div className="absolute bottom-4 left-4 text-white pointer-events-none">
                <h2 className="font-bold truncate max-w-[250px]" title={file.filename}>{file.filename}</h2>
                <p className="text-xs text-slate-300">{file.dimensions || 'Unknown Size'} • {file.fileSize}</p>
            </div>
        </div>
    );
}

const ModernCompareView = ({ left, right, onBack }: { left: ParsedExifData, right: ParsedExifData, onBack: () => void }) => {
    const fields = [
        { k: 'filename', l: 'Filename' },
        { k: 'dateTimeOriginal', l: 'Date Taken' },
        { k: 'model', l: 'Camera Model' },
        { k: 'lens', l: 'Lens' },
        { k: 'iso', l: 'ISO' },
        { k: 'fNumber', l: 'Aperture' },
        { k: 'exposureTime', l: 'Shutter Speed' },
        { k: 'focalLength', l: 'Focal Length' },
        { k: 'fileSize', l: 'File Size' },
        { k: 'dimensions', l: 'Dimensions' }
    ];

    const getValue = (obj: any, key: string) => obj[key] || '-';
    const isDiff = (key: string) => getValue(left, key) !== getValue(right, key);

    return (
        <div className="fixed inset-0 bg-slate-50 z-50 overflow-auto flex flex-col animate-slide-in">
            <header className="sticky top-0 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft /></button>
                    <h1 className="text-xl font-bold text-slate-800">Compare Files</h1>
                </div>
            </header>
            <div className="max-w-6xl mx-auto w-full p-8">
                <div className="grid grid-cols-3 gap-8 mb-8">
                    <div className="col-start-2 text-center">
                         <div className="h-40 w-full bg-slate-200 rounded-lg mb-4 overflow-hidden">
                             {left.thumbnailUrl && <img src={left.thumbnailUrl} className="w-full h-full object-contain" />}
                         </div>
                         <h3 className="font-bold text-lg">{left.filename}</h3>
                    </div>
                    <div className="text-center">
                         <div className="h-40 w-full bg-slate-200 rounded-lg mb-4 overflow-hidden">
                             {right.thumbnailUrl && <img src={right.thumbnailUrl} className="w-full h-full object-contain" />}
                         </div>
                         <h3 className="font-bold text-lg">{right.filename}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {fields.map((f, i) => {
                        const diff = isDiff(f.k);
                        return (
                            <div key={f.k} className={`grid grid-cols-3 border-b border-slate-100 py-4 px-6 ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>
                                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center">{f.l}</div>
                                <div className={`font-mono text-sm ${diff ? 'text-indigo-600 font-semibold bg-indigo-50 p-1 rounded w-fit' : 'text-slate-700'}`}>{getValue(left, f.k)}</div>
                                <div className={`font-mono text-sm ${diff ? 'text-indigo-600 font-semibold bg-indigo-50 p-1 rounded w-fit' : 'text-slate-700'}`}>{getValue(right, f.k)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const ModernAbout = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white text-center">
                <Camera size={48} className="mx-auto mb-4 opacity-90" />
                <h2 className="text-2xl font-bold mb-1">PixelExif Pro</h2>
                <p className="text-indigo-100 text-sm">v2.0.0 Modern Edition</p>
            </div>
            <div className="p-6 space-y-4">
                <p className="text-slate-600 text-center leading-relaxed">
                    A privacy-first, client-side EXIF viewer built with modern web technologies. 
                    No data ever leaves your device.
                </p>
                
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Developer</span>
                        <span className="font-medium text-slate-800">Ryan Shelby</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Stack</span>
                        <span className="font-medium text-slate-800">React 19, Tailwind, Vite</span>
                    </div>
                </div>

                <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
                    Close
                </button>
            </div>
        </div>
    </div>
);

// Detail Panels
const InfoPanel = ({ data }: { data: ParsedExifData }) => {
   const [hashes, setHashes] = useState<any>({});
   const [loading, setLoading] = useState(false);

   const calcHashes = async () => {
      if(!data.blob) return;
      setLoading(true);
      const [sha256, md5, crc32] = await Promise.all([
         generateChecksum(data.blob, 'SHA-256'),
         generateMD5(data.blob),
         generateCRC32(data.blob)
      ]);
      setHashes({ sha256, md5, crc32 });
      setLoading(false);
   };

   return (
      <div className="space-y-6">
         <Section title="Basic Info" icon={<Layers size={16} />}>
            <Item label="File Type" value={data.mimeType} />
            <Item label="File Size" value={data.fileSize} />
            <Item label="Created" value={data.dateTimeOriginal} />
            <Item label="Dimensions" value={data.dimensions} />
         </Section>

         <Section title="Integrity Check" icon={<Shield size={16} />}>
            {!hashes.sha256 ? (
               <button 
                  onClick={calcHashes} 
                  disabled={loading}
                  className="w-full py-2 px-4 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
               >
                  {loading ? <RefreshCw className="animate-spin" size={14} /> : <Hash size={14} />}
                  {loading ? 'Calculating...' : 'Generate Checksums'}
               </button>
            ) : (
               <div className="space-y-3">
                  <HashItem label="MD5" val={hashes.md5} />
                  <HashItem label="SHA-256" val={hashes.sha256} />
                  <HashItem label="CRC32" val={hashes.crc32} />
               </div>
            )}
         </Section>
      </div>
   );
};

const TechPanel = ({ data }: { data: ParsedExifData }) => (
   <div className="space-y-6">
      <Section title="Camera Gear" icon={<Camera size={16} />}>
         <Item label="Make" value={data.make} />
         <Item label="Model" value={data.model} />
         <Item label="Lens" value={data.lens} />
         <Item label="Software" value={data.software} />
      </Section>
      <Section title="Shot Settings" icon={<Aperture size={16} />}>
         <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <span className="block text-xs text-slate-400 uppercase">Aperture</span>
                <span className="font-mono font-medium text-slate-800">f/{data.fNumber || '--'}</span>
             </div>
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <span className="block text-xs text-slate-400 uppercase">ISO</span>
                <span className="font-mono font-medium text-slate-800">{data.iso || '--'}</span>
             </div>
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <span className="block text-xs text-slate-400 uppercase">Shutter</span>
                <span className="font-mono font-medium text-slate-800">{data.exposureTime ? `${data.exposureTime}s` : '--'}</span>
             </div>
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <span className="block text-xs text-slate-400 uppercase">Focal Len</span>
                <span className="font-mono font-medium text-slate-800">{data.focalLength ? `${data.focalLength}mm` : '--'}</span>
             </div>
         </div>
         <Item label="Flash" value={data.flash} />
         <Item label="White Balance" value={data.whiteBalance} />
         <Item label="Color Space" value={data.colorSpace} />
      </Section>
   </div>
);

const GPSPanel = ({ data }: { data: ParsedExifData }) => (
   <div className="space-y-6 h-full">
      {data.gps ? (
         <>
            <div className="aspect-video bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center relative overflow-hidden group cursor-pointer" onClick={() => window.open(`https://www.google.com/maps?q=${data.gps?.latitude},${data.gps?.longitude}`, '_blank')}>
               <MapPin size={48} className="text-emerald-500 mb-2" />
               <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white px-4 py-2 rounded-full shadow-sm text-xs font-bold text-emerald-600">Open in Maps</span>
               </div>
            </div>
            <Section title="Coordinates" icon={<MapPin size={16} />}>
               <Item label="Latitude" value={data.gps.latitude} />
               <Item label="Longitude" value={data.gps.longitude} />
               <Item label="Altitude" value={data.gps.altitude ? `${data.gps.altitude}m` : undefined} />
            </Section>
         </>
      ) : (
         <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
            <MapPin size={48} className="mb-4 opacity-20" />
            <p>No GPS Data Found</p>
         </div>
      )}
   </div>
);

const RawPanel = ({ data }: { data: ParsedExifData }) => (
   <div className="space-y-2 font-mono text-xs">
      <div className="flex justify-between items-center mb-4">
         <span className="text-xs font-bold text-slate-500 uppercase">Raw Metadata Tags</span>
         <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">{Object.keys(data.allTags).length} tags</span>
      </div>
      {Object.entries(data.allTags).map(([k, v]) => (
         <div key={k} className="flex gap-4 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-2 rounded -mx-2">
            <span className="text-indigo-600 min-w-[120px] break-all">{k}</span>
            <span className="text-slate-600 break-all">{v}</span>
         </div>
      ))}
   </div>
);

const Section = ({ title, icon, children }: any) => (
   <div className="mb-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
         <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">{icon}</span>
         {title}
      </h3>
      <div className="space-y-3 pl-1">
         {children}
      </div>
   </div>
);

const Item = ({ label, value }: any) => value ? (
   <div className="flex justify-between items-start text-sm">
      <span className="text-slate-500 shrink-0 pr-4">{label}</span>
      <span className="text-slate-800 font-medium text-right break-all">{value}</span>
   </div>
) : null;

const HashItem = ({ label, val }: any) => {
   const [copied, setCopied] = useState(false);
   const copy = () => {
      navigator.clipboard.writeText(val);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };
   return (
      <div className="bg-slate-50 p-2 rounded border border-slate-100 group hover:border-indigo-200 transition-colors">
         <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
            <button onClick={copy} className="text-slate-400 hover:text-indigo-600">
               {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </button>
         </div>
         <div className="font-mono text-[10px] text-slate-700 break-all">{val}</div>
      </div>
   );
};