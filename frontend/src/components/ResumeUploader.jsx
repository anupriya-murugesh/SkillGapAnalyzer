import { useState, useRef } from 'react';
import { API_BASE_URL } from '../config';

export default function ResumeUploader({ onSkillsExtracted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sendExtractRequest = async (payload) => {
    setLoading(true);
    setError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s for deep multi-model pass

    try {
      const response = await fetch(`${API_BASE_URL}/api/extract-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Analysis request failed. Please check the backend connection.');
      }

      const data = await response.json();
      if (data.skills && Array.isArray(data.skills)) {
        if (data.skills.length === 0) {
          setError('No clear skills could be extracted. Please paste raw skills or verify the resume format.');
        } else {
          onSkillsExtracted(data.skills);
        }
      } else {
        throw new Error('Invalid response structure received from extractor.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Extraction timed out. The AI model or server took too long. Please try again or paste key skills directly.');
      } else {
        setError(err.message || 'Failed to extract resume.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    const fileName = file.name || 'resume';
    const isPdf = fileName.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    setUploadedFileInfo({
      name: fileName,
      size: formatFileSize(file.size),
      isPdf
    });
    setError('');

    try {
      if (isPdf) {
        // Read PDF as Base64 Data URL
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Content = reader.result;
          await sendExtractRequest({
            file_content_base64: base64Content,
            file_name: fileName
          });
        };
        reader.onerror = () => {
          setError('Failed to read the selected PDF file. Please try another file.');
        };
        reader.readAsDataURL(file);
      } else {
        // Read text or markdown
        const text = await file.text();
        setResumeText(text);
        await sendExtractRequest({
          resume_text: text,
          file_name: fileName
        });
      }
    } catch (err) {
      setError(`Failed to read file: ${err.message || 'Unknown read error'}`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = null; // Reset so re-uploading same file works
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!resumeText.trim()) return;
    setUploadedFileInfo(null);
    sendExtractRequest({ resume_text: resumeText });
  };

  const handleClearFile = (e) => {
    e.stopPropagation();
    setUploadedFileInfo(null);
    setError('');
  };

  return (
    <div className="border-2 border-slate-200 rounded-3xl p-6 bg-slate-50 flex flex-col gap-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-6 items-stretch">
        
        {/* Dropzone File Upload */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`flex-1 flex flex-col justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all bg-white relative ${
            isDragging 
              ? 'border-emerald-600 bg-emerald-50/50 scale-[1.01]' 
              : 'border-slate-300 hover:border-emerald-600 hover:bg-slate-50/50'
          }`}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".pdf,.txt,.md,.docx" 
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center text-xl mx-auto mb-3 shadow-xs">
            📄
          </div>

          <h3 className="text-base font-black text-slate-950 mb-1">
            Upload Resume (PDF & Text)
          </h3>
          <p className="text-slate-600 mb-4 text-xs font-medium max-w-xs mx-auto">
            Drop your <strong className="text-emerald-900 font-black">PDF</strong>, <strong className="text-emerald-900 font-black">TXT</strong>, or <strong className="text-emerald-900 font-black">MD</strong> resume here or browse files.
          </p>

          {uploadedFileInfo ? (
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl mx-auto max-w-full text-left">
              <span className="text-base">{uploadedFileInfo.isPdf ? '📕' : '📝'}</span>
              <div className="truncate text-xs">
                <span className="font-bold text-emerald-950 block truncate max-w-[180px]">{uploadedFileInfo.name}</span>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">{uploadedFileInfo.size}</span>
              </div>
              <button
                type="button"
                onClick={handleClearFile}
                disabled={loading}
                title="Remove file"
                className="text-emerald-700 hover:text-red-700 font-black text-sm ml-1 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="relative mx-auto inline-block">
              <button 
                type="button"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-xs transition-all text-xs cursor-pointer"
              >
                {loading ? 'Reading File...' : 'Select Resume (PDF / TXT)'}
              </button>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center">
          <span className="text-slate-400 font-mono font-bold uppercase text-xs px-2">OR</span>
        </div>

        {/* Raw Text Input */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Paste Resume Text</span>
            <span className="text-[10px] font-black text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">Fast Ingest</span>
          </div>
          <textarea
            className="w-full flex-1 min-h-[120px] p-4 border-2 border-slate-300 rounded-2xl focus:border-emerald-600 outline-none resize-none text-xs text-slate-950 font-medium bg-white transition-colors placeholder-slate-400"
            placeholder="Paste your raw resume text, tech stack, or project bullets..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            disabled={loading}
          />
          <button 
            type="button"
            onClick={handleTextSubmit}
            disabled={loading || !resumeText.trim()}
            className="mt-3 w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-xs shadow-xs cursor-pointer"
          >
            {loading ? 'Extracting Skills with Hybrid Engine...' : 'Extract Skills from Text'}
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="p-3 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-300 font-bold text-center text-xs flex items-center justify-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-700 animate-ping"></span>
          Extracting skills from resume using Gemini AI + High-Recall Taxonomy Engine...
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-900 rounded-xl border-2 border-red-200 font-bold text-center text-xs">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
