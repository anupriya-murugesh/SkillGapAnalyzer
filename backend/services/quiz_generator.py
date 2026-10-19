import os
import json
import logging
import random
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

env_path = Path(__file__).resolve().parent.parent / ".env"

def get_api_keys() -> list:
    load_dotenv(dotenv_path=env_path, override=True)
    keys = []
    # 1. Check GEMINI_API_KEYS or GEMINI_API_KEY (supports comma-separated list of keys)
    raw = os.getenv("GEMINI_API_KEYS") or os.getenv("GEMINI_API_KEY") or ""
    for k in raw.split(","):
        k = k.strip()
        if k and len(k) > 10 and not ("your_" in k.lower() or "placeholder" in k.lower()):
            if k not in keys:
                keys.append(k)
    # 2. Check numbered keys GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3...
    for i in range(1, 10):
        k = os.getenv(f"GEMINI_API_KEY_{i}", "").strip()
        if k and len(k) > 10 and k not in keys:
            keys.append(k)
    return keys

def get_api_key() -> str:
    keys = get_api_keys()
    return keys[0] if keys else ""

# =========================================================================
# RICH 20-QUESTION HARD DIAGNOSTIC BANKS (WITH CODE SNIPPETS & 4 ARCHETYPES)
# =========================================================================

def get_curated_mcqs(skill: str) -> list:
    s = skill.strip().lower()
    
    if "python" in s:
        return [
            {
                "id": 1,
                "category": "Predict the Output",
                "question": "What will be printed when this function executes with default mutable arguments?",
                "code_snippet": "def append_to(element, target=[]):\n    target.append(element)\n    return target\n\nlist_a = append_to(10)\nlist_b = append_to(20, [])\nlist_c = append_to(30)\nprint(list_a, list_c)",
                "options": ["[10, 30] [10, 30]", "[10] [30]", "[10, 30] [30]", "[10] [10, 30]"],
                "correct_answer": "[10, 30] [10, 30]",
                "explanation": "Default arguments in Python are evaluated once when the function is defined, not each time it is called. Since target is a mutable list, list_a and list_c reference the same list object.",
                "difficulty": "Hard"
            },
            {
                "id": 2,
                "category": "Spot the Bug",
                "question": "Identify the critical bug in this multi-threaded counter function running under CPython.",
                "code_snippet": "import threading\ncounter = 0\ndef increment():\n    global counter\n    for _ in range(100_000):\n        counter += 1",
                "options": ["counter += 1 is not atomic in bytecode; it causes race conditions between threads", "The global keyword causes a syntax error inside worker threads", "CPython crashes due to Global Interpreter Lock (GIL) violation", "The loop variable _ leaks into module scope causing an unhandled memory exception"],
                "correct_answer": "counter += 1 is not atomic in bytecode; it causes race conditions between threads",
                "explanation": "In Python, counter += 1 expands to LOAD_GLOBAL, LOAD_CONST, BINARY_ADD, and STORE_GLOBAL bytecode instructions. Thread switches between these instructions cause lost increments.",
                "difficulty": "Hard"
            },
            {
                "id": 3,
                "category": "Time & Space Complexity",
                "question": "What is the worst-case time complexity of inserting n elements into a Python dictionary, and why?",
                "code_snippet": "# Inserting n items with overlapping hash keys\nd = {}\nfor key, val in data_pairs:\n    d[key] = val",
                "options": ["O(N^2) in the worst case if hash collisions force linear probing across all slots", "O(N) strictly under all conditions because Python dicts use red-black trees", "O(N log N) due to dynamic key sorting during resize", "O(1) amortized with guaranteed zero collision penalty"],
                "correct_answer": "O(N^2) in the worst case if hash collisions force linear probing across all slots",
                "explanation": "Average case is O(1) per insert (O(N) total), but pathological hash collisions cause quadratic O(N^2) total time due to probing collisions in open addressing.",
                "difficulty": "Hard"
            },
            {
                "id": 4,
                "category": "Predict the Output",
                "question": "What is the output of this generator and list comprehension pipeline?",
                "code_snippet": "funcs = [lambda x, i=i: x * i for i in range(4)]\nresults = [f(2) for f in funcs]\nprint(results)",
                "options": ["[0, 2, 4, 6]", "[6, 6, 6, 6]", "[0, 1, 2, 3]", "[2, 4, 6, 8]"],
                "correct_answer": "[0, 2, 4, 6]",
                "explanation": "By using the default argument i=i, the value of i is bound at function creation time for each lambda. Hence it evaluates to 2*0, 2*1, 2*2, 2*3.",
                "difficulty": "Hard"
            },
            {
                "id": 5,
                "category": "System & Concurrency",
                "question": "When processing a 50GB CSV file on a machine with 8GB RAM, which approach prevents out-of-memory errors?",
                "code_snippet": "# Processing millions of rows without memory exhaustion",
                "options": ["Using a generator expression with chunked reads via csv.reader or pandas chunksize", "Increasing the OS swap file size to 100GB", "Loading the full CSV into a NumPy 2D array", "Calling gc.collect() inside a standard file.readlines() loop"],
                "correct_answer": "Using a generator expression with chunked reads via csv.reader or pandas chunksize",
                "explanation": "Generators stream rows lazily one chunk at a time into memory, keeping the footprint bounded regardless of total file size.",
                "difficulty": "Hard"
            },
            {
                "id": 6,
                "category": "Predict the Output",
                "question": "What will be printed when inspecting class inheritance resolution order (MRO)?",
                "code_snippet": "class A:\n    def ping(self): return 'A'\nclass B(A):\n    def ping(self): return 'B'\nclass C(A):\n    def ping(self): return 'C'\nclass D(B, C):\n    pass\n\nprint(D().ping())",
                "options": ["B", "A", "C", "TypeError: Cannot create a consistent method resolution order"],
                "correct_answer": "B",
                "explanation": "According to C3 Linearization (MRO), Python checks D -> B -> C -> A. Since B defines ping(), it resolves to B first.",
                "difficulty": "Hard"
            },
            {
                "id": 7,
                "category": "Spot the Bug",
                "question": "What is the problem with using a mutable object as a key in a dictionary?",
                "code_snippet": "data = {[1, 2]: 'values'}",
                "options": ["Lists are unhashable types and raise a TypeError", "The dictionary silently converts the list into a string", "The list is garbage collected immediately", "Memory leaks occur due to cyclic references"],
                "correct_answer": "Lists are unhashable types and raise a TypeError",
                "explanation": "Dictionary keys must be hashable and immutable (e.g. tuples, strings, ints). A list raises TypeError: unhashable type: 'list'.",
                "difficulty": "Hard"
            },
            {
                "id": 8,
                "category": "Time & Space Complexity",
                "question": "What is the time complexity of the following recursive Fibonacci implementation with memoization?",
                "code_snippet": "memo = {}\ndef fib(n):\n    if n <= 1: return n\n    if n not in memo:\n        memo[n] = fib(n - 1) + fib(n - 2)\n    return memo[n]",
                "options": ["Time: O(N), Space: O(N)", "Time: O(2^N), Space: O(N)", "Time: O(N^2), Space: O(1)", "Time: O(log N), Space: O(N)"],
                "correct_answer": "Time: O(N), Space: O(N)",
                "explanation": "Each subproblem from 0 to n is computed exactly once. The recursion tree has depth n and the memo dictionary stores n entries.",
                "difficulty": "Hard"
            },
            {
                "id": 9,
                "category": "Predict the Output",
                "question": "What happens when chaining multiple decorators?",
                "code_snippet": "def dec_a(fn):\n    return lambda: fn() + 'A'\ndef dec_b(fn):\n    return lambda: fn() + 'B'\n\n@dec_a\n@dec_b\ndef greet():\n    return 'X'\n\nprint(greet())",
                "options": ["XBA", "XAB", "ABX", "BAX"],
                "correct_answer": "XBA",
                "explanation": "Decorators apply bottom-up: dec_b runs first wrapping greet (producing 'XB'), then dec_a wraps that (producing 'XBA').",
                "difficulty": "Hard"
            },
            {
                "id": 10,
                "category": "Spot the Bug",
                "question": "Identify the memory leak bug in this Python caching decorator.",
                "code_snippet": "cache = {}\ndef memoize(func):\n    def wrapper(*args):\n        if args not in cache:\n            cache[args] = func(*args)\n        return cache[args]\n    return wrapper",
                "options": ["The global cache dictionary grows indefinitely without eviction (LRU / TTL)", "args cannot be unpacked into a tuple", "The wrapper function misses kwargs", "Nested functions cannot access enclosing scope variables in Python"],
                "correct_answer": "The global cache dictionary grows indefinitely without eviction (LRU / TTL)",
                "explanation": "Unbounded caches without capacity limits or time-to-live eviction lead to memory exhaustion in long-running processes.",
                "difficulty": "Hard"
            },
            {
                "id": 11,
                "category": "Predict the Output",
                "question": "What is the result of unpacking with the splat operator in Python 3?",
                "code_snippet": "first, *middle, last = [1, 2, 3, 4, 5]\nprint(middle)",
                "options": ["[2, 3, 4]", "(2, 3, 4)", "[1, 2, 3, 4]", "TypeError: Too many values to unpack"],
                "correct_answer": "[2, 3, 4]",
                "explanation": "Extended iterable unpacking assigns the first element to first, the last to last, and captures intermediate elements in a list.",
                "difficulty": "Hard"
            },
            {
                "id": 12,
                "category": "Time & Space Complexity",
                "question": "What is the time complexity of deque.popleft() compared to list.pop(0) in Python?",
                "code_snippet": "from collections import deque\nq = deque(range(100000))\nl = list(range(100000))",
                "options": ["deque.popleft() is O(1); list.pop(0) is O(N)", "Both are O(1) amortized", "Both are O(N) due to memory shifting", "deque.popleft() is O(log N); list.pop(0) is O(1)"],
                "correct_answer": "deque.popleft() is O(1); list.pop(0) is O(N)",
                "explanation": "deque is implemented as a doubly-linked list of blocks allowing O(1) head removals, whereas list.pop(0) must shift all remaining elements in memory.",
                "difficulty": "Hard"
            },
            {
                "id": 13,
                "category": "System & Concurrency",
                "question": "How should CPU-bound tasks be scaled across all cores in CPython?",
                "code_snippet": "# Maximizing utilization across 16 CPU cores",
                "options": ["Using multiprocessing.Pool or concurrent.futures.ProcessPoolExecutor", "Spawning 16 threading.Thread instances", "Using asyncio event loops with 16 tasks", "Increasing threading.stack_size()"],
                "correct_answer": "Using multiprocessing.Pool or concurrent.futures.ProcessPoolExecutor",
                "explanation": "CPython's GIL restricts CPU execution to a single core per process. Multiprocessing spawns separate processes, each with its own GIL and memory space.",
                "difficulty": "Hard"
            },
            {
                "id": 14,
                "category": "Predict the Output",
                "question": "What is the output of boolean short-circuit evaluation?",
                "code_snippet": "x = [] or [0] or [1]\nprint(x)",
                "options": ["[0]", "[1]", "True", "[]"],
                "correct_answer": "[0]",
                "explanation": "[] evaluates to False. [0] is a non-empty list and evaluates to True. The 'or' operator returns the first truthy operand, which is [0].",
                "difficulty": "Hard"
            },
            {
                "id": 15,
                "category": "Spot the Bug",
                "question": "What happens when modifying a list while iterating over it?",
                "code_snippet": "items = [1, 2, 3, 4, 5]\nfor x in items:\n    if x % 2 == 0:\n        items.remove(x)\nprint(items)",
                "options": ["Elements are skipped because internal index increments while length shrinks", "Raises a ConcurrentModificationException", "Removes all even numbers correctly without side effects", "Causes an infinite loop"],
                "correct_answer": "Elements are skipped because internal index increments while length shrinks",
                "explanation": "Modifying a list during iteration alters internal indexing, causing subsequent elements to slide left and be skipped by the loop counter.",
                "difficulty": "Hard"
            },
            {
                "id": 16,
                "category": "Time & Space Complexity",
                "question": "What is the average time complexity of checking membership in a set vs a list?",
                "code_snippet": "target in collection",
                "options": ["set: O(1), list: O(N)", "set: O(log N), list: O(N)", "Both are O(1) if sorted", "set: O(N), list: O(1)"],
                "correct_answer": "set: O(1), list: O(N)",
                "explanation": "Sets use hash tables offering O(1) average lookup, while lists require sequential O(N) scanning.",
                "difficulty": "Hard"
            },
            {
                "id": 17,
                "category": "Predict the Output",
                "question": "What is the output of the is operator on small integers vs dynamically created integers?",
                "code_snippet": "a = 256\nb = 256\nc = 300\nd = 300\nprint(a is b, c is d)",
                "options": ["True True (in interactive mode may differ, but True for small int cache -5 to 256)", "False False", "True False", "SyntaxError"],
                "correct_answer": "True True (in interactive mode may differ, but True for small int cache -5 to 256)",
                "explanation": "Python pre-allocates an integer cache for numbers between -5 and 256. In compiled script blocks, constants like 300 are also co-located, but 256 is guaranteed to be identical across references.",
                "difficulty": "Hard"
            },
            {
                "id": 18,
                "category": "Spot the Bug",
                "question": "What is the problem with this context manager?",
                "code_snippet": "class SafeFile:\n    def __init__(self, path):\n        self.file = open(path, 'w')\n    def __enter__(self):\n        return self.file\n    def __exit__(self, exc_type, exc_val, exc_tb):\n        self.file.close()",
                "options": ["If open() raises an IOError in __init__, __exit__ is never called, leaving partial handles", "The __exit__ signature requires 5 parameters", "return self.file is prohibited in __enter__", "self.file must be explicitly flushed before closing"],
                "correct_answer": "If open() raises an IOError in __init__, __exit__ is never called, leaving partial handles",
                "explanation": "If initialization fails in __init__, the object is not successfully created, and __exit__ will not be triggered.",
                "difficulty": "Hard"
            },
            {
                "id": 19,
                "category": "System & Concurrency",
                "question": "In an asyncio application, what occurs if synchronous time.sleep(5) is invoked inside a coroutine?",
                "code_snippet": "async def fetch_data():\n    time.sleep(5) # synchronous blocking call\n    return {'status': 'ok'}",
                "options": ["It freezes the entire event loop, halting all concurrent coroutines for 5 seconds", "asyncio automatically offloads it to a background thread", "Raises a SynchronousBlockError", "Only that single coroutine pauses while others proceed concurrently"],
                "correct_answer": "It freezes the entire event loop, halting all concurrent coroutines for 5 seconds",
                "explanation": "asyncio runs on a single thread. Calling blocking I/O or time.sleep() blocks the OS thread and prevents the event loop from scheduling other tasks. Use await asyncio.sleep(5) instead.",
                "difficulty": "Hard"
            },
            {
                "id": 20,
                "category": "Predict the Output",
                "question": "What is the behavior of class variables when modified through an instance?",
                "code_snippet": "class Robot:\n    status = 'standby'\n\nr1 = Robot()\nr2 = Robot()\nr1.status = 'active'\nprint(r1.status, r2.status, Robot.status)",
                "options": ["active standby standby", "active active active", "active standby active", "standby standby standby"],
                "correct_answer": "active standby standby",
                "explanation": "Assigning r1.status creates an instance variable on r1 shadowing the class variable. r2 and Robot remain unchanged at 'standby'.",
                "difficulty": "Hard"
            }
        ]

    # JAVASCRIPT / TYPESCRIPT DEFAULT HARD BANK
    if "javascript" in s or "typescript" in s or "node" in s or "react" in s:
        return [
            {
                "id": 1,
                "category": "Predict the Output",
                "question": "What is the exact console output order under the ECMAScript event loop microtask queue?",
                "code_snippet": "console.log('1');\nsetTimeout(() => console.log('2'), 0);\nPromise.resolve().then(() => console.log('3'));\nqueueMicrotask(() => console.log('4'));\nconsole.log('5');",
                "options": ["1, 5, 3, 4, 2", "1, 2, 3, 4, 5", "1, 5, 2, 3, 4", "1, 3, 4, 5, 2"],
                "correct_answer": "1, 5, 3, 4, 2",
                "explanation": "Synchronous code runs first ('1', '5'). Microtasks (Promise.then, queueMicrotask) run before macrotasks (setTimeout), yielding '3', '4', then '2'.",
                "difficulty": "Hard"
            },
            {
                "id": 2,
                "category": "Spot the Bug",
                "question": "Identify the cause of the memory leak in this React/JavaScript event listener.",
                "code_snippet": "function attachListener() {\n    const hugeData = new Array(1000000).fill('data');\n    window.addEventListener('resize', () => {\n        console.log(hugeData.length);\n    });\n}",
                "options": ["The resize closure holds a perpetual reference to hugeData without removeEventListener", "hugeData exceeds maximum JavaScript heap size", "window.addEventListener cannot accept arrow functions", "Array.fill causes a garbage collector stack overflow"],
                "correct_answer": "The resize closure holds a perpetual reference to hugeData without removeEventListener",
                "explanation": "The event listener persists on the global window object. Its closure retains hugeData in memory indefinitely, preventing garbage collection.",
                "difficulty": "Hard"
            },
            {
                "id": 3,
                "category": "Time & Space Complexity",
                "question": "What is the time complexity of Array.prototype.unshift() versus Array.prototype.push() in V8?",
                "code_snippet": "arr.unshift(item); // prepend\narr.push(item);    // append",
                "options": ["unshift is O(N); push is O(1) amortized", "Both are O(1) amortized", "Both are O(N)", "unshift is O(1); push is O(N)"],
                "correct_answer": "unshift is O(N); push is O(1) amortized",
                "explanation": "unshift must shift every existing element in the continuous memory buffer forward by one position (O(N)), while push appends to the end in amortized O(1).",
                "difficulty": "Hard"
            },
            {
                "id": 4,
                "category": "Predict the Output",
                "question": "What is logged when inspecting this and arrow function lexical binding?",
                "code_snippet": "const obj = {\n    val: 42,\n    getA: function() { return this.val; },\n    getB: () => this.val\n};\nconst fn = obj.getA;\nconsole.log(obj.getA(), fn(), obj.getB());",
                "options": ["42, undefined, undefined", "42, 42, 42", "42, undefined, 42", "undefined, undefined, undefined"],
                "correct_answer": "42, undefined, undefined",
                "explanation": "obj.getA() binds this to obj (42). Calling fn() detached loses the receiver, binding this to global/undefined. Arrow functions take this lexically from outer enclosing scope (undefined/window).",
                "difficulty": "Hard"
            },
            {
                "id": 5,
                "category": "System & Concurrency",
                "question": "What happens if a heavy CPU loop (10 seconds) executes on Node.js main thread?",
                "code_snippet": "app.get('/compute', (req, res) => {\n    const start = Date.now();\n    while (Date.now() - start < 10000) {} // 10s busy wait\n    res.send('done');\n});",
                "options": ["All incoming requests across all connected users freeze until the loop finishes", "Node.js offloads the loop to the libuv threadpool automatically", "V8 creates a background Web Worker process", "The operating system preemptively context-switches other async handlers"],
                "correct_answer": "All incoming requests across all connected users freeze until the loop finishes",
                "explanation": "Node.js JavaScript executes on a single main thread. A blocking while loop stops the event loop from polling sockets or handling incoming connections.",
                "difficulty": "Hard"
            },
            {
                "id": 6,
                "category": "Predict the Output",
                "question": "What is the value of result after variable hoisting and TDZ (Temporal Dead Zone)?",
                "code_snippet": "var a = 1;\nfunction test() {\n    console.log(a);\n    var a = 2;\n}\ntest();",
                "options": ["undefined", "1", "2", "ReferenceError"],
                "correct_answer": "undefined",
                "explanation": "Inside test(), the local declaration var a is hoisted to the top of the function scope as undefined, shadowing the outer global variable a = 1.",
                "difficulty": "Hard"
            },
            {
                "id": 7,
                "category": "Spot the Bug",
                "question": "Why does this asynchronous forEach loop fail to await each database call sequentially?",
                "code_snippet": "async function saveItems(items) {\n    items.forEach(async (item) => {\n        await db.save(item);\n    });\n    console.log('All saved');\n}",
                "options": ["Array.prototype.forEach does not wait for promises returned by its callback", "db.save must be synchronous inside loops", "forEach throws a syntax error when passed an async function", "items cannot be iterated with async callbacks"],
                "correct_answer": "Array.prototype.forEach does not wait for promises returned by its callback",
                "explanation": "forEach fires callbacks in parallel and ignores returned promises. 'All saved' logs immediately before any db.save completes. Use for...of or Promise.all instead.",
                "difficulty": "Hard"
            },
            {
                "id": 8,
                "category": "Time & Space Complexity",
                "question": "What is the lookup complexity of a JavaScript Map compared to an Object with 1,000,000 keys?",
                "code_snippet": "map.get(key) vs obj[key]",
                "options": ["Both are O(1) average, but Map is optimized for frequent key additions and non-string keys", "Map is O(log N); Object is O(1)", "Object is O(log N) due to prototype chaining", "Map is O(N) due to hash collision chaining"],
                "correct_answer": "Both are O(1) average, but Map is optimized for frequent key additions and non-string keys",
                "explanation": "Both use hash tables for O(1) average lookup, but Map avoids prototype pollution, handles arbitrary keys, and maintains insertion order.",
                "difficulty": "Hard"
            },
            {
                "id": 9,
                "category": "Predict the Output",
                "question": "What is the output of JavaScript closure scoping inside a loop?",
                "code_snippet": "for (var i = 0; i < 3; i++) {\n    setTimeout(() => console.log(i), 0);\n}",
                "options": ["3, 3, 3", "0, 1, 2", "undefined, undefined, undefined", "0, 0, 0"],
                "correct_answer": "3, 3, 3",
                "explanation": "var has function scope, not block scope. By the time the timeout callbacks fire, the single shared variable i has incremented to 3.",
                "difficulty": "Hard"
            },
            {
                "id": 10,
                "category": "Spot the Bug",
                "question": "What is wrong with this shallow copy implementation for nested state in React?",
                "code_snippet": "const state = { user: { name: 'Alex', settings: { theme: 'dark' } } };\nconst nextState = { ...state };\nnextState.user.settings.theme = 'light';",
                "options": ["Spread operator only creates a shallow clone; modifying nested properties mutates the original object", "Spread syntax is invalid on object types", "nextState cannot modify properties of state due to freeze", "Objects must be cloned with Object.assign(nextState, state)"],
                "correct_answer": "Spread operator only creates a shallow clone; modifying nested properties mutates the original object",
                "explanation": "Shallow spread {...state} only copies top-level references. state.user and settings point to the exact same memory locations, violating immutability.",
                "difficulty": "Hard"
            },
            {
                "id": 11,
                "category": "Predict the Output",
                "question": "What is logged when evaluating floating point arithmetic in JavaScript?",
                "code_snippet": "console.log(0.1 + 0.2 === 0.3);",
                "options": ["false", "true", "NaN", "TypeError"],
                "correct_answer": "false",
                "explanation": "Due to IEEE 754 binary floating-point representation, 0.1 + 0.2 equals 0.30000000000000004, which does not strictly equal 0.3.",
                "difficulty": "Hard"
            },
            {
                "id": 12,
                "category": "Time & Space Complexity",
                "question": "What is the space complexity of JSON.parse(JSON.stringify(deepObject))?",
                "code_snippet": "const clone = JSON.parse(JSON.stringify(largeTree));",
                "options": ["O(N) space to serialize into a temporary string buffer plus O(N) for the parsed tree", "O(1) because serialization is streamed in place", "O(N^2) space due to recursion", "O(log N) space"],
                "correct_answer": "O(N) space to serialize into a temporary string buffer plus O(N) for the parsed tree",
                "explanation": "JSON.stringify creates an intermediate string of size proportional to the tree, and JSON.parse allocates a new object graph of equal size.",
                "difficulty": "Hard"
            },
            {
                "id": 13,
                "category": "System & Concurrency",
                "question": "In React 18 / 19 Concurrent Mode, what does startTransition do?",
                "code_snippet": "startTransition(() => {\n    setSearchResults(expensiveFilter(query));\n});",
                "options": ["Marks the state update as non-urgent, allowing high-priority events (typing/clicks) to interrupt rendering", "Moves the function to a Web Worker background thread", "Performs synchronous DOM reconciliation immediately", "Prevents all re-renders of child components"],
                "correct_answer": "Marks the state update as non-urgent, allowing high-priority events (typing/clicks) to interrupt rendering",
                "explanation": "Transitions allow React to yield execution back to the browser between render passes, ensuring user input remains responsive.",
                "difficulty": "Hard"
            },
            {
                "id": 14,
                "category": "Predict the Output",
                "question": "What is the output of comparing objects and coercion?",
                "code_snippet": "console.log([] == ![]);",
                "options": ["true", "false", "TypeError", "undefined"],
                "correct_answer": "true",
                "explanation": "![] evaluates to false. The expression [] == false coerces [] to empty string '', which coerces to 0. false coerces to 0. 0 == 0 evaluates to true.",
                "difficulty": "Hard"
            },
            {
                "id": 15,
                "category": "Spot the Bug",
                "question": "What is the bug in this TypeScript generic function?",
                "code_snippet": "function getLength<T>(arg: T): number {\n    return arg.length;\n}",
                "options": ["Property 'length' does not exist on type 'T'; needs constraint <T extends { length: number }>", "Generics cannot return primitive number types", "T must be declared as any", "length is a reserved keyword in TypeScript"],
                "correct_answer": "Property 'length' does not exist on type 'T'; needs constraint <T extends { length: number }>",
                "explanation": "Without a generic constraint (T extends { length: number }), TypeScript cannot verify that arbitrary types passed to T contain a length property.",
                "difficulty": "Hard"
            },
            {
                "id": 16,
                "category": "Time & Space Complexity",
                "question": "What is the time complexity of Array.prototype.sort() in modern JavaScript engines?",
                "code_snippet": "arr.sort((a, b) => a - b);",
                "options": ["O(N log N) using Timsort", "O(N^2) using QuickSort", "O(N) using Counting Sort", "O(N log N) using HeapSort"],
                "correct_answer": "O(N log N) using Timsort",
                "explanation": "V8 and modern JS engines utilize Timsort (a hybrid of merge sort and insertion sort), providing O(N log N) worst-case time with stability.",
                "difficulty": "Hard"
            },
            {
                "id": 17,
                "category": "Predict the Output",
                "question": "What will be printed when passing arguments to an async IIFE?",
                "code_snippet": "async function calculate() {\n    return 42;\n}\nconst res = calculate();\nconsole.log(res);",
                "options": ["Promise { 42 }", "42", "undefined", "[object AsyncFunction]"],
                "correct_answer": "Promise { 42 }",
                "explanation": "Async functions always wrap their return value in a resolved Promise. Without await, res holds the pending/fulfilled Promise object.",
                "difficulty": "Hard"
            },
            {
                "id": 18,
                "category": "Spot the Bug",
                "question": "What race condition exists in this data fetching hook?",
                "code_snippet": "useEffect(() => {\n    fetch(`/api/user/${id}`).then(res => res.json()).then(data => setUser(data));\n}, [id]);",
                "options": ["If id changes rapidly, an earlier slow request can resolve after a newer request, overwriting state with stale data", "useEffect cannot invoke fetch", "Promises cannot call setUser directly", "Missing id dependency"],
                "correct_answer": "If id changes rapidly, an earlier slow request can resolve after a newer request, overwriting state with stale data",
                "explanation": "Network responses can arrive out of order. An AbortController or ignore flag in cleanup is required to discard responses from obsolete IDs.",
                "difficulty": "Hard"
            },
            {
                "id": 19,
                "category": "System & Concurrency",
                "question": "How does WeakMap differ from Map regarding garbage collection?",
                "code_snippet": "const wm = new WeakMap();",
                "options": ["Keys must be objects, and they do not prevent garbage collection if no other references exist", "WeakMap stores values in browser session storage", "WeakMap keys are strongly held until explicitly deleted", "WeakMap accepts primitive string keys only"],
                "correct_answer": "Keys must be objects, and they do not prevent garbage collection if no other references exist",
                "explanation": "WeakMap holds weak references to its object keys. If an object key is deleted everywhere else, its entry in the WeakMap is automatically collected.",
                "difficulty": "Hard"
            },
            {
                "id": 20,
                "category": "Predict the Output",
                "question": "What is logged when invoking a generator twice?",
                "code_snippet": "function* gen() {\n    yield 1;\n    yield 2;\n}\nconst g1 = gen();\nconst g2 = gen();\nconsole.log(g1.next().value, g2.next().value);",
                "options": ["1 1", "1 2", "2 2", "undefined undefined"],
                "correct_answer": "1 1",
                "explanation": "Each generator call gen() returns an independent generator iterator instance with its own execution state. Both yield their first value 1.",
                "difficulty": "Hard"
            }
        ]

    # HTML / CSS / FRONTEND HARD BANK
    if "html" in s or "css" in s or "web" in s or "frontend" in s:
        return [
            {
                "id": 1,
                "category": "Predict the Output",
                "question": "Which CSS rule wins according to specificity calculations?",
                "code_snippet": "/* Rule 1 */ div#header .nav a { color: blue; }\n/* Rule 2 */ body div#header nav a.active { color: red; }\n/* Rule 3 */ #header .nav a.active { color: green; }",
                "options": ["Rule 2 (ID: 1, Class: 1, Tag: 3 = 113)", "Rule 1 (ID: 1, Class: 1, Tag: 2 = 112)", "Rule 3 (ID: 1, Class: 2, Tag: 1 = 121)", "The last one written in the stylesheet always wins"],
                "correct_answer": "Rule 3 (ID: 1, Class: 2, Tag: 1 = 121)",
                "explanation": "Rule 3 has 1 ID (#header), 2 classes (.nav, .active), and 1 tag (a), totaling 0-1-2-1. Rule 2 has 0-1-1-3. Rule 3 has higher specificity.",
                "difficulty": "Hard"
            },
            {
                "id": 2,
                "category": "Spot the Bug",
                "question": "Why does height: 100% fail to expand a child element to fill the full viewport height?",
                "code_snippet": ".child {\n    height: 100%;\n    background: red;\n}",
                "options": ["The parent (and html/body) lacks an explicit height definition, so percentage height evaluates to auto", "height: 100% is deprecated; only 100vh is permitted", "Percentages cannot be used on block level elements", "CSS requires overflow: visible for percentage heights"],
                "correct_answer": "The parent (and html/body) lacks an explicit height definition, so percentage height evaluates to auto",
                "explanation": "Percentage heights require an ancestor with an explicit non-auto height. If html and body are not set to 100%, .child cannot compute 100% of auto.",
                "difficulty": "Hard"
            },
            {
                "id": 3,
                "category": "System & Concurrency",
                "question": "How does setting will-change: transform optimize CSS animation performance?",
                "code_snippet": ".card {\n    will-change: transform;\n    transition: transform 0.3s ease;\n}",
                "options": ["Promotes the element to a dedicated GPU compositing layer, bypassing layout reflows and paint cycles", "Forces JavaScript to run on a background thread", "Disables browser garbage collection during animations", "Increases browser frame rate from 60fps to 144fps automatically"],
                "correct_answer": "Promotes the element to a dedicated GPU compositing layer, bypassing layout reflows and paint cycles",
                "explanation": "will-change signals the rendering engine to allocate a separate GPU texture layer, avoiding expensive CPU layout recalculations and repaints.",
                "difficulty": "Hard"
            },
            {
                "id": 4,
                "category": "Predict the Output",
                "question": "What is the computed width of .box under standard W3C box-sizing: content-box?",
                "code_snippet": ".box {\n    width: 200px;\n    padding: 20px;\n    border: 5px solid black;\n    margin: 10px;\n}",
                "options": ["250px total horizontal space occupied", "200px", "240px", "270px"],
                "correct_answer": "250px total horizontal space occupied",
                "explanation": "Under content-box: Total width = width (200px) + left/right padding (40px) + left/right border (10px) = 250px. (Margins are external).",
                "difficulty": "Hard"
            },
            {
                "id": 5,
                "category": "Spot the Bug",
                "question": "What causes z-index: 9999 to fail to appear above an element with z-index: 2?",
                "code_snippet": "<div class=\"parent\" style=\"position: relative; z-index: 1;\">\n  <div class=\"child\" style=\"position: absolute; z-index: 9999;\">Menu</div>\n</div>\n<div class=\"sibling\" style=\"position: relative; z-index: 2;\">Banner</div>",
                "options": ["The child is trapped in the parent's stacking context (z-index: 1), which is lower than the sibling's context (z-index: 2)", "z-index cannot exceed 1000 in CSS specs", "Absolute children must have position: fixed", "z-index only applies to inline elements"],
                "correct_answer": "The child is trapped in the parent's stacking context (z-index: 1), which is lower than the sibling's context (z-index: 2)",
                "explanation": "Stacking contexts isolate child layers. Since .parent has z-index: 1, its entire subtree cannot render in front of a sibling with z-index: 2.",
                "difficulty": "Hard"
            }
        ]

    # GENERIC HIGH-TECH HARD FALLBACK FOR OTHER LANGUAGES (Java, C++, Go, Rust, etc.)
    return [
        {
            "id": 1,
            "category": "Predict the Output",
            "question": f"In {skill}, what is the result of evaluating memory pointers or references across function scope boundaries?",
            "code_snippet": "// Scope allocation and pointer lifetime validation in " + skill + "\nvoid process() {\n    // Dynamic allocation without immediate deallocation\n}",
            "options": ["Object lifetime is tied to stack frame unless heap allocated or managed by escape analysis", "Memory is instantly zeroed upon function entry", "Garbage collector forces synchronous execution pause", "The pointer becomes null automatically"],
            "correct_answer": "Object lifetime is tied to stack frame unless heap allocated or managed by escape analysis",
            "explanation": "Stack-allocated variables are deallocated when their containing stack frame unwinds. Heap allocations persist until explicitly freed or garbage-collected.",
            "difficulty": "Hard"
        },
        {
            "id": 2,
            "category": "Spot the Bug",
            "question": f"Which common concurrency issue occurs when multiple worker routines read and write shared data in {skill}?",
            "code_snippet": "// Unsynchronized concurrent mutation in " + skill,
            "options": ["Data race resulting in undefined behavior or inconsistent state due to missing mutex / atomic operations", "CPU core frequency throttling", "Automatic type coercion failure", "Compiler warning treated as fatal crash"],
            "correct_answer": "Data race resulting in undefined behavior or inconsistent state due to missing mutex / atomic operations",
            "explanation": "Concurrent unsynchronized access where at least one thread writes causes data races, corrupting internal structures.",
            "difficulty": "Hard"
        },
        {
            "id": 3,
            "category": "Time & Space Complexity",
            "question": f"What is the time complexity of searching an element in a balanced binary search tree (e.g. Red-Black Tree) in {skill}?",
            "code_snippet": "tree.find(key)",
            "options": ["O(log N) worst case and average case", "O(N) guaranteed", "O(1) amortized", "O(N log N)"],
            "correct_answer": "O(log N) worst case and average case",
            "explanation": "Self-balancing binary search trees maintain a maximum height of O(log N), guaranteeing logarithmic search, insertion, and deletion.",
            "difficulty": "Hard"
        },
        {
            "id": 4,
            "category": "System & Concurrency",
            "question": f"When designing high-throughput services with {skill}, what is the main benefit of connection pooling?",
            "code_snippet": "// Database connection pool management",
            "options": ["Reuses pre-established TCP and TLS handshakes, drastically lowering per-query latency and socket exhaustion", "Encrypts all SQL queries with AES-256 in memory", "Bypasses database authentication entirely", "Increases maximum database table size"],
            "correct_answer": "Reuses pre-established TCP and TLS handshakes, drastically lowering per-query latency and socket exhaustion",
            "explanation": "Creating new database connections requires 3-way TCP handshakes, TLS handshakes, and process allocation. Connection pooling keeps sockets warm.",
            "difficulty": "Hard"
        },
        {
            "id": 5,
            "category": "Predict the Output",
            "question": f"What happens when an arithmetic overflow occurs with fixed-width signed 32-bit integers in {skill}?",
            "code_snippet": "int32_t val = 2147483647;\nval = val + 1;",
            "options": ["Wraps around to -2147483648 (in two's complement) or causes undefined behavior", "Throws a fatal compile-time exception", "Automatically expands to an arbitrary-precision BigInt", "Silently sets val to 0"],
            "correct_answer": "Wraps around to -2147483648 (in two's complement) or causes undefined behavior",
            "explanation": "In 32-bit two's complement representation, adding 1 to 0x7FFFFFFF flips the sign bit to 0x80000000 (-2147483648). In languages like C/C++, signed overflow is undefined behavior.",
            "difficulty": "Hard"
        }
    ]

