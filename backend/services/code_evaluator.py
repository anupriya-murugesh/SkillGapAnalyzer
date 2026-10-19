"""
Bridge-IQ Technical Assessment Code Evaluator Engine.
Safely executes and verifies candidate coding challenge submissions against
the 6 test cases (4 public + 2 hidden).
Supports Python, JavaScript, TypeScript, HTML/CSS, and General algorithmic challenges.
"""

import sys
import json
import subprocess
import time
import re
import traceback

def sanitize_code(code: str) -> bool:
    """Check for suspicious or dangerous operations in submitted code."""
    dangerous = [
        "import os", "import subprocess", "import shutil", "import sys",
        "open(", "eval(", "exec(", "__import__", "globals()", "locals()",
        "subprocess.", "os.system", "os.remove", "socket", "child_process",
        "fs.", "process.exit", "require('fs')", "require('child_process')"
    ]
    for d in dangerous:
        if d in code:
            return False
    return True

def is_scaffold_unmodified(code: str) -> bool:
    """Checks if the user submitted empty, default or untouched scaffold code."""
    cleaned = re.sub(r'#.*', '', code)
    cleaned = re.sub(r'//.*', '', cleaned)
    cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)
    cleaned = re.sub(r'<!--.*?-->', '', cleaned, flags=re.DOTALL)
    cleaned = cleaned.replace('\n', ' ').replace('\r', ' ').strip()
    
    # If all that remains is function def and pass or empty braces
    scaffold_patterns = [
        r'^def\s+\w+\s*\(.*?\)\s*(?:->\s*\w+)?\s*:\s*pass\s*$',
        r'^def\s+\w+\s*\(.*?\)\s*(?:->\s*\w+)?\s*:\s*$',
        r'^function\s+\w+\s*\(.*?\)\s*\{\s*\}\s*$',
        r'^function\s+\w+\s*\(.*?\)\s*\{\s*return\s*;\s*\}\s*$',
        r'^\s*$',
        r'^<style>\s*\.[\w-]+\s*\{\s*\}\s*</style>\s*<div\s+class="[\w-]+">\s*</div>\s*$'
    ]
    for pat in scaffold_patterns:
        if re.match(pat, cleaned):
            return True
            
    # If code is shorter than 25 chars after stripping comments
    if len(cleaned) < 25:
        return True
        
    return False

