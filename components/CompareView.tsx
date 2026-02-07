import React from 'react';
import { ParsedExifData } from '../types';
import { RetroButton } from './RetroButton';

interface CompareViewProps {
  left: ParsedExifData;
  right: ParsedExifData;
  onBack: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({ left, right, onBack }) => {
  const fields: { key: keyof ParsedExifData | string, label: string }[] = [
    { key: 'filename', label: 'Filename' },
    { key: 'fileSize', label: 'Size' },
    { key: 'dateTimeOriginal', label: 'Date' },
    { key: 'model', label: 'Camera' },
    { key: 'lens', label: 'Lens' },
    { key: 'iso', label: 'ISO' },
    { key: 'fNumber', label: 'Aperture' },
    { key: 'exposureTime', label: 'Shutter' },
    { key: 'focalLength', label: 'Focal Len' },
    { key: 'software', label: 'Software' },
    { key: 'checksum', label: 'SHA-256' },
  ];

  const renderValue = (obj: any, key: string) => {
    // Basic property access
    const val = obj[key];
    if (val === undefined || val === null) return '-';
    return String(val);
  };

  const isDifferent = (key: string) => {
    return renderValue(left, key) !== renderValue(right, key);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] border-2 border-[var(--primary-color)] font-terminal text-[var(--primary-color)]">
       <div className="flex justify-between items-center p-2 border-b border-[var(--primary-color)] bg-[var(--primary-color)]/10">
          <h2 className="font-pixel">COMPARE MODE</h2>
          <RetroButton onClick={onBack} className="!text-xs !py-1">BACK</RetroButton>
       </div>

       <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse">
             <thead>
                <tr>
                   <th className="w-1/3 p-2 border-b-2 border-[var(--primary-color)] text-left font-pixel text-xs">{left.filename}</th>
                   <th className="w-1/3 p-2 border-b-2 border-[var(--primary-color)] text-center text-white/50">PROPERTY</th>
                   <th className="w-1/3 p-2 border-b-2 border-[var(--primary-color)] text-right font-pixel text-xs">{right.filename}</th>
                </tr>
             </thead>
             <tbody>
                {fields.map(field => {
                   const diff = isDifferent(field.key as string);
                   return (
                      <tr key={field.label} className={`border-b border-[var(--primary-color)]/20 ${diff ? 'bg-[var(--primary-color)]/10' : ''}`}>
                         <td className={`p-2 text-left ${diff ? 'text-[#ff5555]' : ''}`}>{renderValue(left, field.key as string)}</td>
                         <td className="p-2 text-center text-xs uppercase tracking-widest opacity-70">{field.label}</td>
                         <td className={`p-2 text-right ${diff ? 'text-[#ff5555]' : ''}`}>{renderValue(right, field.key as string)}</td>
                      </tr>
                   );
                })}
             </tbody>
          </table>
       </div>
    </div>
  );
};
