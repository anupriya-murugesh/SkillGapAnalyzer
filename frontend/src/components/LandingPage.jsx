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
    <div className="animate-in fade-in duration-700 bg-[#0c0e17] min-h-screen text-slate-100 font-sans selection:bg-[#B298E7]/30 selection:text-white">
      
      {/* Background glow spheres with the 4-color combo */}
      <div className="absolute top-0 left-0 w-full h-[900px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-[#B298E7]/15 blur-[140px] rounded-full"></div>
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-[#B8E3E9]/15 blur-[140px] rounded-full"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-[#F5B8D5]/10 blur-[150px] rounded-full"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0f_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0f_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* HERO SECTION */}
      <section className="pt-24 pb-20 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left: Copy & CTAs */}
        <div className="flex-1 text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#B298E7]/30 bg-[#B298E7]/10 backdrop-blur-md text-[#B298E7] font-mono text-[11px] font-bold uppercase tracking-widest mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#B8E3E9] animate-pulse"></span>
            Bridge-IQ Engine v2.0
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[1.1] mb-6">
            The Intelligence Layer for Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9]">Engineering Career.</span>
          </h1>
          <p className="text-lg lg:text-xl text-slate-400 font-medium leading-relaxed mb-10 max-w-xl">
            Ingest your artifacts, sync with real-time market data via JSearch, and eliminate your skill gaps with mathematical precision. Stop guessing what to learn next.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={onSignUp}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] text-[#0c0e17] font-black text-sm rounded-xl shadow-[0_0_35px_rgba(178,152,231,0.35)] hover:shadow-[0_0_45px_rgba(184,227,233,0.5)] hover:brightness-105 transition-all duration-300 active:scale-95 cursor-pointer"
            >
              Start Free Analysis
            </button>
            <button 
              onClick={onExplore}
              className="w-full sm:w-auto px-8 py-4 bg-[#121626] text-white font-bold text-sm rounded-xl border border-[#B8E3E9]/30 hover:border-[#B8E3E9] hover:bg-[#161c30] transition-all duration-300 shadow-sm cursor-pointer"
            >
              Explore Live Market
            </button>
          </div>
        </div>

        {/* Right: Interactive Sandbox */}
        <div className="flex-1 w-full lg:max-w-2xl relative z-10">
          <div className="bg-[#121626]/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden group hover:border-[#B298E7]/40 transition-all duration-300">
            {/* Top 4-color gradient bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9]"></div>
            
            <div className="flex justify-between items-center mb-8 border-b border-slate-800/80 pb-4">
              <div className="flex space-x-1.5 bg-[#0c0e17] p-1.5 rounded-xl border border-slate-800">
                {['Senior Full-Stack', 'AI/ML Engineer', 'Cloud Architect'].map((role) => (
                  <button 
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeRole === role 
                        ? 'bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {role.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div className="hidden sm:block text-[10px] font-mono tracking-widest uppercase text-[#B8E3E9] font-bold">Live Sandbox</div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-[11px] font-mono tracking-widest uppercase text-[#B8E3E9] mb-3 flex items-center gap-2 font-bold">
                  <span className="w-2 h-2 bg-[#B8E3E9] rounded-full shadow-[0_0_8px_#B8E3E9]"></span> Verified by Proof-of-Work
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeData.verified.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-[#B8E3E9]/15 text-[#B8E3E9] border border-[#B8E3E9]/30 rounded-lg text-xs font-bold shadow-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-mono tracking-widest uppercase text-[#B298E7] mb-3 flex items-center gap-2 font-bold">
                  <span className="w-2 h-2 bg-[#B298E7] rounded-full shadow-[0_0_8px_#B298E7]"></span> Market Delta Detected
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeData.gaps.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-[#B298E7]/15 text-[#B298E7] border border-[#B298E7]/30 rounded-lg text-xs font-bold shadow-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-mono tracking-widest uppercase text-[#F5B8D5] mb-3 flex items-center gap-2 font-bold">
                  <span className="w-2 h-2 bg-[#F5B8D5] rounded-full shadow-[0_0_8px_#F5B8D5]"></span> Critical Disqualifiers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeData.critical.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-[#F5B8D5]/15 text-[#F5B8D5] border border-[#F5B8D5]/30 rounded-lg text-xs font-bold shadow-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">System Match Confidence</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] tracking-tighter">
                {activeRole === 'Senior Full-Stack' ? '74%' : activeRole === 'AI/ML Engineer' ? '42%' : '61%'}
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* Marquee Ticker */}
      <section className="border-y border-slate-800 bg-[#0c0e17]/80 backdrop-blur-md py-4 overflow-hidden flex whitespace-nowrap">
        <div className="animate-marquee flex gap-12 items-center text-xs font-mono font-bold tracking-widest uppercase text-slate-400">
          <span className="flex items-center gap-2"><span className="text-[#B8E3E9] font-black">↑</span> TypeScript +42% Demand</span>
          <span className="flex items-center gap-2"><span className="text-[#B8E3E9] font-black">↑</span> Docker required in 78% DevOps roles</span>
          <span className="flex items-center gap-2"><span className="text-[#F5B8D5] font-black">↓</span> jQuery -89% YoY</span>
          <span className="flex items-center gap-2"><span className="text-[#B298E7] font-black">↑</span> Gemini 2.0 API Knowledge +300%</span>
          <span className="flex items-center gap-2"><span className="text-[#F9BEDD] font-black">↑</span> Rust replacing C++ in Systems (22%)</span>
          {/* Duplicate for infinite loop */}
          <span className="flex items-center gap-2"><span className="text-[#B8E3E9] font-black">↑</span> TypeScript +42% Demand</span>
          <span className="flex items-center gap-2"><span className="text-[#B8E3E9] font-black">↑</span> Docker required in 78% DevOps roles</span>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="py-24 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B298E7]/10 border border-[#B298E7]/20 text-[#B298E7] text-xs font-bold tracking-wider mb-3">
            <span>ENGINE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-4">The Bridge-IQ Engine</h2>
          <p className="text-slate-400 font-medium max-w-2xl text-lg">A suite of intelligent sub-systems designed to verify, align, and accelerate your engineering trajectory.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px]">
          
          {/* Card A: Large Span */}
          <div className="md:col-span-2 bg-[#121626] rounded-3xl border border-slate-800 p-8 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#B298E7]/30 transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#B298E7]/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-[#B298E7]/20 transition-colors pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight mb-2">Context-Aware Artifact Parsing</h3>
              <p className="text-sm font-medium text-slate-400 max-w-md">Gemini 2.0 scans your resume and GitHub logs, extracting skills with semantic depth rather than naive keyword matching.</p>
            </div>
            
            <div className="relative z-10 mt-6 bg-[#0c0e17] border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 shadow-inner">
              <div className="flex gap-2 mb-2">
                <span className="text-[#B298E7] font-bold">Input:</span> "Architected microservices using Node & Postgres"
              </div>
              <div className="pl-4 border-l border-slate-700 space-y-1">
                <div className="text-[#B8E3E9] font-semibold">→ Extracted: System Design, Microservices (Verified)</div>
                <div className="text-[#B8E3E9] font-semibold">→ Extracted: Node.js, PostgreSQL (Verified)</div>
                <div className="text-[#F5B8D5] font-semibold">→ Missing: Container Orchestration (e.g., Kubernetes)</div>
              </div>
            </div>
          </div>

          {/* Card B: Medium Span */}
          <div className="bg-[#121626] rounded-3xl border border-slate-800 p-8 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#B8E3E9]/30 transition-all">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight mb-2">4-Layer Credibility</h3>
              <p className="text-sm font-medium text-slate-400">Eliminating self-reporting bias through verifiable artifact analysis.</p>
            </div>
            
            <div className="relative z-10 mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-[#0c0e17] p-3 rounded-xl border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-[#B298E7]/20 border border-[#B298E7]/40 flex items-center justify-center text-xs font-black text-[#B298E7]">1</div>
                <span className="text-xs font-bold text-slate-200">Artifact Parsing</span>
              </div>
              <div className="flex items-center gap-3 bg-[#0c0e17] p-3 rounded-xl border border-slate-800 opacity-90">
                <div className="w-7 h-7 rounded-lg bg-[#B8E3E9]/20 border border-[#B8E3E9]/40 flex items-center justify-center text-xs font-black text-[#B8E3E9]">2</div>
                <span className="text-xs font-bold text-slate-200">Micro-Assessments</span>
              </div>
              <div className="flex items-center gap-3 bg-[#0c0e17] p-3 rounded-xl border border-slate-800 opacity-80">
                <div className="w-7 h-7 rounded-lg bg-[#F5B8D5]/20 border border-[#F5B8D5]/40 flex items-center justify-center text-xs font-black text-[#F5B8D5]">3</div>
                <span className="text-xs font-bold text-slate-200">Calibration Matrix</span>
              </div>
            </div>
          </div>

          {/* Card C: Medium Span */}
          <div className="bg-[#121626] rounded-3xl border border-slate-800 p-8 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#F5B8D5]/30 transition-all">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight mb-2">Live Market Alignment</h3>
              <p className="text-sm font-medium text-slate-400">Real-time API sync against JSearch global market data.</p>
            </div>
            
            <div className="relative z-10 mt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#B298E7]/30 border-2 border-[#121626] flex items-center justify-center text-[10px] font-black text-[#B298E7]">IN</div>
                  <div className="w-8 h-8 rounded-full bg-[#B8E3E9]/30 border-2 border-[#121626] flex items-center justify-center text-[10px] font-black text-[#B8E3E9]">GL</div>
                  <div className="w-8 h-8 rounded-full bg-[#F5B8D5]/30 border-2 border-[#121626] flex items-center justify-center text-[10px] font-black text-[#F5B8D5]">LI</div>
                </div>
                <div className="text-xs font-bold text-slate-200">+10k Active Roles</div>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[78%] h-full bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9]"></div>
              </div>
              <div className="mt-2 text-[10px] font-bold text-[#B8E3E9] tracking-widest uppercase">78% Sync Completion</div>
            </div>
          </div>

          {/* Card D: Large Span */}
          <div className="md:col-span-2 bg-[#121626] rounded-3xl border border-slate-800 p-8 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#F9BEDD]/30 transition-all">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between">
              <div className="max-w-sm">
                <h3 className="text-xl font-black text-white tracking-tight mb-2">Adaptive Learning Velocity</h3>
                <p className="text-sm font-medium text-slate-400 mb-6">4-week AI-generated roadmaps designed strictly to eliminate your unique market gaps. Drop the tutorials, build the proofs.</p>
                <button 
                  onClick={() => {
                    const el = document.getElementById('interactive-sim');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-black text-[#B298E7] hover:text-[#B8E3E9] uppercase tracking-widest flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Simulate Growth →
                </button>
              </div>
              <div className="flex-1 bg-[#0c0e17] border border-slate-800 rounded-2xl p-5 shadow-inner flex items-end gap-2.5 h-32">
                {[30, 45, 52, 68, 84, 91].map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-800 rounded-t-sm relative group h-full flex items-end">
                    <div 
                      className="w-full rounded-t-sm transition-all duration-500 bg-gradient-to-t from-[#B298E7] to-[#B8E3E9] group-hover:to-[#F5B8D5]"
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
      <section id="interactive-sim" className="py-24 bg-[#0a0d16] border-t border-slate-800 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#B298E7]/10 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-4">Try It Before You Sign Up</h2>
          <p className="text-slate-400 font-medium mb-10">Type a target role to see an instant simulated gap analysis.</p>
          
          <div className="flex gap-2 max-w-md mx-auto mb-8">
            <input 
              type="text" 
              value={simInput}
              onChange={(e) => setSimInput(e.target.value)}
              placeholder="e.g. Data Engineer"
              className="flex-1 bg-[#121626] border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B298E7] transition-colors placeholder:text-slate-500"
            />
            <button 
              onClick={() => {
                if(simInput.trim()) setSimRole(simInput.trim());
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black text-sm rounded-xl transition-all hover:brightness-105 active:scale-95 cursor-pointer shadow-md"
            >
              Simulate
            </button>
          </div>

          <div className="bg-[#121626]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-left backdrop-blur-sm shadow-2xl">
            <div className="text-[11px] font-mono tracking-widest uppercase text-slate-400 mb-5 flex items-center justify-between">
              <span>Simulated Profile: <strong className="text-white font-bold">{simRole}</strong></span>
              <span className="text-[#B8E3E9] font-bold">Bridge-IQ Matrix</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-sm font-bold text-slate-300">Required Skills</span>
                <span className="text-xs font-bold text-[#B8E3E9] bg-[#B8E3E9]/10 px-2.5 py-1 rounded-md border border-[#B8E3E9]/30">High Confidence Matches</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-sm font-bold text-slate-300">Trending Frameworks</span>
                <span className="text-xs font-bold text-[#B298E7] bg-[#B298E7]/10 px-2.5 py-1 rounded-md border border-[#B298E7]/30">Market Delta</span>
              </div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-bold text-slate-300">Architecture / Leadership</span>
                <span className="text-xs font-bold text-[#F5B8D5] bg-[#F5B8D5]/10 px-2.5 py-1 rounded-md border border-[#F5B8D5]/30">Critical Focus</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 max-w-5xl mx-auto text-center border-t border-slate-800 mt-12">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-6">Ready to quantify your worth?</h2>
        <button 
          onClick={onSignUp}
          className="px-10 py-4 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] text-[#0c0e17] font-black text-sm rounded-xl shadow-[0_0_35px_rgba(178,152,231,0.35)] hover:shadow-[0_0_50px_rgba(184,227,233,0.5)] transition-all transform hover:-translate-y-0.5 mb-8 cursor-pointer"
        >
          Run Your Free Analysis
        </button>
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold tracking-widest uppercase text-slate-400">
          <span className="flex items-center gap-2"><span className="w-2 h-2 bg-[#B8E3E9] rounded-full"></span> Zero Spam</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 bg-[#B298E7] rounded-full"></span> Instant Verification</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 bg-[#F5B8D5] rounded-full"></span> Privacy First</span>
        </div>
      </section>
    </div>
  );
}