def evaluate_python_challenge(code: str, challenge_id: str, test_cases: list) -> list:
    """Executes Python code against test cases in an isolated subprocess."""
    if is_scaffold_unmodified(code):
        return [
            {
                "id": tc.get("id"),
                "passed": False,
                "description": tc.get("description"),
                "input": tc.get("input"),
                "expected_output": str(tc.get("expected_output")),
                "actual_output": "None (Scaffold Unimplemented)",
                "error": "Starter code was submitted without implementing function logic.",
                "execution_time_ms": 0,
                "is_hidden": tc.get("is_hidden", False)
            }
            for tc in test_cases
        ]

    if not sanitize_code(code):
        return [
            {
                "id": tc.get("id"),
                "passed": False,
                "description": tc.get("description"),
                "input": tc.get("input"),
                "expected_output": str(tc.get("expected_output")),
                "actual_output": "SecurityViolation",
                "error": "Restricted call or import detected. Code must be pure algorithmic logic.",
                "execution_time_ms": 0,
                "is_hidden": tc.get("is_hidden", False)
            }
            for tc in test_cases
        ]

    # Detect target function name from challenge_id or code
    fn_name = None
    if "p1" in challenge_id:
        if "max_subsegment_sum" in code:
            fn_name = "max_subsegment_sum"
        elif "twoSum" in code or "two_sum" in code:
            fn_name = "two_sum" if "def two_sum" in code else "twoSum"
    elif "p2" in challenge_id:
        if "lru_simulate" in code:
            fn_name = "lru_simulate"
        elif "isValid" in code or "is_valid" in code:
            fn_name = "is_valid" if "def is_valid" in code else "isValid"

    if not fn_name:
        match = re.search(r'def\s+([a-zA-Z_0-9]+)\s*\(', code)
        if match:
            fn_name = match.group(1)
        else:
            return [
                {
                    "id": tc.get("id"),
                    "passed": False,
                    "description": tc.get("description"),
                    "input": tc.get("input"),
                    "expected_output": str(tc.get("expected_output")),
                    "actual_output": "SyntaxError",
                    "error": "No valid function definition found in submission.",
                    "execution_time_ms": 0,
                    "is_hidden": tc.get("is_hidden", False)
                }
                for tc in test_cases
            ]

    runner_code = (
        "import json\n"
        "import sys\n\n"
        "# Candidate Code\n" + code + "\n\n"
        "test_inputs = " + json.dumps([tc.get("input") for tc in test_cases]) + "\n"
        "results = []\n\n"
        "for raw_input in test_inputs:\n"
        "    try:\n"
        "        eval_args = eval('(' + str(raw_input) + ',)')\n"
        "        ret = " + fn_name + "(*eval_args)\n"
        "        if isinstance(ret, bool):\n"
        "            res_str = 'true' if ret else 'false'\n"
        "        elif isinstance(ret, (list, tuple)):\n"
        "            res_str = json.dumps(list(ret))\n"
        "        elif isinstance(ret, dict):\n"
        "            res_str = json.dumps(ret, sort_keys=True)\n"
        "        elif ret is None:\n"
        "            res_str = 'None'\n"
        "        else:\n"
        "            res_str = str(ret)\n"
        "        results.append({'output': res_str, 'error': None})\n"
        "    except Exception as exc:\n"
        "        results.append({'output': 'Error', 'error': f'{type(exc).__name__}: {str(exc)}'})\n\n"
        "print(json.dumps(results))\n"
    )

    try:
        start_t = time.time()
        proc = subprocess.run(
            [sys.executable, "-c", runner_code],
            capture_output=True,
            text=True,
            timeout=3.0
        )
        elapsed_ms = max(1, int((time.time() - start_t) * 1000 / max(1, len(test_cases))))
        
        if proc.returncode != 0:
            err_line = proc.stderr.strip().splitlines()[-1] if proc.stderr else "Runtime execution error"
            return [
                {
                    "id": tc.get("id"),
                    "passed": False,
                    "description": tc.get("description"),
                    "input": tc.get("input"),
                    "expected_output": str(tc.get("expected_output")),
                    "actual_output": "RuntimeError",
                    "error": err_line,
                    "execution_time_ms": elapsed_ms,
                    "is_hidden": tc.get("is_hidden", False)
                }
                for tc in test_cases
            ]

        raw_json = proc.stdout.strip()
        parsed_runs = json.loads(raw_json)

        results = []
        for idx, tc in enumerate(test_cases):
            expected = str(tc.get("expected_output")).strip()
            run_data = parsed_runs[idx] if idx < len(parsed_runs) else {"output": "None", "error": "No output"}
            actual = str(run_data.get("output", "")).strip()
            err = run_data.get("error")

            norm_expected = expected.replace(" ", "").replace("'", '"').lower()
            norm_actual = actual.replace(" ", "").replace("'", '"').lower()
            
            passed = (err is None) and (norm_actual == norm_expected)

            results.append({
                "id": tc.get("id"),
                "passed": passed,
                "description": tc.get("description"),
                "input": tc.get("input"),
                "expected_output": expected,
                "actual_output": actual if not tc.get("is_hidden") or passed else "[Hidden: Output Mismatch]",
                "error": err,
                "execution_time_ms": elapsed_ms,
                "is_hidden": tc.get("is_hidden", False)
            })
        return results

    except subprocess.TimeoutExpired:
        return [
            {
                "id": tc.get("id"),
                "passed": False,
                "description": tc.get("description"),
                "input": tc.get("input"),
                "expected_output": str(tc.get("expected_output")),
                "actual_output": "TimeLimitExceeded",
                "error": "Time Limit Exceeded (>3.0s). Check for infinite loops.",
                "execution_time_ms": 3000,
                "is_hidden": tc.get("is_hidden", False)
            }
            for tc in test_cases
        ]
    except Exception as e:
        return [
            {
                "id": tc.get("id"),
                "passed": False,
                "description": tc.get("description"),
                "input": tc.get("input"),
                "expected_output": str(tc.get("expected_output")),
                "actual_output": "Error",
                "error": str(e),
                "execution_time_ms": 0,
                "is_hidden": tc.get("is_hidden", False)
            }
            for tc in test_cases
        ]

