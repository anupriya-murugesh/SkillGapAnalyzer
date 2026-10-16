import { useState } from 'react';

export default function LearningRoadmap({ roadmap }) {
  const [expandedWeek, setExpandedWeek] = useState(1);

  if (!roadmap || roadmap.length === 0) return null;

  return (
    <div className="bg-[#121626] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <span className="text-3xl">🚀</span> Your 4-Week Learning Roadmap
        </h2>
        <button 
          onClick={() => window.print()}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#B8E3E9]/15 text-[#B8E3E9] border border-[#B8E3E9]/30 font-bold text-xs rounded-xl hover:bg-[#B8E3E9]/25 transition-colors cursor-pointer"
        >
          <span>📥</span> Save PDF
        </button>
      </div>

      <div className="space-y-4">
        {roadmap.map((week, idx) => {
          const isExpanded = expandedWeek === week.week;
          return (
            <div key={idx} className={`border-2 rounded-2xl overflow-hidden transition-all ${isExpanded ? 'border-[#B298E7] shadow-[0_0_20px_rgba(178,152,231,0.15)]' : 'border-slate-800 hover:border-slate-700'}`}>
              <button 
                onClick={() => setExpandedWeek(isExpanded ? null : week.week)}
                className={`w-full flex justify-between items-center p-5 text-left transition-colors cursor-pointer ${isExpanded ? 'bg-[#161c30]' : 'bg-[#0c0e17]'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isExpanded ? 'bg-[#B298E7] text-[#0c0e17]' : 'bg-slate-800 text-slate-400'}`}>
                    W{week.week}
                  </div>
                  <span className="font-bold text-lg text-white">{week.focus_area}</span>
                </div>
                <span className={`transform transition-transform text-slate-400 ${isExpanded ? 'rotate-180 text-[#B298E7]' : ''}`}>▼</span>
              </button>

              {isExpanded && (
                <div className="p-6 bg-[#0c0e17] border-t border-slate-800 grid md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <h4 className="font-black text-[#B8E3E9] mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <span>📚</span> Topics to Master
                    </h4>
                    <ul className="space-y-2.5 mb-6">
                      {week.topics.map((topic, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2.5 text-slate-300 font-medium text-sm">
                          <span className="text-[#B8E3E9] mt-0.5 font-bold">✓</span> {topic}
                        </li>
                      ))}
                    </ul>

                    <h4 className="font-black text-[#B298E7] mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <span>🔗</span> Recommended Resources
                    </h4>
                    <ul className="space-y-2">
                      {week.recommended_resources.map((res, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2.5 text-slate-300 font-medium text-sm">
                          <span className="text-[#B298E7] mt-0.5 font-black">•</span> {res}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-[#161c30] p-6 rounded-2xl border border-slate-700/80 h-fit shadow-md">
                    <h4 className="font-black text-[#F5B8D5] mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <span>⚒️</span> Hands-On Capstone Project
                    </h4>
                    <p className="text-slate-200 text-sm font-medium leading-relaxed">
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
