import { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function ResumeUploader({ onSkillsExtracted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumeText, setResumeText] = useState('');

  const sendExtractRequest = async (text) => {
    if (!text || text.trim() === '') return;
    
    setLoading(true);
    setError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/extract-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: text }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Analysis request failed. Please try again.');
      }

      const data = await response.json();
      if (data.skills) {
        onSkillsExtracted(data.skills);
        setResumeText(''); // Clear on success
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. The AI took too long to respond. Please try again.');
      } else {
        setError(err.message || 'Failed to extract resume.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      setResumeText(text);
      // Auto-extract immediately upon upload
      sendExtractRequest(text);
    } catch (err) {
      setError('Failed to read file. Please upload a valid .txt file.');
    } finally {
      e.target.value = null; // Reset input
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    sendExtractRequest(resumeText);
  };

  return (
    <div className="border-2 border-slate-800 rounded-3xl p-6 bg-[#0c0e17] flex flex-col gap-4 shadow-inner">
      <div className="flex flex-col sm:flex-row gap-6 items-stretch">
        <div className="flex-1 flex flex-col justify-center border-2 border-dashed border-slate-700/80 rounded-2xl p-6 text-center hover:border-[#B298E7]/60 transition-colors bg-[#121626]/80">
          <div className="w-10 h-10 rounded-xl bg-[#B298E7]/15 border border-[#B298E7]/30 flex items-center justify-center text-lg mx-auto mb-3">📄</div>
          <h3 className="text-base font-black text-white mb-1">Upload Resume File</h3>
          <p className="text-slate-400 mb-4 text-xs font-medium">Upload a .txt or .md file to automatically extract your skills with Gemini.</p>
          
          <div className="relative mx-auto inline-block">
            <input 
              type="file" 
              accept=".txt,.md,.csv" 
              onChange={handleFileUpload}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <button 
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black rounded-xl shadow-md transition-all pointer-events-none text-xs"
            >
              Select Resume File
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <span className="text-slate-500 font-mono font-bold uppercase text-xs px-2">OR</span>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black text-white uppercase tracking-wider">Paste Resume Text</span>
            <span className="text-[10px] font-bold text-[#B8E3E9] bg-[#B8E3E9]/10 px-2 py-0.5 rounded border border-[#B8E3E9]/30">Direct Ingest</span>
          </div>
          <textarea
            className="w-full flex-1 min-h-[120px] p-4 border border-slate-800 rounded-2xl focus:border-[#B8E3E9] outline-none resize-none text-xs text-white font-medium bg-[#121626] transition-colors placeholder-slate-500"
            placeholder="Paste your raw resume work history, skills, or projects..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            disabled={loading}
          />
          <button 
            onClick={handleTextSubmit}
            disabled={loading || !resumeText.trim()}
            className="mt-3 w-full py-2.5 bg-[#B298E7] text-[#0c0e17] font-black rounded-xl hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-xs shadow-md cursor-pointer"
          >
            {loading ? 'Extracting Skills with AI...' : 'Extract Skills'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-[#F5B8D5]/10 text-[#F5B8D5] rounded-xl border border-[#F5B8D5]/30 font-semibold text-center text-xs">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
