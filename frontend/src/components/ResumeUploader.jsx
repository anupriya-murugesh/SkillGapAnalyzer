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
    <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gray-50 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-6 items-stretch">
        <div className="flex-1 flex flex-col justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-100 transition-colors bg-white">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Upload Resume File</h3>
          <p className="text-gray-500 mb-4 text-sm font-medium">Upload a .txt file to automatically extract your skills using AI.</p>
          
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
              className="px-6 py-2.5 bg-indigo-100 text-indigo-800 font-bold rounded-xl hover:bg-indigo-200 transition-colors pointer-events-none"
            >
              Select .txt File
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <span className="text-gray-400 font-bold uppercase text-sm px-2">OR</span>
        </div>

        <div className="flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Paste Resume Text</h3>
          <textarea
            className="w-full flex-1 min-h-[120px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm text-gray-700 font-medium bg-white transition-colors"
            placeholder="Paste your resume content here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            disabled={loading}
          />
          <button 
            onClick={handleTextSubmit}
            disabled={loading || !resumeText.trim()}
            className="mt-3 w-full py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm"
          >
            {loading ? 'Extracting AI Data...' : 'Extract Skills'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 font-semibold text-center text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
