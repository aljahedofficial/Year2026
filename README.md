# Stylistic Fingerprint Analyzer - Setup Instructions

## Quick Start

Since npm is not currently available on your system, here are your options:

### Option 1: Install Node.js (Recommended)

1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Install the LTS version (includes npm)
3. Restart your terminal
4. Run these commands:

```bash
cd d:\masterThesis\englishDeptThesis\y2026
npm install
npm run dev
```

The app will open at `http://localhost:5173`

### Option 2: Use the Standalone Component

The main component file `StylisticFingerprintAnalyzer.jsx` is fully self-contained. You can:

1. Copy it into an existing React project
2. Import it: `import StylisticFingerprintAnalyzer from './StylisticFingerprintAnalyzer.jsx'`
3. Use it: `<StylisticFingerprintAnalyzer />`

Required dependencies:
- `react` ^18.2.0
- `react-dom` ^18.2.0
- `recharts` ^2.5.0
- `tailwindcss` ^3.4.0

## Project Files Created

All files are ready in: `d:\masterThesis\englishDeptThesis\y2026\`

```
├── src/
│   ├── StylisticFingerprintAnalyzer.jsx  ← Main component (600+ lines)
│   ├── main.jsx                           ← Entry point
│   └── index.css                          ← Tailwind imports
├── index.html                             ← HTML entry
├── package.json                           ← Dependencies
├── vite.config.js                         ← Vite config
├── tailwind.config.js                     ← Tailwind config
└── postcss.config.js                      ← PostCSS config
```

## What's Included

✅ **Precise linguistic tokenizer** (handles contractions & hyphens)  
✅ **STTR calculation** (standardized type-token ratio)  
✅ **CV calculation** (coefficient of variation for burstiness)  
✅ **Metadiscourse analysis** (Hyland 2005 taxonomy)  
✅ **Stylistic risk assessment** (Human vs AI detection)  
✅ **Six visualizations** (Recharts):
   - Syntactic Burstiness (bar chart)
   - Writer Identity Spectrum (horizontal bar)
   - Cumulative TTR Curve (line chart)
   - Metadiscourse Distribution (pie chart)
   - Sentence-Length Heat-Strip (custom grid)
   - Lexical First-Appearance (scatter plot)  
✅ **Export functionality** (CSV, XLSX, PNG)  
✅ **Tabbed interface** (Individual Files / Combined Corpus)  
✅ **Academic styling** (Tailwind CSS, clean design)

## Next Steps

1. Install Node.js if you haven't already
2. Run `npm install` to get dependencies
3. Run `npm run dev` to start the development server
4. Upload your text samples and start analyzing!

See [walkthrough.md](file:///C:/Users/User/.gemini/antigravity/brain/f390b039-74ba-4226-b5cc-89f0d534948b/walkthrough.md) for complete feature documentation.