# =========================================================================
# AI DYNAMIC 20-QUESTION GENERATOR (WITH RANDOMIZATION & SHUFFLED OPTIONS)
# =========================================================================

def randomize_and_format_questions(questions: list, count: int = 20) -> list:
    """Randomly samples questions and shuffles options so every test session is distinct."""
    if not questions:
        return []
    
    # Deep copy
    pool = [dict(q) for q in questions]
    
    # If pool has at least count items, sample randomly
    if len(pool) >= count:
        selected = random.sample(pool, count)
    else:
        selected = list(pool)
        
    random.shuffle(selected)
    
    formatted = []
    for idx, q in enumerate(selected):
        new_q = dict(q)
        new_q["id"] = idx + 1
        
        # Shuffle options while preserving the correct answer string
        options = list(new_q.get("options", []))
        if options:
            random.shuffle(options)
            new_q["options"] = options
            
        formatted.append(new_q)
        
    return formatted

def generate_quiz_questions(skill: str, count: int = 20) -> list:
    cleaned_skill = skill.strip()
    api_keys = get_api_keys()
    curated = get_curated_mcqs(cleaned_skill)

    # 1. Attempt dynamic generation with Google Gemini using pool of keys (automatic failover)
    if api_keys:
        random_focus = random.choice([
            "concurrency race conditions, memory allocators, and Big-O edge cases",
            "asynchronous event loops, microtask queues, and recursion limits",
            "pointer lifetimes, stack vs heap allocation, and type narrowing",
            "system scale bottlenecks, state consistency, and cache coherence"
        ])
        prompt = f"""
        You are an elite Principal Software Engineer at a FAANG company designing a fresh technical assessment for: {cleaned_skill}.
        Session technical focus: {random_focus}.
        Generate exactly {count} HARD, HIGH-SIGNAL multiple choice questions (MCQ).
        
        The questions must cover these 4 mandatory engineering archetypes:
        1. 'Predict the Output' (Trace tricky code execution, event loop, closures, scope, recursion, pointers).
        2. 'Spot the Bug' (Find the memory leak, race condition, off-by-one, security vulnerability, or edge case).
        3. 'Time & Space Complexity' (Big-O analysis of realistic non-trivial algorithms).
        4. 'System & Concurrency' (Architecture trade-offs, scaling bottlenecks, state synchronization).

        CRITICAL RULES:
        - NO simple definition questions (NEVER ask 'What does X stand for?' or 'What is a variable?').
        - Every question MUST include a realistic code snippet (4 to 8 lines).
        - Provide 4 realistic options where incorrect options represent common developer misconceptions.

        Return ONLY a valid JSON array of {count} objects matching this exact structure:
        [
          {{
            "id": 1,
            "category": "Predict the Output",
            "question": "Clear question text?",
            "code_snippet": "// 4 to 8 lines of realistic code in {cleaned_skill}",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Exact matching string of the correct option",
            "explanation": "1-2 sentence technical explanation of why it is correct and why other approaches fail.",
            "difficulty": "Hard"
          }}
        ]
        """
        for idx, key in enumerate(api_keys):
            try:
                genai.configure(api_key=key)
                model = genai.GenerativeModel('gemini-3.8-flash')
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                parsed = json.loads(response.text)
                if isinstance(parsed, list) and len(parsed) >= count:
                    return randomize_and_format_questions(parsed, count)
                elif isinstance(parsed, list) and len(parsed) > 0:
                    combined = parsed + curated
                    return randomize_and_format_questions(combined, count)
            except Exception as err:
                logging.warning(f"AI API key #{idx+1} note ({err}). Trying next key in pool if available.")

    # 2. Curated Bank with Random Sampling & Shuffled Options (Instant fallback when AI hits 429 quota or offline)
    while len(curated) < count:
        curated.append({
            "id": len(curated) + 1,
            "category": "System & Concurrency",
            "question": f"In production systems using {cleaned_skill}, what architectural pattern prevents cascading microservice failures?",
            "code_snippet": "// Resilience & Circuit Breaking pattern in " + cleaned_skill,
            "options": [
                "Circuit Breaker with exponential backoff retries and fallback endpoints",
                "Infinite immediate synchronous retries without timeout limits",
                "Spawning unlimited unconstrained worker threads",
                "Disabling logging and monitoring to save CPU cycles"
            ],
            "correct_answer": "Circuit Breaker with exponential backoff retries and fallback endpoints",
            "explanation": "Circuit breakers trip open when downstream dependencies fail, shielding the caller from socket exhaustion and cascading outages.",
            "difficulty": "Hard"
        })

    return randomize_and_format_questions(curated, count)

