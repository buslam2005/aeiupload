# AEI Upload

# General Coding Principles

## Very Important
- Be simple. Approach tasks in a simple, incremental way.
- Work incrementally always, in small and simple steps. Validate and check each increment before moving on.
- Use latest versions of libraries, APIs and idiomatic approaches as of today

## Mandatory Code Style
- Do not over-engineer. Do not program defensively. Use exception managers only when needed.
- Identify root cause before fixing issues. Prove with evidence, then fix.
- Use 'uv' as Python package manager. Always 'uv run xxx' never 'python3 xxx', always 'uv add xxx' never 'pip install xxx'
- Favour clear, concise docstring comments. Be sparing with comments outside docstrings.
- Favour short modules, short methods and functions. Name things clearly.
- Be concise. Keep README minimal. IMPORTANT: no emojis ever

## Debugging and fixing
- When troubleshooting problems, always identify root cause before fixing
- Prove the problem first - don't guess.
- Try one test at a time. Be methodical.
- Don't jump to conclusions. Don't apply workarounds.