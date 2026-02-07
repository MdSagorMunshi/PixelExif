import React, { useState, useMemo } from 'react';
import { ParsedExifData } from '../types';
import { Map, Camera, Aperture, Layers, Image as ImageIcon, MapPin, FileText, Hash, Heart, Shield, Terminal, RefreshCw, Copy, ChevronRight, ChevronDown } from 'lucide-react';
import { ImagePreview } from './ImagePreview';
import { RetroButton } from './RetroButton';
import { generateChecksum, generateMD5, generateCRC32 } from '../utils/imageProcessing';

interface ExifTerminalProps {
  data: ParsedExifData;
  onClose: () => void;
  onToggleFavorite: (data: ParsedExifData) => void;
  isFavorite: boolean;
}

export const ExifTerminal: React.FC<ExifTerminalProps> = ({ data, onClose, onToggleFavorite, isFavorite }) => {
  const [activeTab, setActiveTab] = useState<'main' | 'raw' | 'gps' | 'hash'>('main');
  const [hashes, setHashes] = useState<{
    sha256?: string;
    sha512?: string;
    md5?: string;
    crc32?: string;
  }>({ sha256: data.checksum }); // Pre-populate sha256 if available
  const [calculatingHashes, setCalculatingHashes] = useState(false);
  
  // State for raw data groups collapse
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
      setCollapsedGroups(prev => ({...prev, [group]: !prev[group]}));
  };

  const calculateAllHashes = async () => {
    if (!data.blob) return;
    setCalculatingHashes(true);
    try {
        const sha256 = await generateChecksum(data.blob, 'SHA-256');
        const sha512 = await generateChecksum(data.blob, 'SHA-512');
        const md5 = await generateMD5(data.blob);
        const crc32 = await generateCRC32(data.blob);
        setHashes({ sha256, sha512, md5, crc32 });
    } catch (e) {
        console.error("Hash calculation failed", e);
    } finally {
        setCalculatingHashes(false);
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  // Group raw tags by their category (Exif, File, MakerNote, etc)
  const groupedTags = useMemo(() => {
     const groups: Record<string, {key: string, value: string}[]> = {};
     Object.entries(data.allTags).forEach(([fullKey, value]) => {
         const parts = fullKey.split(' - ');
         const groupName = parts.length > 1 ? parts[0] : 'Other';
         const tagName = parts.length > 1 ? parts.slice(1).join(' - ') : fullKey;
         
         if (!groups[groupName]) groups[groupName] = [];
         groups[groupName].push({ key: tagName, value: value as string });
     });
     return groups;
  }, [data.allTags]);

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center text-[var(--secondary-color)] mb-2 mt-4 border-b border-[var(--secondary-color)] pb-1">
      <Icon size={16} className="mr-2" />
      <h3 className="uppercase tracking-widest">{title}</h3>
    </div>
  );

  const DataRow = ({ label, value }: { label: string, value?: string | number }) => (
    value ? (
      <div className="flex justify-between hover:bg-[var(--primary-color)]/20 px-1 py-0.5 group">
        <span className="text-[var(--primary-color)]/80 group-hover:text-[var(--primary-color)]">{label}</span>
        <span className="text-[#fff] font-bold text-right pl-4 truncate max-w-[60%]">{value}</span>
      </div>
    ) : null
  );

  return (
    <div className="bg-[#0a0a0a] border-2 border-[var(--primary-color)] h-full flex flex-col shadow-[0_0_20px_var(--primary-color-dim)] relative overflow-hidden transition-colors duration-300">
      {/* Terminal Header */}
      <div className="bg-[var(--primary-color)] text-black px-2 py-1 flex justify-between items-center font-bold">
        <span className="truncate max-w-[70%]">VIEWER - {data.filename}</span>
        <div className="flex gap-2">
            <button onClick={() => onToggleFavorite(data)} className="hover:text-white" title="Save to Favorites">
                <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-red-600' : ''} />
            </button>
            <button onClick={onClose} className="hover:bg-black hover:text-[var(--primary-color)] px-2">[X]</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--primary-color)]">
        <button 
          onClick={() => setActiveTab('main')}
          className={`px-4 py-1 flex-1 font-pixel text-xs ${activeTab === 'main' ? 'bg-[var(--primary-color)]/30 text-white' : 'text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10'}`}
        >
          MAIN
        </button>
        <button 
          onClick={() => setActiveTab('gps')}
          disabled={!data.gps}
          className={`px-4 py-1 flex-1 font-pixel text-xs ${activeTab === 'gps' ? 'bg-[var(--primary-color)]/30 text-white' : 'text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10'} ${!data.gps ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          GPS
        </button>
        <button 
          onClick={() => setActiveTab('hash')}
          className={`px-4 py-1 flex-1 font-pixel text-xs ${activeTab === 'hash' ? 'bg-[var(--primary-color)]/30 text-white' : 'text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10'}`}
        >
          HASH
        </button>
        <button 
          onClick={() => setActiveTab('raw')}
          className={`px-4 py-1 flex-1 font-pixel text-xs ${activeTab === 'raw' ? 'bg-[var(--primary-color)]/30 text-white' : 'text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10'}`}
        >
          RAW
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 font-terminal text-lg custom-scrollbar">
        
        {activeTab === 'main' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {/* Image Preview Component */}
              <div className="mb-4">
                 <ImagePreview data={data} />
              </div>

              <SectionTitle icon={FileText} title="FILE INFO" />
              <DataRow label="Filename" value={data.filename} />
              <DataRow label="Size" value={data.fileSize} />
              <DataRow label="Type" value={data.mimeType} />
              <DataRow label="Dimensions" value={data.dimensions} />
              <DataRow label="Software" value={data.software} />
              <DataRow label="Created" value={data.dateTimeOriginal} />
              
              <SectionTitle icon={Shield} title="INTEGRITY (SHA-256)" />
              <div className="text-[10px] break-all text-[var(--primary-color)]/70 border border-[var(--primary-color)]/30 p-2 mt-1 font-mono">
                  {data.checksum || 'CALCULATING...'}
              </div>
            </div>

            <div>
              <SectionTitle icon={Camera} title="CAMERA GEAR" />
              <DataRow label="Make" value={data.make} />
              <DataRow label="Model" value={data.model} />
              <DataRow label="Lens" value={data.lens} />
              <DataRow label="Orientation" value={data.orientation} />

              <SectionTitle icon={Aperture} title="EXPOSURE" />
              <DataRow label="Aperture" value={data.fNumber ? `f/${data.fNumber}` : undefined} />
              <DataRow label="Shutter" value={data.exposureTime ? `${data.exposureTime}s` : undefined} />
              <DataRow label="ISO" value={data.iso} />
              <DataRow label="Focal Len" value={data.focalLength ? `${data.focalLength}mm` : undefined} />
              <DataRow label="Flash" value={data.flash} />
              <DataRow label="White Bal" value={data.whiteBalance} />
            </div>
          </div>
        )}

        {activeTab === 'gps' && data.gps && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            {/* Retro Radar Animation */}
            <div className="relative w-32 h-32 rounded-full border-2 border-[var(--primary-color)] mb-6 flex items-center justify-center bg-[#001100]">
                <div className="absolute w-full h-[2px] bg-[var(--primary-color)]/50 animate-[spin_2s_linear_infinite] top-1/2 left-0 origin-center"></div>
                <div className="absolute w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute w-20 h-20 border border-[var(--primary-color)]/30 rounded-full"></div>
                <div className="absolute w-10 h-10 border border-[var(--primary-color)]/30 rounded-full"></div>
            </div>

            <MapPin size={32} className="text-[var(--secondary-color)] mb-4" />
            <h2 className="text-2xl text-[var(--primary-color)] mb-8 font-pixel">LOCATED</h2>
            
            <div className="border border-[var(--primary-color)] p-6 w-full max-w-md bg-[var(--primary-color)]/5 mb-8">
               <DataRow label="Latitude" value={data.gps.latitude} />
               <DataRow label="Longitude" value={data.gps.longitude} />
               <DataRow label="Altitude" value={data.gps.altitude ? `${data.gps.altitude}m` : undefined} />
            </div>

            <a 
              href={`https://www.google.com/maps?q=${data.gps.latitude},${data.gps.longitude}`} 
              target="_blank" 
              rel="noreferrer"
              className="bg-[var(--secondary-color)] text-black font-pixel px-6 py-3 hover:opacity-80 flex items-center"
            >
              <Map size={20} className="mr-2" />
              OPEN IN MAPS
            </a>
          </div>
        )}
        
        {activeTab === 'hash' && (
           <div className="p-4 flex flex-col items-center">
              <Hash size={48} className="text-[var(--secondary-color)] mb-4" />
              <h2 className="text-xl font-pixel mb-6">FILE INTEGRITY CHECKSUMS</h2>
              
              {!hashes.md5 && !calculatingHashes && (
                  <div className="mb-6 text-center">
                      <p className="mb-4 text-sm max-w-md">Calculate robust cryptographic hashes (MD5, SHA-256, SHA-512, CRC32) for file verification.</p>
                      <RetroButton onClick={calculateAllHashes} className="flex items-center gap-2">
                          <RefreshCw size={16} /> GENERATE CHECKSUMS
                      </RetroButton>
                  </div>
              )}

              {calculatingHashes && (
                  <div className="text-[var(--primary-color)] animate-pulse mb-6">CALCULATING HASHES...</div>
              )}

              {(hashes.md5 || hashes.sha512 || hashes.sha256) && (
                  <div className="w-full max-w-2xl space-y-4">
                      {[
                        { label: 'MD5', val: hashes.md5 },
                        { label: 'SHA-256', val: hashes.sha256 },
                        { label: 'SHA-512', val: hashes.sha512 },
                        { label: 'CRC32', val: hashes.crc32 },
                      ].map(h => (
                          <div key={h.label} className="border border-[var(--primary-color)] p-3 bg-[var(--primary-color)]/5">
                              <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-[var(--secondary-color)] text-sm">{h.label}</span>
                                  <button onClick={() => h.val && copyToClipboard(h.val)} className="text-[var(--primary-color)] hover:text-white" title="Copy">
                                      <Copy size={14} />
                                  </button>
                              </div>
                              <div className="font-mono text-[10px] break-all text-white/80 select-all">
                                  {h.val || 'PENDING...'}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
           </div>
        )}

        {activeTab === 'raw' && (
           <div className="pb-4">
             <div className="flex justify-between items-center mb-4">
               <div className="flex items-center text-[var(--secondary-color)]">
                 <Layers size={16} className="mr-2" />
                 <h3 className="uppercase tracking-widest font-bold">FULL METADATA DUMP</h3>
               </div>
               <div className="text-xs text-[var(--primary-color)]">{Object.keys(data.allTags).length} TAGS FOUND</div>
             </div>

             <div className="space-y-4">
               {Object.keys(groupedTags).sort().map(groupName => (
                 <div key={groupName} className="border border-[var(--primary-color)]/40 bg-[var(--primary-color)]/5">
                   <button 
                     onClick={() => toggleGroup(groupName)}
                     className="w-full flex justify-between items-center p-2 bg-[var(--primary-color)]/20 hover:bg-[var(--primary-color)]/30 text-[var(--secondary-color)] font-pixel text-xs"
                   >
                     <span>{groupName.toUpperCase()} ({groupedTags[groupName].length})</span>
                     {collapsedGroups[groupName] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                   </button>
                   
                   {!collapsedGroups[groupName] && (
                     <div className="p-2 space-y-1 font-mono text-xs">
                       {groupedTags[groupName].map(({ key, value }) => (
                         <div key={key} className="flex flex-col sm:flex-row sm:justify-between border-b border-[var(--primary-color)]/10 pb-1 last:border-0">
                           <span className="text-[var(--primary-color)] opacity-80 break-all sm:w-1/3">{key}</span>
                           <span className="text-white break-all sm:w-2/3 sm:text-right pl-2">{value}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               ))}
             </div>
           </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="bg-[var(--primary-color)] text-black text-xs px-2 py-1 font-pixel flex justify-between">
        <span>STATUS: {activeTab === 'hash' ? 'CALCULATING' : 'VIEWING'}</span>
        <span className="animate-pulse">_</span>
      </div>
    </div>
  );
};