def evaluate_javascript_challenge(code: str, challenge_id: str, test_cases: list) -> list:
    """Executes JavaScript code against test cases using Node.js in an isolated process."""
    if is_scaffold_unmodified(code):
        return [
            {
                "id": tc.get("id"),
                "passed": False,
                "description": tc.get("description"),
                "input": tc.get("input"),
                "expected_output": str(tc.get("expected_output")),
                "actual_output": "undefined (Scaffold Unimplemented)",
                "error": "Starter code was submitted without implementing function logic.",
                "execution_time_ms": 0,
                "is_hidden": tc.get("is_hidden", False)
            }
            for tc in test_cases
        ]

    if not sanitize_code(code):
        return [
            {
                "id": tc.get("id"),
                "passed": False,
                "description": tc.get("description"),
                "input": tc.get("input"),
                "expected_output": str(tc.get("expected_output")),
                "actual_output": "SecurityViolation",
                "error": "Restricted call or require detected. Code must be pure algorithmic logic.",
                "execution_time_ms": 0,
                "is_hidden": tc.get("is_hidden", False)
            }
            for tc in test_cases
        ]

    # Find target function name
    fn_name = None
    if "p1" in challenge_id:
        if "chunkAndFlatten" in code:
            fn_name = "chunkAndFlatten"
        elif "twoSum" in code:
            fn_name = "twoSum"
    elif "p2" in challenge_id:
        if "deepFlattenKeys" in code:
            fn_name = "deepFlattenKeys"
        elif "isValid" in code:
            fn_name = "isValid"

    if not fn_name:
        match = re.search(r'function\s+([a-zA-Z_0-9]+)\s*\(', code)
        if match:
            fn_name = match.group(1)
        else:
            return [
                {
                    "id": tc.get("id"),
                    "passed": False,
                    "description": tc.get("description"),
                    "input": tc.get("input"),
                    "expected_output": str(tc.get("expected_output")),
                    "actual_output": "SyntaxError",
                    "error": "No valid function definition found in submission.",
                    "execution_time_ms": 0,
                    "is_hidden": tc.get("is_hidden", False)
                }
                for tc in test_cases
            ]

    # Build Node.js runner script
    node_runner = (
        "try {\n"
        "  // Candidate Code\n" + code + "\n\n"
        "  const testInputs = " + json.dumps([tc.get("input") for tc in test_cases]) + ";\n"
        "  const results = [];\n"
        "  for (const rawInput of testInputs) {\n"
        "    try {\n"
        "      const args = eval(`[${rawInput}]`);\n"
        "      const ret = " + fn_name + "(...args);\n"
        "      let outStr;\n"
        "      if (ret === undefined) {\n"
        "        outStr = 'undefined';\n"
        "      } else if (typeof ret === 'boolean') {\n"
        "        outStr = ret ? 'true' : 'false';\n"
        "      } else if (typeof ret === 'object' && ret !== null) {\n"
        "        outStr = JSON.stringify(ret);\n"
        "      } else {\n"
        "        outStr = String(ret);\n"
        "      }\n"
        "      results.push({ output: outStr, error: null });\n"
        "    } catch (e) {\n"
        "      results.push({ output: 'Error', error: e.message || String(e) });\n"
        "    }\n"
        "  }\n"
        "  console.log(JSON.stringify(results));\n"
        "} catch (topErr) {\n"
        "  console.error(topErr.message || String(topErr));\n"
        "  process.exit(1);\n"
        "}\n"
    )

    try:
        start_t = time.time()
        proc = subprocess.run(
            ["node", "-e", node_runner],
            capture_output=True,
            text=True,
            timeout=3.0
        )
        elapsed_ms = max(1, int((time.time() - start_t) * 1000 / max(1, len(test_cases))))

        if proc.returncode != 0:
            err_line = proc.stderr.strip().splitlines()[-1] if proc.stderr else "Runtime execution error"
            return [
                {
                    "id": tc.get("id"),
                    "passed": False,
                    "description": tc.get("description"),
                    "input": tc.get("input"),
                    "expected_output": str(tc.get("expected_output")),
                    "actual_output": "RuntimeError",
                    "error": err_line,
                    "execution_time_ms": elapsed_ms,
                    "is_hidden": tc.get("is_hidden", False)
                }
                for tc in test_cases
            ]

        raw_json = proc.stdout.strip()
        parsed_runs = json.loads(raw_json)

        results = []
        for idx, tc in enumerate(test_cases):
            expected = str(tc.get("expected_output")).strip()
            run_data = parsed_runs[idx] if idx < len(parsed_runs) else {"output": "undefined", "error": "No output"}
            actual = str(run_data.get("output", "")).strip()
            err = run_data.get("error")

            norm_expected = expected.replace(" ", "").replace("'", '"').lower()
            norm_actual = actual.replace(" ", "").replace("'", '"').lower()
            
            passed = (err is None) and (norm_actual == norm_expected)

            results.append({
                "id": tc.get("id"),
                "passed": passed,
                "description": tc.get("description"),
                "input": tc.get("input"),
                "expected_output": expected,
                "actual_output": actual if not tc.get("is_hidden") or passed else "[Hidden: Output Mismatch]",
                "error": err,
                "execution_time_ms": elapsed_ms,
                "is_hidden": tc.get("is_hidden", False)
            })
        return results

    except subprocess.TimeoutExpired:
        return [
            {
                "id": tc.get("id"),
                "passed": False,
                "description": tc.get("description"),
                "input": tc.get("input"),
                "expected_output": str(tc.get("expected_output")),
                "actual_output": "TimeLimitExceeded",
                "error": "Time Limit Exceeded (>3.0s). Check for infinite loops.",
                "execution_time_ms": 3000,
                "is_hidden": tc.get("is_hidden", False)
            }
            for tc in test_cases
        ]
    except Exception as e:
        return [
            {
                "id": tc.get("id"),
                "passed": False,
                "description": tc.get("description"),
                "input": tc.get("input"),
                "expected_output": str(tc.get("expected_output")),
                "actual_output": "Error",
                "error": str(e),
                "execution_time_ms": 0,
                "is_hidden": tc.get("is_hidden", False)
            }
            for tc in test_cases
        ]

