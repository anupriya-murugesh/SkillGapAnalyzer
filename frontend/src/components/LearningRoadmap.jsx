import { useState } from 'react';

export default function LearningRoadmap({ roadmap }) {
  const [expandedWeek, setExpandedWeek] = useState(1);

  if (!roadmap || roadmap.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-950 flex items-center gap-3">
          <span className="text-3xl">🚀</span> Your 4-Week Learning Roadmap
        </h2>
        <button 
          onClick={() => window.print()}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white text-slate-900 border-2 border-slate-300 font-bold text-xs rounded-xl hover:border-emerald-600 transition-colors cursor-pointer"
        >
          <span>📥</span> Save PDF
        </button>
      </div>

      <div className="space-y-4">
        {roadmap.map((week, idx) => {
          const isExpanded = expandedWeek === week.week;
          return (
            <div key={idx} className={`border-2 rounded-2xl overflow-hidden transition-all ${isExpanded ? 'border-emerald-600 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
              <button 
                onClick={() => setExpandedWeek(isExpanded ? null : week.week)}
                className={`w-full flex justify-between items-center p-5 text-left transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : 'bg-white'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isExpanded ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                    W{week.week}
                  </div>
                  <span className="font-black text-lg text-slate-950">{week.focus_area}</span>
                </div>
                <span className={`transform transition-transform text-slate-500 ${isExpanded ? 'rotate-180 text-emerald-700' : ''}`}>▼</span>
              </button>

              {isExpanded && (
                <div className="p-6 bg-slate-50 border-t-2 border-slate-200 grid md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <h4 className="font-black text-emerald-950 mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <span>📚</span> Topics to Master
                    </h4>
                    <ul className="space-y-2.5 mb-6">
                      {week.topics.map((topic, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2.5 text-slate-800 font-medium text-sm">
                          <span className="text-emerald-700 mt-0.5 font-bold">✓</span> {topic}
                        </li>
                      ))}
                    </ul>

                    <h4 className="font-black text-slate-900 mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <span>🔗</span> Recommended Resources
                    </h4>
                    <ul className="space-y-2">
                      {week.recommended_resources.map((res, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2.5 text-slate-700 font-medium text-sm">
                          <span className="text-emerald-700 mt-0.5 font-black">•</span> {res}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 h-fit shadow-xs">
                    <h4 className="font-black text-emerald-800 mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <span>⚒️</span> Hands-On Capstone Project
                    </h4>
                    <p className="text-slate-900 text-sm font-medium leading-relaxed">
                      {week.hands_on_project}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
