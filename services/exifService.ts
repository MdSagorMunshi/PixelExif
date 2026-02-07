import ExifReader from 'exifreader';
import { ParsedExifData } from '../types';
import { generateChecksum } from '../utils/imageProcessing';
import { v4 as uuidv4 } from 'uuid'; // We don't have uuid installed, using math.random fallback

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const parseFileExif = async (file: File): Promise<ParsedExifData> => {
  try {
    // expanded: true breaks tags into groups (exif, file, iptc, xmp, etc)
    const tags = await ExifReader.load(file, { expanded: true });
    
    // Calculate Checksum concurrently
    const checksumPromise = generateChecksum(file);

    // Helper to extract string value safely from a group
    const getTag = (group: string, name: string) => {
        const t = tags as any;
        return t[group]?.[name]?.description || t[name]?.description || undefined;
    };
    
    // Parse GPS
    let gps = undefined;
    if (tags.gps?.Latitude && tags.gps?.Longitude) {
        gps = {
            latitude: tags.gps.Latitude as number,
            longitude: tags.gps.Longitude as number,
            altitude: tags.gps.Altitude as number
        };
    }

    // Try to find image dimensions if not in standard EXIF
    let dimensions = getTag('file', 'Image Width') && getTag('file', 'Image Height') 
        ? `${getTag('file', 'Image Width')} x ${getTag('file', 'Image Height')}`
        : undefined;

    // Fallback dimensions for some formats
    if (!dimensions) {
       // Check root level if not found in 'file' group
       const width = (tags as any)['Image Width']?.value;
       const height = (tags as any)['Image Height']?.value;
       if (width && height) {
         dimensions = `${width} x ${height}`;
       }
    }

    // Thumbnail
    let thumbnailUrl = undefined;
    if (tags.thumbnail) {
       // ExifReader extracts base64 thumbnail if available
       thumbnailUrl = tags.thumbnail; 
    } else {
        // Create object URL for formats browsers support natively
        if (file.type.match(/image\/(jpeg|png|webp|gif|bmp)/)) {
            thumbnailUrl = URL.createObjectURL(file);
        }
    }

    // Collect all raw tags for "Hidden Metadata" view
    // Since we use expanded: true, we must traverse the groups
    const allTags: Record<string, string> = {};
    
    Object.keys(tags).forEach(groupKey => {
        if (groupKey === 'thumbnail' || groupKey === 'gps') return;
        
        const groupData = (tags as any)[groupKey];
        
        // Ensure we are dealing with an object of tags
        if (typeof groupData === 'object' && groupData !== null) {
            Object.keys(groupData).forEach(tagName => {
                const tag = groupData[tagName];
                
                let valueStr = '';
                if (tag && tag.description !== undefined) {
                    valueStr = String(tag.description);
                } else if (tag && tag.value !== undefined) {
                    valueStr = String(tag.value);
                } else if (typeof tag === 'string' || typeof tag === 'number') {
                    valueStr = String(tag);
                }
                
                if (valueStr) {
                    // Store with Group Prefix to organize in UI
                    // e.g. "Exif - ExposureTime", "MakerNote - ShutterCount"
                    allTags[`${groupKey} - ${tagName}`] = valueStr;
                }
            });
        }
    });

    // Formatting file size
    const sizeKB = (file.size / 1024).toFixed(2);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const fileSizeStr = parseFloat(sizeMB) > 1 ? `${sizeMB} MB` : `${sizeKB} KB`;

    const checksum = await checksumPromise;

    return {
      id: generateId(),
      filename: file.name,
      fileSize: fileSizeStr,
      mimeType: file.type,
      dimensions,
      make: getTag('exif', 'Make') || getTag('tiff', 'Make'),
      model: getTag('exif', 'Model') || getTag('tiff', 'Model'),
      lens: getTag('exif', 'LensModel') || getTag('composite', 'LensID'),
      fNumber: getTag('exif', 'FNumber'),
      exposureTime: getTag('exif', 'ExposureTime'),
      iso: getTag('exif', 'ISOSpeedRatings'),
      focalLength: getTag('exif', 'FocalLength'),
      dateTimeOriginal: getTag('exif', 'DateTimeOriginal') || getTag('exif', 'CreateDate') || getTag('tiff', 'DateTime'),
      gps,
      thumbnailUrl,
      software: getTag('exif', 'Software') || getTag('tiff', 'Software'),
      colorSpace: getTag('exif', 'ColorSpace'),
      flash: getTag('exif', 'Flash'),
      whiteBalance: getTag('exif', 'WhiteBalance'),
      orientation: getTag('exif', 'Orientation'),
      allTags,
      checksum,
      blob: file
    };
  } catch (error) {
    console.error("Error parsing EXIF:", error);
    throw new Error(`Failed to extract metadata from ${file.name}. The file might be corrupted or format not supported.`);
  }
};