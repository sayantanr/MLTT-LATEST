import React, { useState } from 'react';
import { Upload, FileText, Image, Languages, Copy, Download, Type, BarChart3 } from 'lucide-react';

const LANGUAGES = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Assamese", "Aymara", 
  "Azerbaijani", "Bambara", "Basque", "Belarusian", "Bengali", "Bhojpuri", "Bosnian", 
  "Bulgarian", "Burmese", "Catalan", "Cebuano", "Chinese (Simplified)", "Chinese (Traditional)", 
  "Corsican", "Croatian", "Czech", "Danish", "Dhivehi", "Dogri", "Dutch", "English", 
  "Esperanto", "Estonian", "Ewe", "Filipino (Tagalog)", "Finnish", "French", "Frisian", 
  "Galician", "Georgian", "German", "Greek", "Guarani", "Gujarati", "Haitian Creole", 
  "Hausa", "Hawaiian", "Hebrew", "Hindi", "Hmong", "Hungarian", "Icelandic", "Igbo", 
  "Ilocano", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Kannada", "Kazakh", 
  "Khmer", "Kinyarwanda", "Konkani", "Korean", "Krio", "Kurdish (Kurmanji)", "Kurdish (Sorani)", 
  "Kyrgyz", "Lao", "Latin", "Latvian", "Lingala", "Lithuanian", "Luganda", "Luxembourgish", 
  "Macedonian", "Maithili", "Malagasy", "Malay", "Malayalam", "Maltese", "Maori", "Marathi", 
  "Meiteilon (Manipuri)", "Mizo", "Mongolian", "Nepali", "Norwegian", "Odia (Oriya)", "Oromo", 
  "Pashto", "Persian (Farsi)", "Polish", "Portuguese", "Punjabi", "Quechua", "Romanian", 
  "Russian", "Samoan", "Sanskrit", "Scottish Gaelic", "Sepedi", "Serbian", "Sesotho", "Shona", 
  "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili", 
  "Swedish", "Tajik", "Tamil", "Tatar", "Telugu", "Thai", "Tigrinya", "Tsonga", "Turkish", 
  "Turkmen", "Twi", "Ukrainian", "Urdu", "Uyghur", "Uzbek", "Vietnamese", "Welsh", "Xhosa", 
  "Yiddish", "Yoruba", "Zulu"
];