def evaluate_html_css_challenge(code: str, challenge_id: str, test_cases: list) -> list:
    """Verifies HTML5 & CSS3 layout requirements against test cases."""
    if is_scaffold_unmodified(code):
        return [
            {
                "id": tc.get("id"),
                "passed": False,
                "description": tc.get("description"),
                "input": tc.get("input"),
                "expected_output": str(tc.get("expected_output")),
                "actual_output": "Empty Layout (Scaffold Unimplemented)",
                "error": "Starter template was submitted without implementing styles or markup.",
                "execution_time_ms": 0,
                "is_hidden": tc.get("is_hidden", False)
            }
            for tc in test_cases
        ]

    results = []
    lower_code = code.lower()

    for tc in test_cases:
        t_id = tc.get("id")
        desc = tc.get("description", "").lower()
        exp = str(tc.get("expected_output"))
        passed = False
        actual = "Missing"

        if "html-p1" in challenge_id:
            # Flexbox card component
            if t_id == 1:
                passed = "profile-card" in lower_code
                actual = "Element present" if passed else "Missing .profile-card class"
            elif t_id == 2:
                passed = "display" in lower_code and "flex" in lower_code
                actual = "flex" if passed else "No flexbox display"
            elif t_id == 3:
                passed = "border-radius" in lower_code and "12px" in lower_code
                actual = "12px" if passed else "No 12px border-radius"
            elif t_id == 4:
                passed = "padding" in lower_code and "24px" in lower_code
                actual = "24px" if passed else "No 24px padding"
            elif t_id == 5:
                passed = "<h2" in lower_code
                actual = "h2 element verified" if passed else "Missing <h2>"
            elif t_id == 6:
                passed = "<p" in lower_code
                actual = "p element verified" if passed else "Missing <p>"
        else:
            # Grid dashboard widget
            if t_id == 1:
                passed = "dashboard-grid" in lower_code
                actual = "Element present" if passed else "Missing .dashboard-grid"
            elif t_id == 2:
                passed = "display" in lower_code and "grid" in lower_code
                actual = "grid" if passed else "No grid display"
            elif t_id == 3:
                passed = "gap" in lower_code and "16px" in lower_code
                actual = "16px" if passed else "No 16px gap"
            elif t_id == 4:
                # Count child divs or elements
                child_count = len(re.findall(r'<div\b', lower_code)) - 1
                passed = child_count >= 3
                actual = f"{child_count} cards present" if passed else f"Only {max(0, child_count)} cards"
            elif t_id == 5:
                passed = "repeat(3" in lower_code or "1fr 1fr 1fr" in lower_code or "33" in lower_code
                actual = "8px" if passed else "No 3-column repeat"
            elif t_id == 6:
                passed = "background" in lower_code or "border" in lower_code
                actual = "#F8FAFC" if passed else "No theme background"

        results.append({
            "id": t_id,
            "passed": passed,
            "description": tc.get("description"),
            "input": tc.get("input"),
            "expected_output": exp,
            "actual_output": actual if not tc.get("is_hidden") or passed else "[Hidden: Style Mismatch]",
            "error": None if passed else f"Requirement failed: {tc.get('description')}",
            "execution_time_ms": 5,
            "is_hidden": tc.get("is_hidden", False)
        })

    return results

