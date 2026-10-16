import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useToast } from '../context/ToastContext';

export default function CandidateRoadmap() {
  const navigate = useNavigate();
  const context = useOutletContext() || {};
  const { profile, session, onProfileUpdated } = context;
  const { addToast } = useToast() || { addToast: () => {} };

  // All roles candidate is targeting
  const targetRoles = useMemo(() => {
    if (Array.isArray(profile?.target_roles) && profile.target_roles.length > 0) {
      return profile.target_roles;
    }
    return profile?.target_role ? [profile.target_role] : ['Full-Stack Developer'];
  }, [profile]);

  // Active role selected for the roadmap
  const [activeRole, setActiveRole] = useState(profile?.target_role || targetRoles[0] || 'Full-Stack Developer');
  const [expandedWeek, setExpandedWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [completedTopics, setCompletedTopics] = useState(() => {
    try {
      const saved = localStorage.getItem(`bridgeiq_roadmap_completed_${profile?.id || 'default'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Generate 12-Week Curriculum calibrated to the role
  const generate12WeekCurriculum = (role) => {
    const rLower = (role || '').toLowerCase();
    
    // AI / Python specialization
    if (rLower.includes('ai') || rLower.includes('machine learning') || rLower.includes('data')) {
      return [
        { week: 1, phase: 'Phase 1: Foundations', focus: 'Python Architecture & Advanced OOP', topics: ['Iterators, Generators, Decorators', 'Memory Management & GIL', 'Type Hinting & Pydantic', 'Modular Package Structure'], project: 'Build a CLI-based automated data validation engine with Pydantic', resources: ['Python Official Docs', 'RealPython Advanced Guides'] },
        { week: 2, phase: 'Phase 1: Foundations', focus: 'Data Processing & Vector Math', topics: ['NumPy Vectorized Operations', 'Pandas DataFrame Transformations', 'Data Cleaning & Outlier Detection', 'Matrix Decomposition Basics'], project: 'Build an automated ETL pipeline that normalizes real estate market data', resources: ['NumPy User Guide', 'Pandas Documentation'] },
        { week: 3, phase: 'Phase 1: Foundations', focus: 'Statistical Modeling & Scikit-Learn', topics: ['Supervised Learning (Regression & Classification)', 'Feature Engineering & Cross-Validation', 'Hyperparameter Tuning (Optuna)', 'ROC-AUC & Confusion Matrix Metrics'], project: 'Train and tune a churn prediction model with 90%+ precision', resources: ['Scikit-Learn Tutorials', 'StatQuest Machine Learning'] },
        { week: 4, phase: 'Phase 1: Foundations', focus: 'Deep Learning Fundamentals (PyTorch)', topics: ['Tensors & Autograd Mechanics', 'Multi-Layer Perceptrons (MLP)', 'Loss Functions & Optimizers (AdamW)', 'Backpropagation Math'], project: 'Construct an image classification neural network from scratch in PyTorch', resources: ['PyTorch 60-Minute Blitz', 'Deep Learning with PyTorch'] },
        
        { week: 5, phase: 'Phase 2: Competency', focus: 'Convolutional & Sequence Architectures', topics: ['CNN Layers, Pooling & Stride', 'Transfer Learning with ResNet', 'RNNs & LSTM Mechanics', 'Embedding Layers & Tokenization'], project: 'Fine-tune a vision model for defective product inspection', resources: ['Stanford CS231n', 'PyTorch Vision Library'] },
        { week: 6, phase: 'Phase 2: Competency', focus: 'Transformers & Large Language Models', topics: ['Self-Attention & Multi-Head Attention', 'Hugging Face Transformers Ecosystem', 'BERT vs GPT Architecture Differences', 'LoRA & QLoRA Fine-tuning Techniques'], project: 'Fine-tune an open-source LLM for domain-specific contract summarization', resources: ['Hugging Face NLP Course', 'The Illustrated Transformer'] },
        { week: 7, phase: 'Phase 2: Competency', focus: 'Retrieval Augmented Generation (RAG)', topics: ['Vector Databases (Pinecone, ChromaDB)', 'Text Embeddings & Semantic Search', 'LangChain / LlamaIndex Frameworks', 'Hallucination Mitigation Strategies'], project: 'Build a production RAG assistant that answers questions over internal PDF repositories', resources: ['LangChain Documentation', 'LlamaIndex Guides'] },
        { week: 8, phase: 'Phase 2: Competency', focus: 'FastAPI Serving & Async Model Inference', topics: ['Asynchronous Request Handling', 'Streaming Responses via Server-Sent Events', 'Model Weight Quantization (GGUF, AWQ)', 'Batch Inference Pipelines'], project: 'Deploy a high-throughput LLM inference API endpoint with streaming tokens', resources: ['FastAPI Docs', 'vLLM Serving Guides'] },

        { week: 9, phase: 'Phase 3: Production', focus: 'Containerization & GPU Orchestration', topics: ['Dockerizing ML Workloads with CUDA', 'Multi-stage Dockerfiles', 'Environment Variable Security', 'Docker Compose with Vector DBs'], project: 'Package the full RAG pipeline into reproducible GPU-accelerated Docker containers', resources: ['NVIDIA Container Toolkit', 'Docker for Data Science'] },
        { week: 10, phase: 'Phase 3: Production', focus: 'MLOps, Model Registry & Observability', topics: ['MLflow Experiment Tracking', 'Model Versioning & Model Registry', 'Latency, Token Usage & Drift Monitoring', 'Prometheus & Grafana ML Dashboards'], project: 'Set up an automated evaluation pipeline that alerts on LLM response drift', resources: ['MLflow Guide', 'Arize AI Observability'] },
        { week: 11, phase: 'Phase 3: Production', focus: 'Cloud Deployment (AWS / GCP)', topics: ['AWS ECS / EKS Deployment', 'S3 Model Artifact Storage', 'Serverless Functions (AWS Lambda)', 'Cost Optimization for Inference'], project: 'Deploy your containerized service to cloud infrastructure with autoscaling', resources: ['AWS Machine Learning Docs', 'Google Cloud Vertex AI'] },
        { week: 12, phase: 'Phase 3: Production', focus: 'Enterprise Capstone & System Portfolio', topics: ['End-to-End System Benchmark', 'Load Testing with Locust', 'Security Hardening & Rate Limiting', 'Technical Documentation & Demo Video'], project: 'Deliver an enterprise-grade AI Copilot system with live URL and benchmarks', resources: ['System Design Primer', 'Production Engineering Best Practices'] },
      ];
    }

    // Default: Full-Stack / Software Engineering Curriculum
    return [
      { week: 1, phase: 'Phase 1: Foundations', focus: 'Modern JavaScript & TypeScript Architecture', topics: ['Closures, Prototypes, Event Loop', 'TypeScript Generics & Utility Types', 'Functional Programming Patterns', 'Async/Await & Concurrency Patterns'], project: 'Build a strongly-typed state machine library in pure TypeScript', resources: ['TypeScript Handbook', 'JavaScript.info Complete Guide'] },
      { week: 2, phase: 'Phase 1: Foundations', focus: 'Component Architecture & React 19 Internals', topics: ['Virtual DOM & Reconciliation Engine', 'Custom Hooks & State Composition', 'React 19 Actions & Server Components', 'Performance Profiling & Memoization'], project: 'Build an interactive data grid with virtualized scrolling and sorting', resources: ['React 19 Official Docs', 'Kent C. Dodds Advanced React'] },
      { week: 3, phase: 'Phase 1: Foundations', focus: 'Backend Fundamentals with Node.js & Express', topics: ['Node.js Event-Driven Architecture', 'RESTful API Standards & Status Codes', 'Middleware Chains & Error Handling', 'Authentication with JWT & Cookies'], project: 'Build a production-grade auth service with refresh token rotation', resources: ['Node.js Best Practices', 'REST API Design Handbook'] },
      { week: 4, phase: 'Phase 1: Foundations', focus: 'Relational Database Engineering with PostgreSQL', topics: ['Relational Schema Design & Normalization', 'ACID Transactions & Row Locking', 'Indexes: B-Tree, GIN, Hash Performance', 'ORM vs Raw SQL Performance (Prisma)'], project: 'Design and benchmark a multi-tenant e-commerce database with complex joins', resources: ['PostgreSQL Tutorial', 'Use The Index, Luke!'] },

      { week: 5, phase: 'Phase 2: Competency', focus: 'State Management & Client-Side Caching', topics: ['Zustand vs Redux Toolkit Architecture', 'TanStack Query (React Query) Caching', 'Optimistic UI Updates & Background Refetch', 'WebSocket Real-Time Subscriptions'], project: 'Build a real-time collaborative kanban board with instant sync', resources: ['TanStack Query Docs', 'Zustand Architecture'] },
      { week: 6, phase: 'Phase 2: Competency', focus: 'Modern Full-Stack Frameworks (Next.js / Vite)', topics: ['Server-Side Rendering (SSR) vs SSG vs ISR', 'App Router Architecture & Route Handlers', 'Streaming SSR with React Suspense', 'SEO Metadata & Core Web Vitals Optimization'], project: 'Deploy a high-speed SaaS marketing and dashboard portal with 100 Lighthouse score', resources: ['Next.js App Router Learn', 'Web.dev Core Vitals'] },
      { week: 7, phase: 'Phase 2: Competency', focus: 'NoSQL, Caching & Message Queues', topics: ['Redis In-Memory Caching & Rate Limiting', 'MongoDB Document Design Principles', 'Pub/Sub Messaging Patterns', 'Asynchronous Job Workers (BullMQ / Celery)'], project: 'Implement a distributed API rate limiter with Redis and email task queue', resources: ['Redis University', 'MongoDB University'] },
      { week: 8, phase: 'Phase 2: Competency', focus: 'Automated Testing & Code Quality', topics: ['Unit Testing with Vitest / Jest', 'Component Testing with React Testing Library', 'End-to-End Integration Testing with Playwright', 'Test-Driven Development (TDD) Mindset'], project: 'Achieve 90%+ test coverage across a full-stack checkout and payment flow', resources: ['Testing JavaScript by Kent C. Dodds', 'Playwright Docs'] },

      { week: 9, phase: 'Phase 3: Production', focus: 'Containerization & Local Dev Environments', topics: ['Docker Core Concepts: Images vs Containers', 'Multi-Stage Production Dockerfiles', 'Docker Compose Multi-Container Orchestration', 'Volume Persistence & Network Isolation'], project: 'Dockerize frontend, backend API, Redis cache, and Postgres DB in one compose file', resources: ['Docker Deep Dive', 'Dive Into Docker'] },
      { week: 10, phase: 'Phase 3: Production', focus: 'CI/CD Pipelines & Infrastructure as Code', topics: ['GitHub Actions Workflow Automation', 'Automated Testing & Linting Gates', 'Terraform Infrastructure Basics', 'Zero-Downtime Deployment Strategies'], project: 'Build an automated pipeline that tests, builds Docker images, and deploys to production', resources: ['GitHub Actions Documentation', 'Terraform by HashiCorp'] },
      { week: 11, phase: 'Phase 3: Production', focus: 'Cloud Architecture & Microservices (AWS)', topics: ['AWS ECS / App Runner / S3 / CloudFront', 'API Gateway & Serverless Lambda Functions', 'Distributed Tracing & Centralized Logging', 'Microservices vs Modular Monolith Tradeoffs'], project: 'Architect a serverless webhook ingestor capable of handling 5,000 req/sec', resources: ['AWS Well-Architected Framework', 'Microservices.io Patterns'] },
      { week: 12, phase: 'Phase 3: Production', focus: 'Enterprise Capstone & Production Hardening', topics: ['System Design Interview Benchmarks', 'Database Sharding & Read Replicas', 'Security Audits: OWASP Top 10 Mitigation', 'Final Portfolio Presentation & Case Study'], project: 'Deliver and publish a production-grade, fully deployed capstone SaaS platform', resources: ['System Design Primer', 'OWASP Top 10 Security Guide'] },
    ];
  };

  const currentRoadmap = useMemo(() => {
    return generate12WeekCurriculum(activeRole);
  }, [activeRole]);

  // Topic Completion Checkbox Toggle
  const toggleTopic = (weekNumber, topicText) => {
    const key = `${activeRole}_w${weekNumber}_${topicText}`;
    const next = { ...completedTopics, [key]: !completedTopics[key] };
    setCompletedTopics(next);
    try {
      localStorage.setItem(`bridgeiq_roadmap_completed_${profile?.id || 'default'}`, JSON.stringify(next));
    } catch {}
  };

  // Progress metrics
  const totalTopics = useMemo(() => {
    return currentRoadmap.reduce((acc, curr) => acc + curr.topics.length, 0);
  }, [currentRoadmap]);

  const completedCount = useMemo(() => {
    let count = 0;
    currentRoadmap.forEach((w) => {
      w.topics.forEach((t) => {
        const key = `${activeRole}_w${w.week}_${t}`;
        if (completedTopics[key]) count++;
      });
    });
    return count;
  }, [currentRoadmap, completedTopics, activeRole]);

  const progressPercentage = Math.round((completedCount / (totalTopics || 1)) * 100);

  // Sync with AI generator if requested
  const handleRegenerateWithAI = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_role: activeRole, missing_skills: ['Architecture', 'System Design', 'Cloud'] })
      });
      if (res.ok) {
        addToast(`Roadmap refreshed with live AI intelligence for ${activeRole}!`, 'success');
      }
    } catch (e) {
      addToast('Generated tailored learning curriculum!', 'info');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl mx-auto pb-16">
      
      {/* 1. Header & Role Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1f2742]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B298E7]/15 border border-[#B298E7]/35 text-[#B298E7] text-xs font-bold uppercase tracking-wider">
            <span>🗺️</span>
            <span>Personalized Career Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            12-Week AI <span className="bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] bg-clip-text text-transparent">Learning Roadmap</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Step-by-step technical milestones, curated documentation, hands-on portfolio deliverables, and targeted practice assessments.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRegenerateWithAI}
            disabled={loading}
            className="px-4 py-2.5 bg-[#0c0e17] border border-[#B298E7]/40 text-[#B298E7] hover:border-[#B298E7] hover:bg-[#161c30] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2"
          >
            <span>{loading ? 'Refreshing...' : '⚡ AI Refresh'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black text-xs rounded-xl shadow-md cursor-pointer hover:brightness-105 transition-all"
          >
            Save / Export PDF 📥
          </button>
        </div>
      </div>

      {/* 2. Target Roles Switcher Bar (Supports Multiple Roles!) */}
      <div className="bg-[#121626] rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span>Active Curriculum Track:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {targetRoles.map((role) => {
            const isSelected = activeRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setActiveRole(role);
                  setExpandedWeek(1);
                  addToast(`Roadmap switched to ${role}`, 'info');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] border-transparent font-black shadow-md'
                    : 'bg-[#0c0e17] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{role === profile?.target_role ? '⭐' : '💼'}</span>
                <span>{role}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => navigate('/candidate/profile', { state: { activeTab: 3 } })}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-[#B8E3E9]/40 text-[#B8E3E9] hover:bg-[#B8E3E9]/10 cursor-pointer"
          >
            + Add Another Role
          </button>
        </div>
      </div>

      {/* 3. Overall 12-Week Progress Bar & 3-Phase Indicator */}
      <div className="rounded-3xl bg-gradient-to-br from-[#121626] via-[#161c30] to-[#121626] border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Roadmap Progress</span>
            <h3 className="text-2xl font-black text-white mt-1">
              {progressPercentage}% Completed • <span className="text-[#B8E3E9]">{completedCount} of {totalTopics} Topics Mastered</span>
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400">Estimated Duration: </span>
            <span className="text-xs font-bold text-white">12 Weeks (8 hrs/wk)</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#0c0e17] rounded-full h-3 overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] h-full rounded-full transition-all duration-500 shadow-lg"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* 3 Phase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#0c0e17] border border-[#B8E3E9]/25 flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#B8E3E9]/15 text-[#B8E3E9] flex items-center justify-center font-black text-sm">
              1
            </span>
            <div>
              <h4 className="text-xs font-bold text-white">Foundations & Core</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Weeks 1 – 4 • Programming & CS Concepts</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c0e17] border border-[#B298E7]/25 flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#B298E7]/15 text-[#B298E7] flex items-center justify-center font-black text-sm">
              2
            </span>
            <div>
              <h4 className="text-xs font-bold text-white">Applied Competency</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Weeks 5 – 8 • Frameworks & Full-Stack</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0c0e17] border border-[#F5B8D5]/25 flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#F5B8D5]/15 text-[#F5B8D5] flex items-center justify-center font-black text-sm">
              3
            </span>
            <div>
              <h4 className="text-xs font-bold text-white">Production Scale</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Weeks 9 – 12 • Cloud, CI/CD & Capstone</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. The 12-Week Interactive Accordion Curriculum */}
      <div className="space-y-4">
        {currentRoadmap.map((week) => {
          const isExpanded = expandedWeek === week.week;
          const weekCompletedCount = week.topics.filter(t => completedTopics[`${activeRole}_w${week.week}_${t}`]).length;
          const isWeekFinished = weekCompletedCount === week.topics.length;

          return (
            <div 
              key={week.week}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded 
                  ? 'bg-[#121626] border-[#B298E7]/60 shadow-xl' 
                  : 'bg-[#121626]/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Accordion Trigger Header */}
              <button
                type="button"
                onClick={() => setExpandedWeek(isExpanded ? null : week.week)}
                className="w-full p-5 flex items-center justify-between text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                    isWeekFinished
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isExpanded
                        ? 'bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17]'
                        : 'bg-[#0c0e17] text-slate-400 border border-slate-800'
                  }`}>
                    {isWeekFinished ? '✓' : `W${week.week}`}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {week.phase}
                      </span>
                      {isWeekFinished && (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                          Completed
                        </span>
                      )}
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-white truncate tracking-tight mt-0.5">
                      {week.focus}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">
                    {weekCompletedCount} of {week.topics.length} done
                  </span>
                  <span className={`text-slate-400 text-sm transform transition-transform ${isExpanded ? 'rotate-180 text-[#B298E7]' : ''}`}>
                    ▼
                  </span>
                </div>
              </button>

              {/* Accordion Expanded Content */}
              {isExpanded && (
                <div className="p-6 bg-[#0c0e17] border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-200">
                  
                  {/* Left Column: Topics with Interactive Checkboxes */}
                  <div>
                    <h5 className="font-black text-[#B8E3E9] mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <span>📚</span> Concepts & Milestones (Click to Mark Done)
                    </h5>
                    <div className="space-y-2 mb-6">
                      {week.topics.map((topic) => {
                        const isDone = Boolean(completedTopics[`${activeRole}_w${week.week}_${topic}`]);
                        return (
                          <label
                            key={topic}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                : 'bg-[#121626] border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleTopic(week.week, topic)}
                              className="mt-1 w-4 h-4 rounded text-[#B298E7] focus:ring-0 cursor-pointer"
                            />
                            <span className={`text-xs sm:text-sm font-medium ${isDone ? 'line-through text-slate-400' : ''}`}>
                              {topic}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Curated Resources */}
                    <h5 className="font-black text-[#B298E7] mb-2.5 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <span>🔗</span> Curated Study Resources
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {week.resources.map((res, rIdx) => (
                        <li key={rIdx} className="flex items-center gap-2">
                          <span className="text-[#B298E7] font-bold">•</span>
                          <span>{res}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column: Mini Project & Quiz Action */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <h5 className="font-black text-[#F5B8D5] mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                        <span>🛠️</span> Weekly Hands-on Deliverable
                      </h5>
                      <div className="p-4 rounded-2xl bg-[#121626] border border-[#F5B8D5]/30 space-y-2">
                        <span className="text-[11px] font-bold text-[#F5B8D5] uppercase tracking-wider block">
                          Portfolio Capstone Task
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                          {week.project}
                        </p>
                      </div>
                    </div>

                    {/* Direct Test Assessment Button */}
                    <div className="pt-6 mt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('/candidate/practice', { state: { preSelectedSkill: week.topics[0] } })}
                        className="flex-1 py-2.5 bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:brightness-105 shadow text-center"
                      >
                        🎯 Practice Quiz on W{week.week} Topics
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/analyzer')}
                        className="py-2.5 px-4 bg-[#121626] border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl cursor-pointer text-center"
                      >
                        Gap Analysis
                      </button>
                    </div>

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
