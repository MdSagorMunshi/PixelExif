# PixelExif 📸

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)
![Status](https://img.shields.io/badge/Status-Active-success.svg)

**PixelExif** is a privacy-focused, offline-first image metadata viewer that blends nostalgia with modern functionality. By default, it presents a fully retro, 90s-style CRT terminal interface complete with pixel art and sound effects. Under the hood, it offers powerful EXIF extraction, cryptographic integrity checks, and batch processing capabilities.

> **Secret:** Toggle "Modern Mode" by pressing `Ctrl + M` to switch to a clean, contemporary glassmorphism UI.

## ✨ Features

### 🕹️ Retro Mode (Default)
- **90s Aesthetic:** CRT scanlines, screen curvature, phosphor glow, and pixelated fonts.
- **Terminal Interface:** Command-line style data presentation.
- **Sound Effects:** Mechanical keyboard typing, floppy disk drive sounds, and chiptune beeps.
- **Themes:** Switch between Green, Amber, Magenta, Cyan, and Black & White monochrome monitors.

### 🚀 Modern Mode (`Ctrl + M`)
- **Clean UI:** A professional dashboard using Tailwind CSS and glassmorphism.
- **Advanced Filtering:** Filter by camera model, lens, file type, or date range.
- **Sorting:** Sort by name, date taken, or file size.
- **Batch Actions:** Select multiple files to export CSVs, generate rename scripts, or compare side-by-side.

### 🛡️ Core Capabilities
- **Privacy First:** 100% Client-side processing. **No images are ever uploaded to a server.**
- **Wide Format Support:** JPG, PNG, WEBP, HEIC, TIFF, and Raw formats (CR2, NEF, ARW, DNG).
- **Deep Metadata:** View ISO, aperture, shutter speed, lens info, software, and hidden manufacturer notes.
- **GPS Data:** Visualize coordinates with direct links to Google Maps.
- **File Integrity:** Generate SHA-256, SHA-512, MD5, and CRC32 checksums for file verification.
- **Comparison:** Side-by-side metadata comparison for two images.

## 🛠️ Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **EXIF Parsing:** `exifreader`
- **Icons:** Lucide React
- **Fonts:** Inter, Press Start 2P, VT323

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MdSagorMunshi/PixelExif.git
   cd PixelExif
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.

## 📖 Usage

1. **Upload:** Drag and drop images onto the window or click to select files.
2. **View:** Click on a file to inspect its metadata in the terminal.
3. **Favorites:** Click the heart icon to save metadata to local storage for later reference.
4. **Compare:** Select two files in Batch View (Retro) or use the checkbox selection (Modern) to compare them side-by-side.
5. **Switch Modes:** Press `Ctrl + M` at any time to toggle between the Retro Terminal and the Modern Dashboard.

## 🔒 Privacy Policy

PixelExif works entirely offline within your browser. 
- **No Uploads:** Your photos never leave your device.
- **Local Storage:** "Favorites" data is stored in your browser's `localStorage`.
- **No Tracking:** We do not use analytics or cookies.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👤 Author

**Ryan Shelby**
- GitHub: [MdSagorMunshi](https://github.com/MdSagorMunshi)
- GitLab: [rynex](https://gitlab.com/rynex)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Inspired by the golden age of computing.* 💾
