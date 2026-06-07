# PROMPT_08: Git Workflow

## Status Check

Before executing, verify:
- [ ] `.commitlintrc.json` exists with conventional commits config
- [ ] `commitlint` installed and configured
- [ ] `.husky/commit-msg` hook runs commitlint
- [ ] `.releaserc.json` exists with semantic-release config
- [ ] `semantic-release` installed with required plugins
- [ ] Git branches `main` and `develop` exist
- [ ] `.gitignore` is comprehensive

If ALL checks pass → mark as DONE. Otherwise, implement missing parts.

---

## Task

Setup Gitflow branching model, commitlint enforcement via Husky, and semantic-release configuration for automated versioning.

## Implementation Steps

### 1. Install Dependencies

```bash
npm install --save-dev --save-exact @commitlint/cli @commitlint/config-conventional semantic-release @semantic-release/changelog @semantic-release/git
```

### 2. Create Commitlint Config

Create `.commitlintrc.json`:
```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"]],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "subject-max-length": [2, "always", 72]
  }
}
```

### 3. Create Husky commit-msg Hook

Create `.husky/commit-msg`:
```bash
#!/usr/bin/env sh
npx --no -- commitlint --edit "$1"
```

### 4. Create Semantic Release Config

Create `.releaserc.json`:
```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/npm",
      { "npmPublish": false }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json", "package-lock.json"],
        "message": "chore(release): ${nextRelease.version} [skip ci]"
      }
    ]
  ]
}
```

### 5. Create .gitignore

Create `.gitignore`:
```
node_modules/
dist/
coverage/
.env
*.log
.DS_Store
.idea/
```

### 6. Initialize Git Branches

```bash
git init
git add -A
git commit -m "chore(init): initial project setup"
git branch develop
```

## Validation

```bash
# Test commitlint
echo "feat(products): add new feature" | npx commitlint
echo "bad commit message" | npx commitlint  # should fail

# Verify hooks
ls -la .husky/commit-msg
ls -la .husky/pre-commit
```

## Commit

```bash
git add -A
git commit -m "chore(git): add commitlint, semantic-release, Gitflow branching"
```
