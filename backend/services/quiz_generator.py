import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

env_path = Path(__file__).resolve().parent.parent / ".env"

def get_api_key():
    load_dotenv(dotenv_path=env_path, override=True)
    return os.getenv("GEMINI_API_KEY", "").strip()

FALLBACK_QUIZZES = {
    "react": [
        {
            "id": 1,
            "question": "Which hook is used to manage mutable local state across renders without causing a re-render?",
            "options": ["useState", "useRef", "useEffect", "useMemo"],
            "correct_answer": "useRef",
            "explanation": "useRef returns a mutable ref object whose .current property persists without triggering re-renders."
        },
        {
            "id": 2,
            "question": "What is the primary purpose of useEffect cleanup functions?",
            "options": ["To remove component state", "To unsubscribe from event listeners and cancel timers", "To force garbage collection", "To reset URL query parameters"],
            "correct_answer": "To unsubscribe from event listeners and cancel timers",
            "explanation": "Cleanup functions run before the component unmounts or before the effect re-runs to prevent memory leaks."
        },
        {
            "id": 3,
            "question": "What is reconciliation in React?",
            "options": ["Database transaction commit algorithm", "The algorithm React uses to diff one tree with another to determine which parts need to be changed", "Resolving CSS conflicts across styled components", "Converting JSX into server-side rendered HTML only"],
            "correct_answer": "The algorithm React uses to diff one tree with another to determine which parts need to be changed",
            "explanation": "Reconciliation compares the virtual DOM trees to compute minimal DOM updates."
        },
        {
            "id": 4,
            "question": "When should React.useMemo typically be used?",
            "options": ["For every function created inside a component", "To memoize expensive calculations between renders", "To replace all useState calls", "Only inside asynchronous promises"],
            "correct_answer": "To memoize expensive calculations between renders",
            "explanation": "useMemo caches the result of a computationally expensive calculation between renders."
        },
        {
            "id": 5,
            "question": "Why must list items in React have unique 'key' props?",
            "options": ["To apply unique CSS classes", "To help React identify which items have changed, been added, or removed during diffing", "Keys are required by standard HTML5 specs", "To enable React Router deep linking"],
            "correct_answer": "To help React identify which items have changed, been added, or removed during diffing",
            "explanation": "Keys provide identity to elements across render cycles, optimizing DOM mutations."
        }
    ],
    "python": [
        {
            "id": 1,
            "question": "What is the key difference between lists and tuples in Python?",
            "options": ["Lists are immutable, tuples are mutable", "Lists are mutable, tuples are immutable", "Tuples cannot contain integers", "Lists cannot be nested"],
            "correct_answer": "Lists are mutable, tuples are immutable",
            "explanation": "Tuples cannot be altered after creation, making them hashable and memory efficient."
        },
        {
            "id": 2,
            "question": "What does Python's GIL (Global Interpreter Lock) enforce in CPython?",
            "options": ["Only one thread executes Python bytecode at a time", "Only one CPU core can exist on the machine", "Garbage collection cannot run during loops", "Database locks are automatically acquired"],
            "correct_answer": "Only one thread executes Python bytecode at a time",
            "explanation": "The GIL is a mutex that prevents multiple native threads from executing Python bytecodes simultaneously in CPython."
        },
        {
            "id": 3,
            "question": "What is a Python generator and which keyword creates one?",
            "options": ["A function that returns a list; 'return'", "A function yielding values lazily on demand; 'yield'", "A compiler directive; 'generate'", "A multiprocessing daemon; 'spawn'"],
            "correct_answer": "A function yielding values lazily on demand; 'yield'",
            "explanation": "Generators produce sequence values lazily via yield, conserving memory."
        },
        {
            "id": 4,
            "question": "What does the `*args` and `**kwargs` syntax allow in function definitions?",
            "options": ["Enforcing static typing", "Passing arbitrary positional and keyword arguments", "Invoking pointer arithmetic", "Enabling multi-threading"],
            "correct_answer": "Passing arbitrary positional and keyword arguments",
            "explanation": "*args collects extra positional arguments into a tuple, **kwargs collects keyword arguments into a dict."
        },
        {
            "id": 5,
            "question": "In Python, which built-in function returns an iterator that produces tuples of index and item?",
            "options": ["zip()", "enumerate()", "range()", "map()"],
            "correct_answer": "enumerate()",
            "explanation": "enumerate(iterable) yields (index, value) pairs."
        }
    ],
    "node.js": [
        {
            "id": 1,
            "question": "What component in Node.js handles asynchronous non-blocking I/O operations?",
            "options": ["V8 Engine alone", "libuv", "Babel", "npm"],
            "correct_answer": "libuv",
            "explanation": "libuv is the multi-platform C library providing the event loop and thread pool in Node.js."
        },
        {
            "id": 2,
            "question": "What is the difference between process.nextTick() and setImmediate()?",
            "options": ["setImmediate() fires before nextTick()", "process.nextTick() executes immediately after the current operation before the event loop continues", "They are identical aliases", "process.nextTick() is deprecated"],
            "correct_answer": "process.nextTick() executes immediately after the current operation before the event loop continues",
            "explanation": "process.nextTick() queues a callback on the microtask queue before the next event loop phase."
        },
        {
            "id": 3,
            "question": "Which core module is used to handle streaming binary data without buffering entire files in memory?",
            "options": ["stream and Buffer", "cluster", "http-parser", "vm"],
            "correct_answer": "stream and Buffer",
            "explanation": "The stream module processes chunks sequentially, allowing high throughput with low memory overhead."
        },
        {
            "id": 4,
            "question": "Why is blocking the Node.js event loop harmful?",
            "options": ["It crashes the OS immediately", "Because Node.js is single-threaded for JavaScript execution, all concurrent requests freeze", "It causes syntax errors", "It leaks database passwords"],
            "correct_answer": "Because Node.js is single-threaded for JavaScript execution, all concurrent requests freeze",
            "explanation": "Blocking operations prevent the single main thread from processing incoming events and requests."
        },
        {
            "id": 5,
            "question": "What does EventEmitter in Node.js provide?",
            "options": ["A pub/sub observer pattern for handling custom events", "Websocket server implementation", "SQL connection pooling", "DOM mutation observers"],
            "correct_answer": "A pub/sub observer pattern for handling custom events",
            "explanation": "EventEmitter allows objects to bind and emit custom named events."
        }
    ]
}

