# MCP Usage Guidelines: Groucho the Hunter

## When This Applies

These rules apply when:
- Deciding which MCP tool to use for a task
- Searching for documentation or examples
- Managing external data or integrations
- Accessing version control operations
- Any tool selection decision

## MCP Tool Selection Matrix

### Web Search & Reading Tools

#### `mcp--web___search___prime--webSearchPrime`
**USE FOR:**
- Finding current documentation URLs
- Searching for latest package versions
- Discovering new libraries or tools
- Researching general topics and tutorials
- Finding Stack Overflow solutions
- Current events and recent changes

**DO NOT USE FOR:**
- Reading full documentation (use web-reader or Context7 instead)
- Deep technical reference (use Context7 for libraries)
- Known documentation sites you've already visited

**Example:**
```
✓ Search: "Three.js r171 WebGPU release notes"
✓ Search: "latest three-mesh-bvh npm version"
✗ Search: "What is Three.js" (too general)
```

#### `mcp--web___reader--webReader`
**USE FOR:**
- Reading specific documentation pages once you have the URL
- Extracting content from GitHub repos, READMEs
- Reading blog posts and tutorials
- Converting HTML to markdown for reference

**DO NOT USE FOR:**
- Discovery/search (use web-search-prime)
- Library API documentation (use Context7 instead)
- Sites you already have content from

**Example:**
```
✓ Read: "https://threejs.org/docs/#api/en/core/Object3D"
✓ Read: "https://github.com/gkjohnson/three-mesh-bvh/blob/master/README.md"
✗ Read: "https://threejs.org/docs/" (too broad, use Context7)
```

#### `mcp--fetch--fetch`
**USE FOR:**
- Simple HTTP GET requests
- Fetching raw files (JSON, text, etc.)
- Quick content extraction when web-reader is overkill

**DO NOT USE FOR:**
- Rich HTML conversion (use web-reader)
- Documentation that needs markdown conversion

**Example:**
```
✓ Fetch: "https://api.github.com/repos/mrdoob/three.js/releases/latest"
✗ Fetch: Complex HTML pages
```

### Documentation Tools

#### `mcp--Context7--resolve___library___id` + `mcp--Context7--query___docs`
**USE FOR:**
- Three.js API documentation and code examples
- Library-specific questions requiring up-to-date docs
- Finding code snippets for specific Three.js features
- Any Three.js how-to questions
- When you need authoritative library documentation

**ALWAYS USE Context7 FOR:**
- Three.js WebGPU/WebGL renderer setup
- Three.js materials, geometries, lights
- Three.js animation system
- three-mesh-bvh usage
- Any Three.js addon modules

**Workflow:**
1. First call `resolve-library-id` with library name (e.g., "three.js", "three-mesh-bvh")
2. Then call `query-docs` with the resolved library ID

**Example:**
```
✓ Context7: "How to setup WebGPU renderer in Three.js"
✓ Context7: "three-mesh-bvh raycasting examples"
✗ Context7: "JavaScript array methods" (not a library doc)
```

### Google Sheets Tools

#### `mcp--google___sheets--*`
**USE FOR:**
- Game design spreadsheets (level data, enemy stats, progression)
- Project planning and tracking
- Asset management inventories
- Test case documentation
- Any tabular data that needs collaboration

**DO NOT USE FOR:**
- Code storage
- Configuration files (use JSON/JS)
- Large binary data

**Required Parameters:**
- Must have `spreadsheet_id` from URL
- Must verify sheet exists before writing

**Example Use Cases:**
```
✓ Track: Level design data (enemy positions, puzzle solutions)
✓ Track: Game balance metrics (damage, health, XP values)
✓ Track: Asset inventory (models, textures, audio)
✗ Store: JavaScript code
```

### Git Tools

#### `mcp--git--*`
**USE FOR:**
- Checking repository status
- Viewing commit history
- Creating branches
- Staging and committing changes
- Viewing diffs

**DO NOT USE FOR:**
- Complex merge operations (use CLI directly)
- Rebasing (use CLI directly)
- Remote operations (push/pull - use CLI)

**Best Practices:**
- Always check status before making changes
- Review diffs before committing
- Write descriptive commit messages
- Use conventional commits format: `type(scope): description`

**Commit Message Format:**
```
feat(player): add sprint mechanics
fix(collision): resolve wall clipping issue
docs(readme): update installation instructions
refactor(systems): simplify state manager
test(puzzles): add unit tests for log analysis
```

### File System Tools

#### Built-in File Tools (`read_file`, `edit_file`, `search_files`, `list_files`)
**USE FOR:**
- All file operations within the workspace
- Searching code with regex
- Listing directory contents
- Creating and modifying files

**PREFER OVER:**
- Git tools for reading files (use read_file instead of git show for current files)
- External search (use search_files first for codebase queries)

## Strict Enforcement Rules

### Rule 1: Three.js Documentation
**MUST use Context7 for ALL Three.js questions**
- Never use web-search-prime for Three.js API docs
- Never use web-reader for threejs.org/docs
- Context7 has the most current, complete Three.js documentation

### Rule 2: General Web Search
**Use web-search-prime ONLY when:**
- You don't know the exact URL
- You need to discover resources
- You need current/recent information
- The query is not library-specific

### Rule 3: URL-to-Content
**Once you have a URL from search:**
1. Use web-reader to extract content
2. Parse and use the information
3. Don't search for the same thing again

### Rule 4: Code Examples
**For library code examples:**
1. Try Context7 first (most authoritative)
2. If not found, use web-search-prime with "example" in query
3. Then web-reader to extract the example

### Rule 5: Google Sheets Data
**Before modifying spreadsheets:**
1. Always read current data first
2. Verify sheet structure
3. Use batch operations when possible
4. Confirm changes with user if destructive

## Decision Flowchart

```
Need information?
├── Three.js / three-mesh-bvh?
│   └── USE: Context7
├── Have specific URL?
│   ├── HTML page to read?
│   │   └── USE: web-reader
│   └── Raw data (JSON/text)?
│       └── USE: fetch
├── Need to find/discover?
│   └── USE: web-search-prime
├── Spreadsheet operations?
│   └── USE: google-sheets
└── Git operations?
    └── USE: git tools
```

## Examples by Scenario

### Scenario: Setting up Three.js WebGPU Renderer
```
WRONG:
- web-search-prime: "Three.js WebGPU setup"
- web-reader: threejs.org docs

CORRECT:
- Context7 resolve-library-id: "three.js"
- Context7 query-docs: "How to initialize WebGPU renderer with WebGL fallback"
```

### Scenario: Finding Latest Vite Version
```
WRONG:
- Context7: "latest vite version" (not a library usage question)

CORRECT:
- web-search-prime: "vite latest version npm"
```

### Scenario: Reading Project Dependencies
```
WRONG:
- web-reader: github.com/package.json URL

CORRECT:
- read_file: package.json (local file)
```

### Scenario: Three.js Raycasting with BVH
```
WRONG:
- web-search-prime: "three.js raycasting example"

CORRECT:
- Context7 resolve-library-id: "three-mesh-bvh"
- Context7 query-docs: "raycasting examples with BVH"
```

## Violation Consequences

Not following these guidelines results in:
- Outdated or incorrect information
- Unnecessary API calls
- Slower task completion
- Potential errors from wrong documentation versions

## References

- See [`.kilocode/rules/threejs-patterns.md`](threejs-patterns.md) for Three.js implementation patterns
- See [`Docs/TechnicalDesign.md`](Docs/TechnicalDesign.md) for architecture using these tools
- See [`Docs/research.md`](Docs/research.md) for technology research methodology
