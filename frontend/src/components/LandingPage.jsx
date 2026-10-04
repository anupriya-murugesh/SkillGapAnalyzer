export default function LandingPage({ onSignUp, onExplore }) {
  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Powered by Gemini 2.0 Flash
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-6">
          Close Your Career Skill Gap with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Real-Time Market Intelligence</span>
        </h1>
        <p className="text-xl md:text-2xl font-medium text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Upload your resume, sync live job market postings from LinkedIn & Indeed, and receive AI-driven gap math with week-by-week study roadmaps.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onSignUp}
            className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white font-black text-lg rounded-2xl shadow-xl hover:bg-gray-800 hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            Get Started Free
          </button>
          <button 
            onClick={onExplore}
            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 font-black text-lg rounded-2xl shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            Explore Live Market
          </button>
        </div>
        
        {/* Live Metrics Preview Bar */}
        <div className="mt-14 flex flex-wrap justify-center gap-6 sm:gap-12 opacity-80 border-t border-gray-200 pt-10">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-gray-900">88%</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Average Match Accuracy</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-gray-900 flex items-center gap-2"><span className="text-green-500 text-xl">●</span> Live</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Real-Time JSearch Data</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-gray-900">Zero</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Data Retention Required</span>
          </div>
        </div>
      </section>

      {/* How It Works Flow */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-16">The 4-Step Process</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Automated Resume Parsing', desc: 'Extracts hard & soft skills into interactive tags.' },
              { step: 2, title: 'Live Job Aggregation', desc: 'Scans active global market roles across LinkedIn/Indeed.' },
              { step: 3, title: 'Semantic AI Gap Analysis', desc: 'Calculates exact match percentage & missing qualifications.' },
              { step: 4, title: 'Personal 4-Week AI Roadmap', desc: 'Generates step-by-step learning paths & projects.' }
            ].map(item => (
              <div key={item.step} className="relative flex flex-col items-center text-center p-6 group">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-black mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 font-medium">{item.desc}</p>
                {item.step !== 4 && (
                  <div className="hidden md:block absolute top-14 left-[65%] w-[70%] h-0.5 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="features">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-10 rounded-3xl border border-gray-200 hover:shadow-lg transition-shadow group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">📄</div>
            <h3 className="text-2xl font-black text-gray-900 mb-4">Resume Intelligence</h3>
            <p className="text-gray-600 font-medium text-lg leading-relaxed">Instantly convert PDFs into structured skill graphs using local fallback parsers and Gemini LLMs.</p>
          </div>
          <div className="bg-gray-50 p-10 rounded-3xl border border-gray-200 hover:shadow-lg transition-shadow group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">📊</div>
            <h3 className="text-2xl font-black text-gray-900 mb-4">Market Gap Math</h3>
            <p className="text-gray-600 font-medium text-lg leading-relaxed">Quantify your employability with precise match percentages derived directly from live listings.</p>
          </div>
          <div className="bg-gray-50 p-10 rounded-3xl border border-gray-200 hover:shadow-lg transition-shadow group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">⭐</div>
            <h3 className="text-2xl font-black text-gray-900 mb-4">Skill Wishlist</h3>
            <p className="text-gray-600 font-medium text-lg leading-relaxed">Bookmark roles directly from the job aggregator to build a personalized career target list.</p>
          </div>
          <div className="bg-gray-50 p-10 rounded-3xl border border-gray-200 hover:shadow-lg transition-shadow group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">📈</div>
            <h3 className="text-2xl font-black text-gray-900 mb-4">Progress Dashboard</h3>
            <p className="text-gray-600 font-medium text-lg leading-relaxed">Track every analysis and seamlessly restore learning roadmaps via your persistent dashboard.</p>
          </div>
        </div>
      </section>

      {/* Trust & Impact Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center pb-12">
        <div className="bg-gray-900 text-white rounded-3xl p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/3"></div>
          <h2 className="text-3xl font-black mb-6 relative z-10">Privacy-First Architecture</h2>
          <p className="text-gray-300 text-lg font-medium max-w-3xl mx-auto relative z-10 leading-relaxed">
            We prioritize your data. Resumes are processed locally where possible, and our infrastructure includes instant local fallbacks to ensure 100% uptime without permanently storing your PII.
          </p>
        </div>
      </section>
    </div>
  );
}
