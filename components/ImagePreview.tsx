import React, { useState, useEffect } from 'react';
import { generateAsciiArt } from '../utils/imageProcessing';
import { ScanLine, Image as ImageIcon, Type, Grid, Eye } from 'lucide-react';
import { ParsedExifData } from '../types';

interface ImagePreviewProps {
  data: ParsedExifData;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ data }) => {
  const [filter, setFilter] = useState<'none' | 'grayscale' | 'pixelate' | 'sepia'>('none');
  const [mode, setMode] = useState<'image' | 'ascii'>('image');
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (mode === 'ascii' && !asciiArt && data.thumbnailUrl) {
      generateAsciiArt(data.thumbnailUrl).then(setAsciiArt).catch(() => setAsciiArt('ASCII GENERATION FAILED'));
    }
  }, [mode, data.thumbnailUrl, asciiArt]);

  const getFilterClass = () => {
    switch(filter) {
      case 'grayscale': return 'grayscale';
      case 'sepia': return 'sepia';
      case 'pixelate': return 'pixelated blur-[1px]'; // approximated css pixelation
      default: return '';
    }
  };

  return (
    <div className="relative border border-[var(--primary-color)] bg-black p-1 min-h-[300px] flex flex-col">
       {/* Toolbar */}
       <div className="flex gap-2 mb-2 border-b border-[var(--primary-color)] pb-1 justify-between">
          <div className="flex gap-1">
             <button onClick={() => setMode(mode === 'image' ? 'ascii' : 'image')} className={`p-1 hover:bg-[var(--primary-color)] hover:text-black ${mode === 'ascii' ? 'bg-[var(--primary-color)] text-black' : 'text-[var(--primary-color)]'}`} title="Toggle ASCII">
               <Type size={16} />
             </button>
             <button onClick={() => setShowOverlay(!showOverlay)} className={`p-1 hover:bg-[var(--primary-color)] hover:text-black ${showOverlay ? 'bg-[var(--primary-color)] text-black' : 'text-[var(--primary-color)]'}`} title="Toggle Overlay">
               <ScanLine size={16} />
             </button>
          </div>
          
          {mode === 'image' && (
             <div className="flex gap-1 text-xs font-pixel">
               <button onClick={() => setFilter('none')} className={filter === 'none' ? 'underline' : ''}>NORM</button>
               <button onClick={() => setFilter('grayscale')} className={filter === 'grayscale' ? 'underline' : ''}>BW</button>
               <button onClick={() => setFilter('sepia')} className={filter === 'sepia' ? 'underline' : ''}>OLD</button>
             </div>
          )}
       </div>

       {/* Viewport */}
       <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#050505]">
          {mode === 'image' ? (
             data.thumbnailUrl ? (
                <div className="relative w-full h-full flex items-center justify-center group">
                   <img 
                      src={data.thumbnailUrl} 
                      alt="Preview" 
                      className={`max-w-full max-h-[400px] object-contain transition-all duration-300 ${getFilterClass()}`} 
                   />
                   
                   {/* Scanline Overlay */}
                   <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-20"></div>

                   {/* Data Overlay */}
                   {showOverlay && (
                      <div className="absolute bottom-2 left-2 bg-black/80 border border-[var(--primary-color)] p-2 text-[var(--primary-color)] font-pixel text-[10px] leading-tight z-20 shadow-lg">
                         <p>{data.filename}</p>
                         <p>{data.dimensions}</p>
                         <p>{data.iso ? `ISO ${data.iso}` : ''} {data.fNumber ? `f/${data.fNumber}` : ''}</p>
                         <p>{data.dateTimeOriginal}</p>
                      </div>
                   )}
                </div>
             ) : (
                <div className="text-[var(--primary-color)] opacity-50 flex flex-col items-center">
                   <ImageIcon size={48} />
                   <span className="font-pixel mt-2">NO PREVIEW</span>
                </div>
             )
          ) : (
             <pre className="text-[var(--primary-color)] text-[6px] leading-[4px] font-mono whitespace-pre overflow-auto max-h-[400px] w-full text-center">
                {asciiArt || 'GENERATING...'}
             </pre>
          )}
       </div>
    </div>
  );
};
