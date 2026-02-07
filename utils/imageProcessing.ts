import SparkMD5 from 'spark-md5';

export async function generateChecksum(file: Blob, algo: 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest(algo, buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateMD5(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  return SparkMD5.ArrayBuffer.hash(buffer);
}

const makeCRCTable = () => {
    let c;
    const crcTable = [];
    for(let n =0; n < 256; n++){
        c = n;
        for(let k =0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

const crcTable = makeCRCTable();

export async function generateCRC32(file: Blob): Promise<string> {
    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    let crc = 0 ^ (-1);
    for (let i = 0; i < uint8.length; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ uint8[i]) & 0xFF];
    }
    const result = (crc ^ (-1)) >>> 0;
    return result.toString(16).toUpperCase().padStart(8, '0');
}

export function generateAsciiArt(imageUrl: string, width = 60): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');

      // Calculate height to maintain aspect ratio (font is approx 1:2 ratio usually)
      const ratio = img.height / img.width;
      const height = Math.floor(width * ratio * 0.5); 

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      const chars = " .:-=+*#%@"; // Simple density map
      let art = "";

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          
          // Simple brightness
          const brightness = (r + g + b) / 3;
          const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
          art += chars[charIndex];
        }
        art += "\n";
      }
      resolve(art);
    };
    img.onerror = reject;
  });
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}