def evaluate_submission(skill: str, challenge_id: str, code: str, test_cases: list) -> list:
    """Master evaluator dispatching to the appropriate language execution engine."""
    s = skill.strip().lower()

    if "python" in s:
        return evaluate_python_challenge(code, challenge_id, test_cases)
    elif "javascript" in s or "typescript" in s or "node" in s or "react" in s:
        return evaluate_javascript_challenge(code, challenge_id, test_cases)
    elif "html" in s or "css" in s or "web" in s or "frontend" in s:
        return evaluate_html_css_challenge(code, challenge_id, test_cases)
    else:
        # For general languages like Java, C++, Go, Rust, C#, PHP, Ruby, Kotlin, Swift
        # First check if scaffold is unmodified
        if is_scaffold_unmodified(code):
            return [
                {
                    "id": tc.get("id"),
                    "passed": False,
                    "description": tc.get("description"),
                    "input": tc.get("input"),
                    "expected_output": str(tc.get("expected_output")),
                    "actual_output": "Scaffold Unimplemented",
                    "error": "Starter scaffold submitted without implementing algorithm logic.",
                    "execution_time_ms": 0,
                    "is_hidden": tc.get("is_hidden", False)
                }
                for tc in test_cases
            ]
        # Attempt JavaScript/Node execution if syntax is compatible (e.g., TwoSum / Valid Parentheses)
        try:
            return evaluate_javascript_challenge(code, challenge_id, test_cases)
        except Exception:
            # Fallback to Python runner
            return evaluate_python_challenge(code, challenge_id, test_cases)
