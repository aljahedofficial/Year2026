import nlp from 'compromise';
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
    ReferenceLine,
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
    const [thresholds, setThresholds] = useState({
        cv: 0.25,
        sttr: 0.45,
        metadiscourse: 8.0
    });
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

    // TIER 2: Extended Metadiscourse Categories
    const extendedMetadiscourse = {
        codeGlosses: ['i.e.', 'e.g.', 'namely', 'that is', 'in other words', 'for example', 'for instance', 'such as', 'specifically'],
        frameMarkers: ['finally', 'first', 'second', 'third', 'firstly', 'secondly', 'to conclude', 'in conclusion', 'in summary', 'to summarize', 'overall', 'lastly', 'next', 'then'],
        evidentials: ['according to', 'based on', 'argues', 'claims', 'suggests', 'states', 'reports', 'finds', 'demonstrates', 'shows', 'research shows', 'studies show'],
        directives: ['consider', 'note', 'see', 'observe', 'examine', 'look at', 'refer to', 'review', 'compare', 'analyze'],
        readerPronouns: ['you', 'your', 'yours', 'yourself', 'yourselves']
    };

    // Top 100 English Function Words (for stylometric analysis)
    const functionWords = [
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
        'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
        'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
        'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
        'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
        'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
        'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
        'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
    ];

    // Academic Word List (AWL) - Representative subset (Coxhead, 2000)
    const academicWordList = [
        'analyze', 'approach', 'area', 'assess', 'assume', 'authority', 'available', 'benefit', 'concept', 'consist',
        'constitute', 'context', 'contract', 'create', 'data', 'define', 'derive', 'distribute', 'economy', 'environment',
        'establish', 'estimate', 'evident', 'export', 'factor', 'finance', 'formula', 'function', 'identify', 'income',
        'indicate', 'individual', 'interpret', 'involve', 'issue', 'labor', 'legal', 'legislate', 'major', 'method',
        'occur', 'percent', 'period', 'policy', 'principle', 'proceed', 'process', 'require', 'research', 'respond',
        'role', 'section', 'sector', 'significant', 'similar', 'source', 'specific', 'structure', 'theory', 'vary',
        'achieve', 'acquire', 'administrate', 'affect', 'appropriate', 'aspect', 'assist', 'category', 'chapter', 'commission',
        'community', 'complex', 'compute', 'conclude', 'conduct', 'consequent', 'construct', 'consume', 'credit', 'culture',
        'design', 'distinct', 'element', 'equate', 'evaluate', 'feature', 'final', 'focus', 'impact', 'injure',
        'institute', 'invest', 'item', 'journal', 'maintain', 'normal', 'obtain', 'participate', 'perceive', 'positive',
        'potential', 'previous', 'primary', 'purchase', 'range', 'region', 'regulate', 'relevant', 'reside', 'resource',
        'restrict', 'secure', 'seek', 'select', 'site', 'strategy', 'survey', 'text', 'tradition', 'transfer',
        'alternative', 'circumstance', 'comment', 'compensate', 'component', 'consent', 'considerable', 'constant', 'constrain', 'contribute',
        'convene', 'coordinate', 'core', 'corporate', 'correspond', 'criteria', 'deduce', 'demonstrate', 'document', 'dominate',
        'emphasis', 'ensure', 'exclude', 'framework', 'fund', 'illustrate', 'immigrate', 'imply', 'initial', 'instance',
        'interact', 'justify', 'layer', 'link', 'locate', 'maximize', 'minor', 'negate', 'outcome', 'partner',
        'philosophy', 'physical', 'proportion', 'publish', 'react', 'register', 'rely', 'remove', 'scheme', 'sequence',
        'sex', 'shift', 'specify', 'sufficient', 'task', 'technical', 'technique', 'technology', 'valid', 'volume'
    ];

    // Common content word POS tags (for lexical density)
    const contentWordPOS = ['Noun', 'Verb', 'Adjective', 'Adverb'];

    // Subordinating conjunctions (for clause analysis)
    const subordinatingConjunctions = [
        'although', 'though', 'even though', 'because', 'since', 'as', 'if', 'unless', 'until', 'while',
        'whereas', 'after', 'before', 'when', 'whenever', 'where', 'wherever', 'whether'
    ];

    // Risk calculation function
    const calculateRisk = (text, thresholds) => {
        const cv = parseFloat(text.cv);
        const sttr = parseFloat(text.sttr);
        const mdDensity = text.metadiscourse?.density || 0;

        // CV veto: if CV < threshold, it's HIGH RISK regardless of other metrics
        if (cv < thresholds.cv) {
            return { overallRisk: 'HIGH RISK (AI) - CV veto', cvVeto: true };
        }

        // Check STTR and MD
        const sttrLow = sttr < thresholds.sttr;
        const mdLow = mdDensity < thresholds.metadiscourse;

        if (sttrLow && mdLow) {
            return { overallRisk: 'HIGH RISK (AI)', cvVeto: false };
        } else if (sttrLow || mdLow) {
            return { overallRisk: 'BORDERLINE', cvVeto: false };
        } else {
            return { overallRisk: 'HUMAN-LIKE', cvVeto: false };
        }
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

    // ========== TIER 2 CALCULATION FUNCTIONS ==========

    // Calculate Burrows's Delta (stylometric distance between two texts)
    const calculateBurrowsDelta = (tokens1, tokens2) => {
        const freq1 = {};
        const freq2 = {};

        tokens1.forEach(t => freq1[t] = (freq1[t] || 0) + 1);
        tokens2.forEach(t => freq2[t] = (freq2[t] || 0) + 1);

        const allWords = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
        const commonWords = Array.from(allWords).slice(0, 50); // Top 50 most frequent

        let deltaSum = 0;
        commonWords.forEach(word => {
            const f1 = (freq1[word] || 0) / tokens1.length;
            const f2 = (freq2[word] || 0) / tokens2.length;
            deltaSum += Math.abs(f1 - f2);
        });

        return commonWords.length > 0 ? deltaSum / commonWords.length : 0;
    };

    // Function word frequency profile
    const calculateFunctionWordProfile = (tokens, topN = 50) => {
        const profile = {};
        const targetWords = functionWords.slice(0, topN);

        targetWords.forEach(fw => profile[fw] = 0);
        tokens.forEach(token => {
            if (profile.hasOwnProperty(token)) {
                profile[token]++;
            }
        });

        // Convert to percentages
        const total = tokens.length;
        Object.keys(profile).forEach(key => {
            profile[key] = total > 0 ? (profile[key] / total) * 100 : 0;
        });

        return profile;
    };

    // Pronoun distribution (1st/2nd/3rd person)
    const calculatePronounDistribution = (tokens) => {
        const firstPerson = ['i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'myself', 'ourselves'];
        const secondPerson = ['you', 'your', 'yours', 'yourself', 'yourselves'];
        const thirdPerson = ['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves'];

        const counts = { first: 0, second: 0, third: 0 };

        tokens.forEach(token => {
            if (firstPerson.includes(token)) counts.first++;
            else if (secondPerson.includes(token)) counts.second++;
            else if (thirdPerson.includes(token)) counts.third++;
        });

        const total = counts.first + counts.second + counts.third;
        return {
            counts,
            total,
            percentages: {
                first: total > 0 ? (counts.first / total) * 100 : 0,
                second: total > 0 ? (counts.second / total) * 100 : 0,
                third: total > 0 ? (counts.third / total) * 100 : 0
            }
        };
    };

    // Hapax legomena ratio (words appearing exactly once)
    const calculateHapaxLegomena = (tokens) => {
        const freq = {};
        tokens.forEach(t => freq[t] = (freq[t] || 0) + 1);
        const hapax = Object.values(freq).filter(count => count === 1).length;
        return tokens.length > 0 ? hapax / tokens.length : 0;
    };

    // Dis legomena ratio (words appearing exactly twice)
    const calculateDisLegomena = (tokens) => {
        const freq = {};
        tokens.forEach(t => freq[t] = (freq[t] || 0) + 1);
        const dis = Object.values(freq).filter(count => count === 2).length;
        return tokens.length > 0 ? dis / tokens.length : 0;
    };

    // Academic Word List coverage
    const calculateAWLCoverage = (tokens) => {
        const awlTokens = tokens.filter(t => academicWordList.includes(t));
        return tokens.length > 0 ? (awlTokens.length / tokens.length) * 100 : 0;
    };

    // Word frequency bands (K1: 1-1000, K2: 1001-2000, off-list)
    const calculateWordFrequencyBands = (tokens) => {
        // Simplified: use function words as proxy for K1
        const k1Count = tokens.filter(t => functionWords.includes(t)).length;
        const k2Count = tokens.filter(t => academicWordList.includes(t)).length;
        const offList = tokens.length - k1Count - k2Count;

        return {
            k1: tokens.length > 0 ? (k1Count / tokens.length) * 100 : 0,
            k2: tokens.length > 0 ? (k2Count / tokens.length) * 100 : 0,
            offList: tokens.length > 0 ? (offList / tokens.length) * 100 : 0
        };
    };

    // Lexical density (content words / total words) using NLP
    const calculateLexicalDensity = (text) => {
        const doc = nlp(text);
        const totalWords = doc.terms().length;
        const contentWords = doc.match('#Noun|#Verb|#Adjective|#Adverb').length;
        return totalWords > 0 ? (contentWords / totalWords) * 100 : 0;
    };

    // Average word length (graphemes)
    const calculateAvgWordLength = (tokens) => {
        if (tokens.length === 0) return 0;
        const totalLength = tokens.reduce((sum, token) => sum + token.length, 0);
        return totalLength / tokens.length;
    };

    // Multi-syllabic word ratio (≥3 syllables) - heuristic estimation
    const calculateMultiSyllabicRatio = (tokens) => {
        const estimateSyllables = (word) => {
            word = word.toLowerCase();
            if (word.length <= 3) return 1;
            word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
            word = word.replace(/^y/, '');
            const matches = word.match(/[aeiouy]{1,2}/g);
            return matches ? matches.length : 1;
        };

        const multiSyllabic = tokens.filter(t => estimateSyllables(t) >= 3).length;
        return tokens.length > 0 ? (multiSyllabic / tokens.length) * 100 : 0;
    };

    // Sentence length standard deviation
    const calculateSentenceLengthStdDev = (sentenceLengths) => {
        if (sentenceLengths.length === 0) return 0;
        const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
        const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / sentenceLengths.length;
        return Math.sqrt(variance);
    };

    // Sentence complexity distribution using NLP
    const estimateSentenceComplexity = (text) => {
        const doc = nlp(text);
        const sentences = doc.sentences().out('array');

        const complexity = { simple: 0, compound: 0, complex: 0 };

        sentences.forEach(sent => {
            const sentDoc = nlp(sent);
            const hasCoordConj = sentDoc.match('(and|but|or|nor|for|yet|so)').length > 0;
            const hasSubordConj = sentDoc.match('(although|because|since|unless|while|if|when|where)').length > 0;

            if (hasSubordConj) {
                complexity.complex++;
            } else if (hasCoordConj) {
                complexity.compound++;
            } else {
                complexity.simple++;
            }
        });

        const total = sentences.length;
        return {
            counts: complexity,
            percentages: {
                simple: total > 0 ? (complexity.simple / total) * 100 : 0,
                compound: total > 0 ? (complexity.compound / total) * 100 : 0,
                complex: total > 0 ? (complexity.complex / total) * 100 : 0
            }
        };
    };

    // Estimate subordination depth
    const estimateSubordinationDepth = (sentences) => {
        const depths = sentences.map(sent => {
            const lowerSent = sent.toLowerCase();
            let depth = 0;
            subordinatingConjunctions.forEach(conj => {
                const regex = new RegExp(`\\b${conj}\\b`, 'g');
                const matches = lowerSent.match(regex);
                if (matches) depth += matches.length;
            });
            return depth;
        });

        return depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;
    };

    // Estimate clauses per sentence using NLP
    const estimateClausesPerSentence = (text) => {
        const doc = nlp(text);
        const sentences = doc.sentences().out('array');

        if (sentences.length === 0) return 0;

        const totalClauses = sentences.reduce((sum, sent) => {
            const sentDoc = nlp(sent);
            // Count verbs as proxy for clauses
            const verbs = sentDoc.verbs().length;
            return sum + Math.max(1, verbs);
        }, 0);

        return totalClauses / sentences.length;
    };

    // Calculate T-unit length (approximation)
    const calculateTUnitLength = (text) => {
        const doc = nlp(text);
        const sentences = doc.sentences().out('array');

        if (sentences.length === 0) return 0;

        const totalWords = doc.terms().length;
        return totalWords / sentences.length;
    };

    // Dependent clause ratio
    const calculateDependentClauseRatio = (sentences) => {
        let totalClauses = 0;
        let dependentClauses = 0;

        sentences.forEach(sent => {
            const lowerSent = sent.toLowerCase();
            let clauseCount = 1; // At least one main clause
            let depCount = 0;

            subordinatingConjunctions.forEach(conj => {
                const regex = new RegExp(`\\b${conj}\\b`, 'g');
                const matches = lowerSent.match(regex);
                if (matches) {
                    clauseCount += matches.length;
                    depCount += matches.length;
                }
            });

            totalClauses += clauseCount;
            dependentClauses += depCount;
        });

        return totalClauses > 0 ? (dependentClauses / totalClauses) * 100 : 0;
    };

    // Extended metadiscourse calculation
    const calculateExtendedMetadiscourse = (text) => {
        const lowerText = text.toLowerCase();
        const counts = {
            codeGlosses: 0,
            frameMarkers: 0,
            evidentials: 0,
            directives: 0,
            readerPronouns: 0
        };

        Object.keys(extendedMetadiscourse).forEach(category => {
            extendedMetadiscourse[category].forEach(marker => {
                const regex = new RegExp(`\\b${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                const matches = lowerText.match(regex);
                if (matches) counts[category] += matches.length;
            });
        });

        const tokens = tokenize(text);
        const per1k = tokens.length > 0 ? 1000 / tokens.length : 0;

        return {
            counts,
            densities: {
                codeGlosses: counts.codeGlosses * per1k,
                frameMarkers: counts.frameMarkers * per1k,
                evidentials: counts.evidentials * per1k,
                directives: counts.directives * per1k,
                readerPronouns: counts.readerPronouns * per1k
            }
        };
    };

    // Lexical repetition ratio
    const calculateLexicalRepetition = (tokens) => {
        const contentTokens = tokens.filter(t => !functionWords.includes(t));
        if (contentTokens.length === 0) return 0;

        const freq = {};
        contentTokens.forEach(t => freq[t] = (freq[t] || 0) + 1);

        const repeated = Object.values(freq).filter(count => count > 1).reduce((sum, count) => sum + count, 0);
        return (repeated / contentTokens.length) * 100;
    };

    // Estimate reference chains (pronouns and demonstratives)
    const estimateReferenceChains = (text) => {
        const doc = nlp(text);
        const pronouns = doc.pronouns().length;
        const demonstratives = doc.match('(this|that|these|those)').length;
        return pronouns + demonstratives;
    };

    // Estimate lexical chains (semantic continuity via word overlap)
    const estimateLexicalChains = (sentences) => {
        if (sentences.length < 2) return 0;

        let overlapCount = 0;
        for (let i = 0; i < sentences.length - 1; i++) {
            const tokens1 = new Set(tokenize(sentences[i]));
            const tokens2 = new Set(tokenize(sentences[i + 1]));

            const intersection = new Set([...tokens1].filter(t => tokens2.has(t) && !functionWords.includes(t)));
            if (intersection.size > 0) overlapCount++;
        }

        return sentences.length > 1 ? (overlapCount / (sentences.length - 1)) * 100 : 0;
    };

    // ========== TIER 3 CALCULATION FUNCTIONS ==========

    // VOCD-D approximation (simplified sampling method)
    const calculateVOCD_D = (tokens) => {
        if (tokens.length < 50) return 0;

        const sampleSizes = [35, 40, 45, 50];
        const trials = 3;
        let totalD = 0;
        let count = 0;

        sampleSizes.forEach(size => {
            if (tokens.length >= size) {
                for (let trial = 0; trial < trials; trial++) {
                    const sample = [];
                    const indices = new Set();
                    while (sample.length < size) {
                        const idx = Math.floor(Math.random() * tokens.length);
                        if (!indices.has(idx)) {
                            indices.add(idx);
                            sample.push(tokens[idx]);
                        }
                    }
                    const types = new Set(sample).size;
                    const ttr = types / size;
                    // Simplified D calculation
                    totalD += (types * types) / (2 * (size - types + 1));
                    count++;
                }
            }
        });

        return count > 0 ? totalD / count : 0;
    };

    // Moving-Average Type-Token Ratio (MATTR)
    const calculateMATTR = (tokens, windowSize = 50) => {
        if (tokens.length < windowSize) {
            const types = new Set(tokens).size;
            return tokens.length > 0 ? types / tokens.length : 0;
        }

        let sumTTR = 0;
        let windowCount = 0;

        for (let i = 0; i <= tokens.length - windowSize; i++) {
            const window = tokens.slice(i, i + windowSize);
            const types = new Set(window).size;
            sumTTR += types / windowSize;
            windowCount++;
        }

        return windowCount > 0 ? sumTTR / windowCount : 0;
    };

    // Measure of Textual Lexical Diversity (MTLD)
    const calculateMTLD = (tokens) => {
        if (tokens.length < 50) return 0;

        const calculateFactorScore = (tokenList) => {
            let factors = 0;
            let types = new Set();
            let tokensSoFar = 0;
            const threshold = 0.72;

            for (let i = 0; i < tokenList.length; i++) {
                types.add(tokenList[i]);
                tokensSoFar++;
                const ttr = types.size / tokensSoFar;

                if (ttr <= threshold) {
                    factors++;
                    types = new Set();
                    tokensSoFar = 0;
                }
            }

            if (tokensSoFar > 0) {
                const ttr = types.size / tokensSoFar;
                factors += (1 - ttr) / (1 - threshold);
            }

            return factors;
        };

        const forwardFactors = calculateFactorScore(tokens);
        const backwardFactors = calculateFactorScore([...tokens].reverse());

        const avgFactors = (forwardFactors + backwardFactors) / 2;
        return avgFactors > 0 ? tokens.length / avgFactors : 0;
    };

    // Rare word ratio (words not in common 5000)
    const calculateRareWordRatio = (tokens) => {
        // Simplified: words not in function words or AWL are considered "rare"
        const commonWords = new Set([...functionWords, ...academicWordList]);
        const rareWords = tokens.filter(t => !commonWords.has(t) && t.length > 3);
        return tokens.length > 0 ? (rareWords.length / tokens.length) * 100 : 0;
    };

    // Content-to-function word ratio using NLP
    const calculateContentFunctionRatio = (text) => {
        const doc = nlp(text);
        const contentWords = doc.match('#Noun|#Verb|#Adjective|#Adverb').length;
        const allWords = doc.terms().length;
        const functionWords = allWords - contentWords;
        return functionWords > 0 ? contentWords / functionWords : 0;
    };

    // Open-class TTR (nouns, verbs, adjectives, adverbs only)
    const calculateOpenClassTTR = (text) => {
        const doc = nlp(text);
        const openClass = doc.match('#Noun|#Verb|#Adjective|#Adverb').out('array');
        const tokens = openClass.map(w => w.toLowerCase());
        const types = new Set(tokens).size;
        return tokens.length > 0 ? types / tokens.length : 0;
    };

    // Nominalization density (-tion, -ness, -ment, -ity per 1k words)
    const calculateNominalizationDensity = (tokens) => {
        const nominalizations = tokens.filter(t =>
            t.endsWith('tion') || t.endsWith('sion') || t.endsWith('ness') ||
            t.endsWith('ment') || t.endsWith('ity') || t.endsWith('ance') ||
            t.endsWith('ence')
        );
        return tokens.length > 0 ? (nominalizations.length / tokens.length) * 1000 : 0;
    };

    // Nominal vs verbal style ratio
    const calculateNominalVerbalRatio = (text) => {
        const doc = nlp(text);
        const nouns = doc.nouns().length;
        const verbs = doc.verbs().length;
        return verbs > 0 ? nouns / verbs : 0;
    };

    // Passive voice density using NLP
    const calculatePassiveVoiceDensity = (text) => {
        const doc = nlp(text);
        const sentences = doc.sentences().out('array');
        let passiveCount = 0;

        sentences.forEach(sent => {
            const sentDoc = nlp(sent);
            // Detect passive: "be" verb + past participle
            const hasBeVerb = sentDoc.match('(is|are|was|were|been|be|being)').found;
            const hasPastParticiple = sentDoc.match('#PastTense').found || sentDoc.match('#Participle').found;
            if (hasBeVerb && hasPastParticiple) {
                passiveCount++;
            }
        });

        return sentences.length > 0 ? (passiveCount / sentences.length) * 100 : 0;
    };

    // Reporting verbs analysis
    const calculateReportingVerbs = (tokens) => {
        const reportingVerbs = [
            'argue', 'argues', 'argued', 'claim', 'claims', 'claimed',
            'suggest', 'suggests', 'suggested', 'demonstrate', 'demonstrates', 'demonstrated',
            'show', 'shows', 'showed', 'indicate', 'indicates', 'indicated',
            'reveal', 'reveals', 'revealed', 'find', 'finds', 'found',
            'conclude', 'concludes', 'concluded', 'state', 'states', 'stated',
            'report', 'reports', 'reported', 'assert', 'asserts', 'asserted'
        ];

        const count = tokens.filter(t => reportingVerbs.includes(t)).length;
        return tokens.length > 0 ? (count / tokens.length) * 1000 : 0;
    };

    // Citation pattern detection
    const detectCitationPatterns = (text) => {
        // Parenthetical citations: (Author, Year) or (Author Year)
        const parentheticalPattern = /\([A-Z][a-z]+(?:\s+(?:et al\.|&|and)\s+[A-Z][a-z]+)?,?\s+\d{4}\)/g;
        const parentheticalMatches = text.match(parentheticalPattern) || [];

        // Narrative citations: Author (Year)
        const narrativePattern = /[A-Z][a-z]+(?:\s+(?:et al\.|&|and)\s+[A-Z][a-z]+)?\s+\(\d{4}\)/g;
        const narrativeMatches = text.match(narrativePattern) || [];

        return {
            parenthetical: parentheticalMatches.length,
            narrative: narrativeMatches.length,
            total: parentheticalMatches.length + narrativeMatches.length
        };
    };

    // Genre moves detection (CARS model)
    const detectGenreMoves = (text) => {
        const lowerText = text.toLowerCase();

        // Establishing territory indicators
        const territoryMarkers = ['research has shown', 'studies have', 'it is well known', 'previous work', 'literature shows'];
        const territory = territoryMarkers.filter(marker => lowerText.includes(marker)).length;

        // Establishing niche/gap indicators
        const nicheMarkers = ['however', 'but', 'yet', 'although', 'gap', 'lack of', 'few studies', 'limited research'];
        const niche = nicheMarkers.filter(marker => lowerText.includes(marker)).length;

        // Occupying niche/purpose indicators
        const purposeMarkers = ['this study', 'this paper', 'this research', 'we investigate', 'we examine', 'the aim', 'the purpose'];
        const purpose = purposeMarkers.filter(marker => lowerText.includes(marker)).length;

        return { territory, niche, purpose, total: territory + niche + purpose };
    };

    // Citation shell noun patterns
    const detectCitationShellNouns = (text) => {
        const shellNouns = ['argument', 'claim', 'idea', 'notion', 'view', 'finding', 'result', 'conclusion', 'suggestion', 'proposal'];
        const pattern = new RegExp(`(this|these)\\s+(${shellNouns.join('|')})\\s+that`, 'gi');
        const matches = text.match(pattern) || [];
        return matches.length;
    };

    // Flesch Reading Ease
    const calculateFleschReadingEase = (text, tokens, sentences) => {
        if (sentences.length === 0 || tokens.length === 0) return 0;

        const totalSyllables = tokens.reduce((sum, word) => {
            return sum + estimateSyllables(word);
        }, 0);

        const avgSentenceLength = tokens.length / sentences.length;
        const avgSyllablesPerWord = totalSyllables / tokens.length;

        return 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    };

    // Flesch-Kincaid Grade Level
    const calculateFleschKincaidGrade = (text, tokens, sentences) => {
        if (sentences.length === 0 || tokens.length === 0) return 0;

        const totalSyllables = tokens.reduce((sum, word) => {
            return sum + estimateSyllables(word);
        }, 0);

        const avgSentenceLength = tokens.length / sentences.length;
        const avgSyllablesPerWord = totalSyllables / tokens.length;

        return (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;
    };

    // Gunning Fog Index
    const calculateGunningFog = (text, tokens, sentences) => {
        if (sentences.length === 0 || tokens.length === 0) return 0;

        const complexWords = tokens.filter(word => estimateSyllables(word) >= 3).length;
        const avgSentenceLength = tokens.length / sentences.length;
        const percentComplexWords = (complexWords / tokens.length) * 100;

        return 0.4 * (avgSentenceLength + percentComplexWords);
    };

    // Helper function for syllable estimation (reused from Tier 2)
    const estimateSyllables = (word) => {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    };

    // ========== TIER 4 CALCULATION FUNCTIONS ==========

    // Clause length analysis (T-units)
    const calculateClauseLength = (text) => {
        const doc = nlp(text);
        const sentences = doc.sentences().out('array');
        if (sentences.length === 0) return 0;

        const clauseLengths = sentences.map(sent => {
            const sentDoc = nlp(sent);
            const words = sentDoc.terms().length;
            const verbs = sentDoc.verbs().length;
            return verbs > 0 ? words / Math.max(1, verbs) : words;
        });

        return clauseLengths.reduce((a, b) => a + b, 0) / clauseLengths.length;
    };

    // Subordinate clause ratio (finite + non-finite)
    const calculateSubordinateClauseRatio = (sentences) => {
        let totalClauses = sentences.length;
        let subordinateClauses = 0;

        sentences.forEach(sent => {
            const lowerSent = sent.toLowerCase();
            subordinatingConjunctions.forEach(conj => {
                const regex = new RegExp(`\\b${conj}\\b`, 'g');
                const matches = lowerSent.match(regex);
                if (matches) subordinateClauses += matches.length;
            });
            // Non-finite markers: to-infinitives, -ing forms
            const toInf = (lowerSent.match(/\bto\s+\w+/g) || []).length;
            const ingForms = (lowerSent.match(/\b\w+ing\b/g) || []).length;
            subordinateClauses += Math.min(toInf, 2) + Math.min(ingForms * 0.3, 1);
        });

        return totalClauses > 0 ? (subordinateClauses / totalClauses) * 100 : 0;
    };

    // Left-branching depth (words before main verb)
    const calculateLeftBranchingDepth = (text) => {
        const doc = nlp(text);
        const sentences = doc.sentences().out('array');
        if (sentences.length === 0) return 0;

        const depths = sentences.map(sent => {
            const sentDoc = nlp(sent);
            const terms = sentDoc.terms().out('array');
            const verbs = sentDoc.verbs().out('array');
            if (verbs.length === 0) return 0;

            const firstVerbIndex = terms.findIndex(t => verbs.includes(t));
            return firstVerbIndex >= 0 ? firstVerbIndex : 0;
        });

        return depths.reduce((a, b) => a + b, 0) / depths.length;
    };

    // Right-branching depth (post-verbal expansion)
    const calculateRightBranchingDepth = (text) => {
        const doc = nlp(text);
        const sentences = doc.sentences().out('array');
        if (sentences.length === 0) return 0;

        const depths = sentences.map(sent => {
            const sentDoc = nlp(sent);
            const terms = sentDoc.terms().out('array');
            const verbs = sentDoc.verbs().out('array');
            if (verbs.length === 0) return 0;

            const lastVerbIndex = terms.map((t, i) => verbs.includes(t) ? i : -1).filter(i => i >= 0).pop();
            return lastVerbIndex >= 0 ? terms.length - lastVerbIndex - 1 : 0;
        });

        return depths.reduce((a, b) => a + b, 0) / depths.length;
    };

    // Overall syntactic complexity index (composite)
    const calculateSyntacticComplexityIndex = (text, sentences) => {
        const doc = nlp(text);
        const avgSentLength = doc.terms().length / sentences.length;
        const clausesPerSent = estimateClausesPerSentence(text);
        const subordinationDepth = estimateSubordinationDepth(sentences);

        // Normalized composite (0-100 scale)
        const lengthScore = Math.min(avgSentLength / 30, 1) * 33;
        const clauseScore = Math.min(clausesPerSent / 3, 1) * 33;
        const subordinationScore = Math.min(subordinationDepth, 1) * 34;

        return lengthScore + clauseScore + subordinationScore;
    };

    // Passive agent retention ("by-phrase")
    const calculatePassiveAgentRetention = (text) => {
        const passivePattern = /\b(is|are|was|were|been|be)\s+\w+ed\s+by\s+/gi;
        const matches = text.match(passivePattern) || [];
        const sentences = splitSentences(text);
        return sentences.length > 0 ? (matches.length / sentences.length) * 100 : 0;
    };

    // Light-verb construction ratio
    const calculateLightVerbRatio = (text) => {
        const lightVerbPatterns = [
            /\bmake\s+a\s+(decision|choice|mistake|attempt|effort)\b/gi,
            /\btake\s+a\s+(look|break|chance|step|walk)\b/gi,
            /\bgive\s+a\s+(presentation|talk|speech|lecture)\b/gi,
            /\bhave\s+a\s+(discussion|conversation|meeting|chat)\b/gi,
            /\bdo\s+a\s+(favor|job|task)\b/gi
        ];

        let count = 0;
        lightVerbPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            count += matches.length;
        });

        const tokens = tokenize(text);
        return tokens.length > 0 ? (count / tokens.length) * 1000 : 0;
    };

    // Multi-word verb ratio (phrasal/prepositional verbs)
    const calculateMultiWordVerbRatio = (text) => {
        const doc = nlp(text);
        const terms = doc.terms().out('array');
        let multiWordVerbs = 0;

        // Common phrasal verb particles
        const particles = ['up', 'down', 'out', 'in', 'on', 'off', 'over', 'back', 'away', 'through'];

        for (let i = 0; i < terms.length - 1; i++) {
            const current = terms[i].toLowerCase();
            const next = terms[i + 1].toLowerCase();
            const verbDoc = nlp(current);
            if (verbDoc.verbs().found && particles.includes(next)) {
                multiWordVerbs++;
            }
        }

        return terms.length > 0 ? (multiWordVerbs / terms.length) * 100 : 0;
    };

    // It-cleft frequency
    const calculateItCleftFrequency = (text) => {
        const itCleftPattern = /\bit\s+(is|was|'s)\s+\w+\s+that\b/gi;
        const matches = text.match(itCleftPattern) || [];
        const sentences = splitSentences(text);
        return sentences.length > 0 ? (matches.length / sentences.length) * 100 : 0;
    };

    // Wh-cleft frequency
    const calculateWhCleftFrequency = (text) => {
        const whCleftPattern = /\b(what|where|when|why|how)\s+\w+\s+(is|was|are|were)\b/gi;
        const matches = text.match(whCleftPattern) || [];
        const sentences = splitSentences(text);
        return sentences.length > 0 ? (matches.length / sentences.length) * 100 : 0;
    };

    // Existential there density
    const calculateExistentialThereDensity = (text) => {
        const therePattern = /\bthere\s+(is|are|was|were|has|have|been)\b/gi;
        const matches = text.match(therePattern) || [];
        const sentences = splitSentences(text);
        return sentences.length > 0 ? (matches.length / sentences.length) * 100 : 0;
    };

    // Inversion after negative adverbials
    const calculateNegativeInversion = (text) => {
        const inversionPatterns = [
            /\bnever\s+(have|has|had|do|does|did|can|could|will|would)\b/gi,
            /\bseldom\s+(have|has|had|do|does|did)\b/gi,
            /\brarely\s+(have|has|had|do|does|did)\b/gi,
            /\bhardly\s+(have|has|had|do|does|did)\b/gi,
            /\bscarcely\s+(have|has|had|do|does|did)\b/gi
        ];

        let count = 0;
        inversionPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            count += matches.length;
        });

        const sentences = splitSentences(text);
        return sentences.length > 0 ? (count / sentences.length) * 100 : 0;
    };

    // Conjunction types analysis
    const analyzeConjunctionTypes = (text) => {
        const lowerText = text.toLowerCase();
        const coordinating = ['and', 'but', 'or', 'nor', 'for', 'yet', 'so'];
        const subordinating = subordinatingConjunctions;
        const correlative = ['either...or', 'neither...nor', 'both...and', 'not only...but also'];

        const coordCount = coordinating.reduce((sum, conj) => {
            const regex = new RegExp(`\\b${conj}\\b`, 'g');
            return sum + (lowerText.match(regex) || []).length;
        }, 0);

        const subordCount = subordinating.reduce((sum, conj) => {
            const regex = new RegExp(`\\b${conj}\\b`, 'g');
            return sum + (lowerText.match(regex) || []).length;
        }, 0);

        const correlatCount = correlative.reduce((sum, pair) => {
            const regex = new RegExp(pair.replace('...', '.*?'), 'gi');
            return sum + (text.match(regex) || []).length;
        }, 0);

        return { coordinating: coordCount, subordinating: subordCount, correlative: correlatCount };
    };

    // Discourse markers density
    const calculateDiscourseMarkersDensity = (tokens) => {
        const discourseMarkers = [
            'furthermore', 'moreover', 'additionally', 'besides', 'likewise',
            'however', 'nevertheless', 'nonetheless', 'conversely', 'alternatively',
            'therefore', 'thus', 'consequently', 'hence', 'accordingly',
            'meanwhile', 'subsequently', 'previously', 'initially', 'finally'
        ];

        const count = tokens.filter(t => discourseMarkers.includes(t)).length;
        return tokens.length > 0 ? (count / tokens.length) * 1000 : 0;
    };

    // Anaphoric demonstrative density
    const calculateAnaphoricDemonstrativeDensity = (text) => {
        const pattern = /\b(this|that|these|those)\s+\w+/gi;
        const matches = text.match(pattern) || [];
        const tokens = tokenize(text);
        return tokens.length > 0 ? (matches.length / tokens.length) * 1000 : 0;
    };

    // Topic shift frequency (approximation using paragraph breaks)
    const calculateTopicShiftFrequency = (text) => {
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
        return paragraphs.length;
    };

    // Paragraph length in sentences
    const calculateParagraphLengthSentences = (text) => {
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
        if (paragraphs.length === 0) return 0;

        const lengths = paragraphs.map(p => splitSentences(p).length);
        return lengths.reduce((a, b) => a + b, 0) / lengths.length;
    };

    // Paragraph length variation
    const calculateParagraphLengthVariation = (text) => {
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
        if (paragraphs.length < 2) return 0;

        const lengths = paragraphs.map(p => splitSentences(p).length);
        const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
        return Math.sqrt(variance);
    };

    // Sentence opener diversity
    const calculateSentenceOpenerDiversity = (sentences) => {
        if (sentences.length === 0) return 0;

        const openers = sentences.map(sent => {
            const words = sent.trim().split(/\s+/);
            return words[0] ? words[0].toLowerCase().replace(/[^a-z]/g, '') : '';
        }).filter(o => o.length > 0);

        const uniqueOpeners = new Set(openers);
        return openers.length > 0 ? (uniqueOpeners.size / openers.length) * 100 : 0;
    };

    // ========== TIER 5 CALCULATION FUNCTIONS ==========

    // Repetitive sentence pattern detection (POS sequences)
    const calculateRepetitivePatterns = (text) => {
        const doc = nlp(text);
        const sentences = doc.sentences().out('array');
        if (sentences.length < 2) return 0;

        let repetitions = 0;
        const posSequences = sentences.map(s => nlp(s).terms().out('tags').map(t => t[0]).join(',')); // Simplified POS tags

        for (let i = 0; i < posSequences.length - 1; i++) {
            if (posSequences[i] === posSequences[i + 1]) repetitions++;
        }

        return (repetitions / sentences.length) * 100;
    };

    // Sentence opener POS analysis
    const analyzeSentenceOpeners = (text) => {
        const doc = nlp(text);
        const sentences = doc.sentences();
        const total = sentences.length;
        if (total === 0) return { noun: 0, verb: 0, adj: 0, adv: 0, other: 0 };

        const counts = { noun: 0, verb: 0, adj: 0, adv: 0, other: 0 };

        sentences.forEach(s => {
            const firstTerm = s.terms(0);
            if (firstTerm.has('#Noun')) counts.noun++;
            else if (firstTerm.has('#Verb')) counts.verb++;
            else if (firstTerm.has('#Adjective')) counts.adj++;
            else if (firstTerm.has('#Adverb')) counts.adv++;
            else counts.other++;
        });

        return counts;
    };

    // Lexical cohesion via semantic overlap (Jaccard)
    const calculateJaccardCohesion = (text) => {
        const sentences = splitSentences(text);
        if (sentences.length < 2) return 0;

        let sumJaccard = 0;
        const tokenSets = sentences.map(s => new Set(tokenize(s).map(t => t.toLowerCase())));

        for (let i = 0; i < tokenSets.length - 1; i++) {
            const setA = tokenSets[i];
            const setB = tokenSets[i + 1];
            if (setA.size === 0 || setB.size === 0) continue;

            const intersection = new Set([...setA].filter(x => setB.has(x)));
            const union = new Set([...setA, ...setB]);
            sumJaccard += intersection.size / union.size;
        }

        return (sumJaccard / (sentences.length - 1)).toFixed(3);
    };

    // Impersonal construction frequency
    const calculateImpersonalConstructions = (text) => {
        const patterns = [
            /\bit\s+(seems|appears|looks|sounds|feels)/gi,
            /\bit\s+is\s+(likely|possible|probable|clear|obvious|evident)/gi,
            /\bone\s+(must|should|can|could|may|might)/gi,
            /\bthere\s+(is|are|seems|appears)/gi
        ];

        let count = 0;
        patterns.forEach(p => {
            const matches = text.match(p) || [];
            count += matches.length;
        });

        const tokens = tokenize(text);
        return tokens.length > 0 ? (count / tokens.length) * 1000 : 0;
    };

    // Contraction usage
    const calculateContractionRatio = (text) => {
        const matches = text.match(/\b\w+'[stmdre]\b|\bwon't\b|\bcan't\b/gi) || [];
        const tokens = tokenize(text);
        return tokens.length > 0 ? (matches.length / tokens.length) * 100 : 0;
    };

    // Determiner patterns (the/a/an)
    const calculateDeterminerRatio = (text) => {
        const doc = nlp(text);
        const determiners = doc.match('(the|a|an)').length;
        const tokens = doc.terms().length;
        return tokens > 0 ? (determiners / tokens) * 100 : 0;
    };

    // Preposition distribution
    const calculatePrepositionDistribution = (text) => {
        const doc = nlp(text);
        const preps = doc.prepositions().out('array');
        const counts = {};
        preps.forEach(p => {
            const lower = p.toLowerCase();
            counts[lower] = (counts[lower] || 0) + 1;
        });
        return counts;
    };

    // Hedging ratio
    const calculateHedgingRatio = (text) => {
        const hedges = [
            'possibly', 'probably', 'perhaps', 'maybe', 'might', 'may', 'could', 'can',
            'seem', 'appear', 'suggest', 'indicate', 'assume', 'likely', 'unlikely',
            'conceivably', 'potentially', 'presumably', 'apparently'
        ];
        const tokens = tokenize(text);
        const count = tokens.filter(t => hedges.includes(t.toLowerCase())).length;
        return tokens.length > 0 ? (count / tokens.length) * 100 : 0;
    };

    // Boosting ratio
    const calculateBoostingRatio = (text) => {
        const boosters = [
            'definitely', 'certainly', 'clearly', 'obviously', 'undeniably', 'absolutely',
            'always', 'never', 'must', 'prove', 'conclusively', 'evidently', 'invariably',
            'show that', 'demonstrate that'
        ];
        // Simple token match for single words, regex for phrases
        let count = 0;
        const lowerText = text.toLowerCase();
        boosters.forEach(b => {
            if (b.includes(' ')) {
                count += (lowerText.match(new RegExp(b, 'g')) || []).length;
            } else {
                count += (tokenize(text).filter(t => t.toLowerCase() === b).length);
            }
        });
        const tokens = tokenize(text);
        return tokens.length > 0 ? (count / tokens.length) * 100 : 0;
    };

    // Epistemic stance adverbs
    const calculateStanceAdverbs = (text) => {
        const doc = nlp(text);
        const adverbs = doc.adverbs().out('array');
        const epistemic = ['arguably', 'reportedly', 'supposedly', 'allegedly', 'undoubtedly', 'actually', 'really', 'truly', 'factually'];
        const count = adverbs.filter(a => epistemic.includes(a.toLowerCase())).length;
        const tokens = doc.terms().length;
        return tokens > 0 ? (count / tokens) * 1000 : 0;
    };

    // Hallidayan Processes
    const analyzeHallidayanProcesses = (text) => {
        const doc = nlp(text);

        // Material: Actions, doing, happening
        const materialVerbs = ['do', 'make', 'go', 'run', 'walk', 'work', 'play', 'take', 'give', 'build', 'create', 'write', 'eat'];
        const material = doc.verbs().filter(v => materialVerbs.some(mv => v.text('root').includes(mv))).length;

        // Mental: Cognition, affection, perception
        const mentalVerbs = ['think', 'know', 'feel', 'believe', 'understand', 'want', 'like', 'love', 'see', 'hear', 'smell', 'remember', 'forget'];
        const mental = doc.verbs().filter(v => mentalVerbs.some(mv => v.text('root').includes(mv))).length;

        // Relational: Being, having, becoming
        const relationalVerbs = ['be', 'have', 'become', 'seem', 'appear', 'sound', 'look', 'remain', 'stay'];
        const relational = doc.verbs().filter(v => relationalVerbs.some(rv => v.text('root').includes(rv))).length;

        const total = material + mental + relational;
        return {
            material, mental, relational,
            total: total > 0 ? total : 1 // Avoid div by zero
        };
    };

    // Dynamic vs Stative Ratio
    const calculateDynamicStativeRatio = (text) => {
        const doc = nlp(text);
        // Approximation: Stative verbs are mostly Relational/Mental, Dynamic are Material
        const { material, mental, relational } = analyzeHallidayanProcesses(text);
        const dynamic = material;
        const stative = mental + relational;
        return stative > 0 ? dynamic / stative : dynamic > 0 ? 10 : 0;
    };

    // Present Perfect Ratio
    const calculatePresentPerfectRatio = (text) => {
        const doc = nlp(text);
        const presentPerfect = doc.match('(have|has) #PastTense').length; // Approximation for have + Vbn
        const totalSentences = doc.sentences().length;
        return totalSentences > 0 ? (presentPerfect / totalSentences) * 100 : 0;
    };

    // Tense Shift Inconsistency
    const calculateTenseShiftInconsistency = (text) => {
        const doc = nlp(text);
        const paragraphs = text.split(/\n\n+/);
        let shifts = 0;

        paragraphs.forEach(p => {
            const pDoc = nlp(p);
            const sentences = pDoc.sentences().out('array');
            if (sentences.length < 2) return;

            let prevTense = null;
            sentences.forEach(s => {
                const sDoc = nlp(s);
                let currentTense = null;
                if (sDoc.has('#PastTense')) currentTense = 'past';
                else if (sDoc.has('#PresentTense')) currentTense = 'present';
                else if (sDoc.has('#FutureTense')) currentTense = 'future';

                if (currentTense && prevTense && currentTense !== prevTense) {
                    shifts++;
                }
                if (currentTense) prevTense = currentTense;
            });
        });

        const totalSentences = doc.sentences().length;
        return totalSentences > 0 ? (shifts / totalSentences) * 100 : 0;
    };

    // Grammatical Ratios
    const calculateGrammaticalRatios = (text) => {
        const doc = nlp(text);
        const nouns = doc.nouns().length;
        const verbs = doc.verbs().length;
        const adj = doc.adjectives().length;
        const adv = doc.adverbs().length;

        return {
            nounVerb: verbs > 0 ? (nouns / verbs).toFixed(2) : 0,
            adjNoun: nouns > 0 ? (adj / nouns).toFixed(2) : 0,
            advVerb: verbs > 0 ? (adv / verbs).toFixed(2) : 0
        };
    };

    // Lexical Density Variability
    const calculateLexicalDensityVariability = (text) => {
        const doc = nlp(text);
        const sentences = doc.sentences().out('array');
        if (sentences.length < 2) return 0;

        const densities = sentences.map(s => {
            const sDoc = nlp(s);
            const content = sDoc.match('#Noun|#Verb|#Adjective|#Adverb').length;
            const total = sDoc.terms().length;
            return total > 0 ? (content / total) * 100 : 0;
        });

        const mean = densities.reduce((a, b) => a + b, 0) / densities.length;
        const variance = densities.reduce((s, d) => s + Math.pow(d - mean, 2), 0) / densities.length;
        return Math.sqrt(variance).toFixed(2);
    };

    // ========== TIER 6 CALCULATION FUNCTIONS ==========

    // Coleman-Liau Index
    const calculateColemanLiau = (text, sentences, tokens) => {
        if (tokens.length === 0 || sentences.length === 0) return 0;
        const L = (text.replace(/[^a-zA-Z]/g, '').length / tokens.length) * 100;
        const S = (sentences.length / tokens.length) * 100;
        return (0.0588 * L - 0.296 * S - 15.8).toFixed(2);
    };

    // Automated Readability Index (ARI) - Replaces "Overall readability composite"
    const calculateARI = (text, sentences, tokens) => {
        if (tokens.length === 0 || sentences.length === 0) return 0;
        const chars = text.replace(/[^a-zA-Z0-9]/g, '').length;
        return (4.71 * (chars / tokens.length) + 0.5 * (tokens.length / sentences.length) - 21.43).toFixed(2);
    };

    // Shell Noun Variety
    const calculateShellNounVariety = (text) => {
        // Categories based on Schmid (2000)
        const categories = {
            factual: ['fact', 'problem', 'reason', 'result', 'proof', 'evidence', 'sign'],
            mental: ['idea', 'theory', 'notion', 'belief', 'concept', 'hypothesis', 'view'],
            eventive: ['process', 'development', 'change', 'situation', 'occurrence', 'incident'],
            modal: ['possibility', 'chance', 'risk', 'uncertainty', 'opportunity', 'danger']
        };

        const doc = nlp(text);
        const typesFound = new Set();

        Object.keys(categories).forEach(cat => {
            const words = categories[cat];
            words.forEach(w => {
                if (doc.has(w)) typesFound.add(cat);
            });
        });

        return typesFound.size; // 0 to 4
    };

    // Anglo-Saxon Core Ratio
    const calculateAngloSaxonRatio = (tokens) => {
        // Approximation: High freq short words are mostly Anglo-Saxon
        // In a real app, we'd use a massive lookup list. Here we use a heuristic + small common list
        const angloSaxonCommon = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us']);

        let count = 0;
        tokens.forEach(t => {
            if (angloSaxonCommon.has(t.toLowerCase()) || t.length <= 4) count++;
        });

        return tokens.length > 0 ? ((count / tokens.length) * 100).toFixed(1) : 0;
    };

    // Moving-Window TTR Decay (Slope)
    const calculateTTRDecay = (tokens) => {
        if (tokens.length < 200) return 0;

        const windowSizes = [50, 100, 150, 200];
        const ttrs = [];

        windowSizes.forEach(size => {
            if (tokens.length >= size) {
                const slice = tokens.slice(0, size);
                const types = new Set(slice.map(t => t.toLowerCase())).size;
                ttrs.push(types / size);
            }
        });

        if (ttrs.length < 2) return 0;

        // Simple slope calc: change in TTR over change in Window
        // We expect negative slope (TTR drops as text gets longer)
        const first = ttrs[0];
        const last = ttrs[ttrs.length - 1];
        const slope = (last - first) / (windowSizes[ttrs.length - 1] - windowSizes[0]);

        return (slope * 1000).toFixed(4); // Scaled for readability
    };

    // Genitive Alternation ('s vs of)
    const calculateGenitiveAlternation = (text) => {
        const doc = nlp(text);
        const sGenitives = doc.match('#Noun+\'s #Noun').length; // user's goal
        const ofGenitives = doc.match('#Noun of (the|a|an) #Noun').length; // goal of the user

        const total = sGenitives + ofGenitives;
        return total > 0 ? ((sGenitives / total) * 100).toFixed(1) : 0;
    };

    // Dative Alternation
    const calculateDativeAlternation = (text) => {
        const doc = nlp(text);
        const doubleObject = doc.match('(give|sent|show|tell|offer) #Pronoun #Noun').length; // give him it
        const prepDative = doc.match('(give|sent|show|tell|offer) #Noun to #Pronoun').length; // give it to him

        const total = doubleObject + prepDative;
        return total > 0 ? ((doubleObject / total) * 100).toFixed(1) : 0;
    };

    // Pied-Piping Score
    const calculatePiedPiping = (text) => {
        const doc = nlp(text);
        const piedPiping = doc.match('(to|for|with|by|from|in) (whom|which|whose)').length; // to whom
        const stranding = doc.match('(who|which|that) #Noun+? #Verb+? (to|for|with|by|from|in)$').length; // who... to

        // Return ratio of Pied-Piping vs Total Relatives found
        const total = piedPiping + stranding;
        return total > 0 ? ((piedPiping / total) * 100).toFixed(1) : 0;
    };

    // Adjective Ordering Violations
    const calculateAdjOrderingViolations = (text) => {
        // Standard order: Opinion, Size, Age, Shape, Color, Origin, Material, Purpose
        // Heuristic: Check if 'Color' comes before 'Size' (common error)
        const doc = nlp(text);
        const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow'];
        const sizes = ['big', 'small', 'large', 'tiny', 'huge', 'short', 'long'];

        let violations = 0;
        doc.sentences().forEach(s => {
            const sText = s.text().toLowerCase();
            colors.forEach(c => {
                sizes.forEach(sz => {
                    // if "red big" appears, violation
                    if (sText.includes(`${c} ${sz}`)) violations++;
                });
            });
        });

        return violations;
    };

    // Idiom Token Ratio
    const calculateIdiomRatio = (text) => {
        const idioms = [
            'piece of cake', 'break a leg', 'hit the nail', 'bite the bullet',
            'under the weather', 'spill the beans', 'once in a blue moon',
            'see eye to eye', 'ball is in your court', 'barking up the wrong tree',
            'blessing in disguise', 'burn the midnight oil', 'cut corners'
        ];

        let count = 0;
        const lower = text.toLowerCase();
        idioms.forEach(id => {
            if (lower.includes(id)) count++;
        });

        const tokens = tokenize(text);
        return tokens.length > 0 ? ((count / tokens.length) * 1000).toFixed(2) : 0;
    };

    // Assess risk based on metrics and current thresholds (with CV Veto Rule)
    const assessRisk = (metrics, currentThresholds) => {
        const cv = parseFloat(metrics.cv);
        const sttr = parseFloat(metrics.sttr);
        const mdDensity = metrics.metadiscourse.density;

        // VETO RULE: If CV is below threshold, override everything
        if (cv < currentThresholds.cv) {
            return {
                cvStatus: 'AI-like',
                sttrStatus: sttr > currentThresholds.sttr ? 'Human-like' : sttr < 0.40 ? 'AI-like' : 'Ambiguous',
                metadiscourseStatus: mdDensity > currentThresholds.metadiscourse ? 'Human-like' : mdDensity < 5 ? 'AI-like' : 'Ambiguous',
                overallRisk: 'AI / HIGH RISK'
            };
        }

        // Normal assessment
        const cvStatus = cv > 0.30 ? 'Human-like' : cv < 0.20 ? 'AI-like' : 'Ambiguous';
        const sttrStatus = sttr > currentThresholds.sttr ? 'Human-like' : sttr < 0.40 ? 'AI-like' : 'Ambiguous';
        const metadiscourseStatus = mdDensity > currentThresholds.metadiscourse ? 'Human-like' : mdDensity < 5 ? 'AI-like' : 'Ambiguous';

        const humanLikeCount = [cvStatus, sttrStatus, metadiscourseStatus].filter(s => s === 'Human-like').length;
        const aiLikeCount = [cvStatus, sttrStatus, metadiscourseStatus].filter(s => s === 'AI-like').length;

        let overallRisk;
        if (humanLikeCount >= 2) {
            overallRisk = 'High Stylistic Variation Detected - Likely Human';
        } else if (aiLikeCount >= 2) {
            overallRisk = 'Low Stylistic Variation Detected - Likely AI';
        } else {
            overallRisk = 'Mixed Stylistic Signals - Inconclusive';
        }

        return { cvStatus, sttrStatus, metadiscourseStatus, overallRisk };
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

        // Store raw metrics only (risk assessment will be calculated on-the-fly)

        // ========== TIER 2 CALCULATIONS ==========

        // Stylometric features
        const functionWordProfile = calculateFunctionWordProfile(tokens, 50);
        const top10FunctionWords = Object.entries(functionWordProfile)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, freq]) => ({ word, frequency: freq.toFixed(2) }));

        const pronounDist = calculatePronounDistribution(tokens);
        const hapaxRatio = calculateHapaxLegomena(tokens);
        const disRatio = calculateDisLegomena(tokens);

        // Lexical sophistication
        const awlCoverage = calculateAWLCoverage(tokens);
        const wordFreqBands = calculateWordFrequencyBands(tokens);
        const lexicalDensity = calculateLexicalDensity(text);
        const avgWordLength = calculateAvgWordLength(tokens);
        const multiSyllabicRatio = calculateMultiSyllabicRatio(tokens);

        // Syntactic complexity
        const sentLengthStdDev = calculateSentenceLengthStdDev(sentenceLengths);
        const sentComplexity = estimateSentenceComplexity(text);
        const subordinationDepth = estimateSubordinationDepth(sentences);
        const clausesPerSentence = estimateClausesPerSentence(text);
        const tUnitLength = calculateTUnitLength(text);
        const depClauseRatio = calculateDependentClauseRatio(sentences);

        // Extended metadiscourse
        const extendedMD = calculateExtendedMetadiscourse(text);

        // Cohesion features
        const lexicalRepetition = calculateLexicalRepetition(tokens);
        const referenceChains = estimateReferenceChains(text);
        const lexicalChains = estimateLexicalChains(sentences);

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
            avgSentenceLength: sentenceLengths.length > 0
                ? (sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length).toFixed(2)
                : 0,
            externalFlag: '', // User can paste H (Human) / AI / ? after external scan

            // TIER 2 FEATURES
            tier2: {
                // Stylometric
                functionWordProfile: top10FunctionWords,
                pronounDistribution: pronounDist,
                hapaxRatio: (hapaxRatio * 100).toFixed(2),
                disRatio: (disRatio * 100).toFixed(2),

                // Lexical Sophistication
                awlCoverage: awlCoverage.toFixed(2),
                wordFreqBands,
                lexicalDensity: lexicalDensity.toFixed(2),
                avgWordLength: avgWordLength.toFixed(2),
                multiSyllabicRatio: multiSyllabicRatio.toFixed(2),

                // Syntactic Complexity
                sentLengthStdDev: sentLengthStdDev.toFixed(2),
                sentComplexity,
                subordinationDepth: subordinationDepth.toFixed(2),
                clausesPerSentence: clausesPerSentence.toFixed(2),
                tUnitLength: tUnitLength.toFixed(2),
                depClauseRatio: depClauseRatio.toFixed(2),

                // Extended Metadiscourse
                extendedMetadiscourse: extendedMD,

                // Cohesion
                lexicalRepetition: lexicalRepetition.toFixed(2),
                referenceChains,
                lexicalChains: lexicalChains.toFixed(2)
            },

            // TIER 3 FEATURES
            tier3: {
                // Advanced Lexical Diversity
                vocdD: calculateVOCD_D(tokens).toFixed(2),
                mattr: calculateMATTR(tokens).toFixed(3),
                mtld: calculateMTLD(tokens).toFixed(2),
                rareWordRatio: calculateRareWordRatio(tokens).toFixed(2),
                contentFunctionRatio: calculateContentFunctionRatio(text).toFixed(2),

                // POS-Based Metrics
                openClassTTR: calculateOpenClassTTR(text).toFixed(3),
                nominalizationDensity: calculateNominalizationDensity(tokens).toFixed(2),

                // Style Ratios
                nominalVerbalRatio: calculateNominalVerbalRatio(text).toFixed(2),
                passiveVoiceDensity: calculatePassiveVoiceDensity(text).toFixed(2),

                // Academic Writing Features
                reportingVerbsDensity: calculateReportingVerbs(tokens).toFixed(2),
                citationPatterns: detectCitationPatterns(text),
                genreMoves: detectGenreMoves(text),
                shellNounPatterns: detectCitationShellNouns(text),

                // Readability Indices
                fleschReadingEase: calculateFleschReadingEase(text, tokens, sentences).toFixed(2),
                fleschKincaidGrade: calculateFleschKincaidGrade(text, tokens, sentences).toFixed(2),
                gunningFog: calculateGunningFog(text, tokens, sentences).toFixed(2)
            },

            // TIER 4 FEATURES
            tier4: {
                // Clause-Level Analysis
                clauseLength: calculateClauseLength(text).toFixed(2),
                subordinateClauseRatio: calculateSubordinateClauseRatio(sentences).toFixed(2),
                leftBranchingDepth: calculateLeftBranchingDepth(text).toFixed(2),
                rightBranchingDepth: calculateRightBranchingDepth(text).toFixed(2),
                syntacticComplexityIndex: calculateSyntacticComplexityIndex(text, sentences).toFixed(2),

                // Syntactic Patterns
                passiveAgentRetention: calculatePassiveAgentRetention(text).toFixed(2),
                lightVerbRatio: calculateLightVerbRatio(text).toFixed(2),
                multiWordVerbRatio: calculateMultiWordVerbRatio(text).toFixed(2),

                // Cleft Constructions
                itCleftFrequency: calculateItCleftFrequency(text).toFixed(2),
                whCleftFrequency: calculateWhCleftFrequency(text).toFixed(2),
                existentialThereDensity: calculateExistentialThereDensity(text).toFixed(2),
                negativeInversion: calculateNegativeInversion(text).toFixed(2),

                // Discourse Features
                conjunctionTypes: analyzeConjunctionTypes(text),
                discourseMarkersDensity: calculateDiscourseMarkersDensity(tokens).toFixed(2),
                anaphoricDemonstrativeDensity: calculateAnaphoricDemonstrativeDensity(text).toFixed(2),

                // Paragraph-Level
                topicShifts: calculateTopicShiftFrequency(text),
                paragraphLengthSentences: calculateParagraphLengthSentences(text).toFixed(2),
                paragraphLengthVariation: calculateParagraphLengthVariation(text).toFixed(2),
                sentenceOpenerDiversity: calculateSentenceOpenerDiversity(sentences).toFixed(2)
            },

            // TIER 5 FEATURES (Theoretical Depth)
            tier5: {
                // Discourse & Patterns
                repetitivePatterns: calculateRepetitivePatterns(text).toFixed(2),
                sentenceOpenerPOS: analyzeSentenceOpeners(text),
                jaccardCohesion: calculateJaccardCohesion(text),

                // Stance & Rhetoric
                impersonalConstructions: calculateImpersonalConstructions(text).toFixed(2),
                contractionRatio: calculateContractionRatio(text).toFixed(2),
                determinerRatio: calculateDeterminerRatio(text).toFixed(2),
                prepositionDistribution: calculatePrepositionDistribution(text),
                hedgingRatio: calculateHedgingRatio(text).toFixed(2),
                boostingRatio: calculateBoostingRatio(text).toFixed(2),
                stanceAdverbs: calculateStanceAdverbs(text).toFixed(2),

                // Hallidayan Processes
                hallidayan: analyzeHallidayanProcesses(text),
                dynamicStativeRatio: calculateDynamicStativeRatio(text).toFixed(2),
                presentPerfectRatio: calculatePresentPerfectRatio(text).toFixed(2),

                // Tense & Aspect
                tenseShiftInconsistency: calculateTenseShiftInconsistency(text).toFixed(2),

                // Grammatical Ratios & Variability
                grammaticalRatios: calculateGrammaticalRatios(text),
                lexicalDensityVariability: calculateLexicalDensityVariability(text)
            },

            // TIER 6 FEATURES (Final Advanced Metrics)
            tier6: {
                // Readability & Provenance
                colemanLiau: calculateColemanLiau(text, sentences, tokens),
                ari: calculateARI(text, sentences, tokens),
                angloSaxonRatio: calculateAngloSaxonRatio(tokens),
                shellNounVariety: calculateShellNounVariety(text),
                idiomRatio: calculateIdiomRatio(text),
                ttrDecay: calculateTTRDecay(tokens),

                // Micro-Syntax & Alternations
                genitiveAlternation: calculateGenitiveAlternation(text),
                dativeAlternation: calculateDativeAlternation(text),
                piedPipingScore: calculatePiedPiping(text),
                adjOrderingViolations: calculateAdjOrderingViolations(text)
                // Note: Key-Keywords skipped as it requires a massive external reference corpus
            }
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

    // Handle file upload (supports TXT, PDF, DOC, DOCX)
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        const supportedExtensions = ['.txt', '.pdf', '.doc', '.docx'];
        const validFiles = files.filter(f =>
            supportedExtensions.some(ext => f.name.toLowerCase().endsWith(ext))
        );

        if (validFiles.length === 0) {
            alert('Please upload .txt, .pdf, .doc, or .docx files only.');
            return;
        }

        setIsProcessing(true);

        for (const file of validFiles) {
            try {
                let text = '';
                const ext = file.name.toLowerCase().split('.').pop();

                if (ext === 'txt') {
                    // Plain text
                    text = await file.text();
                } else if (ext === 'pdf') {
                    // PDF parsing using pdf.js
                    text = await parsePDF(file);
                } else if (ext === 'docx') {
                    // DOCX parsing using mammoth.js
                    text = await parseDOCX(file);
                } else if (ext === 'doc') {
                    // DOC files need server-side processing, warn user
                    alert(`Legacy .doc format for "${file.name}" is not fully supported in-browser. Please convert to .docx or .txt.`);
                    continue;
                }

                if (text && text.trim()) {
                    const analysis = analyzeText(text, file.name);
                    setTexts(prev => [...prev, analysis]);
                } else {
                    console.warn(`No text extracted from ${file.name}`);
                }
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                alert(`Failed to process "${file.name}": ${error.message}`);
            }
        }

        setIsProcessing(false);
    };

    // Parse PDF using pdf.js (CDN loaded)
    const parsePDF = async (file) => {
        // Load pdf.js from CDN if not already loaded
        if (!window.pdfjsLib) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                script.onload = () => {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        return fullText;
    };

    // Parse DOCX using mammoth.js (CDN loaded)
    const parseDOCX = async (file) => {
        // Load mammoth.js from CDN if not already loaded
        if (!window.mammoth) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    // Batch rename files to FP_01...FP_35 and C_01...C_35
    const handleBatchRename = () => {
        if (texts.length === 0) return;

        const halfPoint = Math.ceil(texts.length / 2);
        const renamed = texts.map((text, idx) => {
            if (idx < halfPoint) {
                const num = String(idx + 1).padStart(2, '0');
                return { ...text, filename: `FP_${num}.txt` };
            } else {
                const num = String(idx - halfPoint + 1).padStart(2, '0');
                return { ...text, filename: `C_${num}.txt` };
            }
        });

        setTexts(renamed);
        console.log(`Renamed ${texts.length} files → FP_01…FP_${String(halfPoint).padStart(2, '0')} and C_01…C_${String(texts.length - halfPoint).padStart(2, '0')}`);
        alert(`Renamed ${texts.length} files → FP_01…C_${String(texts.length - halfPoint).padStart(2, '0')}`);
    };

    // Calculate Z-scores for uncertainty bands
    const calculateZScores = (text, corpusStats) => {
        const cv = parseFloat(text.cv);
        const sttr = parseFloat(text.sttr);
        const md = text.metadiscourse.density;

        return {
            z_cv: corpusStats.stdCV > 0 ? ((cv - thresholds.cv) / corpusStats.stdCV).toFixed(2) : 0,
            z_sttr: corpusStats.stdSTTR > 0 ? ((sttr - thresholds.sttr) / corpusStats.stdSTTR).toFixed(2) : 0,
            z_md: corpusStats.stdMD > 0 ? ((md - thresholds.metadiscourse) / corpusStats.stdMD).toFixed(2) : 0
        };
    };

    // Update external flag for a text
    const updateExternalFlag = (index, flag) => {
        const updated = [...texts];
        updated[index].externalFlag = flag;
        setTexts(updated);
    };

    // Calculate combined corpus statistics with standard deviations
    const getCombinedStats = () => {
        if (texts.length === 0) return null;

        const totalWords = texts.reduce((sum, t) => sum + t.wordCount, 0);
        const totalSentences = texts.reduce((sum, t) => sum + t.sentenceCount, 0);
        const avgSTTR = texts.reduce((sum, t) => sum + parseFloat(t.sttr), 0) / texts.length;
        const avgCV = texts.reduce((sum, t) => sum + parseFloat(t.cv), 0) / texts.length;
        const avgMetadiscourse = texts.reduce((sum, t) => sum + t.metadiscourse.density, 0) / texts.length;

        // Calculate standard deviations for z-scores
        const varianceSTTR = texts.reduce((sum, t) => sum + Math.pow(parseFloat(t.sttr) - avgSTTR, 2), 0) / texts.length;
        const varianceCV = texts.reduce((sum, t) => sum + Math.pow(parseFloat(t.cv) - avgCV, 2), 0) / texts.length;
        const varianceMD = texts.reduce((sum, t) => sum + Math.pow(t.metadiscourse.density - avgMetadiscourse, 2), 0) / texts.length;

        return {
            totalWords,
            totalSentences,
            avgSTTR: avgSTTR.toFixed(3),
            avgCV: avgCV.toFixed(3),
            avgMetadiscourse: avgMetadiscourse.toFixed(2),
            fileCount: texts.length,
            stdSTTR: Math.sqrt(varianceSTTR),
            stdCV: Math.sqrt(varianceCV),
            stdMD: Math.sqrt(varianceMD)
        };
    };

    // Calculate confusion matrix and Youden's J
    const getConfusionMatrix = () => {
        if (texts.length === 0) return null;

        let TP = 0, FP = 0, TN = 0, FN = 0;

        texts.forEach(text => {
            if (!text.externalFlag) return; // Skip if no external flag set

            const risk = assessRisk(text, thresholds);
            const predictedHuman = risk.overallRisk.includes('Human');
            const actualHuman = text.externalFlag.toUpperCase() === 'H';
            const actualAI = text.externalFlag.toUpperCase() === 'AI';

            if (!actualHuman && !actualAI) return; // Skip '?' or other values

            if (predictedHuman && actualHuman) TP++;
            else if (!predictedHuman && actualHuman) FP++;
            else if (!predictedHuman && actualAI) TN++;
            else if (predictedHuman && actualAI) FN++;
        });

        const total = TP + FP + TN + FN;
        if (total === 0) return null;

        const sensitivity = TP + FN > 0 ? TP / (TP + FN) : 0;
        const specificity = TN + FP > 0 ? TN / (TN + FP) : 0;
        const youdenJ = sensitivity + specificity - 1;

        return { TP, FP, TN, FN, sensitivity, specificity, youdenJ };
    };

    // Generate LaTeX method paragraph
    const generateMethodParagraph = () => {
        if (texts.length === 0) return '';

        const stats = getCombinedStats();
        const confusion = getConfusionMatrix();
        const jValue = confusion ? confusion.youdenJ.toFixed(2) : 'N/A';

        return `The corpus ($N$=${stats.fileCount}) was analysed with CV (mean=${stats.avgCV}, SD=${stats.stdCV.toFixed(2)}), STTR (mean=${stats.avgSTTR}, SD=${stats.stdSTTR.toFixed(2)}) and metadiscourse density (mean=${stats.avgMetadiscourse}/1k, SD=${stats.stdMD.toFixed(1)}). Thresholds were CV$<$${thresholds.cv.toFixed(2)}, STTR$>$${thresholds.sttr.toFixed(2)}, MD$>$${thresholds.metadiscourse.toFixed(1)}, yielding Youden's $J$=${jValue}.`;
    };

    // Copy method paragraph to clipboard
    const copyMethodParagraph = () => {
        const paragraph = generateMethodParagraph();
        navigator.clipboard.writeText(paragraph).then(() => {
            console.log('Method paragraph copied – paste into Chapter 3');
            alert('Method paragraph copied to clipboard!');
        });
    };

    // Export to CSV
    const exportToCSV = () => {
        if (texts.length === 0) return;

        const stats = getCombinedStats();

        // Comprehensive headers including Tier 1 and Tier 2
        const headers = [
            'Filename', 'Word Count', 'Sentence Count', 'STTR', 'CV', 'Metadiscourse Density', 'Avg Sentence Length', 'Risk Assessment',
            'z_cv', 'z_sttr', 'z_md', 'External_Detector_Flag',
            // Tier 2: Stylometric
            'Hapax_Ratio', 'Dis_Ratio', 'Pronoun_1st', 'Pronoun_2nd', 'Pronoun_3rd',
            // Tier 2: Lexical Sophistication
            'AWL_Coverage', 'Lexical_Density', 'Avg_Word_Length', 'Multi_Syllabic_Ratio', 'Word_Freq_K1', 'Word_Freq_K2', 'Word_Freq_OffList',
            // Tier 2: Syntactic Complexity
            'Sent_Length_StdDev', 'Subordination_Depth', 'Clauses_Per_Sentence', 'T_Unit_Length', 'Dep_Clause_Ratio',
            'Sent_Simple', 'Sent_Compound', 'Sent_Complex',
            // Tier 2: Extended Metadiscourse
            'MD_CodeGlosses', 'MD_FrameMarkers', 'MD_Evidentials', 'MD_Directives', 'MD_ReaderPronouns',
            // Tier 2: Cohesion
            'Lexical_Repetition', 'Reference_Chains', 'Lexical_Chains',
            // Tier 3: Advanced Lexical Diversity
            'VOCD_D', 'MATTR', 'MTLD', 'Rare_Word_Ratio', 'Content_Function_Ratio',
            // Tier 3: POS-Based & Style
            'Open_Class_TTR', 'Nominalization_Density', 'Nominal_Verbal_Ratio', 'Passive_Voice_Density',
            // Tier 3: Academic Writing
            'Reporting_Verbs', 'Citations_Parenthetical', 'Citations_Narrative', 'Citations_Total',
            'Genre_Territory', 'Genre_Niche', 'Genre_Purpose', 'Shell_Nouns',
            // Tier 3: Readability
            'Flesch_Reading_Ease', 'Flesch_Kincaid_Grade', 'Gunning_Fog',
            // Tier 4: Clause-Level
            'Clause_Length', 'Subordinate_Clause_Ratio', 'Left_Branching', 'Right_Branching', 'Syntactic_CI',
            // Tier 4: Syntactic Patterns & Clefts
            'Passive_Agent', 'Light_Verbs', 'Multi_Word_Verbs',
            'It_Clefts', 'Wh_Clefts', 'Existential_There', 'Negative_Inversion',
            // Tier 4: Discourse
            'Coord_Conj', 'Subord_Conj', 'Correl_Conj', 'Discourse_Markers', 'Anaphoric_Dems',
            // Tier 4: Paragraph
            'Topic_Shifts', 'Para_Length', 'Para_Length_Var', 'Sent_Opener_Diversity',
            // Tier 5: Discourse & Stance
            'Repetitive_Patterns', 'Jaccard_Cohesion', 'Lexical_Variability',
            'Impersonal_Constr', 'Contractions', 'Determiner_Ratio',
            'Hedges', 'Boosters', 'Stance_Adverbs',
            // Tier 5: Grammar
            'Process_Material', 'Process_Mental', 'Process_Relational',
            'Dyn_Stative_Ratio', 'Present_Perfect', 'Tense_Shift_Inconsist',
            'Ratio_NounVerb', 'Ratio_AdjNoun', 'Ratio_AdvVerb',
            // Tier 6: Final Stylistic Markers
            'Coleman_Liau', 'ARI_Score', 'Anglo_Saxon_Ratio', 'Shell_Noun_Var',
            'Idiom_Ratio', 'TTR_Decay',
            'Genitive_Alt', 'Dative_Alt', 'Pied_Piping', 'Adj_Ordering_Viol'
        ];

        const rows = texts.map(t => {
            const risk = assessRisk(t, thresholds);
            const zScores = calculateZScores(t, stats);
            const t2 = t.tier2 || {};

            return [
                t.filename,
                t.wordCount,
                t.sentenceCount,
                t.sttr,
                t.cv,
                t.metadiscourse.density.toFixed(2),
                t.avgSentenceLength,
                risk.overallRisk,
                zScores.z_cv,
                zScores.z_sttr,
                zScores.z_md,
                t.externalFlag || '',
                // Tier 2: Stylometric
                t2.hapaxRatio || '',
                t2.disRatio || '',
                t2.pronounDistribution?.counts.first || 0,
                t2.pronounDistribution?.counts.second || 0,
                t2.pronounDistribution?.counts.third || 0,
                // Tier 2: Lexical Sophistication
                t2.awlCoverage || '',
                t2.lexicalDensity || '',
                t2.avgWordLength || '',
                t2.multiSyllabicRatio || '',
                t2.wordFreqBands?.k1.toFixed(2) || '',
                t2.wordFreqBands?.k2.toFixed(2) || '',
                t2.wordFreqBands?.offList.toFixed(2) || '',
                // Tier 2: Syntactic Complexity
                t2.sentLengthStdDev || '',
                t2.subordinationDepth || '',
                t2.clausesPerSentence || '',
                t2.tUnitLength || '',
                t2.depClauseRatio || '',
                t2.sentComplexity?.counts.simple || 0,
                t2.sentComplexity?.counts.compound || 0,
                t2.sentComplexity?.counts.complex || 0,
                // Tier 2: Extended Metadiscourse
                t2.extendedMetadiscourse?.densities.codeGlosses.toFixed(2) || '',
                t2.extendedMetadiscourse?.densities.frameMarkers.toFixed(2) || '',
                t2.extendedMetadiscourse?.densities.evidentials.toFixed(2) || '',
                t2.extendedMetadiscourse?.densities.directives.toFixed(2) || '',
                t2.extendedMetadiscourse?.densities.readerPronouns.toFixed(2) || '',
                // Tier 2: Cohesion
                t2.lexicalRepetition || '',
                t2.referenceChains || 0,
                t2.lexicalChains || '',
                // Tier 3: Advanced Lexical Diversity
                t.tier3?.vocdD || '',
                t.tier3?.mattr || '',
                t.tier3?.mtld || '',
                t.tier3?.rareWordRatio || '',
                t.tier3?.contentFunctionRatio || '',
                // Tier 3: POS-Based & Style
                t.tier3?.openClassTTR || '',
                t.tier3?.nominalizationDensity || '',
                t.tier3?.nominalVerbalRatio || '',
                t.tier3?.passiveVoiceDensity || '',
                // Tier 3: Academic Writing
                t.tier3?.reportingVerbsDensity || '',
                t.tier3?.citationPatterns?.parenthetical || 0,
                t.tier3?.citationPatterns?.narrative || 0,
                t.tier3?.citationPatterns?.total || 0,
                t.tier3?.genreMoves?.territory || 0,
                t.tier3?.genreMoves?.niche || 0,
                t.tier3?.genreMoves?.purpose || 0,
                t.tier3?.shellNounPatterns || 0,
                // Tier 3: Readability
                t.tier3?.fleschReadingEase || '',
                t.tier3?.fleschKincaidGrade || '',
                t.tier3?.gunningFog || '',
                // Tier 4: Clause-Level
                t.tier4?.clauseLength || '',
                t.tier4?.subordinateClauseRatio || '',
                t.tier4?.leftBranchingDepth || '',
                t.tier4?.rightBranchingDepth || '',
                t.tier4?.syntacticComplexityIndex || '',
                // Tier 4: Syntactic Patterns & Clefts
                t.tier4?.passiveAgentRetention || '',
                t.tier4?.lightVerbRatio || '',
                t.tier4?.multiWordVerbRatio || '',
                t.tier4?.itCleftFrequency || '',
                t.tier4?.whCleftFrequency || '',
                t.tier4?.existentialThereDensity || '',
                t.tier4?.negativeInversion || '',
                // Tier 4: Discourse
                t.tier4?.conjunctionTypes?.coordinating || 0,
                t.tier4?.conjunctionTypes?.subordinating || 0,
                t.tier4?.conjunctionTypes?.correlative || 0,
                t.tier4?.discourseMarkersDensity || '',
                t.tier4?.anaphoricDemonstrativeDensity || '',
                // Tier 4: Paragraph
                t.tier4?.topicShifts || 0,
                t.tier4?.paragraphLengthSentences || '',
                t.tier4?.paragraphLengthVariation || '',
                t.tier4?.sentenceOpenerDiversity || '',
                // Tier 5: Discourse & Stance
                t.tier5?.repetitivePatterns || '',
                t.tier5?.jaccardCohesion || '',
                t.tier5?.lexicalDensityVariability || '',
                t.tier5?.impersonalConstructions || '',
                t.tier5?.contractionRatio || '',
                t.tier5?.determinerRatio || '',
                t.tier5?.hedgingRatio || '',
                t.tier5?.boostingRatio || '',
                t.tier5?.stanceAdverbs || '',
                // Tier 5: Grammar
                t.tier5?.hallidayan?.material || 0,
                t.tier5?.hallidayan?.mental || 0,
                t.tier5?.hallidayan?.relational || 0,
                t.tier5?.dynamicStativeRatio || '',
                t.tier5?.presentPerfectRatio || '',
                t.tier5?.tenseShiftInconsistency || '',
                t.tier5?.grammaticalRatios?.nounVerb || '',
                t.tier5?.grammaticalRatios?.adjNoun || '',
                t.tier5?.grammaticalRatios?.advVerb || '',
                // Tier 6: Final Stylistic Markers
                t.tier6?.colemanLiau || '',
                t.tier6?.ari || '',
                t.tier6?.angloSaxonRatio || '',
                t.tier6?.shellNounVariety || 0,
                t.tier6?.idiomRatio || '',
                t.tier6?.ttrDecay || '',
                t.tier6?.genitiveAlternation || '',
                t.tier6?.dativeAlternation || '',
                t.tier6?.piedPipingScore || '',
                t.tier6?.adjOrderingViolations || 0
            ];
        });

        // Add threshold settings as header rows
        const thresholdInfo = [
            ['Threshold Settings Used:'],
            ['CV Threshold', thresholds.cv],
            ['STTR Threshold', thresholds.sttr],
            ['Metadiscourse Threshold', thresholds.metadiscourse],
            [''],  // Empty row separator
        ];

        const csvContent = [...thresholdInfo, headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stylistic_analysis_tier2.csv';
        a.click();
        console.log('CSV export complete with Tier 1 + Tier 2 features');
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

            const stats = getCombinedStats();
            const data = texts.map(t => {
                const risk = assessRisk(t, thresholds);
                const zScores = calculateZScores(t, stats);
                const t2 = t.tier2 || {};

                return {
                    // Tier 1 Features
                    'Filename': t.filename,
                    'Word Count': t.wordCount,
                    'Sentence Count': t.sentenceCount,
                    'STTR': t.sttr,
                    'CV (Burstiness)': t.cv,
                    'Metadiscourse Density': t.metadiscourse.density.toFixed(2),
                    'Avg Sentence Length': t.avgSentenceLength,
                    'Risk Assessment': risk.overallRisk,
                    'z_cv': zScores.z_cv,
                    'z_sttr': zScores.z_sttr,
                    'z_md': zScores.z_md,
                    'External_Detector_Flag': t.externalFlag || '',

                    // Tier 2: Stylometric
                    'Hapax Ratio %': t2.hapaxRatio || '',
                    'Dis Ratio %': t2.disRatio || '',
                    'Pronoun 1st Person': t2.pronounDistribution?.counts.first || 0,
                    'Pronoun 2nd Person': t2.pronounDistribution?.counts.second || 0,
                    'Pronoun 3rd Person': t2.pronounDistribution?.counts.third || 0,

                    // Tier 2: Lexical Sophistication
                    'AWL Coverage %': t2.awlCoverage || '',
                    'Lexical Density %': t2.lexicalDensity || '',
                    'Avg Word Length': t2.avgWordLength || '',
                    'Multi-syllabic %': t2.multiSyllabicRatio || '',
                    'Word Freq K1 %': t2.wordFreqBands?.k1.toFixed(2) || '',
                    'Word Freq K2 %': t2.wordFreqBands?.k2.toFixed(2) || '',
                    'Word Freq Off-List %': t2.wordFreqBands?.offList.toFixed(2) || '',

                    // Tier 2: Syntactic Complexity
                    'Sent Length StdDev': t2.sentLengthStdDev || '',
                    'Subordination Depth': t2.subordinationDepth || '',
                    'Clauses/Sentence': t2.clausesPerSentence || '',
                    'T-Unit Length': t2.tUnitLength || '',
                    'Dependent Clause %': t2.depClauseRatio || '',
                    'Simple Sentences': t2.sentComplexity?.counts.simple || 0,
                    'Compound Sentences': t2.sentComplexity?.counts.compound || 0,
                    'Complex Sentences': t2.sentComplexity?.counts.complex || 0,

                    // Tier 2: Extended Metadiscourse (per 1k words)
                    'MD Code Glosses': t2.extendedMetadiscourse?.densities.codeGlosses.toFixed(2) || '',
                    'MD Frame Markers': t2.extendedMetadiscourse?.densities.frameMarkers.toFixed(2) || '',
                    'MD Evidentials': t2.extendedMetadiscourse?.densities.evidentials.toFixed(2) || '',
                    'MD Directives': t2.extendedMetadiscourse?.densities.directives.toFixed(2) || '',
                    'MD Reader Pronouns': t2.extendedMetadiscourse?.densities.readerPronouns.toFixed(2) || '',

                    // Tier 2: Cohesion
                    'Lexical Repetition %': t2.lexicalRepetition || '',
                    'Reference Chains': t2.referenceChains || 0,
                    'Lexical Chains %': t2.lexicalChains || '',

                    // Tier 3: Advanced Lexical Diversity
                    'VOCD-D': t.tier3?.vocdD || '',
                    'MATTR': t.tier3?.mattr || '',
                    'MTLD': t.tier3?.mtld || '',
                    'Rare Word Ratio %': t.tier3?.rareWordRatio || '',
                    'Content/Function Ratio': t.tier3?.contentFunctionRatio || '',

                    // Tier 3: POS-Based & Style
                    'Open-Class TTR': t.tier3?.openClassTTR || '',
                    'Nominalization Density': t.tier3?.nominalizationDensity || '',
                    'Nominal/Verbal Ratio': t.tier3?.nominalVerbalRatio || '',
                    'Passive Voice %': t.tier3?.passiveVoiceDensity || '',

                    // Tier 3: Academic Writing
                    'Reporting Verbs (per 1k)': t.tier3?.reportingVerbsDensity || '',
                    'Citations (Parenthetical)': t.tier3?.citationPatterns?.parenthetical || 0,
                    'Citations (Narrative)': t.tier3?.citationPatterns?.narrative || 0,
                    'Citations (Total)': t.tier3?.citationPatterns?.total || 0,
                    'Genre Moves (Territory)': t.tier3?.genreMoves?.territory || 0,
                    'Genre Moves (Niche)': t.tier3?.genreMoves?.niche || 0,
                    'Genre Moves (Purpose)': t.tier3?.genreMoves?.purpose || 0,
                    'Shell Noun Patterns': t.tier3?.shellNounPatterns || 0,

                    // Tier 3: Readability
                    'Flesch Reading Ease': t.tier3?.fleschReadingEase || '',
                    'Flesch-Kincaid Grade': t.tier3?.fleschKincaidGrade || '',
                    'Gunning Fog Index': t.tier3?.gunningFog || '',

                    // Tier 4: Clause-Level
                    'Clause Length': t.tier4?.clauseLength || '',
                    'Subordinate Clause %': t.tier4?.subordinateClauseRatio || '',
                    'Left Branching Depth': t.tier4?.leftBranchingDepth || '',
                    'Right Branching Depth': t.tier4?.rightBranchingDepth || '',
                    'Syntactic Complexity Index': t.tier4?.syntacticComplexityIndex || '',

                    // Tier 4: Syntactic Patterns
                    'Passive Agent (by-phrase) %': t.tier4?.passiveAgentRetention || '',
                    'Light Verbs (per 1k)': t.tier4?.lightVerbRatio || '',
                    'Multi-Word Verbs %': t.tier4?.multiWordVerbRatio || '',

                    // Tier 4: Clefts & Inversion
                    'It-Clefts %': t.tier4?.itCleftFrequency || '',
                    'Wh-Clefts %': t.tier4?.whCleftFrequency || '',
                    'Existential There %': t.tier4?.existentialThereDensity || '',
                    'Negative Inversion %': t.tier4?.negativeInversion || '',

                    // Tier 4: Discourse
                    'Coordinating Conj': t.tier4?.conjunctionTypes?.coordinating || 0,
                    'Subordinating Conj': t.tier4?.conjunctionTypes?.subordinating || 0,
                    'Correlative Conj': t.tier4?.conjunctionTypes?.correlative || 0,
                    'Discourse Markers (per 1k)': t.tier4?.discourseMarkersDensity || '',
                    'Anaphoric Demonstratives (per 1k)': t.tier4?.anaphoricDemonstrativeDensity || '',

                    // Tier 4: Paragraph
                    'Topic Shifts': t.tier4?.topicShifts || 0,
                    'Paragraph Length (sents)': t.tier4?.paragraphLengthSentences || '',
                    'Paragraph Len Variation': t.tier4?.paragraphLengthVariation || '',
                    'Sentence Opener Diversity %': t.tier4?.sentenceOpenerDiversity || '',

                    // Tier 5: Discourse & Stance
                    'Repetitive Patterns %': t.tier5?.repetitivePatterns || '',
                    'Jaccard Cohesion (0-1)': t.tier5?.jaccardCohesion || '',
                    'Lexical Variability (SD)': t.tier5?.lexicalDensityVariability || '',
                    'Impersonal Constr (per 1k)': t.tier5?.impersonalConstructions || '',
                    'Contraction Ratio %': t.tier5?.contractionRatio || '',
                    'Determiner Ratio %': t.tier5?.determinerRatio || '',
                    'Hedging Ratio %': t.tier5?.hedgingRatio || '',
                    'Boosting Ratio %': t.tier5?.boostingRatio || '',
                    'Stance Adverbs (per 1k)': t.tier5?.stanceAdverbs || '',

                    // Tier 5: Grammar
                    'Process: Material': t.tier5?.hallidayan?.material || 0,
                    'Process: Mental': t.tier5?.hallidayan?.mental || 0,
                    'Process: Relational': t.tier5?.hallidayan?.relational || 0,
                    'Dynamic/Stative Ratio': t.tier5?.dynamicStativeRatio || '',
                    'Present Perfect %': t.tier5?.presentPerfectRatio || '',
                    'Tense Inconsistency %': t.tier5?.tenseShiftInconsistency || '',
                    'Ratio: Noun/Verb': t.tier5?.grammaticalRatios?.nounVerb || '',
                    'Ratio: Adj/Noun': t.tier5?.grammaticalRatios?.adjNoun || '',
                    'Ratio: Adv/Verb': t.tier5?.grammaticalRatios?.advVerb || '',
                    // Tier 6: Final Stylistic Markers
                    'Coleman-Liau': t.tier6?.colemanLiau || '',
                    'ARI Score': t.tier6?.ari || '',
                    'Anglo-Saxon Core %': t.tier6?.angloSaxonRatio || '',
                    'Shell Variety (0-4)': t.tier6?.shellNounVariety || 0,
                    'Idiom Ratio': t.tier6?.idiomRatio || '',
                    'TTR Decay': t.tier6?.ttrDecay || '',
                    'Genitive Alt %': t.tier6?.genitiveAlternation || '',
                    'Dative Alt %': t.tier6?.dativeAlternation || '',
                    'Pied-Piping %': t.tier6?.piedPipingScore || '',
                    'Adj Ordering Viol': t.tier6?.adjOrderingViolations || 0
                };
            });

            // Add threshold settings
            const thresholdData = [
                { 'Filename': 'THRESHOLD SETTINGS USED:' },
                { 'Filename': 'CV Threshold', 'Word Count': thresholds.cv },
                { 'Filename': 'STTR Threshold', 'Word Count': thresholds.sttr },
                { 'Filename': 'Metadiscourse Threshold', 'Word Count': thresholds.metadiscourse },
                {},  // Empty row
            ];

            const ws = window.XLSX.utils.json_to_sheet([...thresholdData, ...data]);
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, 'Analysis');

            // Add Confusion Matrix sheet
            const confusion = getConfusionMatrix();
            if (confusion) {
                const confusionData = [
                    { 'Metric': 'True Positives (TP)', 'Value': confusion.TP },
                    { 'Metric': 'False Positives (FP)', 'Value': confusion.FP },
                    { 'Metric': 'True Negatives (TN)', 'Value': confusion.TN },
                    { 'Metric': 'False Negatives (FN)', 'Value': confusion.FN },
                    {},
                    { 'Metric': 'Sensitivity', 'Value': confusion.sensitivity.toFixed(3) },
                    { 'Metric': 'Specificity', 'Value': confusion.specificity.toFixed(3) },
                    { 'Metric': "Youden's J", 'Value': confusion.youdenJ.toFixed(3) }
                ];
                const confusionWs = window.XLSX.utils.json_to_sheet(confusionData);
                window.XLSX.utils.book_append_sheet(wb, confusionWs, 'Confusion');
            }

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
                        Stylistic False Positive Analyzer - SPF Analyzer
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
                            Upload Files (.txt, .pdf, .docx)
                        </label>
                        <div className="flex gap-3 items-center">
                            <input
                                type="file"
                                multiple
                                accept=".txt,.pdf,.doc,.docx"
                                onChange={handleFileUpload}
                                className="block flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <button
                                onClick={handleBatchRename}
                                disabled={texts.length === 0}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                            >
                                Auto-label corpus (FP/C)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Heuristic Calibration Panel */}
                {texts.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-2xl font-semibold text-slate-700 mb-4">Heuristic Calibration</h2>
                        <p className="text-sm text-slate-600 mb-4">
                            Adjust thresholds to see how they affect risk assessment in real-time. Changes apply to all displays and exports.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* CV Threshold */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    CV Threshold (Veto Rule)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0.10"
                                        max="0.50"
                                        step="0.01"
                                        value={thresholds.cv}
                                        onChange={(e) => setThresholds({ ...thresholds, cv: parseFloat(e.target.value) })}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                    />
                                    <input
                                        type="number"
                                        min="0.10"
                                        max="0.50"
                                        step="0.01"
                                        value={thresholds.cv}
                                        onChange={(e) => setThresholds({ ...thresholds, cv: parseFloat(e.target.value) })}
                                        className="w-20 px-2 py-1 border border-slate-300 rounded-md text-sm"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    If CV &lt; {thresholds.cv}, text is flagged as AI / HIGH RISK
                                </p>
                            </div>

                            {/* STTR Threshold */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    STTR Threshold (Diversity)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0.30"
                                        max="0.70"
                                        step="0.01"
                                        value={thresholds.sttr}
                                        onChange={(e) => setThresholds({ ...thresholds, sttr: parseFloat(e.target.value) })}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                    />
                                    <input
                                        type="number"
                                        min="0.30"
                                        max="0.70"
                                        step="0.01"
                                        value={thresholds.sttr}
                                        onChange={(e) => setThresholds({ ...thresholds, sttr: parseFloat(e.target.value) })}
                                        className="w-20 px-2 py-1 border border-slate-300 rounded-md text-sm"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Minimum STTR for Human classification
                                </p>
                            </div>

                            {/* Metadiscourse Threshold */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    MD Density Threshold
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="3.0"
                                        max="15.0"
                                        step="0.5"
                                        value={thresholds.metadiscourse}
                                        onChange={(e) => setThresholds({ ...thresholds, metadiscourse: parseFloat(e.target.value) })}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                                    />
                                    <input
                                        type="number"
                                        min="3.0"
                                        max="15.0"
                                        step="0.5"
                                        value={thresholds.metadiscourse}
                                        onChange={(e) => setThresholds({ ...thresholds, metadiscourse: parseFloat(e.target.value) })}
                                        className="w-20 px-2 py-1 border border-slate-300 rounded-md text-sm"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Markers per 1k words for Human classification
                                </p>
                            </div>
                        </div>
                    </div>
                )}


                {/* Export Buttons */}
                {texts.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="flex gap-3 flex-wrap">
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
                            <button
                                onClick={copyMethodParagraph}
                                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                            >
                                Copy Method Snippet
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
                            <button
                                onClick={() => setActiveTab('method')}
                                className={`px-6 py-3 rounded-t-lg font-semibold transition-colors ${activeTab === 'method'
                                    ? 'bg-white text-blue-700 shadow-md'
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                    }`}
                            >
                                Method Paragraph
                            </button>
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`px-6 py-3 rounded-t-lg font-semibold transition-colors ${activeTab === 'dashboard'
                                    ? 'bg-white text-blue-700 shadow-md'
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                    }`}
                            >
                                📊 Dashboard
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
                                        {(() => {
                                            const risk = assessRisk(currentText, thresholds);
                                            return (
                                                <>
                                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                        <span className="font-medium">CV (Burstiness):</span>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${risk.cvStatus === 'Human-like'
                                                            ? 'bg-green-100 text-green-800'
                                                            : risk.cvStatus === 'AI-like'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {risk.cvStatus}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                        <span className="font-medium">STTR (Lexical Diversity):</span>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${risk.sttrStatus === 'Human-like'
                                                            ? 'bg-green-100 text-green-800'
                                                            : risk.sttrStatus === 'AI-like'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {risk.sttrStatus}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                        <span className="font-medium">Metadiscourse Density:</span>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${risk.metadiscourseStatus === 'Human-like'
                                                            ? 'bg-green-100 text-green-800'
                                                            : risk.metadiscourseStatus === 'AI-like'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {risk.metadiscourseStatus}
                                                        </span>
                                                    </div>
                                                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
                                                        <div className="font-semibold text-slate-700 mb-1">Overall Assessment:</div>
                                                        <div className="text-lg font-bold text-blue-800">{risk.overallRisk}</div>
                                                    </div>
                                                </>
                                            );
                                        })()}
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
                                                {/* Reference Lines for Thresholds */}
                                                <ReferenceLine x={thresholds.sttr} stroke="#9333ea" strokeWidth={2} strokeDasharray="5 5" label={{ value: 'STTR Threshold', position: 'top', fill: '#9333ea', fontSize: 10 }} />
                                                <ReferenceLine x={thresholds.cv} stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" label={{ value: 'CV Threshold', position: 'top', fill: '#f97316', fontSize: 10 }} />
                                                <ReferenceLine x={thresholds.metadiscourse / 100} stroke="#ec4899" strokeWidth={2} strokeDasharray="5 5" label={{ value: 'MD Threshold', position: 'top', fill: '#ec4899', fontSize: 10 }} />
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
                                                    data={Object.entries(currentText.metadiscourse.counts)
                                                        .map(([key, value]) => ({
                                                            name: key.replace(/([A-Z])/g, ' $1').trim(),
                                                            value
                                                        }))
                                                        .filter(item => item.value > 0)
                                                    }
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

                                    {/* ========== TIER 2 FEATURES SECTION ========== */}
                                    {currentText.tier2 && (
                                        <>
                                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 border-l-4 border-indigo-600">
                                                <h2 className="text-2xl font-bold text-indigo-900 mb-2">Tier 2: Advanced Linguistic Features</h2>
                                                <p className="text-sm text-slate-600">Comprehensive stylometric, lexical, syntactic, and cohesion analysis</p>
                                            </div>

                                            {/* Stylometric Profile */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Stylometric Profile</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Function Word Profile */}
                                                    <div>
                                                        <h4 className="font-medium text-slate-700 mb-3">Top 10 Function Words</h4>
                                                        <div className="space-y-2">
                                                            {currentText.tier2.functionWordProfile.map((item, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <span className="w-20 text-sm font-mono text-slate-600">{item.word}</span>
                                                                    <div className="flex-1 bg-slate-200 rounded-full h-4">
                                                                        <div
                                                                            className="bg-indigo-600 h-4 rounded-full"
                                                                            style={{ width: `${Math.min(parseFloat(item.frequency) * 10, 100)}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="w-12 text-xs text-slate-500">{item.frequency}%</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Pronoun Distribution */}
                                                    <div>
                                                        <h4 className="font-medium text-slate-700 mb-3">Pronoun Distribution</h4>
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <PieChart>
                                                                <Pie
                                                                    data={[
                                                                        { name: '1st Person', value: currentText.tier2.pronounDistribution.counts.first },
                                                                        { name: '2nd Person', value: currentText.tier2.pronounDistribution.counts.second },
                                                                        { name: '3rd Person', value: currentText.tier2.pronounDistribution.counts.third }
                                                                    ].filter(item => item.value > 0)}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    labelLine={false}
                                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                                    outerRadius={80}
                                                                    fill="#8884d8"
                                                                    dataKey="value"
                                                                >
                                                                    {[0, 1, 2].map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                                            <div className="p-2 bg-slate-50 rounded text-center">
                                                                <div className="text-xs text-slate-600">Hapax Legomena</div>
                                                                <div className="text-lg font-bold text-slate-700">{currentText.tier2.hapaxRatio}%</div>
                                                            </div>
                                                            <div className="p-2 bg-slate-50 rounded text-center">
                                                                <div className="text-xs text-slate-600">Dis Legomena</div>
                                                                <div className="text-lg font-bold text-slate-700">{currentText.tier2.disRatio}%</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lexical Sophistication */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Lexical Sophistication</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                                    <div className="p-4 bg-emerald-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">AWL Coverage</div>
                                                        <div className="text-2xl font-bold text-emerald-700">{currentText.tier2.awlCoverage}%</div>
                                                    </div>
                                                    <div className="p-4 bg-teal-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Lexical Density</div>
                                                        <div className="text-2xl font-bold text-teal-700">{currentText.tier2.lexicalDensity}%</div>
                                                    </div>
                                                    <div className="p-4 bg-cyan-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Avg Word Length</div>
                                                        <div className="text-2xl font-bold text-cyan-700">{currentText.tier2.avgWordLength}</div>
                                                    </div>
                                                    <div className="p-4 bg-sky-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Multi-syllabic</div>
                                                        <div className="text-2xl font-bold text-sky-700">{currentText.tier2.multiSyllabicRatio}%</div>
                                                    </div>
                                                </div>

                                                {/* Word Frequency Bands */}
                                                <div>
                                                    <h4 className="font-medium text-slate-700 mb-3">Word Frequency Bands</h4>
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <PieChart>
                                                            <Pie
                                                                data={[
                                                                    { name: 'K1 (High Freq)', value: parseFloat(currentText.tier2.wordFreqBands.k1) },
                                                                    { name: 'K2 (Academic)', value: parseFloat(currentText.tier2.wordFreqBands.k2) },
                                                                    { name: 'Off-List', value: parseFloat(currentText.tier2.wordFreqBands.offList) }
                                                                ].filter(item => item.value > 0)}
                                                                cx="50%"
                                                                cy="50%"
                                                                labelLine={true}
                                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                                                outerRadius={90}
                                                                fill="#8884d8"
                                                                dataKey="value"
                                                            >
                                                                {[0, 1, 2].map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b'][index]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Syntactic Complexity */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Syntactic Complexity</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                    <div className="p-4 bg-violet-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Sent Length StdDev</div>
                                                        <div className="text-2xl font-bold text-violet-700">{currentText.tier2.sentLengthStdDev}</div>
                                                    </div>
                                                    <div className="p-4 bg-purple-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Subordination Depth</div>
                                                        <div className="text-2xl font-bold text-purple-700">{currentText.tier2.subordinationDepth}</div>
                                                    </div>
                                                    <div className="p-4 bg-fuchsia-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Clauses/Sentence</div>
                                                        <div className="text-2xl font-bold text-fuchsia-700">{currentText.tier2.clausesPerSentence}</div>
                                                    </div>
                                                    <div className="p-4 bg-pink-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">T-Unit Length</div>
                                                        <div className="text-2xl font-bold text-pink-700">{currentText.tier2.tUnitLength}</div>
                                                    </div>
                                                    <div className="p-4 bg-rose-50 rounded-lg col-span-2 md:col-span-1">
                                                        <div className="text-sm text-slate-600">Dependent Clause %</div>
                                                        <div className="text-2xl font-bold text-rose-700">{currentText.tier2.depClauseRatio}%</div>
                                                    </div>
                                                </div>

                                                {/* Sentence Complexity Distribution */}
                                                <div>
                                                    <h4 className="font-medium text-slate-700 mb-3">Sentence Complexity Distribution</h4>
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <BarChart
                                                            data={[
                                                                { type: 'Simple', count: currentText.tier2.sentComplexity.counts.simple, percentage: currentText.tier2.sentComplexity.percentages.simple },
                                                                { type: 'Compound', count: currentText.tier2.sentComplexity.counts.compound, percentage: currentText.tier2.sentComplexity.percentages.compound },
                                                                { type: 'Complex', count: currentText.tier2.sentComplexity.counts.complex, percentage: currentText.tier2.sentComplexity.percentages.complex }
                                                            ]}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="type" />
                                                            <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                                                            <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentage.toFixed(1)}%)`, 'Count']} />
                                                            <Bar dataKey="count" fill="#8b5cf6" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Extended Metadiscourse */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Extended Metadiscourse (per 1,000 words)</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                    <div className="p-4 bg-amber-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Code Glosses</div>
                                                        <div className="text-2xl font-bold text-amber-700">{currentText.tier2.extendedMetadiscourse.densities.codeGlosses.toFixed(2)}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Count: {currentText.tier2.extendedMetadiscourse.counts.codeGlosses}</div>
                                                    </div>
                                                    <div className="p-4 bg-orange-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Frame Markers</div>
                                                        <div className="text-2xl font-bold text-orange-700">{currentText.tier2.extendedMetadiscourse.densities.frameMarkers.toFixed(2)}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Count: {currentText.tier2.extendedMetadiscourse.counts.frameMarkers}</div>
                                                    </div>
                                                    <div className="p-4 bg-yellow-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Evidentials</div>
                                                        <div className="text-2xl font-bold text-yellow-700">{currentText.tier2.extendedMetadiscourse.densities.evidentials.toFixed(2)}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Count: {currentText.tier2.extendedMetadiscourse.counts.evidentials}</div>
                                                    </div>
                                                    <div className="p-4 bg-lime-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Directives</div>
                                                        <div className="text-2xl font-bold text-lime-700">{currentText.tier2.extendedMetadiscourse.densities.directives.toFixed(2)}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Count: {currentText.tier2.extendedMetadiscourse.counts.directives}</div>
                                                    </div>
                                                    <div className="p-4 bg-green-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Reader Pronouns</div>
                                                        <div className="text-2xl font-bold text-green-700">{currentText.tier2.extendedMetadiscourse.densities.readerPronouns.toFixed(2)}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Count: {currentText.tier2.extendedMetadiscourse.counts.readerPronouns}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cohesion Features */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Cohesion Features</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="p-6 bg-blue-50 rounded-lg">
                                                        <div className="text-sm text-slate-600 mb-2">Lexical Repetition</div>
                                                        <div className="text-3xl font-bold text-blue-700">{currentText.tier2.lexicalRepetition}%</div>
                                                        <div className="text-xs text-slate-500 mt-2">Percentage of repeated content words</div>
                                                    </div>
                                                    <div className="p-6 bg-indigo-50 rounded-lg">
                                                        <div className="text-sm text-slate-600 mb-2">Reference Chains</div>
                                                        <div className="text-3xl font-bold text-indigo-700">{currentText.tier2.referenceChains}</div>
                                                        <div className="text-xs text-slate-500 mt-2">Total pronouns + demonstratives</div>
                                                    </div>
                                                    <div className="p-6 bg-purple-50 rounded-lg">
                                                        <div className="text-sm text-slate-600 mb-2">Lexical Chains</div>
                                                        <div className="text-3xl font-bold text-purple-700">{currentText.tier2.lexicalChains}%</div>
                                                        <div className="text-xs text-slate-500 mt-2">Adjacent sentence word overlap</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* ========== TIER 3 FEATURES SECTION ========== */}
                                    {currentText.tier3 && (
                                        <>
                                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg shadow-md p-6 border-l-4 border-emerald-600 mt-6">
                                                <h2 className="text-2xl font-bold text-emerald-900 mb-2">Tier 3: Advanced Analysis</h2>
                                                <p className="text-sm text-slate-600">Lexical diversity, readability, and academic writing features</p>
                                            </div>

                                            {/* Advanced Lexical Diversity */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Advanced Lexical Diversity</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                    <div className="p-4 bg-emerald-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">VOCD-D</div>
                                                        <div className="text-2xl font-bold text-emerald-700">{currentText.tier3.vocdD}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Semantic diversity</div>
                                                    </div>
                                                    <div className="p-4 bg-teal-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">MATTR</div>
                                                        <div className="text-2xl font-bold text-teal-700">{currentText.tier3.mattr}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Moving-average TTR</div>
                                                    </div>
                                                    <div className="p-4 bg-cyan-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">MTLD</div>
                                                        <div className="text-2xl font-bold text-cyan-700">{currentText.tier3.mtld}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Textual diversity</div>
                                                    </div>
                                                    <div className="p-4 bg-sky-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Rare Words</div>
                                                        <div className="text-2xl font-bold text-sky-700">{currentText.tier3.rareWordRatio}%</div>
                                                        <div className="text-xs text-slate-500 mt-1">Sophistication</div>
                                                    </div>
                                                    <div className="p-4 bg-blue-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Content/Function</div>
                                                        <div className="text-2xl font-bold text-blue-700">{currentText.tier3.contentFunctionRatio}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Word ratio</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Linguistic Style */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Linguistic Style</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="p-4 bg-violet-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Open-Class TTR</div>
                                                        <div className="text-2xl font-bold text-violet-700">{currentText.tier3.openClassTTR}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Content word diversity</div>
                                                    </div>
                                                    <div className="p-4 bg-purple-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Nominalization</div>
                                                        <div className="text-2xl font-bold text-purple-700">{currentText.tier3.nominalizationDensity}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Per 1k words</div>
                                                    </div>
                                                    <div className="p-4 bg-fuchsia-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Nominal/Verbal</div>
                                                        <div className="text-2xl font-bold text-fuchsia-700">{currentText.tier3.nominalVerbalRatio}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Style ratio</div>
                                                    </div>
                                                    <div className="p-4 bg-pink-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Passive Voice</div>
                                                        <div className="text-2xl font-bold text-pink-700">{currentText.tier3.passiveVoiceDensity}%</div>
                                                        <div className="text-xs text-slate-500 mt-1">Of sentences</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Academic Writing Features */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Academic Writing Features</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="font-medium text-slate-700 mb-3">Citation Patterns</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between p-3 bg-amber-50 rounded">
                                                                <span className="text-sm text-slate-600">Parenthetical</span>
                                                                <span className="font-bold text-amber-700">{currentText.tier3.citationPatterns.parenthetical}</span>
                                                            </div>
                                                            <div className="flex justify-between p-3 bg-orange-50 rounded">
                                                                <span className="text-sm text-slate-600">Narrative</span>
                                                                <span className="font-bold text-orange-700">{currentText.tier3.citationPatterns.narrative}</span>
                                                            </div>
                                                            <div className="flex justify-between p-3 bg-yellow-50 rounded">
                                                                <span className="text-sm text-slate-600">Total Citations</span>
                                                                <span className="font-bold text-yellow-700">{currentText.tier3.citationPatterns.total}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-slate-700 mb-3">Genre Moves (CARS)</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between p-3 bg-lime-50 rounded">
                                                                <span className="text-sm text-slate-600">Territory</span>
                                                                <span className="font-bold text-lime-700">{currentText.tier3.genreMoves.territory}</span>
                                                            </div>
                                                            <div className="flex justify-between p-3 bg-green-50 rounded">
                                                                <span className="text-sm text-slate-600">Niche/Gap</span>
                                                                <span className="font-bold text-green-700">{currentText.tier3.genreMoves.niche}</span>
                                                            </div>
                                                            <div className="flex justify-between p-3 bg-emerald-50 rounded">
                                                                <span className="text-sm text-slate-600">Purpose</span>
                                                                <span className="font-bold text-emerald-700">{currentText.tier3.genreMoves.purpose}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mt-4">
                                                    <div className="p-4 bg-slate-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Reporting Verbs</div>
                                                        <div className="text-2xl font-bold text-slate-700">{currentText.tier3.reportingVerbsDensity}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Per 1k words</div>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Shell Noun Patterns</div>
                                                        <div className="text-2xl font-bold text-slate-700">{currentText.tier3.shellNounPatterns}</div>
                                                        <div className="text-xs text-slate-500 mt-1">this/these + noun + that</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Readability Indices */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Readability Indices</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                                        <div className="text-sm text-slate-600 mb-2">Flesch Reading Ease</div>
                                                        <div className="text-4xl font-bold text-blue-700 mb-2">{currentText.tier3.fleschReadingEase}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {parseFloat(currentText.tier3.fleschReadingEase) >= 60 ? '✓ Easy to read' :
                                                                parseFloat(currentText.tier3.fleschReadingEase) >= 30 ? '~ Moderate' :
                                                                    '⚠ Difficult'}
                                                        </div>
                                                    </div>
                                                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                                                        <div className="text-sm text-slate-600 mb-2">Flesch-Kincaid Grade</div>
                                                        <div className="text-4xl font-bold text-purple-700 mb-2">{currentText.tier3.fleschKincaidGrade}</div>
                                                        <div className="text-xs text-slate-500">US grade level</div>
                                                    </div>
                                                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                                                        <div className="text-sm text-slate-600 mb-2">Gunning Fog Index</div>
                                                        <div className="text-4xl font-bold text-indigo-700 mb-2">{currentText.tier3.gunningFog}</div>
                                                        <div className="text-xs text-slate-500">Years of education</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* ========== TIER 4 FEATURES SECTION ========== */}
                                    {currentText.tier4 && (
                                        <>
                                            <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg shadow-md p-6 border-l-4 border-rose-600 mt-6">
                                                <h2 className="text-2xl font-bold text-rose-900 mb-2">Tier 4: Deep Syntactic & Discourse Analysis</h2>
                                                <p className="text-sm text-slate-600">Clause structures, cleft constructions, and discourse flow</p>
                                            </div>

                                            {/* Clause-Level Analysis */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Clause-Level Analysis</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                    <div className="p-4 bg-rose-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Clause Length</div>
                                                        <div className="text-2xl font-bold text-rose-700">{currentText.tier4.clauseLength}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Words per clause</div>
                                                    </div>
                                                    <div className="p-4 bg-red-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Subord. Clauses</div>
                                                        <div className="text-2xl font-bold text-red-700">{currentText.tier4.subordinateClauseRatio}%</div>
                                                        <div className="text-xs text-slate-500 mt-1">Ratio to total</div>
                                                    </div>
                                                    <div className="p-4 bg-orange-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Left Branching</div>
                                                        <div className="text-2xl font-bold text-orange-700">{currentText.tier4.leftBranchingDepth}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Pre-verb depth</div>
                                                    </div>
                                                    <div className="p-4 bg-amber-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Right Branching</div>
                                                        <div className="text-2xl font-bold text-amber-700">{currentText.tier4.rightBranchingDepth}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Post-verb expansion</div>
                                                    </div>
                                                    <div className="p-4 bg-yellow-50 rounded-lg">
                                                        <div className="text-sm text-slate-600">Syntactic CI</div>
                                                        <div className="text-2xl font-bold text-yellow-700">{currentText.tier4.syntacticComplexityIndex}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Composite index (0-100)</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Syntactic Patterns */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Syntactic Constructions</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="border border-slate-200 rounded-lg p-4">
                                                        <h4 className="font-medium text-slate-700 mb-3 text-center">Verb Patterns</h4>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <div className="flex justify-between text-sm mb-1">
                                                                    <span className="text-slate-600">Passive Agent (by-phrase)</span>
                                                                    <span className="font-semibold text-slate-800">{currentText.tier4.passiveAgentRetention}%</span>
                                                                </div>
                                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(parseFloat(currentText.tier4.passiveAgentRetention) * 2, 100)}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between text-sm mb-1">
                                                                    <span className="text-slate-600">Light Verbs (per 1k)</span>
                                                                    <span className="font-semibold text-slate-800">{currentText.tier4.lightVerbRatio}</span>
                                                                </div>
                                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(parseFloat(currentText.tier4.lightVerbRatio) * 5, 100)}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between text-sm mb-1">
                                                                    <span className="text-slate-600">Multi-word Verbs</span>
                                                                    <span className="font-semibold text-slate-800">{currentText.tier4.multiWordVerbRatio}%</span>
                                                                </div>
                                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${Math.min(parseFloat(currentText.tier4.multiWordVerbRatio) * 5, 100)}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-span-1 md:col-span-2 border border-slate-200 rounded-lg p-4">
                                                        <h4 className="font-medium text-slate-700 mb-3">Clefts & Inversions</h4>
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                            <div className="p-3 bg-slate-50 rounded text-center">
                                                                <div className="text-xs text-slate-500 uppercase tracking-wider">IT-Clefts</div>
                                                                <div className="text-xl font-bold text-slate-700">{currentText.tier4.itCleftFrequency}%</div>
                                                            </div>
                                                            <div className="p-3 bg-slate-50 rounded text-center">
                                                                <div className="text-xs text-slate-500 uppercase tracking-wider">WH-Clefts</div>
                                                                <div className="text-xl font-bold text-slate-700">{currentText.tier4.whCleftFrequency}%</div>
                                                            </div>
                                                            <div className="p-3 bg-slate-50 rounded text-center">
                                                                <div className="text-xs text-slate-500 uppercase tracking-wider">Ex. There</div>
                                                                <div className="text-xl font-bold text-slate-700">{currentText.tier4.existentialThereDensity}%</div>
                                                            </div>
                                                            <div className="p-3 bg-slate-50 rounded text-center">
                                                                <div className="text-xs text-slate-500 uppercase tracking-wider">Neg Inv.</div>
                                                                <div className="text-xl font-bold text-slate-700">{currentText.tier4.negativeInversion}%</div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 text-xs text-slate-500 italic text-center">
                                                            Percent of sentences containing these constructions
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Discourse & Paragraphs */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Discourse & Paragraph Metrics</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                                            <h4 className="font-medium text-slate-700 mb-2">Conjunction Usage</h4>
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-center flex-1">
                                                                    <div className="text-lg font-bold text-blue-600">{currentText.tier4.conjunctionTypes.coordinating}</div>
                                                                    <div className="text-xs text-slate-500">Coord.</div>
                                                                </div>
                                                                <div className="text-center flex-1">
                                                                    <div className="text-lg font-bold text-purple-600">{currentText.tier4.conjunctionTypes.subordinating}</div>
                                                                    <div className="text-xs text-slate-500">Subord.</div>
                                                                </div>
                                                                <div className="text-center flex-1">
                                                                    <div className="text-lg font-bold text-pink-600">{currentText.tier4.conjunctionTypes.correlative}</div>
                                                                    <div className="text-xs text-slate-500">Correl.</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="p-3 border border-slate-200 rounded">
                                                                <div className="text-xs text-slate-500">Discourse Markers</div>
                                                                <div className="text-lg font-bold text-slate-700">{currentText.tier4.discourseMarkersDensity}</div>
                                                                <div className="text-[10px] text-slate-400">per 1k words</div>
                                                            </div>
                                                            <div className="p-3 border border-slate-200 rounded">
                                                                <div className="text-xs text-slate-500">Anaphoric Dems.</div>
                                                                <div className="text-lg font-bold text-slate-700">{currentText.tier4.anaphoricDemonstrativeDensity}</div>
                                                                <div className="text-[10px] text-slate-400">pattern density</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="border-l border-slate-200 pl-0 md:pl-6">
                                                        <h4 className="font-medium text-slate-700 mb-3">Paragraph Structure</h4>
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-slate-600">Paragraph Len (Mean)</span>
                                                                <span className="font-mono font-bold text-slate-700">{currentText.tier4.paragraphLengthSentences} <span className="text-xs font-normal text-slate-500">sents</span></span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-slate-600">Length Variation (SD)</span>
                                                                <span className="font-mono font-bold text-slate-700">{currentText.tier4.paragraphLengthVariation}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-slate-600">Sentence Opener Diversity</span>
                                                                <span className="font-mono font-bold text-slate-700">{currentText.tier4.sentenceOpenerDiversity}%</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                                                                <span className="text-sm text-green-800">Topic Shifts Detected</span>
                                                                <span className="font-bold text-green-700">{currentText.tier4.topicShifts}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {/* ========== TIER 5 FEATURES SECTION ========== */}
                                    {currentText.tier5 && (
                                        <>
                                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg shadow-md p-6 border-l-4 border-emerald-600 mt-6">
                                                <h2 className="text-2xl font-bold text-emerald-900 mb-2">Tier 5: Theoretical Depth & Grammar</h2>
                                                <p className="text-sm text-slate-600">Hallidayan processes, stance markers, and advanced discourse patterns</p>
                                            </div>

                                            {/* Discourse Patterns */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Discourse Patterns</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="p-4 bg-teal-50 rounded-lg text-center">
                                                        <div className="text-sm text-slate-600">Repetitive Patterns</div>
                                                        <div className="text-3xl font-bold text-teal-700">{currentText.tier5.repetitivePatterns}%</div>
                                                        <div className="text-xs text-slate-500 mt-1">Identical POS sequences</div>
                                                    </div>
                                                    <div className="p-4 bg-cyan-50 rounded-lg text-center">
                                                        <div className="text-sm text-slate-600">Jaccard Cohesion</div>
                                                        <div className="text-3xl font-bold text-cyan-700">{currentText.tier5.jaccardCohesion}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Semantic overlap (0-1)</div>
                                                    </div>
                                                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                                                        <div className="text-sm text-slate-600">Lexical Variability</div>
                                                        <div className="text-3xl font-bold text-emerald-700">{currentText.tier5.lexicalDensityVariability}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Density SD across sentences</div>
                                                    </div>
                                                </div>

                                                <div className="mt-6">
                                                    <h4 className="font-medium text-slate-700 mb-3">Sentence Openers (POS)</h4>
                                                    <div className="flex gap-1 h-8 rounded-full overflow-hidden bg-slate-100">
                                                        <div className="bg-blue-500 h-full" style={{ width: `${(currentText.tier5.sentenceOpenerPOS.noun / (currentText.sentenceCount || 1)) * 100}%` }} title="Noun"></div>
                                                        <div className="bg-green-500 h-full" style={{ width: `${(currentText.tier5.sentenceOpenerPOS.verb / (currentText.sentenceCount || 1)) * 100}%` }} title="Verb"></div>
                                                        <div className="bg-yellow-500 h-full" style={{ width: `${(currentText.tier5.sentenceOpenerPOS.adj / (currentText.sentenceCount || 1)) * 100}%` }} title="Adjective"></div>
                                                        <div className="bg-purple-500 h-full" style={{ width: `${(currentText.tier5.sentenceOpenerPOS.adv / (currentText.sentenceCount || 1)) * 100}%` }} title="Adverb"></div>
                                                        <div className="bg-slate-300 h-full flex-grow" title="Other"></div>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
                                                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Noun</span>
                                                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Verb</span>
                                                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Adj</span>
                                                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Adv</span>
                                                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-300 rounded-full"></div> Other</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stance & Rhetoric */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Stance & Rhetoric</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                                        <div className="text-xs text-slate-500 text-center">Hedges</div>
                                                        <div className="text-xl font-bold text-slate-700 text-center">{currentText.tier5.hedgingRatio}%</div>
                                                    </div>
                                                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                                        <div className="text-xs text-slate-500 text-center">Boosters</div>
                                                        <div className="text-xl font-bold text-slate-700 text-center">{currentText.tier5.boostingRatio}%</div>
                                                    </div>
                                                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                                        <div className="text-xs text-slate-500 text-center">Impersonals</div>
                                                        <div className="text-xl font-bold text-slate-700 text-center">{currentText.tier5.impersonalConstructions}</div>
                                                        <div className="text-[10px] text-slate-400 text-center">per 1k</div>
                                                    </div>
                                                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                                        <div className="text-xs text-slate-500 text-center">Contractions</div>
                                                        <div className="text-xl font-bold text-slate-700 text-center">{currentText.tier5.contractionRatio}%</div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-4">
                                                    <div className="bg-indigo-50 p-3 rounded flex justify-between items-center">
                                                        <span className="text-sm text-indigo-900">Epistemic Adverbs</span>
                                                        <span className="font-bold text-indigo-700">{currentText.tier5.stanceAdverbs} <span className="text-xs font-normal">/1k</span></span>
                                                    </div>
                                                    <div className="bg-blue-50 p-3 rounded flex justify-between items-center">
                                                        <span className="text-sm text-blue-900">Determiner Ratio</span>
                                                        <span className="font-bold text-blue-700">{currentText.tier5.determinerRatio}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hallidayan Processes & Grammar */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Functional Grammar (Hallidayan)</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div>
                                                        <h4 className="font-medium text-slate-700 mb-3">Process Types</h4>
                                                        <div className="space-y-3">
                                                            <div className="relative pt-1">
                                                                <div className="flex mb-2 items-center justify-between">
                                                                    <div className="text-sm font-semibold text-rose-600">Material (Doing)</div>
                                                                    <div className="text-xs font-semibold text-rose-600">
                                                                        {((currentText.tier5.hallidayan.material / currentText.tier5.hallidayan.total) * 100).toFixed(0)}%
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-rose-200">
                                                                    <div style={{ width: `${(currentText.tier5.hallidayan.material / currentText.tier5.hallidayan.total) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-500"></div>
                                                                </div>
                                                            </div>
                                                            <div className="relative pt-1">
                                                                <div className="flex mb-2 items-center justify-between">
                                                                    <div className="text-sm font-semibold text-purple-600">Mental (Sensing)</div>
                                                                    <div className="text-xs font-semibold text-purple-600">
                                                                        {((currentText.tier5.hallidayan.mental / currentText.tier5.hallidayan.total) * 100).toFixed(0)}%
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                                                                    <div style={{ width: `${(currentText.tier5.hallidayan.mental / currentText.tier5.hallidayan.total) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                                                                </div>
                                                            </div>
                                                            <div className="relative pt-1">
                                                                <div className="flex mb-2 items-center justify-between">
                                                                    <div className="text-sm font-semibold text-blue-600">Relational (Being)</div>
                                                                    <div className="text-xs font-semibold text-blue-600">
                                                                        {((currentText.tier5.hallidayan.relational / currentText.tier5.hallidayan.total) * 100).toFixed(0)}%
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                                                                    <div style={{ width: `${(currentText.tier5.hallidayan.relational / currentText.tier5.hallidayan.total) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="bg-slate-50 p-4 rounded-lg">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm text-slate-600">Dynamic/Stative Ratio</span>
                                                                <span className="font-bold text-slate-800">{currentText.tier5.dynamicStativeRatio}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm text-slate-600">Present Perfect Usage</span>
                                                                <span className="font-bold text-slate-800">{currentText.tier5.presentPerfectRatio}%</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-red-600">
                                                                <span className="text-sm">Tense Shift Inconsistency</span>
                                                                <span className="font-bold">{currentText.tier5.tenseShiftInconsistency}%</span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                            <div className="bg-slate-100 p-2 rounded">
                                                                <div className="text-[10px] text-slate-500">Noun/Verb</div>
                                                                <div className="font-bold text-slate-700">{currentText.tier5.grammaticalRatios.nounVerb}</div>
                                                            </div>
                                                            <div className="bg-slate-100 p-2 rounded">
                                                                <div className="text-[10px] text-slate-500">Adj/Noun</div>
                                                                <div className="font-bold text-slate-700">{currentText.tier5.grammaticalRatios.adjNoun}</div>
                                                            </div>
                                                            <div className="bg-slate-100 p-2 rounded">
                                                                <div className="text-[10px] text-slate-500">Adv/Verb</div>
                                                                <div className="font-bold text-slate-700">{currentText.tier5.grammaticalRatios.advVerb}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* ========== TIER 6 FEATURES SECTION ========== */}
                                    {currentText.tier6 && (
                                        <>
                                            <div className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-lg shadow-md p-6 border-l-4 border-slate-600 mt-6">
                                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Tier 6: Final Stylistic Markers</h2>
                                                <p className="text-sm text-slate-600">Readability, linguistic provenance, and micro-syntax alternations</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                {/* Readability & Provenance */}
                                                <div className="bg-white rounded-lg shadow-md p-6">
                                                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Readability & Provenance</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 bg-slate-50 rounded-lg">
                                                            <div className="text-sm text-slate-600">Coleman-Liau</div>
                                                            <div className="text-2xl font-bold text-slate-800">{currentText.tier6.colemanLiau}</div>
                                                            <div className="text-xs text-slate-500 mt-1">Readability Index</div>
                                                        </div>
                                                        <div className="p-4 bg-slate-50 rounded-lg">
                                                            <div className="text-sm text-slate-600">ARI Score</div>
                                                            <div className="text-2xl font-bold text-slate-800">{currentText.tier6.ari}</div>
                                                            <div className="text-xs text-slate-500 mt-1">Automated Readability</div>
                                                        </div>
                                                        <div className="p-4 bg-orange-50 rounded-lg col-span-2">
                                                            <div className="text-sm text-slate-600">Anglo-Saxon Core</div>
                                                            <div className="text-3xl font-bold text-orange-800">{currentText.tier6.angloSaxonRatio}%</div>
                                                            <div className="text-xs text-slate-500 mt-1">Percent of tokens from Germanic core</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                                        <div className="bg-blue-50 p-2 rounded text-center">
                                                            <div className="text-xs text-slate-600">Shell Types</div>
                                                            <div className="font-bold text-blue-800">{currentText.tier6.shellNounVariety}/4</div>
                                                        </div>
                                                        <div className="bg-green-50 p-2 rounded text-center">
                                                            <div className="text-xs text-slate-600">Idiom Ratio</div>
                                                            <div className="font-bold text-green-800">{currentText.tier6.idiomRatio}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Micro-Syntax & Alternations */}
                                                <div className="bg-white rounded-lg shadow-md p-6">
                                                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Micro-Syntax & Alternations</h3>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span className="text-slate-600">Genitive Alternation ('s)</span>
                                                                <span className="font-bold text-slate-800">{currentText.tier6.genitiveAlternation}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${currentText.tier6.genitiveAlternation}%` }}></div>
                                                            </div>
                                                            <div className="text-xs text-slate-400 mt-1 text-right">vs. 'of' genitive</div>
                                                        </div>

                                                        <div>
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span className="text-slate-600">Dative Alternation (Double Obj)</span>
                                                                <span className="font-bold text-slate-800">{currentText.tier6.dativeAlternation}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${currentText.tier6.dativeAlternation}%` }}></div>
                                                            </div>
                                                            <div className="text-xs text-slate-400 mt-1 text-right">vs. Prepositional Dative</div>
                                                        </div>

                                                        <div className="p-4 bg-red-50 rounded-lg mt-4 flex justify-between items-center">
                                                            <div>
                                                                <div className="text-sm font-semibold text-red-800">Pied-Piping Score</div>
                                                                <div className="text-xs text-red-600">Preposition formal placement</div>
                                                            </div>
                                                            <div className="text-2xl font-bold text-red-800">{currentText.tier6.piedPipingScore}%</div>
                                                        </div>

                                                        {currentText.tier6.adjOrderingViolations > 0 && (
                                                            <div className="p-2 bg-yellow-100 text-yellow-800 text-xs rounded text-center font-semibold">
                                                                ⚠️ {currentText.tier6.adjOrderingViolations} Adjective Ordering Violations
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
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

                                {/* Confusion Matrix & Youden's J */}
                                {(() => {
                                    const confusion = getConfusionMatrix();
                                    if (confusion) {
                                        return (
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h3 className="text-xl font-semibold text-slate-700 mb-4">Confusion Matrix & Youden's J</h3>
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                                                        <div className="text-sm text-slate-600">True Positives (TP)</div>
                                                        <div className="text-3xl font-bold text-green-700">{confusion.TP}</div>
                                                    </div>
                                                    <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                                                        <div className="text-sm text-slate-600">False Positives (FP)</div>
                                                        <div className="text-3xl font-bold text-red-700">{confusion.FP}</div>
                                                    </div>
                                                    <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                                                        <div className="text-sm text-slate-600">True Negatives (TN)</div>
                                                        <div className="text-3xl font-bold text-blue-700">{confusion.TN}</div>
                                                    </div>
                                                    <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                                                        <div className="text-sm text-slate-600">False Negatives (FN)</div>
                                                        <div className="text-3xl font-bold text-orange-700">{confusion.FN}</div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 mt-4">
                                                    <div className="p-3 bg-purple-50 rounded-lg">
                                                        <div className="text-xs text-slate-600">Sensitivity</div>
                                                        <div className="text-xl font-bold text-purple-700">{confusion.sensitivity.toFixed(3)}</div>
                                                    </div>
                                                    <div className="p-3 bg-purple-50 rounded-lg">
                                                        <div className="text-xs text-slate-600">Specificity</div>
                                                        <div className="text-xl font-bold text-purple-700">{confusion.specificity.toFixed(3)}</div>
                                                    </div>
                                                    <div className="p-3 bg-indigo-100 rounded-lg border-2 border-indigo-400">
                                                        <div className="text-xs text-slate-600">Youden's J</div>
                                                        <div className="text-xl font-bold text-indigo-800">{confusion.youdenJ.toFixed(3)}</div>
                                                    </div>
                                                </div>
                                                <div className="mt-3 text-xs text-slate-500">
                                                    Based on texts with External_Detector_Flag set (H or AI)
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

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
                                                <th className="text-center p-2 font-semibold">External Flag</th>
                                                <th className="text-center p-2 font-semibold">Z-Score Band</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {texts.map((text, idx) => {
                                                const risk = assessRisk(text, thresholds);
                                                const zScores = calculateZScores(text, combinedStats);
                                                return (
                                                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                                                        <td className="p-2">{text.filename}</td>
                                                        <td className="text-right p-2">{text.wordCount}</td>
                                                        <td className="text-right p-2">{text.sentenceCount}</td>
                                                        <td className="text-right p-2">{text.sttr}</td>
                                                        <td className="text-right p-2">{text.cv}</td>
                                                        <td className="text-right p-2">{text.metadiscourse.density.toFixed(2)}</td>
                                                        <td className="p-2">
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${risk.overallRisk.includes('Human')
                                                                ? 'bg-green-100 text-green-800'
                                                                : risk.overallRisk.includes('AI')
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {risk.overallRisk.split(' - ')[0]}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <select
                                                                value={text.externalFlag}
                                                                onChange={(e) => updateExternalFlag(idx, e.target.value)}
                                                                className="px-2 py-1 border border-slate-300 rounded text-xs"
                                                            >
                                                                <option value="">-</option>
                                                                <option value="H">H</option>
                                                                <option value="AI">AI</option>
                                                                <option value="?">?</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="flex gap-1 justify-center">
                                                                {/* CV Z-Score */}
                                                                <div
                                                                    className="w-8 h-3 border border-slate-200"
                                                                    style={{
                                                                        backgroundColor: Math.abs(zScores.z_cv) < 1 ? '#ef4444' : Math.abs(zScores.z_cv) < 2 ? '#f59e0b' : '#22c55e'
                                                                    }}
                                                                    title={`CV z=${zScores.z_cv}`}
                                                                />
                                                                {/* STTR Z-Score */}
                                                                <div
                                                                    className="w-8 h-3 border border-slate-200"
                                                                    style={{
                                                                        backgroundColor: Math.abs(zScores.z_sttr) < 1 ? '#ef4444' : Math.abs(zScores.z_sttr) < 2 ? '#f59e0b' : '#22c55e'
                                                                    }}
                                                                    title={`STTR z=${zScores.z_sttr}`}
                                                                />
                                                                {/* MD Z-Score */}
                                                                <div
                                                                    className="w-8 h-3 border border-slate-200"
                                                                    style={{
                                                                        backgroundColor: Math.abs(zScores.z_md) < 1 ? '#ef4444' : Math.abs(zScores.z_md) < 2 ? '#f59e0b' : '#22c55e'
                                                                    }}
                                                                    title={`MD z=${zScores.z_md}`}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <div className="mt-2 text-xs text-slate-500">
                                        Z-Score Bands: Red = within ±1 SD of threshold, Amber = 1-2 SD, Green = &gt;2 SD
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Method Paragraph Tab */}
                        {activeTab === 'method' && texts.length > 0 && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Method Paragraph Generator</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Generate a LaTeX-ready methodology paragraph for your thesis or paper. The paragraph summarizes the corpus statistics and linguistic features analyzed.
                                    </p>

                                    <div className="bg-slate-50 rounded-lg p-6 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                                        {(() => {
                                            const totalWords = texts.reduce((sum, t) => sum + t.wordCount, 0);
                                            const avgWords = Math.round(totalWords / texts.length);
                                            const avgSentLen = (texts.reduce((sum, t) => sum + parseFloat(t.avgSentenceLength), 0) / texts.length).toFixed(1);
                                            const avgSTTR = (texts.reduce((sum, t) => sum + parseFloat(t.sttr), 0) / texts.length).toFixed(3);
                                            const avgCV = (texts.reduce((sum, t) => sum + parseFloat(t.cv), 0) / texts.length).toFixed(3);

                                            // Tier 2 averages
                                            const hasT2 = texts[0]?.tier2;
                                            const avgAWL = hasT2 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier2?.awlCoverage || 0), 0) / texts.length).toFixed(1) : 'N/A';
                                            const avgLexDen = hasT2 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier2?.lexicalDensity || 0), 0) / texts.length).toFixed(1) : 'N/A';

                                            // Tier 3 averages
                                            const hasT3 = texts[0]?.tier3;
                                            const avgVOCD = hasT3 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier3?.vocdD || 0), 0) / texts.length).toFixed(1) : 'N/A';
                                            const avgMATTR = hasT3 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier3?.mattr || 0), 0) / texts.length).toFixed(3) : 'N/A';

                                            // Tier 6 averages
                                            const hasT6 = texts[0]?.tier6;
                                            const avgCL = hasT6 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier6?.colemanLiau || 0), 0) / texts.length).toFixed(1) : 'N/A';
                                            const avgAS = hasT6 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier6?.angloSaxonRatio || 0), 0) / texts.length).toFixed(1) : 'N/A';

                                            return `\\subsection{Stylistic Analysis Methodology}

The corpus comprises ${texts.length} text samples with a combined total of ${totalWords.toLocaleString()} words (mean = ${avgWords.toLocaleString()} words per sample). Stylistic analysis was conducted using the Stylistic Fingerprint Analyzer, a browser-based tool implementing ${hasT6 ? '117' : hasT3 ? '65' : hasT2 ? '45' : '20'} linguistic features across ${hasT6 ? 'six' : hasT3 ? 'three' : hasT2 ? 'two' : 'one'} analytical tier${hasT6 || hasT3 || hasT2 ? 's' : ''}.

\\subsubsection{Foundational Metrics (Tier 1)}
Lexical diversity was measured using Standardized Type-Token Ratio (STTR = ${avgSTTR}), while syntactic variability was assessed via Coefficient of Variation of sentence length (CV = ${avgCV}). Mean sentence length across the corpus was ${avgSentLen} words.
${hasT2 ? `
\\subsubsection{Stylometric Features (Tier 2)}
Academic vocabulary coverage (AWL) averaged ${avgAWL}\\%, and lexical density was ${avgLexDen}\\%. Function word profiles, pronoun distributions, and metadiscourse density (Hyland, 2005) were computed for each sample.` : ''}
${hasT3 ? `
\\subsubsection{Advanced Lexical Analysis (Tier 3)}
Sophisticated lexical diversity indices were computed, including VOCD-D (M = ${avgVOCD}) and MATTR (M = ${avgMATTR}). Readability was assessed using Flesch, Kincaid, and Fog indices.` : ''}
${hasT6 ? `
\\subsubsection{Provenance and Micro-Syntax (Tier 6)}
Linguistic provenance was evaluated using the Anglo-Saxon core ratio (M = ${avgAS}\\%), measuring the proportion of Germanic vs. Latinate vocabulary. Readability was additionally assessed via the Coleman-Liau Index (M = ${avgCL}). Micro-syntactic alternations including genitive, dative, and pied-piping patterns were recorded.` : ''}

All metrics were exported for statistical analysis, and threshold-based risk assessment was applied to identify stylistic anomalies.`;
                                        })()}
                                    </div>

                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={() => {
                                                const totalWords = texts.reduce((sum, t) => sum + t.wordCount, 0);
                                                const avgWords = Math.round(totalWords / texts.length);
                                                const avgSentLen = (texts.reduce((sum, t) => sum + parseFloat(t.avgSentenceLength), 0) / texts.length).toFixed(1);
                                                const avgSTTR = (texts.reduce((sum, t) => sum + parseFloat(t.sttr), 0) / texts.length).toFixed(3);
                                                const avgCV = (texts.reduce((sum, t) => sum + parseFloat(t.cv), 0) / texts.length).toFixed(3);
                                                const hasT2 = texts[0]?.tier2;
                                                const avgAWL = hasT2 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier2?.awlCoverage || 0), 0) / texts.length).toFixed(1) : 'N/A';
                                                const avgLexDen = hasT2 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier2?.lexicalDensity || 0), 0) / texts.length).toFixed(1) : 'N/A';
                                                const hasT3 = texts[0]?.tier3;
                                                const avgVOCD = hasT3 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier3?.vocdD || 0), 0) / texts.length).toFixed(1) : 'N/A';
                                                const avgMATTR = hasT3 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier3?.mattr || 0), 0) / texts.length).toFixed(3) : 'N/A';
                                                const hasT6 = texts[0]?.tier6;
                                                const avgCL = hasT6 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier6?.colemanLiau || 0), 0) / texts.length).toFixed(1) : 'N/A';
                                                const avgAS = hasT6 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier6?.angloSaxonRatio || 0), 0) / texts.length).toFixed(1) : 'N/A';

                                                const latex = `\\subsection{Stylistic Analysis Methodology}\n\nThe corpus comprises ${texts.length} text samples with a combined total of ${totalWords.toLocaleString()} words (mean = ${avgWords.toLocaleString()} words per sample). Stylistic analysis was conducted using the Stylistic Fingerprint Analyzer, a browser-based tool implementing ${hasT6 ? '117' : hasT3 ? '65' : hasT2 ? '45' : '20'} linguistic features across ${hasT6 ? 'six' : hasT3 ? 'three' : hasT2 ? 'two' : 'one'} analytical tier${hasT6 || hasT3 || hasT2 ? 's' : ''}.\n\n\\subsubsection{Foundational Metrics (Tier 1)}\nLexical diversity was measured using Standardized Type-Token Ratio (STTR = ${avgSTTR}), while syntactic variability was assessed via Coefficient of Variation of sentence length (CV = ${avgCV}). Mean sentence length across the corpus was ${avgSentLen} words.\n${hasT2 ? `\n\\subsubsection{Stylometric Features (Tier 2)}\nAcademic vocabulary coverage (AWL) averaged ${avgAWL}\\%, and lexical density was ${avgLexDen}\\%. Function word profiles, pronoun distributions, and metadiscourse density (Hyland, 2005) were computed for each sample.` : ''}\n${hasT3 ? `\n\\subsubsection{Advanced Lexical Analysis (Tier 3)}\nSophisticated lexical diversity indices were computed, including VOCD-D (M = ${avgVOCD}) and MATTR (M = ${avgMATTR}). Readability was assessed using Flesch, Kincaid, and Fog indices.` : ''}\n${hasT6 ? `\n\\subsubsection{Provenance and Micro-Syntax (Tier 6)}\nLinguistic provenance was evaluated using the Anglo-Saxon core ratio (M = ${avgAS}\\%), measuring the proportion of Germanic vs. Latinate vocabulary. Readability was additionally assessed via the Coleman-Liau Index (M = ${avgCL}). Micro-syntactic alternations including genitive, dative, and pied-piping patterns were recorded.` : ''}\n\nAll metrics were exported for statistical analysis, and threshold-based risk assessment was applied to identify stylistic anomalies.`;

                                                navigator.clipboard.writeText(latex);
                                                alert('LaTeX copied to clipboard!');
                                            }}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            📋 Copy LaTeX to Clipboard
                                        </button>
                                        <button
                                            onClick={() => {
                                                const stats = calculateCorpusStats(texts);
                                                const totalWords = texts.reduce((sum, t) => sum + t.wordCount, 0);
                                                const avgWords = Math.round(totalWords / texts.length);
                                                const avgSentLen = (texts.reduce((sum, t) => sum + parseFloat(t.avgSentenceLength), 0) / texts.length).toFixed(1);
                                                const avgSTTR = (texts.reduce((sum, t) => sum + parseFloat(t.sttr), 0) / texts.length).toFixed(3);
                                                const avgCV = (texts.reduce((sum, t) => sum + parseFloat(t.cv), 0) / texts.length).toFixed(3);
                                                const hasT2 = texts[0]?.tier2;
                                                const avgAWL = hasT2 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier2?.awlCoverage || 0), 0) / texts.length).toFixed(1) : 'N/A';
                                                const avgLexDen = hasT2 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier2?.lexicalDensity || 0), 0) / texts.length).toFixed(1) : 'N/A';
                                                const hasT3 = texts[0]?.tier3;
                                                const avgVOCD = hasT3 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier3?.vocdD || 0), 0) / texts.length).toFixed(1) : 'N/A';
                                                const avgMATTR = hasT3 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier3?.mattr || 0), 0) / texts.length).toFixed(3) : 'N/A';
                                                const hasT6 = texts[0]?.tier6;
                                                const avgCL = hasT6 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier6?.colemanLiau || 0), 0) / texts.length).toFixed(1) : 'N/A';
                                                const avgAS = hasT6 ? (texts.reduce((sum, t) => sum + parseFloat(t.tier6?.angloSaxonRatio || 0), 0) / texts.length).toFixed(1) : 'N/A';

                                                const latex = `\\subsection{Stylistic Analysis Methodology}\n\nThe corpus comprises ${texts.length} text samples with a combined total of ${totalWords.toLocaleString()} words (mean = ${avgWords.toLocaleString()} words per sample). Stylistic analysis was conducted using the Stylistic Fingerprint Analyzer, a browser-based tool implementing ${hasT6 ? '117' : hasT3 ? '65' : hasT2 ? '45' : '20'} linguistic features across ${hasT6 ? 'six' : hasT3 ? 'three' : hasT2 ? 'two' : 'one'} analytical tier${hasT6 || hasT3 || hasT2 ? 's' : ''}.\n\n\\subsubsection{Foundational Metrics (Tier 1)}\nLexical diversity was measured using Standardized Type-Token Ratio (STTR = ${avgSTTR}), while syntactic variability was assessed via Coefficient of Variation of sentence length (CV = ${avgCV}). Mean sentence length across the corpus was ${avgSentLen} words.\n${hasT2 ? `\n\\subsubsection{Stylometric Features (Tier 2)}\nAcademic vocabulary coverage (AWL) averaged ${avgAWL}\\%, and lexical density was ${avgLexDen}\\%. Function word profiles, pronoun distributions, and metadiscourse density (Hyland, 2005) were computed for each sample.` : ''}\n${hasT3 ? `\n\\subsubsection{Advanced Lexical Analysis (Tier 3)}\nSophisticated lexical diversity indices were computed, including VOCD-D (M = ${avgVOCD}) and MATTR (M = ${avgMATTR}). Readability was assessed using Flesch, Kincaid, and Fog indices.` : ''}\n${hasT6 ? `\n\\subsubsection{Provenance and Micro-Syntax (Tier 6)}\nLinguistic provenance was evaluated using the Anglo-Saxon core ratio (M = ${avgAS}\\%), measuring the proportion of Germanic vs. Latinate vocabulary. Readability was additionally assessed via the Coleman-Liau Index (M = ${avgCL}). Micro-syntactic alternations including genitive, dative, and pied-piping patterns were recorded.` : ''}\n\nAll metrics were exported for statistical analysis, and threshold-based risk assessment was applied to identify stylistic anomalies.`;

                                                const blob = new Blob([latex], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = 'methodology_paragraph.tex';
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            💾 Download .tex File
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dashboard Tab */}
                        {activeTab === 'dashboard' && texts.length > 0 && (() => {
                            // Calculate all dashboard metrics
                            const totalFiles = texts.length;
                            const totalWords = texts.reduce((sum, t) => sum + t.wordCount, 0);
                            const totalSentences = texts.reduce((sum, t) => sum + t.sentenceCount, 0);
                            const meanSTTR = (texts.reduce((sum, t) => sum + parseFloat(t.sttr), 0) / texts.length).toFixed(3);
                            const meanCV = (texts.reduce((sum, t) => sum + parseFloat(t.cv), 0) / texts.length).toFixed(3);
                            const meanMD = (texts.reduce((sum, t) => sum + (t.metadiscourse?.density || 0), 0) / texts.length).toFixed(2);

                            // Calculate risk distribution
                            const riskCounts = { high: 0, borderline: 0, low: 0 };
                            texts.forEach(t => {
                                const risk = calculateRisk(t, thresholds);
                                if (risk.overallRisk.includes('HIGH')) riskCounts.high++;
                                else if (risk.overallRisk.includes('BORDERLINE')) riskCounts.borderline++;
                                else riskCounts.low++;
                            });
                            const pctHigh = ((riskCounts.high / totalFiles) * 100).toFixed(1);
                            const pctBorderline = ((riskCounts.borderline / totalFiles) * 100).toFixed(1);
                            const pctLow = ((riskCounts.low / totalFiles) * 100).toFixed(1);

                            // Calculate corpus stats for Z-scores
                            const cvValues = texts.map(t => parseFloat(t.cv));
                            const sttrValues = texts.map(t => parseFloat(t.sttr));
                            const mdValues = texts.map(t => t.metadiscourse?.density || 0);
                            const corpusMeanCV = cvValues.reduce((a, b) => a + b, 0) / cvValues.length;
                            const corpusMeanSTTR = sttrValues.reduce((a, b) => a + b, 0) / sttrValues.length;
                            const corpusMeanMD = mdValues.reduce((a, b) => a + b, 0) / mdValues.length;
                            const corpusStdCV = Math.sqrt(cvValues.reduce((sum, v) => sum + Math.pow(v - corpusMeanCV, 2), 0) / cvValues.length) || 0.001;
                            const corpusStdSTTR = Math.sqrt(sttrValues.reduce((sum, v) => sum + Math.pow(v - corpusMeanSTTR, 2), 0) / sttrValues.length) || 0.001;
                            const corpusStdMD = Math.sqrt(mdValues.reduce((sum, v) => sum + Math.pow(v - corpusMeanMD, 2), 0) / mdValues.length) || 0.001;

                            // Find outliers
                            const outliers = texts.map((t, idx) => ({
                                idx,
                                filename: t.filename,
                                zCV: Math.abs((parseFloat(t.cv) - corpusMeanCV) / corpusStdCV),
                                zSTTR: Math.abs((parseFloat(t.sttr) - corpusMeanSTTR) / corpusStdSTTR),
                                zMD: Math.abs(((t.metadiscourse?.density || 0) - corpusMeanMD) / corpusStdMD),
                                cv: t.cv,
                                sttr: t.sttr,
                                md: (t.metadiscourse?.density || 0).toFixed(2)
                            })).sort((a, b) => Math.max(b.zCV, b.zSTTR, b.zMD) - Math.max(a.zCV, a.zSTTR, a.zMD)).slice(0, 5);

                            // Confusion matrix (if external labels exist)
                            const labeledTexts = texts.filter(t => t.externalFlag && t.externalFlag !== '');
                            let confusion = { tp: 0, fp: 0, tn: 0, fn: 0 };
                            if (labeledTexts.length > 0) {
                                labeledTexts.forEach(t => {
                                    const risk = calculateRisk(t, thresholds);
                                    const predicted = risk.overallRisk.includes('HIGH') || risk.overallRisk.includes('BORDERLINE') ? 'AI' : 'H';
                                    const actual = t.externalFlag;
                                    if (actual === 'AI' && predicted === 'AI') confusion.tp++;
                                    else if (actual === 'H' && predicted === 'AI') confusion.fp++;
                                    else if (actual === 'H' && predicted === 'H') confusion.tn++;
                                    else if (actual === 'AI' && predicted === 'H') confusion.fn++;
                                });
                            }
                            const accuracy = labeledTexts.length > 0 ? ((confusion.tp + confusion.tn) / labeledTexts.length * 100).toFixed(1) : 'N/A';
                            const sensitivity = (confusion.tp + confusion.fn) > 0 ? (confusion.tp / (confusion.tp + confusion.fn) * 100).toFixed(1) : 'N/A';
                            const specificity = (confusion.tn + confusion.fp) > 0 ? (confusion.tn / (confusion.tn + confusion.fp) * 100).toFixed(1) : 'N/A';
                            const youdenJ = sensitivity !== 'N/A' && specificity !== 'N/A' ? ((parseFloat(sensitivity) + parseFloat(specificity) - 100) / 100).toFixed(2) : 'N/A';

                            // Auto-generate insight
                            const lowCVTexts = texts.filter(t => parseFloat(t.cv) < thresholds.cv);
                            const insightParts = [];
                            if (parseFloat(meanCV) >= thresholds.cv && parseFloat(meanSTTR) >= thresholds.sttr) {
                                insightParts.push("Corpus averages are human-like");
                            } else {
                                insightParts.push("Corpus averages show potential AI characteristics");
                            }
                            if (lowCVTexts.length > 0 && lowCVTexts.length < totalFiles / 2) {
                                insightParts.push(`but ${lowCVTexts.length} text${lowCVTexts.length > 1 ? 's' : ''} drive${lowCVTexts.length === 1 ? 's' : ''} CV down into AI territory`);
                            }
                            if (riskCounts.high > 0) {
                                insightParts.push(`${riskCounts.high} file${riskCounts.high > 1 ? 's' : ''} flagged as HIGH RISK`);
                            }
                            const quickInsight = insightParts.join(', ') + '.';

                            // Scatterplot data
                            const scatterData = texts.map((t, idx) => {
                                const risk = calculateRisk(t, thresholds);
                                return {
                                    name: t.filename,
                                    cv: parseFloat(t.cv),
                                    sttr: parseFloat(t.sttr),
                                    md: t.metadiscourse?.density || 0,
                                    risk: risk.overallRisk.includes('HIGH') ? 'red' : risk.overallRisk.includes('BORDERLINE') ? 'orange' : 'green'
                                };
                            });

                            return (
                                <div className="space-y-6">
                                    {/* Quick Insight Banner */}
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">💡</span>
                                            <div>
                                                <h3 className="text-lg font-semibold">Quick Insight</h3>
                                                <p className="text-blue-100">{quickInsight}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Corpus-at-a-Glance Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                                            <div className="text-3xl font-bold text-blue-700">{totalFiles}</div>
                                            <div className="text-sm text-slate-600">Total Files</div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                                            <div className="text-3xl font-bold text-green-700">{totalWords.toLocaleString()}</div>
                                            <div className="text-sm text-slate-600">Total Words</div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                                            <div className="text-3xl font-bold text-purple-700">{totalSentences.toLocaleString()}</div>
                                            <div className="text-sm text-slate-600">Total Sentences</div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                                            <div className="text-3xl font-bold text-indigo-700">{meanSTTR}</div>
                                            <div className="text-sm text-slate-600">Mean STTR</div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                                            <div className="text-3xl font-bold text-orange-700">{meanCV}</div>
                                            <div className="text-sm text-slate-600">Mean CV</div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow-md p-4 text-center">
                                            <div className="text-3xl font-bold text-pink-700">{meanMD}</div>
                                            <div className="text-sm text-slate-600">Mean MD Density</div>
                                        </div>
                                    </div>

                                    {/* Risk Distribution Row */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Risk Percentages */}
                                        <div className="bg-white rounded-lg shadow-md p-6">
                                            <h3 className="text-xl font-semibold text-slate-700 mb-4">Risk Distribution</h3>
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                                                    <div className="text-3xl font-bold text-red-600">{pctHigh}%</div>
                                                    <div className="text-sm text-red-700">HIGH RISK (AI)</div>
                                                    <div className="text-xs text-red-500">{riskCounts.high} files</div>
                                                </div>
                                                <div className="text-center p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                                                    <div className="text-3xl font-bold text-amber-600">{pctBorderline}%</div>
                                                    <div className="text-sm text-amber-700">BORDERLINE</div>
                                                    <div className="text-xs text-amber-500">{riskCounts.borderline} files</div>
                                                </div>
                                                <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                                                    <div className="text-3xl font-bold text-green-600">{pctLow}%</div>
                                                    <div className="text-sm text-green-700">HUMAN-LIKE</div>
                                                    <div className="text-xs text-green-500">{riskCounts.low} files</div>
                                                </div>
                                            </div>

                                            {/* Donut Chart */}
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'HIGH RISK', value: riskCounts.high },
                                                            { name: 'BORDERLINE', value: riskCounts.borderline },
                                                            { name: 'HUMAN-LIKE', value: riskCounts.low }
                                                        ].filter(d => d.value > 0)}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={80}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        <Cell fill="#ef4444" />
                                                        <Cell fill="#f59e0b" />
                                                        <Cell fill="#22c55e" />
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Confusion Matrix (if labels exist) */}
                                        <div className="bg-white rounded-lg shadow-md p-6">
                                            <h3 className="text-xl font-semibold text-slate-700 mb-4">
                                                Confusion Matrix
                                                {labeledTexts.length === 0 && <span className="text-sm font-normal text-slate-400 ml-2">(No labels set)</span>}
                                            </h3>
                                            {labeledTexts.length > 0 ? (
                                                <>
                                                    <div className="grid grid-cols-3 gap-1 mb-4 text-center text-sm">
                                                        <div></div>
                                                        <div className="font-semibold text-slate-600">Pred: AI</div>
                                                        <div className="font-semibold text-slate-600">Pred: H</div>
                                                        <div className="font-semibold text-slate-600">Actual: AI</div>
                                                        <div className="p-3 bg-green-100 border border-green-300 rounded font-bold text-green-700">TP: {confusion.tp}</div>
                                                        <div className="p-3 bg-red-100 border border-red-300 rounded font-bold text-red-700">FN: {confusion.fn}</div>
                                                        <div className="font-semibold text-slate-600">Actual: H</div>
                                                        <div className="p-3 bg-red-100 border border-red-300 rounded font-bold text-red-700">FP: {confusion.fp}</div>
                                                        <div className="p-3 bg-green-100 border border-green-300 rounded font-bold text-green-700">TN: {confusion.tn}</div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div className="p-2 bg-slate-50 rounded"><span className="font-semibold">Accuracy:</span> {accuracy}%</div>
                                                        <div className="p-2 bg-slate-50 rounded"><span className="font-semibold">Sensitivity:</span> {sensitivity}%</div>
                                                        <div className="p-2 bg-slate-50 rounded"><span className="font-semibold">Specificity:</span> {specificity}%</div>
                                                        <div className="p-2 bg-slate-50 rounded"><span className="font-semibold">Youden J:</span> {youdenJ}</div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center text-slate-400 py-8">
                                                    <p>Set external labels (H/AI) in Combined Corpus table to see confusion matrix.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Metric Scatterplot Matrix (3x3) */}
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="text-xl font-semibold text-slate-700 mb-4">Metric Scatterplot Matrix</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* CV vs STTR */}
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-600 mb-2 text-center">CV vs STTR</h4>
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 40 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="cv" name="CV" type="number" domain={['auto', 'auto']} tick={{ fontSize: 10 }} label={{ value: 'CV', position: 'bottom', fontSize: 10 }} />
                                                        <YAxis dataKey="sttr" name="STTR" type="number" domain={['auto', 'auto']} tick={{ fontSize: 10 }} label={{ value: 'STTR', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                                        <Scatter data={scatterData}>
                                                            {scatterData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.risk} />
                                                            ))}
                                                        </Scatter>
                                                        <ReferenceLine x={thresholds.cv} stroke="#ef4444" strokeDasharray="5 5" />
                                                    </ScatterChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* CV vs MD */}
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-600 mb-2 text-center">CV vs MD Density</h4>
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 40 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="cv" name="CV" type="number" domain={['auto', 'auto']} tick={{ fontSize: 10 }} label={{ value: 'CV', position: 'bottom', fontSize: 10 }} />
                                                        <YAxis dataKey="md" name="MD" type="number" domain={['auto', 'auto']} tick={{ fontSize: 10 }} label={{ value: 'MD', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                                        <Scatter data={scatterData}>
                                                            {scatterData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.risk} />
                                                            ))}
                                                        </Scatter>
                                                        <ReferenceLine x={thresholds.cv} stroke="#ef4444" strokeDasharray="5 5" />
                                                    </ScatterChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* STTR vs MD */}
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-600 mb-2 text-center">STTR vs MD Density</h4>
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 40 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="sttr" name="STTR" type="number" domain={['auto', 'auto']} tick={{ fontSize: 10 }} label={{ value: 'STTR', position: 'bottom', fontSize: 10 }} />
                                                        <YAxis dataKey="md" name="MD" type="number" domain={['auto', 'auto']} tick={{ fontSize: 10 }} label={{ value: 'MD', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                                        <Scatter data={scatterData}>
                                                            {scatterData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.risk} />
                                                            ))}
                                                        </Scatter>
                                                    </ScatterChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="flex justify-center gap-4 mt-2 text-xs">
                                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> HIGH RISK</span>
                                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> BORDERLINE</span>
                                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> HUMAN-LIKE</span>
                                        </div>
                                    </div>

                                    {/* Outlier Table */}
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="text-xl font-semibold text-slate-700 mb-4">Top 5 Outliers (by Z-Score)</h3>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-2">Filename</th>
                                                    <th className="text-center p-2">CV</th>
                                                    <th className="text-center p-2">|Z| CV</th>
                                                    <th className="text-center p-2">STTR</th>
                                                    <th className="text-center p-2">|Z| STTR</th>
                                                    <th className="text-center p-2">MD</th>
                                                    <th className="text-center p-2">|Z| MD</th>
                                                    <th className="text-center p-2">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {outliers.map((o, i) => (
                                                    <tr key={i} className="border-b hover:bg-slate-50">
                                                        <td className="p-2 font-medium">{o.filename}</td>
                                                        <td className="p-2 text-center">{o.cv}</td>
                                                        <td className={`p-2 text-center font-bold ${o.zCV > 2 ? 'text-red-600' : o.zCV > 1 ? 'text-amber-600' : 'text-green-600'}`}>{o.zCV.toFixed(2)}</td>
                                                        <td className="p-2 text-center">{o.sttr}</td>
                                                        <td className={`p-2 text-center font-bold ${o.zSTTR > 2 ? 'text-red-600' : o.zSTTR > 1 ? 'text-amber-600' : 'text-green-600'}`}>{o.zSTTR.toFixed(2)}</td>
                                                        <td className="p-2 text-center">{o.md}</td>
                                                        <td className={`p-2 text-center font-bold ${o.zMD > 2 ? 'text-red-600' : o.zMD > 1 ? 'text-amber-600' : 'text-green-600'}`}>{o.zMD.toFixed(2)}</td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                onClick={() => { setSelectedTextIndex(o.idx); setActiveTab('individual'); }}
                                                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                                                            >
                                                                View →
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Threshold Reminder Strip */}
                                    <div className="bg-slate-100 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Current Thresholds</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">CV Veto: {thresholds.cv}</span>
                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">STTR: {thresholds.sttr}</span>
                                            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">MD Density: {thresholds.metadiscourse}</span>
                                        </div>
                                    </div>

                                    {/* Export Queue Status */}
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="text-xl font-semibold text-slate-700 mb-4">Export Options</h3>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={exportToCSV}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                                            >
                                                📥 Export CSV
                                            </button>
                                            <button
                                                onClick={exportToXLSX}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                📊 Export XLSX
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">Exports include all {totalFiles} files with 117+ features per file.</p>
                                    </div>
                                </div>
                            );
                        })()}
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