# =========================================================================
# 2 CODING CHALLENGES WITH 6 TEST CASES (4 PUBLIC + 2 HIDDEN EDGE CASES)
# =========================================================================

def generate_coding_challenges(skill: str) -> list:
    s = skill.strip().lower()

    if "python" in s:
        pool = [
            {
                "id": "py-p1",
                "title": "Stream Anomaly Sliding Window",
                "difficulty": "Medium",
                "category": "Arrays & Sliding Window",
                "description": "Given a list of integer telemetry readings `readings` and a window size `k`, find the maximum sum of any contiguous subsegment of length `k`. If `k` is larger than the list length or list is empty, return 0.",
                "examples": [
                    {
                        "input": "readings = [1, 4, 2, 10, 23, 3, 1, 0, 20], k = 4",
                        "output": "39",
                        "explanation": "Subsegment [4, 2, 10, 23] yields sum 39."
                    }
                ],
                "constraints": [
                    "0 <= len(readings) <= 10^5",
                    "-10^4 <= readings[i] <= 10^4",
                    "1 <= k <= 10^5",
                    "Target Time Complexity: O(N)"
                ],
                "starter_code": "def max_subsegment_sum(readings: list[int], k: int) -> int:\n    # Write your solution here\n    pass\n",
                "test_cases": [
                    {"id": 1, "input": "[1, 4, 2, 10, 23, 3, 1, 0, 20], 4", "expected_output": "39", "is_hidden": False, "description": "Standard positive array"},
                    {"id": 2, "input": "[100, 200, 300, 400], 2", "expected_output": "700", "is_hidden": False, "description": "Strictly ascending array"},
                    {"id": 3, "input": "[-1, -2, -3, -4], 2", "expected_output": "-3", "is_hidden": False, "description": "All negative elements"},
                    {"id": 4, "input": "[5], 1", "expected_output": "5", "is_hidden": False, "description": "Single element boundary"},
                    {"id": 5, "input": "[], 3", "expected_output": "0", "is_hidden": True, "description": "Hidden: Empty input boundary"},
                    {"id": 6, "input": "[1, 2], 5", "expected_output": "0", "is_hidden": True, "description": "Hidden: Window k exceeds array length"}
                ]
            },
            {
                "id": "py-p2",
                "title": "Least Recently Used (LRU) Cache Invalidation",
                "difficulty": "Hard",
                "category": "Hash Table & Doubly Linked List",
                "description": "Implement a helper function `lru_simulate(capacity: int, operations: list[tuple])` that executes a stream of ('GET', key) and ('PUT', key, value) commands and returns the list of values produced by all 'GET' operations. If key not found, return -1.",
                "examples": [
                    {
                        "input": "capacity = 2, operations = [('PUT', 1, 1), ('PUT', 2, 2), ('GET', 1), ('PUT', 3, 3), ('GET', 2)]",
                        "output": "[1, -1]",
                        "explanation": "Key 2 was evicted when key 3 was inserted because key 1 was accessed by GET."
                    }
                ],
                "constraints": [
                    "1 <= capacity <= 10^4",
                    "Operations length <= 10^5",
                    "Expected Time per operation: O(1) average"
                ],
                "starter_code": "def lru_simulate(capacity: int, operations: list) -> list:\n    # Write your solution here\n    pass\n",
                "test_cases": [
                    {"id": 1, "input": "2, [('PUT', 1, 10), ('PUT', 2, 20), ('GET', 1)]", "expected_output": "[10]", "is_hidden": False, "description": "Basic put and get"},
                    {"id": 2, "input": "2, [('PUT', 1, 1), ('PUT', 2, 2), ('PUT', 3, 3), ('GET', 1)]", "expected_output": "[-1]", "is_hidden": False, "description": "Eviction check"},
                    {"id": 3, "input": "1, [('PUT', 5, 50), ('GET', 5), ('PUT', 6, 60), ('GET', 5)]", "expected_output": "[50, -1]", "is_hidden": False, "description": "Capacity 1 eviction"},
                    {"id": 4, "input": "3, [('GET', 99)]", "expected_output": "[-1]", "is_hidden": False, "description": "Miss on empty cache"},
                    {"id": 5, "input": "2, [('PUT', 1, 100), ('PUT', 1, 200), ('GET', 1)]", "expected_output": "[200]", "is_hidden": True, "description": "Hidden: Updating existing key"},
                    {"id": 6, "input": "2, [('PUT', 1, 1), ('PUT', 2, 2), ('GET', 1), ('PUT', 3, 3), ('GET', 2), ('GET', 3)]", "expected_output": "[1, -1, 3]", "is_hidden": True, "description": "Hidden: Complex multi-step access pattern"}
                ]
            },
            {
                "id": "py-p3",
                "title": "Two Sum Target Finder (Python)",
                "difficulty": "Medium",
                "category": "Hash Map & Lookups",
                "description": "Given a list of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Exactly one valid answer exists.",
                "examples": [
                    {"input": "nums = [2, 7, 11, 15], target = 9", "output": "[0, 1]", "explanation": "nums[0] + nums[1] == 9"}
                ],
                "constraints": ["2 <= len(nums) <= 10^4", "Target Time: O(N)"],
                "starter_code": "def two_sum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass\n",
                "test_cases": [
                    {"id": 1, "input": "[2, 7, 11, 15], 9", "expected_output": "[0, 1]", "is_hidden": False, "description": "Basic positive array"},
                    {"id": 2, "input": "[3, 2, 4], 6", "expected_output": "[1, 2]", "is_hidden": False, "description": "Non-zero start indices"},
                    {"id": 3, "input": "[3, 3], 6", "expected_output": "[0, 1]", "is_hidden": False, "description": "Duplicate values"},
                    {"id": 4, "input": "[-1, -2, -3, -4, -5], -8", "expected_output": "[2, 4]", "is_hidden": False, "description": "Negative numbers"},
                    {"id": 5, "input": "[0, 4, 3, 0], 0", "expected_output": "[0, 3]", "is_hidden": True, "description": "Hidden: Zero elements"},
                    {"id": 6, "input": "[1000000, 500, 1000000], 2000000", "expected_output": "[0, 2]", "is_hidden": True, "description": "Hidden: Large numbers"}
                ]
            },
            {
                "id": "py-p4",
                "title": "Valid Balanced Parentheses (Python)",
                "difficulty": "Hard",
                "category": "Stack & String Parsing",
                "description": "Given a string `s` containing brackets '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
                "examples": [
                    {"input": "s = '()[]{}'", "output": "true", "explanation": "All brackets matched in pairs."}
                ],
                "constraints": ["1 <= len(s) <= 10^4", "Target Time: O(N)"],
                "starter_code": "def is_valid(s: str) -> bool:\n    # Write your solution here\n    pass\n",
                "test_cases": [
                    {"id": 1, "input": "'()[]{}'", "expected_output": "true", "is_hidden": False, "description": "Sequential matched pairs"},
                    {"id": 2, "input": "'([{}])'", "expected_output": "true", "is_hidden": False, "description": "Nested balanced pairs"},
                    {"id": 3, "input": "'(]'", "expected_output": "false", "is_hidden": False, "description": "Mismatched closing bracket"},
                    {"id": 4, "input": "'([)]'", "expected_output": "false", "is_hidden": False, "description": "Improper nesting"},
                    {"id": 5, "input": "']'", "expected_output": "false", "is_hidden": True, "description": "Hidden: Single closing bracket"},
                    {"id": 6, "input": "'(((((((((())))))))))'", "expected_output": "true", "is_hidden": True, "description": "Hidden: Deep nesting"}
                ]
            }
        ]
        selected = random.sample(pool, 2)
        return [
            {**ch, "title": f"Problem {i+1}: {ch['title']}"}
            for i, ch in enumerate(selected)
        ]

    # JAVASCRIPT / TYPESCRIPT DEFAULT CHALLENGES
    if "javascript" in s or "typescript" in s or "node" in s or "react" in s:
        pool = [
            {
                "id": "js-p1",
                "title": "Asynchronous Concurrency Limiter",
                "difficulty": "Medium",
                "category": "Async Programming & Promise Queues",
                "description": "Write a function `chunkAndFlatten(arr, chunkSize)` that partitions an array into subarrays of at most `chunkSize`, filters out any falsy values (`null`, `undefined`, `0`, `false`, `\"\"`), and returns the chunked array.",
                "examples": [
                    {
                        "input": "arr = [1, 0, 2, false, 3, null, 4], chunkSize = 2",
                        "output": "[[1, 2], [3, 4]]",
                        "explanation": "Filtered items [1, 2, 3, 4] partitioned into chunks of 2."
                    }
                ],
                "constraints": ["0 <= arr.length <= 10^5", "chunkSize >= 1"],
                "starter_code": "function chunkAndFlatten(arr, chunkSize) {\n    // Write your solution here\n    \n}\n",
                "test_cases": [
                    {"id": 1, "input": "[1, 0, 2, false, 3, null, 4], 2", "expected_output": "[[1, 2], [3, 4]]", "is_hidden": False, "description": "Filter falsy and chunk"},
                    {"id": 2, "input": "[1, 2, 3, 4, 5], 3", "expected_output": "[[1, 2, 3], [4, 5]]", "is_hidden": False, "description": "Uneven chunk size"},
                    {"id": 3, "input": "[null, undefined, 0, false], 2", "expected_output": "[]", "is_hidden": False, "description": "All falsy items"},
                    {"id": 4, "input": "[10, 20], 5", "expected_output": "[[10, 20]]", "is_hidden": False, "description": "Chunk size greater than length"},
                    {"id": 5, "input": "[], 4", "expected_output": "[]", "is_hidden": True, "description": "Hidden: Empty array boundary"},
                    {"id": 6, "input": "[1, 2, 3, 4, 5, 6], 1", "expected_output": "[[1], [2], [3], [4], [5], [6]]", "is_hidden": True, "description": "Hidden: Single item chunks"}
                ]
            },
            {
                "id": "js-p2",
                "title": "Deep Object Invariant Validator",
                "difficulty": "Hard",
                "category": "Recursion & Data Transformation",
                "description": "Write a function `deepFlattenKeys(obj, prefix = '')` that takes a deeply nested object and returns a flat single-level object where keys are dot-separated paths.",
                "examples": [
                    {
                        "input": "{ a: 1, b: { c: 2, d: { e: 3 } } }",
                        "output": "{ 'a': 1, 'b.c': 2, 'b.d.e': 3 }",
                        "explanation": "Nested keys flattened into dot notation."
                    }
                ],
                "constraints": ["Object depth <= 50", "Object properties <= 1000"],
                "starter_code": "function deepFlattenKeys(obj, prefix = '') {\n    // Write your solution here\n    \n}\n",
                "test_cases": [
                    {"id": 1, "input": "{ a: 1, b: { c: 2 } }", "expected_output": "{\"a\":1,\"b.c\":2}", "is_hidden": False, "description": "Basic 2-level nesting"},
                    {"id": 2, "input": "{ x: { y: { z: 42 } } }", "expected_output": "{\"x.y.z\":42}", "is_hidden": False, "description": "3-level nesting"},
                    {"id": 3, "input": "{ simple: 'value' }", "expected_output": "{\"simple\":\"value\"}", "is_hidden": False, "description": "Flat object"},
                    {"id": 4, "input": "{ a: null, b: 0 }", "expected_output": "{\"a\":null,\"b\":0}", "is_hidden": False, "description": "Primitive null and zero values"},
                    {"id": 5, "input": "{}", "expected_output": "{}", "is_hidden": True, "description": "Hidden: Empty object boundary"},
                    {"id": 6, "input": "{ a: { b: { c: { d: 'deep' } } } }", "expected_output": "{\"a.b.c.d\":\"deep\"}", "is_hidden": True, "description": "Hidden: Deep multi-tier nesting"}
                ]
            },
            {
                "id": "js-p3",
                "title": "Two Sum Target Finder (JavaScript)",
                "difficulty": "Medium",
                "category": "Arrays & Hash Map",
                "description": "Write a function `twoSum(nums, target)` that returns the indices of the two numbers in `nums` that add up to `target`.",
                "examples": [
                    {"input": "nums = [2, 7, 11, 15], target = 9", "output": "[0, 1]", "explanation": "nums[0] + nums[1] == 9"}
                ],
                "constraints": ["2 <= nums.length <= 10^4", "Target Time: O(N)"],
                "starter_code": "function twoSum(nums, target) {\n    // Write your solution here\n    \n}\n",
                "test_cases": [
                    {"id": 1, "input": "[2, 7, 11, 15], 9", "expected_output": "[0, 1]", "is_hidden": False, "description": "Standard positive array"},
                    {"id": 2, "input": "[3, 2, 4], 6", "expected_output": "[1, 2]", "is_hidden": False, "description": "Non-zero start indices"},
                    {"id": 3, "input": "[3, 3], 6", "expected_output": "[0, 1]", "is_hidden": False, "description": "Duplicate values"},
                    {"id": 4, "input": "[-1, -2, -3, -4, -5], -8", "expected_output": "[2, 4]", "is_hidden": False, "description": "Negative numbers"},
                    {"id": 5, "input": "[0, 4, 3, 0], 0", "expected_output": "[0, 3]", "is_hidden": True, "description": "Hidden: Zero elements"},
                    {"id": 6, "input": "[1000000, 500, 1000000], 2000000", "expected_output": "[0, 2]", "is_hidden": True, "description": "Hidden: Large integers"}
                ]
            },
            {
                "id": "js-p4",
                "title": "Valid Balanced Parentheses (JavaScript)",
                "difficulty": "Hard",
                "category": "Stack & String Parsing",
                "description": "Given a string `s` containing brackets, write `isValid(s)` to determine if open brackets are properly closed in valid order.",
                "examples": [
                    {"input": "s = '()[]{}'", "output": "true", "explanation": "Brackets match correctly."}
                ],
                "constraints": ["1 <= s.length <= 10^4", "Target Time: O(N)"],
                "starter_code": "function isValid(s) {\n    // Write your solution here\n    \n}\n",
                "test_cases": [
                    {"id": 1, "input": "'()[]{}'", "expected_output": "true", "is_hidden": False, "description": "Sequential matched pairs"},
                    {"id": 2, "input": "'([{}])'", "expected_output": "true", "is_hidden": False, "description": "Nested balanced pairs"},
                    {"id": 3, "input": "'(]'", "expected_output": "false", "is_hidden": False, "description": "Mismatched closing bracket"},
                    {"id": 4, "input": "'([)]'", "expected_output": "false", "is_hidden": False, "description": "Improper nesting"},
                    {"id": 5, "input": "']'", "expected_output": "false", "is_hidden": True, "description": "Hidden: Single closing bracket"},
                    {"id": 6, "input": "'(((((((((())))))))))'", "expected_output": "true", "is_hidden": True, "description": "Hidden: Deep nesting"}
                ]
            }
        ]
        selected = random.sample(pool, 2)
        return [
            {**ch, "title": f"Problem {i+1}: {ch['title']}"}
            for i, ch in enumerate(selected)
        ]

    # HTML / CSS DOM TESTCASE CHALLENGES
    if "html" in s or "css" in s or "web" in s or "frontend" in s:
        return [
            {
                "id": "html-p1",
                "title": "Problem 1: Responsive Flexbox Card Component",
                "difficulty": "Medium",
                "category": "HTML5 & CSS3 Layouts",
                "description": "Construct a responsive product card element with class `profile-card`. The container must use flexbox layout, center items horizontally, have a padding of 24px, a border-radius of 12px, and a subtle border.",
                "examples": [
                    {
                        "input": "<div class=\"profile-card\"><h2>Alex Morgan</h2><p>Senior Engineer</p></div>",
                        "output": "DOM satisfies: display=flex, align-items=center, border-radius=12px",
                        "explanation": "DOM computed style tests pass specifications."
                    }
                ],
                "constraints": [
                    "Must use valid semantic HTML5",
                    "Must satisfy pure CSS flexbox rules"
                ],
                "starter_code": "<style>\n/* Implement required CSS styles for .profile-card below */\n.profile-card {\n    \n}\n</style>\n\n<div class=\"profile-card\">\n    <!-- Add required child elements here -->\n    \n</div>\n",
                "test_cases": [
                    {"id": 1, "input": "Check .profile-card existence", "expected_output": "Element present", "is_hidden": False, "description": "Root element exists"},
                    {"id": 2, "input": "Computed display property", "expected_output": "flex", "is_hidden": False, "description": "Uses flexbox"},
                    {"id": 3, "input": "Computed border-radius", "expected_output": "12px", "is_hidden": False, "description": "Border radius is 12px"},
                    {"id": 4, "input": "Computed padding", "expected_output": "24px", "is_hidden": False, "description": "Padding is 24px"},
                    {"id": 5, "input": "Child heading existence", "expected_output": "h2 element verified", "is_hidden": True, "description": "Hidden: Semantic heading tag"},
                    {"id": 6, "input": "Child paragraph existence", "expected_output": "p element verified", "is_hidden": True, "description": "Hidden: Semantic paragraph tag"}
                ]
            },
            {
                "id": "html-p2",
                "title": "Problem 2: CSS Grid Responsive Dashboard Widget",
                "difficulty": "Hard",
                "category": "CSS Grid Architecture",
                "description": "Create a 3-column responsive dashboard container with class `dashboard-grid`. Must use CSS Grid (`display: grid`), have a column gap of 16px, and 3 equal-width columns (`repeat(3, 1fr)`).",
                "examples": [
                    {
                        "input": "<div class=\"dashboard-grid\"><div class=\"card\">1</div><div class=\"card\">2</div><div class=\"card\">3</div></div>",
                        "output": "display=grid, gap=16px, 3 equal columns",
                        "explanation": "CSS grid attributes verified by test runner."
                    }
                ],
                "constraints": [
                    "display: grid required",
                    "gap: 16px required"
                ],
                "starter_code": "<style>\n/* Implement CSS Grid rules for .dashboard-grid below */\n.dashboard-grid {\n    \n}\n</style>\n\n<div class=\"dashboard-grid\">\n    <!-- Add grid child items below -->\n    \n</div>\n",
                "test_cases": [
                    {"id": 1, "input": "Check .dashboard-grid", "expected_output": "Element present", "is_hidden": False, "description": "Grid container exists"},
                    {"id": 2, "input": "Computed display property", "expected_output": "grid", "is_hidden": False, "description": "Uses CSS grid"},
                    {"id": 3, "input": "Computed gap", "expected_output": "16px", "is_hidden": False, "description": "Gap is 16px"},
                    {"id": 4, "input": "Computed child count", "expected_output": "3 cards present", "is_hidden": False, "description": "Contains 3 metric cards"},
                    {"id": 5, "input": "Border radius on child cards", "expected_output": "8px", "is_hidden": True, "description": "Hidden: Child card rounding"},
                    {"id": 6, "input": "Background color check", "expected_output": "#F8FAFC", "is_hidden": True, "description": "Hidden: Theme styling"}
                ]
            }
        ]

    # GENERAL SOFTWARE CHALLENGES FOR ALL OTHER LANGUAGES (Java, C++, Go, Rust, C#, etc.)
    general_pool = [
        {
            "id": f"{s}-p1",
            "title": f"Two Sum Target Finder ({skill})",
            "difficulty": "Medium",
            "category": "Arrays & Hash Table",
            "description": f"Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Exactly one solution exists. Solve in {skill}.",
            "examples": [
                {
                    "input": "nums = [2, 7, 11, 15], target = 9",
                    "output": "[0, 1]",
                    "explanation": "nums[0] + nums[1] == 9, so return [0, 1]."
                }
            ],
            "constraints": [
                "2 <= nums.length <= 10^4",
                "-10^9 <= nums[i] <= 10^9",
                "Target Time Complexity: O(N)"
            ],
            "starter_code": (
                "// Implement Two Sum solution in " + skill + "\n"
                "function twoSum(nums, target) {\n"
                "    // Write your solution here\n"
                "    \n"
                "}\n"
            ),
            "test_cases": [
                {"id": 1, "input": "[2, 7, 11, 15], 9", "expected_output": "[0, 1]", "is_hidden": False, "description": "Standard positive array"},
                {"id": 2, "input": "[3, 2, 4], 6", "expected_output": "[1, 2]", "is_hidden": False, "description": "Non-zero start indices"},
                {"id": 3, "input": "[3, 3], 6", "expected_output": "[0, 1]", "is_hidden": False, "description": "Duplicate values"},
                {"id": 4, "input": "[-1, -2, -3, -4, -5], -8", "expected_output": "[2, 4]", "is_hidden": False, "description": "Negative numbers"},
                {"id": 5, "input": "[0, 4, 3, 0], 0", "expected_output": "[0, 3]", "is_hidden": True, "description": "Hidden: Zero elements"},
                {"id": 6, "input": "[1000000, 500, 1000000], 2000000", "expected_output": "[0, 2]", "is_hidden": True, "description": "Hidden: Large integers"}
            ]
        },
        {
            "id": f"{s}-p2",
            "title": f"Valid Balanced Parentheses ({skill})",
            "difficulty": "Hard",
            "category": "Stack & String Parsing",
            "description": f"Given a string `s` containing brackets, determine if the input string is valid. Open brackets must be closed by the same type of brackets in the correct order. Solve in {skill}.",
            "examples": [
                {
                    "input": "s = '()[]{}'",
                    "output": "true",
                    "explanation": "All brackets matched correctly in pairs."
                },
                {
                    "input": "s = '(]'",
                    "output": "false",
                    "explanation": "Mismatched bracket types."
                }
            ],
            "constraints": [
                "1 <= s.length <= 10^4",
                "Target Time Complexity: O(N)",
                "Target Space Complexity: O(N)"
            ],
            "starter_code": (
                "// Implement Valid Parentheses in " + skill + "\n"
                "function isValid(s) {\n"
                "    // Write your solution here\n"
                "    \n"
                "}\n"
            ),
            "test_cases": [
                {"id": 1, "input": "'()[]{}'", "expected_output": "true", "is_hidden": False, "description": "Sequential matched pairs"},
                {"id": 2, "input": "'([{}])'", "expected_output": "true", "is_hidden": False, "description": "Nested balanced pairs"},
                {"id": 3, "input": "'(]'", "expected_output": "false", "is_hidden": False, "description": "Mismatched closing bracket"},
                {"id": 4, "input": "'([)]'", "expected_output": "false", "is_hidden": False, "description": "Interleaved improper nesting"},
                {"id": 5, "input": "']'", "expected_output": "false", "is_hidden": True, "description": "Hidden: Single closing bracket"},
                {"id": 6, "input": "'(((((((((())))))))))'", "expected_output": "true", "is_hidden": True, "description": "Hidden: Deep balanced nesting"}
            ]
        }
    ]
    return [
        {**ch, "title": f"Problem {i+1}: {ch['title']}"}
        for i, ch in enumerate(general_pool[:2])
    ]
