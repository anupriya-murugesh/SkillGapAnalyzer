import { useState } from 'react';

export default function LandingPage({ onSignUp, onExplore }) {
  const [activeRole, setActiveRole] = useState('Senior Full-Stack');
  const [simRole, setSimRole] = useState('Data Scientist');
  const [simInput, setSimInput] = useState('');
  
  // Interactive Sandbox Data
  const rolesData = {
    'Senior Full-Stack': {
      verified: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      gaps: ['GraphQL', 'Redis', 'Docker'],
      critical: ['AWS', 'System Architecture']
    },
    'AI/ML Engineer': {
      verified: ['Python', 'TensorFlow', 'SQL'],
      gaps: ['PyTorch', 'MLOps', 'FastAPI'],
      critical: ['CUDA', 'Model Deployment']
    },
    'Cloud Architect': {
      verified: ['AWS', 'Terraform', 'Linux'],
      gaps: ['Kubernetes', 'CI/CD Pipelines'],
      critical: ['GCP', 'FinOps']
    }
  };

  const activeData = rolesData[activeRole];

  return (
    <div className="bg-[#FAFCF8] min-h-screen text-slate-900 font-sans selection:bg-emerald-200 selection:text-emerald-950">
      
      {/* Background soft ambient glow */}
      <div className="absolute top-0 left-0 w-full h-[900px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[55%] h-[55%] bg-emerald-100/50 blur-[130px] rounded-full"></div>
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-green-100/40 blur-[140px] rounded-full"></div>
      </div>

      {/* HERO SECTION */}
      <section className="pt-20 pb-16 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-14">
        
        {/* Left: Copy & CTAs */}
        <div className="flex-1 text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-emerald-300 bg-emerald-100 text-emerald-950 font-mono text-xs font-black uppercase tracking-wider mb-6 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 animate-pulse"></span>
            Bridge-IQ Engine v2.0
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-950 tracking-tight leading-[1.1] mb-6">
            The Intelligence Layer for Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700">
              Engineering Career.
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-700 font-medium leading-relaxed mb-8 max-w-xl">
            Ingest your artifacts, sync with real-time market data via JSearch, and eliminate your skill gaps with mathematical precision. Stop guessing what to learn next.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={onSignUp}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base rounded-xl shadow-lg shadow-emerald-700/25 transition-all duration-300 active:scale-95 cursor-pointer"
            >
              Start Free Analysis
            </button>
            <button 
              onClick={onExplore}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold text-base rounded-xl border-2 border-slate-300 hover:border-emerald-700 hover:bg-emerald-50 transition-all duration-300 shadow-xs cursor-pointer"
            >
              Explore Live Market
            </button>
          </div>
        </div>

        {/* Right: Interactive Sandbox */}
        <div className="flex-1 w-full lg:max-w-2xl relative z-10">
          <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 relative overflow-hidden group hover:border-emerald-600 transition-all duration-300">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-800 via-emerald-600 to-green-500"></div>
            
            <div className="flex justify-between items-center mb-6 border-b-2 border-slate-100 pb-4">
              <div className="flex space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                {['Senior Full-Stack', 'AI/ML Engineer', 'Cloud Architect'].map((role) => (
                  <button 
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                      activeRole === role 
                        ? 'bg-slate-950 text-white font-black shadow-sm' 
                        : 'text-slate-800 hover:text-slate-950 font-bold'
                    }`}
                  >
                    {role.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div className="hidden sm:block text-xs font-mono tracking-wider uppercase text-emerald-800 font-black">
                Live Sandbox
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-mono tracking-wider uppercase text-emerald-950 mb-2.5 flex items-center gap-2 font-black">
                  <span className="w-2.5 h-2.5 bg-emerald-700 rounded-full shadow-[0_0_8px_#047857]"></span> Verified by Proof-of-Work
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeData.verified.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-emerald-100 text-emerald-950 border-2 border-emerald-300 rounded-lg text-xs font-black shadow-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono tracking-wider uppercase text-slate-900 mb-2.5 flex items-center gap-2 font-black">
                  <span className="w-2.5 h-2.5 bg-green-600 rounded-full shadow-[0_0_8px_#16a34a]"></span> Market Delta Detected
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeData.gaps.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-green-100 text-green-950 border-2 border-green-300 rounded-lg text-xs font-black shadow-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono tracking-wider uppercase text-amber-950 mb-2.5 flex items-center gap-2 font-black">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full border border-amber-600"></span> Critical Disqualifiers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeData.critical.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-amber-100 text-amber-950 border-2 border-amber-300 rounded-lg text-xs font-black shadow-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t-2 border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">System Match Confidence</span>
              <span className="text-3xl font-black text-emerald-800 tracking-tight">
                {activeRole === 'Senior Full-Stack' ? '74%' : activeRole === 'AI/ML Engineer' ? '42%' : '61%'}
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* Marquee Ticker */}
      <section className="border-y-2 border-slate-200 bg-white py-4 overflow-hidden flex whitespace-nowrap">
        <div className="animate-marquee flex gap-12 items-center text-xs font-mono font-black tracking-widest uppercase text-slate-900">
          <span className="flex items-center gap-2"><span className="text-emerald-700 font-black text-sm">↑</span> TypeScript +42% Demand</span>
          <span className="flex items-center gap-2"><span className="text-emerald-700 font-black text-sm">↑</span> Docker required in 78% DevOps roles</span>
          <span className="flex items-center gap-2"><span className="text-red-600 font-black text-sm">↓</span> jQuery -89% YoY</span>
          <span className="flex items-center gap-2"><span className="text-emerald-700 font-black text-sm">↑</span> Gemini 2.0 API Knowledge +300%</span>
          <span className="flex items-center gap-2"><span className="text-emerald-700 font-black text-sm">↑</span> Rust replacing C++ in Systems (22%)</span>
          {/* Duplicate for infinite loop */}
          <span className="flex items-center gap-2"><span className="text-emerald-700 font-black text-sm">↑</span> TypeScript +42% Demand</span>
          <span className="flex items-center gap-2"><span className="text-emerald-700 font-black text-sm">↑</span> Docker required in 78% DevOps roles</span>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-950 text-xs font-black tracking-wider mb-3">
            <span>ENGINE ARCHITECTURE</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mb-3">The Bridge-IQ Engine</h2>
          <p className="text-slate-700 font-medium max-w-2xl text-lg">A suite of intelligent sub-systems designed to verify, align, and accelerate your engineering trajectory.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px]">
          
          {/* Card A: Large Span */}
          <div className="md:col-span-2 bg-white rounded-3xl border-2 border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-emerald-600 flex flex-col justify-between relative overflow-hidden group transition-all">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-slate-950 tracking-tight mb-2">Context-Aware Artifact Parsing</h3>
              <p className="text-sm font-medium text-slate-700 max-w-md">Gemini scans your resume and GitHub logs, extracting skills with semantic depth rather than naive keyword matching.</p>
            </div>
            
            <div className="relative z-10 mt-6 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-900 shadow-inner">
              <div className="flex gap-2 mb-2 font-black">
                <span className="text-emerald-800">Input:</span> "Architected microservices using Node & Postgres"
              </div>
              <div className="pl-4 border-l-4 border-emerald-700 space-y-1.5 font-bold">
                <div className="text-emerald-950">→ Extracted: System Design, Microservices (Verified)</div>
                <div className="text-emerald-950">→ Extracted: Node.js, PostgreSQL (Verified)</div>
                <div className="text-amber-900">→ Missing: Container Orchestration (e.g., Kubernetes)</div>
              </div>
            </div>
          </div>

          {/* Card B: Medium Span */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-emerald-600 flex flex-col justify-between relative overflow-hidden group transition-all">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-slate-950 tracking-tight mb-2">4-Layer Credibility</h3>
              <p className="text-sm font-medium text-slate-700">Eliminating self-reporting bias through verifiable artifact analysis.</p>
            </div>
            
            <div className="relative z-10 mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border-2 border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-black shadow-xs">1</div>
                <span className="text-sm font-bold text-slate-900">Artifact Parsing</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border-2 border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-black shadow-xs">2</div>
                <span className="text-sm font-bold text-slate-900">Micro-Assessments</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border-2 border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-black shadow-xs">3</div>
                <span className="text-sm font-bold text-slate-900">Calibration Matrix</span>
              </div>
            </div>
          </div>

          {/* Card C: Medium Span */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-emerald-600 flex flex-col justify-between relative overflow-hidden group transition-all">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-slate-950 tracking-tight mb-2">Live Market Alignment</h3>
              <p className="text-sm font-medium text-slate-700">Real-time API sync against JSearch global market data.</p>
            </div>
            
            <div className="relative z-10 mt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  <div className="w-9 h-9 rounded-full bg-emerald-800 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-xs">IN</div>
                  <div className="w-9 h-9 rounded-full bg-emerald-700 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-xs">GL</div>
                  <div className="w-9 h-9 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-xs">LI</div>
                </div>
                <div className="text-sm font-bold text-slate-900">+10,000 Active Roles</div>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="w-[78%] h-full bg-emerald-700"></div>
              </div>
              <div className="mt-2 text-[11px] font-black text-emerald-800 tracking-widest uppercase">78% Sync Completion</div>
            </div>
          </div>

          {/* Card D: Large Span */}
          <div className="md:col-span-2 bg-white rounded-3xl border-2 border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-emerald-600 flex flex-col justify-between relative overflow-hidden group transition-all">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between">
              <div className="max-w-sm">
                <h3 className="text-2xl font-bold text-slate-950 tracking-tight mb-2">Adaptive Learning Velocity</h3>
                <p className="text-sm font-medium text-slate-700 mb-6">4-week AI-generated roadmaps designed strictly to eliminate your unique market gaps. Drop the tutorials, build the proofs.</p>
                <button 
                  onClick={() => {
                    const el = document.getElementById('interactive-sim');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm font-black text-emerald-800 hover:text-emerald-900 uppercase tracking-widest flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Simulate Growth →
                </button>
              </div>
              <div className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 shadow-inner flex items-end gap-2.5 h-32">
                {[30, 45, 52, 68, 84, 91].map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-200 rounded-t-sm relative group h-full flex items-end">
                    <div 
                      className="w-full rounded-t-sm transition-all duration-500 bg-emerald-700 group-hover:bg-emerald-600"
                      style={{ height: `${h}%` }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Gap Simulator */}
      <section id="interactive-sim" className="py-20 bg-[#F4F8F3] border-t-2 border-slate-200 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mb-3">Try It Before You Sign Up</h2>
          <p className="text-slate-700 font-medium text-lg mb-8">Type a target role to see an instant simulated gap analysis.</p>
          
          <div className="flex gap-2 max-w-md mx-auto mb-8">
            <input 
              type="text" 
              value={simInput}
              onChange={(e) => setSimInput(e.target.value)}
              placeholder="e.g. Data Engineer"
              className="flex-1 bg-white border-2 border-slate-300 text-slate-950 font-bold text-base rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-700 transition-colors placeholder:text-slate-400 shadow-sm"
            />
            <button 
              onClick={() => {
                if(simInput.trim()) setSimRole(simInput.trim());
              }}
              className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
            >
              Simulate
            </button>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-xl">
            <div className="text-xs font-mono tracking-widest uppercase text-slate-700 mb-5 flex items-center justify-between font-black">
              <span>Simulated Profile: <strong className="text-slate-950 font-black">{simRole}</strong></span>
              <span className="text-emerald-800 font-black">Bridge-IQ Matrix</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                <span className="text-sm font-bold text-slate-900">Required Skills</span>
                <span className="text-xs font-black text-emerald-950 bg-emerald-100 px-3 py-1 rounded-md border-2 border-emerald-300">High Confidence Matches</span>
              </div>
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                <span className="text-sm font-bold text-slate-900">Trending Frameworks</span>
                <span className="text-xs font-black text-green-950 bg-green-100 px-3 py-1 rounded-md border-2 border-green-300">Market Delta</span>
              </div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-bold text-slate-900">Architecture / Leadership</span>
                <span className="text-xs font-black text-amber-950 bg-amber-100 px-3 py-1 rounded-md border-2 border-amber-300">Critical Focus</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 max-w-5xl mx-auto text-center border-t-2 border-slate-200 mt-12">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mb-6">Ready to quantify your worth?</h2>
        <button 
          onClick={onSignUp}
          className="px-10 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base rounded-xl shadow-lg shadow-emerald-700/30 transition-all transform hover:-translate-y-0.5 mb-8 cursor-pointer"
        >
          Run Your Free Analysis
        </button>
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-black tracking-widest uppercase text-slate-800">
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-emerald-700 rounded-full"></span> Zero Spam</span>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-emerald-700 rounded-full"></span> Instant Verification</span>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-emerald-700 rounded-full"></span> Privacy First</span>
        </div>
      </section>
    </div>
  );
}