export default function TranslatorApp() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [isTranslating, setIsTranslating] = useState(false);
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState('translate'); // 'translate' or 'transliterate'
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setIsTranslating(true);

    try {
      if (file.type === 'application/pdf') {
        // For PDFs, we'll extract text using PDF.js or similar
        // Since we can't use external libraries easily, we'll use the Anthropic API
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target.result.split(',')[1];
          
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1000,
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "document",
                      source: {
                        type: "base64",
                        media_type: "application/pdf",
                        data: base64Data
                      }
                    },
                    {
                      type: "text",
                      text: "Extract all text from this PDF document. Return only the extracted text, nothing else."
                    }
                  ]
                }
              ]
            })
          });

          const data = await response.json();
          const extractedText = data.content.map(item => item.type === "text" ? item.text : "").join("\n");
          setInputText(extractedText);
          setIsTranslating(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('image/')) {
        // For images, perform OCR
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target.result.split(',')[1];
          
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1000,
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "image",
                      source: {
                        type: "base64",
                        media_type: file.type,
                        data: base64Data
                      }
                    },
                    {
                      type: "text",
                      text: "Extract all visible text from this image. Return only the extracted text, nothing else."
                    }
                  ]
                }
              ]
            })
          });

          const data = await response.json();
          const extractedText = data.content.map(item => item.type === "text" ? item.text : "").join("\n");
          setInputText(extractedText);
          setIsTranslating(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain') {
        // For text files
        const reader = new FileReader();
        reader.onload = (e) => {
          setInputText(e.target.result);
          setIsTranslating(false);
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
      setIsTranslating(false);
    }
  };

  const calculateStats = (original, translated) => {
    const originalWords = original.trim().split(/\s+/).filter(w => w.length > 0);
    const translatedWords = translated.trim().split(/\s+/).filter(w => w.length > 0);
    const originalChars = original.length;
    const translatedChars = translated.length;
    const originalCharsNoSpace = original.replace(/\s/g, '').length;
    const translatedCharsNoSpace = translated.replace(/\s/g, '').length;
    
    // Calculate sentences
    const originalSentences = original.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const translatedSentences = translated.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    // Calculate paragraphs
    const originalParagraphs = original.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const translatedParagraphs = translated.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    
    // Calculate average word length
    const avgOriginalWordLength = originalCharsNoSpace / originalWords.length || 0;
    const avgTranslatedWordLength = translatedCharsNoSpace / translatedWords.length || 0;
    
    // Calculate expansion/compression ratio
    const lengthRatio = ((translatedChars / originalChars) * 100) || 0;
    
    return {
      original: {
        words: originalWords.length,
        characters: originalChars,
        charactersNoSpace: originalCharsNoSpace,
        sentences: originalSentences,
        paragraphs: originalParagraphs,
        avgWordLength: avgOriginalWordLength.toFixed(2)
      },
      translated: {
        words: translatedWords.length,
        characters: translatedChars,
        charactersNoSpace: translatedCharsNoSpace,
        sentences: translatedSentences,
        paragraphs: translatedParagraphs,
        avgWordLength: avgTranslatedWordLength.toFixed(2)
      },
      comparison: {
        wordDifference: translatedWords.length - originalWords.length,
        characterDifference: translatedChars - originalChars,
        lengthRatio: lengthRatio.toFixed(2),
        expansionOrCompression: lengthRatio > 100 ? 'Expansion' : lengthRatio < 100 ? 'Compression' : 'Same'
      }
    };
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      alert('Please enter or upload text to translate');
      return;
    }

    setIsTranslating(true);
    setTranslatedText('');
    setStats(null);

    try {
      let promptText;
      
      if (mode === 'translate') {
        promptText = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Return only the translated text, nothing else:\n\n${inputText}`;
      } else {
        promptText = `Transliterate the following text from ${sourceLanguage} script to ${targetLanguage} script. Convert the pronunciation/phonetics, not the meaning. For example, if transliterating "Hello" from English to Hindi, return "हेलो" (the sound, not the meaning "नमस्ते"). Return only the transliterated text:\n\n${inputText}`;
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: promptText
            }
          ]
        })
      });

      const data = await response.json();
      const result = data.content.map(item => item.type === "text" ? item.text : "").join("\n");
      setTranslatedText(result);
      
      // Calculate statistics
      const statistics = calculateStats(inputText, result);
      setStats(statistics);
      
    } catch (error) {
      console.error('Processing error:', error);
      alert('Error processing text. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    alert('Copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([translatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_${targetLanguage.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Languages className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Multi-Language Translator</h1>
            <p className="text-gray-600">Translate, transliterate text, PDFs, and images across 120+ languages</p>
          </div>

          {/* Mode Selection */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                onClick={() => setMode('translate')}
                className={`flex items-center px-6 py-2 rounded-md transition-colors ${
                  mode === 'translate'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Languages className="w-5 h-5 mr-2" />
                Translate
              </button>
              <button
                onClick={() => setMode('transliterate')}
                className={`flex items-center px-6 py-2 rounded-md transition-colors ${
                  mode === 'transliterate'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Type className="w-5 h-5 mr-2" />
                Transliterate
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-center">
              <button
                onClick={swapLanguages}
                className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                ⇄ Swap
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
                <FileText className="w-5 h-5 mr-2" />
                Text File (.txt)
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              
              <label className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 mr-2" />
                PDF File
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <label className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer transition-colors">
                <Image className="w-5 h-5 mr-2" />
                Image (OCR)
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {fileName && (
              <p className="text-sm text-gray-600 mt-2">Loaded: {fileName}</p>
            )}
          </div>

          {/* Text Input/Output Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source Text</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text or upload a file..."
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'translate' ? 'Translated Text' : 'Transliterated Text'}
              </label>
              <textarea
                value={translatedText}
                readOnly
                placeholder={mode === 'translate' ? 'Translation will appear here...' : 'Transliteration will appear here...'}
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {isTranslating ? 'Processing...' : mode === 'translate' ? 'Translate' : 'Transliterate'}
            </button>

            {translatedText && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Copy
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </button>

                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  {showStats ? 'Hide Stats' : 'Show Stats'}
                </button>
              </>
            )}
          </div>

          {/* Statistics Panel */}
          {showStats && stats && (
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
              <h3 className="text-2xl font-bold text-indigo-900 mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 mr-2" />
                Text Statistics & Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Original Text Stats */}
                <div className="bg-white rounded-lg p-5 shadow-md">
                  <h4 className="font-semibold text-lg text-blue-700 mb-3 border-b-2 border-blue-200 pb-2">
                    Source Text ({sourceLanguage})
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Words:</span>
                      <span className="font-bold text-gray-900">{stats.original.words}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Characters:</span>
                      <span className="font-bold text-gray-900">{stats.original.characters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chars (no space):</span>
                      <span className="font-bold text-gray-900">{stats.original.charactersNoSpace}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sentences:</span>
                      <span className="font-bold text-gray-900">{stats.original.sentences}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paragraphs:</span>
                      <span className="font-bold text-gray-900">{stats.original.paragraphs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Word Length:</span>
                      <span className="font-bold text-gray-900">{stats.original.avgWordLength}</span>
                    </div>
                  </div>
                </div>

                {/* Translated Text Stats */}
                <div className="bg-white rounded-lg p-5 shadow-md">
                  <h4 className="font-semibold text-lg text-green-700 mb-3 border-b-2 border-green-200 pb-2">
                    Target Text ({targetLanguage})
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Words:</span>
                      <span className="font-bold text-gray-900">{stats.translated.words}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Characters:</span>
                      <span className="font-bold text-gray-900">{stats.translated.characters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chars (no space):</span>
                      <span className="font-bold text-gray-900">{stats.translated.charactersNoSpace}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sentences:</span>
                      <span className="font-bold text-gray-900">{stats.translated.sentences}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paragraphs:</span>
                      <span className="font-bold text-gray-900">{stats.translated.paragraphs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Word Length:</span>
                      <span className="font-bold text-gray-900">{stats.translated.avgWordLength}</span>
                    </div>
                  </div>
                </div>

                {/* Comparison Stats */}
                <div className="bg-white rounded-lg p-5 shadow-md">
                  <h4 className="font-semibold text-lg text-purple-700 mb-3 border-b-2 border-purple-200 pb-2">
                    Comparison Analysis
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Word Difference:</span>
                      <span className={`font-bold ${stats.comparison.wordDifference > 0 ? 'text-green-600' : stats.comparison.wordDifference < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {stats.comparison.wordDifference > 0 ? '+' : ''}{stats.comparison.wordDifference}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Char Difference:</span>
                      <span className={`font-bold ${stats.comparison.characterDifference > 0 ? 'text-green-600' : stats.comparison.characterDifference < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {stats.comparison.characterDifference > 0 ? '+' : ''}{stats.comparison.characterDifference}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Length Ratio:</span>
                      <span className="font-bold text-gray-900">{stats.comparison.lengthRatio}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Text Change:</span>
                      <span className={`font-bold ${stats.comparison.expansionOrCompression === 'Expansion' ? 'text-blue-600' : stats.comparison.expansionOrCompression === 'Compression' ? 'text-orange-600' : 'text-gray-900'}`}>
                        {stats.comparison.expansionOrCompression}
                      </span>
                    </div>
                    <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-gray-700">
                        <strong>Reading Time:</strong>
                        <br />Source: ~{Math.ceil(stats.original.words / 200)} min
                        <br />Target: ~{Math.ceil(stats.translated.words / 200)} min
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Insights */}
              <div className="mt-6 bg-white rounded-lg p-4 shadow-md">
                <h4 className="font-semibold text-md text-indigo-700 mb-2">💡 Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="flex items-start">
                    <span className="text-indigo-500 mr-2">•</span>
                    <span>
                      {stats.comparison.lengthRatio > 120 
                        ? `The ${targetLanguage} translation is significantly longer, which is common for languages with more descriptive grammar.`
                        : stats.comparison.lengthRatio < 80
                        ? `The ${targetLanguage} translation is more compact, typical for languages with efficient character systems.`
                        : `Both texts have similar lengths, indicating structural similarity between languages.`}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-indigo-500 mr-2">•</span>
                    <span>
                      Average word length changed from {stats.original.avgWordLength} to {stats.translated.avgWordLength} characters.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