def generate_quiz_questions(skill: str) -> list:
    cleaned_skill = skill.strip().lower()
    api_key = get_api_key()
    
    # Check default pre-curated sets first for instant response
    for key, questions in FALLBACK_QUIZZES.items():
        if key in cleaned_skill or cleaned_skill in key:
            return questions

    candidate_models = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-1.5-flash']
    
    prompt = f"""
    Generate exactly 5 intermediate-to-advanced multiple choice questions (MCQ) testing technical knowledge in: {skill}.
    Return ONLY a valid JSON array of 5 objects with this exact structure:
    [
      {{
        "id": 1,
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer": "Exact matching string of the correct option",
        "explanation": "Brief 1-sentence explanation of why it is correct"
      }}
    ]
    """

    if api_key and not ("your_" in api_key.lower() or "placeholder" in api_key.lower()):
        try:
            genai.configure(api_key=api_key)
            for model_name in candidate_models:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(
                        prompt,
                        generation_config={"response_mime_type": "application/json"}
                    )
                    parsed = json.loads(response.text)
                    if isinstance(parsed, list) and len(parsed) >= 5:
                        return parsed[:5]
                except Exception as e:
                    logging.warning(f"Quiz model {model_name} failed: {e}. Trying fallback...")
                    continue
        except Exception as err:
            logging.error(f"Quiz generation AI error: {err}")

    # Generic high quality fallback for unknown skills
    return [
        {
            "id": 1,
            "question": f"What is a core best practice when architecting scalable applications using {skill}?",
            "options": [
                "Coupling presentation and persistence tightly",
                "Decoupling components and applying clear separation of concerns",
                "Hardcoding configuration credentials into source files",
                "Avoiding automated unit and integration tests"
            ],
            "correct_answer": "Decoupling components and applying clear separation of concerns",
            "explanation": "Separation of concerns ensures modularity, testability, and maintainability as systems scale."
        },
        {
            "id": 2,
            "question": f"How do engineers effectively profile and identify performance bottlenecks in {skill}?",
            "options": [
                "Relying solely on visual inspection of the code",
                "Using dedicated benchmarking tools, profilers, and telemetry logs",
                "Increasing the clock speed of developers' machines",
                "Restarting services whenever latency spikes"
            ],
            "correct_answer": "Using dedicated benchmarking tools, profilers, and telemetry logs",
            "explanation": "Profiling tools and telemetry provide empirical latency distributions and memory allocation bottlenecks."
        },
        {
            "id": 3,
            "question": f"Which strategy minimizes vulnerability risks when integrating dependencies in {skill}?",
            "options": [
                "Ignoring version locking and using wildcards everywhere",
                "Continuous security audits, vulnerability scanning, and semantic version pinning",
                "Copying untrusted scripts from discussion forums without vetting",
                "Disabling TLS and SSL verification"
            ],
            "correct_answer": "Continuous security audits, vulnerability scanning, and semantic version pinning",
            "explanation": "Audit scanners (e.g. Snyk, Dependabot) ensure dependencies are patched against CVEs."
        },
        {
            "id": 4,
            "question": f"In a distributed cloud setup, how should state be handled with {skill} services?",
            "options": [
                "Maintain local file-based state on transient server disks",
                "Store state externally in resilient databases or distributed caches (stateless services)",
                "Store user sessions in local process memory across autoscaling groups",
                "State should never be saved anywhere"
            ],
            "correct_answer": "Store state externally in resilient databases or distributed caches (stateless services)",
            "explanation": "Stateless services allow elastic horizontal autoscaling without session loss."
        },
        {
            "id": 5,
            "question": f"What is the recommended approach for continuous delivery and testing with {skill}?",
            "options": [
                "Manual FTP uploads to production on Friday evenings",
                "Automated CI/CD pipelines executing linting, unit tests, and canary deployments",
                "Skipping staging environments directly to release",
                "Manual code reviews without test suites"
            ],
            "correct_answer": "Automated CI/CD pipelines executing linting, unit tests, and canary deployments",
            "explanation": "Automated CI/CD pipelines catch regressions early and ensure reproducible deployments."
        }
    ]
