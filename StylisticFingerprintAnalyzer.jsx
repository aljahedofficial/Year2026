import { useRef, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis, YAxis
} from 'recharts';

const StylisticFingerprintAnalyzer = () => {
    const [texts, setTexts] = useState([]);
    const [activeTab, setActiveTab] = useState('individual');
    const [selectedTextIndex, setSelectedTextIndex] = useState(0);
    const [pastedText, setPastedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const chartRef = useRef(null);

    // Metadiscourse categories based on Hyland (2005)
    const metadiscourseCategories = {
        transitions: ['however', 'therefore', 'thus', 'moreover', 'furthermore', 'consequently', 'nevertheless', 'nonetheless', 'additionally', 'similarly', 'conversely', 'meanwhile', 'subsequently', 'accordingly', 'hence', 'whereas'],
        hedges: ['might', 'perhaps', 'possibly', 'probably', 'maybe', 'could', 'would', 'seem', 'appear', 'suggest', 'indicate', 'likely', 'unlikely', 'somewhat', 'relatively', 'fairly', 'rather', 'quite'],
        boosters: ['clearly', 'obviously', 'definitely', 'certainly', 'undoubtedly', 'indeed', 'surely', 'always', 'never', 'must', 'demonstrate', 'prove', 'show', 'establish', 'confirm'],
        attitudeMarkers: ['surprisingly', 'unfortunately', 'fortunately', 'importantly', 'interestingly', 'remarkably', 'hopefully', 'regrettably', 'essentially', 'dramatically'],
        selfMention: ['i', 'we', 'my', 'our', 'me', 'us', 'mine', 'ours'],
        engagementMarkers: ['consider', 'note', 'see', 'imagine', 'suppose', 'assume', 'recall', 'remember', 'think', 'believe']
    };

    // Precise tokenizer handling contractions and hyphens
    const tokenize = (text) => {
        const tokens = text.toLowerCase().match(/\b[a-z]+(?:['-]?[a-z]+)*\b/g) || [];
        return tokens;
    };

    // Sentence splitter preserving common abbreviations
    const splitSentences = (text) => {
        // Replace common abbreviations temporarily
        let processed = text
            .replace(/\bi\.e\./gi, 'IE_TEMP')
            .replace(/\be\.g\./gi, 'EG_TEMP')
            .replace(/\betc\./gi, 'ETC_TEMP')
            .replace(/\bdr\./gi, 'DR_TEMP')
            .replace(/\bmr\./gi, 'MR_TEMP')
            .replace(/\bmrs\./gi, 'MRS_TEMP')
            .replace(/\bms\./gi, 'MS_TEMP')
            .replace(/\bprof\./gi, 'PROF_TEMP');

        // Split by sentence-ending punctuation
        const sentences = processed.split(/[.!?]+/).filter(s => s.trim().length > 0);

        // Restore abbreviations
        return sentences.map(s => s
            .replace(/IE_TEMP/g, 'i.e.')
            .replace(/EG_TEMP/g, 'e.g.')
            .replace(/ETC_TEMP/g, 'etc.')
            .replace(/DR_TEMP/g, 'Dr.')
            .replace(/MR_TEMP/g, 'Mr.')
            .replace(/MRS_TEMP/g, 'Mrs.')
            .replace(/MS_TEMP/g, 'Ms.')
            .replace(/PROF_TEMP/g, 'Prof.')
            .trim()
        );
    };

    // Calculate STTR (Standardized Type-Token Ratio)
    const calculateSTTR = (tokens) => {
        if (tokens.length < 100) {
            const types = new Set(tokens).size;
            return tokens.length > 0 ? types / tokens.length : 0;
        }

        const blockSize = 100;
        const ttrs = [];

        for (let i = 0; i + blockSize <= tokens.length; i += blockSize) {
            const block = tokens.slice(i, i + blockSize);
            const types = new Set(block).size;
            ttrs.push(types / blockSize);
        }

        return ttrs.length > 0 ? ttrs.reduce((a, b) => a + b, 0) / ttrs.length : 0;
    };

    // Calculate Coefficient of Variation (CV) for burstiness
    const calculateCV = (sentenceLengths) => {
        if (sentenceLengths.length === 0) return 0;

        const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
        if (mean === 0) return 0;

        const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / sentenceLengths.length;
        const stdDev = Math.sqrt(variance);

        return stdDev / mean;
    };

    // Calculate metadiscourse density
    const calculateMetadiscourse = (tokens) => {
        const counts = {
            transitions: 0,
            hedges: 0,
            boosters: 0,
            attitudeMarkers: 0,
            selfMention: 0,
            engagementMarkers: 0
        };

        tokens.forEach(token => {
            Object.keys(metadiscourseCategories).forEach(category => {
                if (metadiscourseCategories[category].includes(token)) {
                    counts[category]++;
                }
            });
        });

        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        const density = tokens.length > 0 ? (total / tokens.length) * 1000 : 0;

        return { counts, density, total };
    };

    // Main analysis function
    const analyzeText = (text, filename = 'Pasted Text') => {
        const tokens = tokenize(text);
        const sentences = splitSentences(text);
        const sentenceLengths = sentences.map(s => tokenize(s).length);

        const sttr = calculateSTTR(tokens);
        const cv = calculateCV(sentenceLengths);
        const metadiscourse = calculateMetadiscourse(tokens);

        // Calculate cumulative TTR for visualization
        const cumulativeTTR = [];
        const step = 50;
        for (let i = step; i <= tokens.length; i += step) {
            const subset = tokens.slice(0, i);
            const types = new Set(subset).size;
            cumulativeTTR.push({ position: i, ttr: types / i });
        }

        // Calculate lexical first appearance
        const firstAppearance = [];
        const seen = new Set();
        tokens.forEach((token, idx) => {
            if (!seen.has(token)) {
                seen.add(token);
                firstAppearance.push({ position: idx, word: token });
            }
        });

        // Stylistic risk assessment
        const riskAssessment = {
            cvStatus: cv > 0.30 ? 'Human-like' : cv < 0.20 ? 'AI-like' : 'Ambiguous',
            sttrStatus: sttr > 0.50 ? 'Human-like' : sttr < 0.40 ? 'AI-like' : 'Ambiguous',
            metadiscourseStatus: metadiscourse.density > 10 ? 'Human-like' : metadiscourse.density < 5 ? 'AI-like' : 'Ambiguous'
        };

        const overallRisk = [riskAssessment.cvStatus, riskAssessment.sttrStatus, riskAssessment.metadiscourseStatus]
            .filter(s => s === 'Human-like').length >= 2
            ? 'High Stylistic Variation Detected - Likely Human'
            : [riskAssessment.cvStatus, riskAssessment.sttrStatus, riskAssessment.metadiscourseStatus]
                .filter(s => s === 'AI-like').length >= 2
                ? 'Low Stylistic Variation Detected - Likely AI'
                : 'Mixed Stylistic Signals - Inconclusive';

        return {
            filename,
            wordCount: tokens.length,
            sentenceCount: sentences.length,
            sttr: sttr.toFixed(3),
            cv: cv.toFixed(3),
            metadiscourse,
            sentenceLengths,
            cumulativeTTR,
            firstAppearance,
            riskAssessment,
            overallRisk,
            avgSentenceLength: sentenceLengths.length > 0
                ? (sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length).toFixed(2)
                : 0
        };
    };

    // Handle pasted text
    const handlePasteAnalysis = () => {
        if (!pastedText.trim()) return;
        const analysis = analyzeText(pastedText, `Pasted Text ${texts.length + 1}`);
        setTexts([...texts, analysis]);
        setPastedText('');
        setSelectedTextIndex(texts.length);
    };

    // Handle file upload
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(f => f.name.endsWith('.txt'));

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const analysis = analyzeText(text, file.name);
                setTexts(prev => [...prev, analysis]);
            };
            reader.readAsText(file);
        });
    };

    // Calculate combined corpus statistics
    const getCombinedStats = () => {
        if (texts.length === 0) return null;

        const totalWords = texts.reduce((sum, t) => sum + t.wordCount, 0);
        const totalSentences = texts.reduce((sum, t) => sum + t.sentenceCount, 0);
        const avgSTTR = texts.reduce((sum, t) => sum + parseFloat(t.sttr), 0) / texts.length;
        const avgCV = texts.reduce((sum, t) => sum + parseFloat(t.cv), 0) / texts.length;
        const avgMetadiscourse = texts.reduce((sum, t) => sum + t.metadiscourse.density, 0) / texts.length;

        return {
            totalWords,
            totalSentences,
            avgSTTR: avgSTTR.toFixed(3),
            avgCV: avgCV.toFixed(3),
            avgMetadiscourse: avgMetadiscourse.toFixed(2),
            fileCount: texts.length
        };
    };

    // Export to CSV
    const exportToCSV = () => {
        if (texts.length === 0) return;

        const headers = ['Filename', 'Word Count', 'Sentence Count', 'STTR', 'CV', 'Metadiscourse Density', 'Avg Sentence Length', 'Risk Assessment'];
        const rows = texts.map(t => [
            t.filename,
            t.wordCount,
            t.sentenceCount,
            t.sttr,
            t.cv,
            t.metadiscourse.density.toFixed(2),
            t.avgSentenceLength,
            t.overallRisk
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stylistic_analysis.csv';
        a.click();
    };

    // Export to XLSX
    const exportToXLSX = async () => {
        if (texts.length === 0) return;

        setIsProcessing(true);

        try {
            // Load SheetJS from CDN
            if (!window.XLSX) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const data = texts.map(t => ({
                'Filename': t.filename,
                'Word Count': t.wordCount,
                'Sentence Count': t.sentenceCount,
                'STTR': t.sttr,
                'CV (Burstiness)': t.cv,
                'Metadiscourse Density': t.metadiscourse.density.toFixed(2),
                'Avg Sentence Length': t.avgSentenceLength,
                'Risk Assessment': t.overallRisk
            }));

            const ws = window.XLSX.utils.json_to_sheet(data);
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, 'Analysis');
            window.XLSX.writeFile(wb, 'stylistic_analysis.xlsx');
        } catch (error) {
            console.error('Error exporting to XLSX:', error);
            alert('Failed to export XLSX. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Export to PNG
    const exportToPNG = async () => {
        if (!chartRef.current) return;

        setIsProcessing(true);

        try {
            // Load html2canvas from CDN
            if (!window.html2canvas) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const canvas = await window.html2canvas(chartRef.current);
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = 'stylistic_analysis.png';
            a.click();
        } catch (error) {
            console.error('Error exporting to PNG:', error);
            alert('Failed to export PNG. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const currentText = texts[selectedTextIndex];
    const combinedStats = getCombinedStats();

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-800 mb-2">
                        Stylistic Fingerprint Analyzer
                    </h1>
                    <p className="text-slate-600 italic">
                        When Machines Mistake Humans: Stylistic Analysis of False Positives in AI Detection
                    </p>
                </header>

                {/* Input Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-2xl font-semibold text-slate-700 mb-4">Corpus Input / Text Sample</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Paste Text Sample
                        </label>
                        <textarea
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            className="w-full h-32 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Paste your text here for analysis..."
                        />
                        <button
                            onClick={handlePasteAnalysis}
                            disabled={!pastedText.trim()}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Analyze Pasted Text
                        </button>
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Upload Text Files (.txt only)
                        </label>
                        <input
                            type="file"
                            multiple
                            accept=".txt"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                </div>

                {/* Export Buttons */}
                {texts.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="flex gap-3">
                            <button
                                onClick={exportToCSV}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={exportToXLSX}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-slate-400 transition-colors"
                            >
                                {isProcessing ? 'Processing...' : 'Export XLSX'}
                            </button>
                            <button
                                onClick={exportToPNG}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-slate-400 transition-colors"
                            >
                                {isProcessing ? 'Processing...' : 'Export PNG'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                {texts.length > 0 && (
                    <>
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setActiveTab('individual')}
                                className={`px-6 py-3 rounded-t-lg font-semibold transition-colors ${activeTab === 'individual'
                                        ? 'bg-white text-blue-700 shadow-md'
                                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                    }`}
                            >
                                Individual Files
                            </button>
                            <button
                                onClick={() => setActiveTab('combined')}
                                className={`px-6 py-3 rounded-t-lg font-semibold transition-colors ${activeTab === 'combined'
                                        ? 'bg-white text-blue-700 shadow-md'
                                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                    }`}
                            >
                                Combined Corpus
                            </button>
                        </div>

                        {/* Individual Files Tab */}
                        {activeTab === 'individual' && currentText && (
                            <div className="space-y-6">
                                {/* File Selector */}
                                <div className="bg-white rounded-lg shadow-md p-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Select Text Sample
                                    </label>
                                    <select
                                        value={selectedTextIndex}
                                        onChange={(e) => setSelectedTextIndex(Number(e.target.value))}
                                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    >
                                        {texts.map((t, idx) => (
                                            <option key={idx} value={idx}>
                                                {t.filename}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Statistics Table */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Linguistic Metrics</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <div className="text-sm text-slate-600">Word Count</div>
                                            <div className="text-2xl font-bold text-blue-700">{currentText.wordCount}</div>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <div className="text-sm text-slate-600">Sentence Count</div>
                                            <div className="text-2xl font-bold text-green-700">{currentText.sentenceCount}</div>
                                        </div>
                                        <div className="p-4 bg-purple-50 rounded-lg">
                                            <div className="text-sm text-slate-600">STTR (Lexical Diversity)</div>
                                            <div className="text-2xl font-bold text-purple-700">{currentText.sttr}</div>
                                        </div>
                                        <div className="p-4 bg-orange-50 rounded-lg">
                                            <div className="text-sm text-slate-600">CV (Syntactic Burstiness)</div>
                                            <div className="text-2xl font-bold text-orange-700">{currentText.cv}</div>
                                        </div>
                                        <div className="p-4 bg-pink-50 rounded-lg">
                                            <div className="text-sm text-slate-600">Metadiscourse Density</div>
                                            <div className="text-2xl font-bold text-pink-700">
                                                {currentText.metadiscourse.density.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-slate-500">per 1,000 words</div>
                                        </div>
                                        <div className="p-4 bg-indigo-50 rounded-lg">
                                            <div className="text-sm text-slate-600">Avg Sentence Length</div>
                                            <div className="text-2xl font-bold text-indigo-700">{currentText.avgSentenceLength}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stylistic Risk Assessment */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Stylistic Risk Assessment</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium">CV (Burstiness):</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${currentText.riskAssessment.cvStatus === 'Human-like'
                                                    ? 'bg-green-100 text-green-800'
                                                    : currentText.riskAssessment.cvStatus === 'AI-like'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {currentText.riskAssessment.cvStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium">STTR (Lexical Diversity):</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${currentText.riskAssessment.sttrStatus === 'Human-like'
                                                    ? 'bg-green-100 text-green-800'
                                                    : currentText.riskAssessment.sttrStatus === 'AI-like'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {currentText.riskAssessment.sttrStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium">Metadiscourse Density:</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${currentText.riskAssessment.metadiscourseStatus === 'Human-like'
                                                    ? 'bg-green-100 text-green-800'
                                                    : currentText.riskAssessment.metadiscourseStatus === 'AI-like'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {currentText.riskAssessment.metadiscourseStatus}
                                            </span>
                                        </div>
                                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
                                            <div className="font-semibold text-slate-700 mb-1">Overall Assessment:</div>
                                            <div className="text-lg font-bold text-blue-800">{currentText.overallRisk}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Visualizations */}
                                <div ref={chartRef} className="space-y-6">
                                    {/* Syntactic Burstiness */}
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="text-xl font-semibold text-slate-700 mb-4">Syntactic Burstiness</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={currentText.sentenceLengths.map((len, idx) => ({ sentence: idx + 1, length: len }))}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="sentence" label={{ value: 'Sentence Index', position: 'insideBottom', offset: -5 }} />
                                                <YAxis label={{ value: 'Word Count', angle: -90, position: 'insideLeft' }} />
                                                <Tooltip />
                                                <Bar dataKey="length" fill="#8884d8" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Writer Identity Spectrum */}
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="text-xl font-semibold text-slate-700 mb-4">Writer Identity Spectrum</h3>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart
                                                layout="vertical"
                                                data={[
                                                    { metric: 'STTR', value: parseFloat(currentText.sttr) },
                                                    { metric: 'CV', value: parseFloat(currentText.cv) },
                                                    { metric: 'Metadiscourse/100', value: currentText.metadiscourse.density / 100 }
                                                ]}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="metric" type="category" />
                                                <Tooltip />
                                                <Bar dataKey="value" fill="#82ca9d" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Cumulative TTR Curve */}
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="text-xl font-semibold text-slate-700 mb-4">Cumulative Type-Token Ratio Curve</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={currentText.cumulativeTTR}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="position" label={{ value: 'Word Position', position: 'insideBottom', offset: -5 }} />
                                                <YAxis label={{ value: 'TTR', angle: -90, position: 'insideLeft' }} />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="ttr" stroke="#8884d8" strokeWidth={2} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Metadiscourse Distribution */}
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="text-xl font-semibold text-slate-700 mb-4">Metadiscourse Distribution (Hyland 2005)</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries(currentText.metadiscourse.counts).map(([key, value]) => ({
                                                        name: key.replace(/([A-Z])/g, ' $1').trim(),
                                                        value
                                                    }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {Object.keys(currentText.metadiscourse.counts).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Sentence-Length Heat-Strip */}
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="text-xl font-semibold text-slate-700 mb-4">Sentence-Length Heat-Strip</h3>
                                        <div className="flex flex-wrap gap-1">
                                            {currentText.sentenceLengths.map((len, idx) => {
                                                const maxLen = Math.max(...currentText.sentenceLengths);
                                                const intensity = Math.floor((len / maxLen) * 255);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="w-4 h-8 border border-slate-200"
                                                        style={{ backgroundColor: `rgb(${255 - intensity}, ${100}, ${intensity})` }}
                                                        title={`Sentence ${idx + 1}: ${len} words`}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <div className="mt-2 text-sm text-slate-600">
                                            Each cell represents one sentence. Color intensity indicates word count.
                                        </div>
                                    </div>

                                    {/* Lexical First-Appearance */}
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="text-xl font-semibold text-slate-700 mb-4">Lexical First-Appearance Distribution</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <ScatterChart>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="position" name="Position" label={{ value: 'Word Position', position: 'insideBottom', offset: -5 }} />
                                                <YAxis name="New Vocabulary" label={{ value: 'Unique Word Introduction', angle: -90, position: 'insideLeft' }} />
                                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                                <Scatter
                                                    data={currentText.firstAppearance.map((item, idx) => ({ ...item, y: idx }))}
                                                    fill="#8884d8"
                                                />
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                        <div className="mt-2 text-sm text-slate-600">
                                            Shows where new vocabulary items are introduced throughout the text.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Combined Corpus Tab */}
                        {activeTab === 'combined' && combinedStats && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Aggregated Corpus Statistics</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <div className="text-sm text-slate-600">Total Files</div>
                                            <div className="text-2xl font-bold text-blue-700">{combinedStats.fileCount}</div>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <div className="text-sm text-slate-600">Total Words</div>
                                            <div className="text-2xl font-bold text-green-700">{combinedStats.totalWords}</div>
                                        </div>
                                        <div className="p-4 bg-purple-50 rounded-lg">
                                            <div className="text-sm text-slate-600">Total Sentences</div>
                                            <div className="text-2xl font-bold text-purple-700">{combinedStats.totalSentences}</div>
                                        </div>
                                        <div className="p-4 bg-orange-50 rounded-lg">
                                            <div className="text-sm text-slate-600">Avg STTR</div>
                                            <div className="text-2xl font-bold text-orange-700">{combinedStats.avgSTTR}</div>
                                        </div>
                                        <div className="p-4 bg-pink-50 rounded-lg">
                                            <div className="text-sm text-slate-600">Avg CV</div>
                                            <div className="text-2xl font-bold text-pink-700">{combinedStats.avgCV}</div>
                                        </div>
                                        <div className="p-4 bg-indigo-50 rounded-lg">
                                            <div className="text-sm text-slate-600">Avg Metadiscourse</div>
                                            <div className="text-2xl font-bold text-indigo-700">{combinedStats.avgMetadiscourse}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Individual Files Table */}
                                <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
                                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Individual File Metrics</h3>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-slate-300">
                                                <th className="text-left p-2 font-semibold">Filename</th>
                                                <th className="text-right p-2 font-semibold">Words</th>
                                                <th className="text-right p-2 font-semibold">Sentences</th>
                                                <th className="text-right p-2 font-semibold">STTR</th>
                                                <th className="text-right p-2 font-semibold">CV</th>
                                                <th className="text-right p-2 font-semibold">Metadiscourse</th>
                                                <th className="text-left p-2 font-semibold">Assessment</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {texts.map((text, idx) => (
                                                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                                                    <td className="p-2">{text.filename}</td>
                                                    <td className="text-right p-2">{text.wordCount}</td>
                                                    <td className="text-right p-2">{text.sentenceCount}</td>
                                                    <td className="text-right p-2">{text.sttr}</td>
                                                    <td className="text-right p-2">{text.cv}</td>
                                                    <td className="text-right p-2">{text.metadiscourse.density.toFixed(2)}</td>
                                                    <td className="p-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${text.overallRisk.includes('Human')
                                                                ? 'bg-green-100 text-green-800'
                                                                : text.overallRisk.includes('AI')
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {text.overallRisk.split(' - ')[0]}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {texts.length === 0 && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="text-slate-400 text-lg">
                            No texts analyzed yet. Upload files or paste text to begin stylistic analysis.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StylisticFingerprintAnalyzer;
