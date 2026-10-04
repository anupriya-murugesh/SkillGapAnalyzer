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
    <div className="animate-in fade-in duration-700 bg-[#FAFAFA] min-h-screen text-zinc-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Background noise/glows */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-multiply"></div>
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full mix-blend-multiply"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDI0VjBIMjRWMjRIMFpNMSAyM0gyM1YxSDFWMjNaIiBmaWxsPSIjRTZFNkU2IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz4KPC9zdmc+')] opacity-50"></div>
      </div>

      {/* HERO SECTION */}
      <section className="pt-24 pb-20 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left: Copy & CTAs */}
        <div className="flex-1 text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200/60 bg-white/60 backdrop-blur-sm text-zinc-600 font-mono text-[10px] uppercase tracking-widest mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Bridge-IQ Engine v2.0
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-zinc-900 tracking-tighter leading-[1.1] mb-6">
            The Intelligence Layer for Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Engineering Career.</span>
          </h1>
          <p className="text-lg lg:text-xl text-zinc-600 font-medium leading-relaxed mb-10 max-w-xl">
            Ingest your artifacts, sync with real-time market data via JSearch, and eliminate your skill gaps with mathematical precision. Stop guessing what to learn next.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={onSignUp}
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white font-bold text-sm rounded-xl shadow-[0_0_40px_-10px_rgba(79,70,229,0.3)] hover:bg-zinc-800 hover:shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] transition-all duration-300"
            >
              Start Free Analysis
            </button>
            <button 
              onClick={onExplore}
              className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-900 font-bold text-sm rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-300 shadow-sm"
            >
              Explore Live Market
            </button>
          </div>
        </div>

        {/* Right: Interactive Sandbox */}
        <div className="flex-1 w-full lg:max-w-2xl relative z-10">
          <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/60 rounded-3xl shadow-2xl p-6 relative overflow-hidden group hover:border-zinc-300/80 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400"></div>
            
            <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-4">
              <div className="flex space-x-1 bg-zinc-100/80 p-1 rounded-lg">
                {['Senior Full-Stack', 'AI/ML Engineer', 'Cloud Architect'].map((role) => (
                  <button 
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeRole === role ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    {role.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div className="hidden sm:block text-[10px] font-mono tracking-widest uppercase text-zinc-400">Live Sandbox</div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-mono tracking-widest uppercase text-emerald-600 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Verified by Proof-of-Work
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeData.verified.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md text-xs font-bold shadow-sm">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-mono tracking-widest uppercase text-amber-600 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Market Delta Detected
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeData.gaps.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-md text-xs font-bold shadow-sm">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-mono tracking-widest uppercase text-red-600 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Critical Disqualifiers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeData.critical.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200/60 rounded-md text-xs font-bold shadow-sm">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500">System Match Confidence</span>
              <span className="text-xl font-black text-zinc-900 tracking-tighter">
                {activeRole === 'Senior Full-Stack' ? '74%' : activeRole === 'AI/ML Engineer' ? '42%' : '61%'}
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* Marquee Ticker */}
      <section className="border-y border-zinc-200/60 bg-white/50 backdrop-blur-md py-4 overflow-hidden flex whitespace-nowrap">
        <div className="animate-marquee flex gap-12 items-center text-xs font-mono font-bold tracking-widest uppercase text-zinc-500">
          <span className="flex items-center gap-2"><span className="text-emerald-500">↑</span> TypeScript +42% Demand</span>
          <span className="flex items-center gap-2"><span className="text-emerald-500">↑</span> Docker required in 78% DevOps roles</span>
          <span className="flex items-center gap-2"><span className="text-red-500">↓</span> jQuery -89% YoY</span>
          <span className="flex items-center gap-2"><span className="text-emerald-500">↑</span> Gemini 2.0 API Knowledge +300%</span>
          <span className="flex items-center gap-2"><span className="text-emerald-500">↑</span> Rust replacing C++ in Systems (22%)</span>
          {/* Duplicate for infinite loop */}
          <span className="flex items-center gap-2"><span className="text-emerald-500">↑</span> TypeScript +42% Demand</span>
          <span className="flex items-center gap-2"><span className="text-emerald-500">↑</span> Docker required in 78% DevOps roles</span>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="py-24 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
        <div className="mb-16">
          <h2 className="text-3xl lg:text-4xl font-black text-zinc-900 tracking-tight mb-4">The Bridge-IQ Engine</h2>
          <p className="text-zinc-500 font-medium max-w-2xl text-lg">A suite of intelligent sub-systems designed to verify, align, and accelerate your engineering trajectory.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px]">
          
          {/* Card A: Large Span */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-zinc-200/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-100 transition-colors"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-2">Context-Aware Artifact Parsing</h3>
              <p className="text-sm font-medium text-zinc-500 max-w-md">Gemini 2.0 scans your resume and GitHub logs, extracting skills with semantic depth rather than naive keyword matching.</p>
            </div>
            
            <div className="relative z-10 mt-6 bg-zinc-50 border border-zinc-200/60 rounded-xl p-4 font-mono text-[10px] text-zinc-600 shadow-inner">
              <div className="flex gap-2 mb-2">
                <span className="text-indigo-500">Input:</span> "Architected microservices using Node & Postgres"
              </div>
              <div className="pl-4 border-l border-zinc-300">
                <div className="text-emerald-600">→ Extracted: System Design, Microservices (Verified)</div>
                <div className="text-emerald-600">→ Extracted: Node.js, PostgreSQL (Verified)</div>
                <div className="text-zinc-400">→ Missing: Container Orchestration (e.g., Kubernetes)</div>
              </div>
            </div>
          </div>

          {/* Card B: Medium Span */}
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight mb-2">4-Layer Credibility</h3>
              <p className="text-sm font-medium text-zinc-400">Eliminating self-reporting bias through verifiable artifact analysis.</p>
            </div>
            
            <div className="relative z-10 mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-700/50">
                <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">1</div>
                <span className="text-xs font-bold text-zinc-300">Artifact Parsing</span>
              </div>
              <div className="flex items-center gap-3 bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-700/50 opacity-80">
                <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">2</div>
                <span className="text-xs font-bold text-zinc-300">Micro-Assessments</span>
              </div>
              <div className="flex items-center gap-3 bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-700/50 opacity-60">
                <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">3</div>
                <span className="text-xs font-bold text-zinc-300">Calibration Matrix</span>
              </div>
            </div>
          </div>

          {/* Card C: Medium Span */}
          <div className="bg-white rounded-3xl border border-zinc-200/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-2">Live Market Alignment</h3>
              <p className="text-sm font-medium text-zinc-500">Real-time API sync against JSearch global market data.</p>
            </div>
            
            <div className="relative z-10 mt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700">IN</div>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-700">GL</div>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700">LI</div>
                </div>
                <div className="text-xs font-bold text-zinc-900">+10k Active Roles</div>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div className="w-[78%] h-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              </div>
              <div className="mt-2 text-[10px] font-bold text-zinc-400 tracking-widest uppercase">78% Sync Completion</div>
            </div>
          </div>

          {/* Card D: Large Span */}
          <div className="md:col-span-2 bg-gradient-to-br from-zinc-50 to-white rounded-3xl border border-zinc-200/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between">
              <div className="max-w-sm">
                <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-2">Adaptive Learning Velocity</h3>
                <p className="text-sm font-medium text-zinc-500 mb-6">4-week AI-generated roadmaps designed strictly to eliminate your unique market gaps. Drop the tutorials, build the proofs.</p>
                <button 
                  onClick={() => window.location.href = '#interactive-sim'}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 transition-colors"
                >
                  Simulate Growth →
                </button>
              </div>
              <div className="flex-1 bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm flex items-end gap-2 h-32">
                {[30, 45, 52, 68, 84, 91].map((h, i) => (
                  <div key={i} className="flex-1 bg-indigo-50 rounded-t-sm relative group">
                    <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-sm transition-all duration-500" style={{ height: `${h}%` }}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Gap Simulator */}
      <section id="interactive-sim" className="py-24 bg-zinc-900 border-t border-zinc-800 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-4">Try It Before You Sign Up</h2>
          <p className="text-zinc-400 font-medium mb-10">Type a target role to see an instant simulated gap analysis.</p>
          
          <div className="flex gap-2 max-w-md mx-auto mb-8">
            <input 
              type="text" 
              value={simInput}
              onChange={(e) => setSimInput(e.target.value)}
              placeholder="e.g. Data Engineer"
              className="flex-1 bg-zinc-800/50 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
            />
            <button 
              onClick={() => {
                if(simInput.trim()) setSimRole(simInput.trim());
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors"
            >
              Simulate
            </button>
          </div>

          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-6 text-left backdrop-blur-sm shadow-xl">
            <div className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 mb-4">Simulated Profile: <span className="text-white">{simRole}</span></div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-700/50 pb-2">
                <span className="text-sm font-bold text-zinc-300">Required Skills</span>
                <span className="text-xs font-medium text-emerald-400">High Confidence Matches</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-700/50 pb-2">
                <span className="text-sm font-bold text-zinc-300">Trending Frameworks</span>
                <span className="text-xs font-medium text-amber-400">Market Delta</span>
              </div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-bold text-zinc-300">Soft Skills / Architecture</span>
                <span className="text-xs font-medium text-red-400">Critical Gap</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 max-w-5xl mx-auto text-center border-t border-zinc-200/60 mt-12">
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-6">Ready to quantify your worth?</h2>
        <button 
          onClick={onSignUp}
          className="px-10 py-4 bg-zinc-900 text-white font-bold text-sm rounded-xl shadow-lg hover:bg-zinc-800 hover:shadow-xl transition-all transform hover:-translate-y-0.5 mb-8"
        >
          Run Your Free Analysis
        </button>
        <div className="flex items-center justify-center gap-6 text-[10px] font-bold tracking-widest uppercase text-zinc-400">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Zero Spam</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Instant Verification</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Privacy First</span>
        </div>
      </section>
    </div>
  );
}
