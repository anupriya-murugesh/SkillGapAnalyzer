import { useState } from 'react';

export default function LearningRoadmap({ roadmap }) {
  const [expandedWeek, setExpandedWeek] = useState(1);

  if (!roadmap || roadmap.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
          <span className="text-3xl">🚀</span> Your 4-Week Learning Roadmap
        </h2>
        <button 
          onClick={() => window.print()}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors"
        >
          <span>📥</span> Save PDF
        </button>
      </div>

      <div className="space-y-4">
        {roadmap.map((week, idx) => {
          const isExpanded = expandedWeek === week.week;
          return (
            <div key={idx} className={`border-2 rounded-2xl overflow-hidden transition-colors ${isExpanded ? 'border-indigo-500 shadow-md' : 'border-gray-200 hover:border-indigo-300'}`}>
              <button 
                onClick={() => setExpandedWeek(isExpanded ? null : week.week)}
                className={`w-full flex justify-between items-center p-5 text-left transition-colors ${isExpanded ? 'bg-indigo-50/50' : 'bg-white'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    W{week.week}
                  </div>
                  <span className="font-bold text-lg text-gray-900">{week.focus_area}</span>
                </div>
                <span className={`transform transition-transform text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {isExpanded && (
                <div className="p-6 bg-white border-t border-gray-100 grid md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <span className="text-blue-500 text-lg">📚</span> Topics to Master
                    </h4>
                    <ul className="space-y-2 mb-6">
                      {week.topics.map((topic, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2 text-gray-700 font-medium text-sm">
                          <span className="text-green-500 mt-0.5 font-bold">✓</span> {topic}
                        </li>
                      ))}
                    </ul>

                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <span className="text-purple-500 text-lg">🔗</span> Recommended Resources
                    </h4>
                    <ul className="space-y-2">
                      {week.recommended_resources.map((res, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2 text-gray-700 font-medium text-sm">
                          <span className="text-gray-400 mt-0.5 font-black">•</span> {res}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 h-fit shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <span className="text-yellow-500 text-lg">⚒️</span> Hands-On Project
                    </h4>
                    <p className="text-gray-700 text-sm font-semibold leading-relaxed">
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
