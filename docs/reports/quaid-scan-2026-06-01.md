# quaid-scanner Report: /Users/karstenwade/Projects/AINative-Studio/src/ai-kit-a2ui-core

**Score:** 🔴 1.4/10 — CRITICAL risk
**Maturity:** sandbox | **Depth:** standard | **Duration:** 2.0s
**Scanned:** 2026-06-01T21:03:35.883Z

## Pillar Scores

| Pillar | Score | Weight | Findings |
|--------|-------|--------|----------|
| Security | 0.0 | 25% | 0C 13W 1I |
| Governance | 1.5 | 20% | 0C 2W 11I |
| Community | 0.5 | 15% | 0C 3W 10I |
| AI Readiness | 2.5 | 15% | 0C 5W 0I |
| Inclusive Language | 0.0 | 15% | 0C 4W 13I |
| Technical Rigor | 6.0 | 10% | 0C 1W 5I |

## Warnings

- **[TIMEOUT-binary-artifacts]** Scanner "binary-artifacts" timed out after undefinedms *(Increase scannerTimeout in configuration or check network connectivity)*
- **[TIMEOUT-dep-pinning-docker]** Scanner "dep-pinning-docker" timed out after undefinedms *(Increase scannerTimeout in configuration or check network connectivity)*
- **[dep-pinning-packages-1]** Loosely pinned dependency "@types/node": "^20.10.0" uses ^ prefix in devDependencies *(Consider pinning "@types/node" to an exact version for reproducible builds)*
- **[dep-pinning-packages-2]** Loosely pinned dependency "@typescript-eslint/eslint-plugin": "^6.13.0" uses ^ prefix in devDependencies *(Consider pinning "@typescript-eslint/eslint-plugin" to an exact version for reproducible builds)*
- **[dep-pinning-packages-3]** Loosely pinned dependency "@typescript-eslint/parser": "^6.13.0" uses ^ prefix in devDependencies *(Consider pinning "@typescript-eslint/parser" to an exact version for reproducible builds)*
- **[dep-pinning-packages-4]** Loosely pinned dependency "@vitest/coverage-v8": "^1.0.4" uses ^ prefix in devDependencies *(Consider pinning "@vitest/coverage-v8" to an exact version for reproducible builds)*
- **[dep-pinning-packages-5]** Loosely pinned dependency "eslint": "^8.55.0" uses ^ prefix in devDependencies *(Consider pinning "eslint" to an exact version for reproducible builds)*
- **[dep-pinning-packages-6]** Loosely pinned dependency "prettier": "^3.1.0" uses ^ prefix in devDependencies *(Consider pinning "prettier" to an exact version for reproducible builds)*
- **[dep-pinning-packages-7]** Loosely pinned dependency "tsup": "^8.0.1" uses ^ prefix in devDependencies *(Consider pinning "tsup" to an exact version for reproducible builds)*
- **[dep-pinning-packages-8]** Loosely pinned dependency "typescript": "^5.3.3" uses ^ prefix in devDependencies *(Consider pinning "typescript" to an exact version for reproducible builds)*
- **[dep-pinning-packages-9]** Loosely pinned dependency "vitest": "^1.0.4" uses ^ prefix in devDependencies *(Consider pinning "vitest" to an exact version for reproducible builds)*
- **[TIMEOUT-openssf-local-checks]** Scanner "openssf-local-checks" timed out after undefinedms *(Increase scannerTimeout in configuration or check network connectivity)*
- **[TIMEOUT-openssf-scorecard]** Scanner "openssf-scorecard" timed out after undefinedms *(Increase scannerTimeout in configuration or check network connectivity)*
- **[TIMEOUT-license-header-scanner]** Scanner "license-header-scanner" timed out after undefinedms *(Increase scannerTimeout in configuration or check network connectivity)*
- **[vendor-neutrality-high-concentration]** High vendor concentration: gmail.com (74% of commits) *(Encourage contributions from additional organizations to improve vendor diversity)*
- **[contributor-funnel-2]** Conversion rates: casual→regular 0%, regular→core 0% *(Low casual-to-regular conversion suggests contributor onboarding friction)*
- **[psych-safety-1]** No Code of Conduct found *(Add a CODE_OF_CONDUCT.md — see https://www.contributor-covenant.org/)*
- **[support-channels-1]** No SUPPORT.md or .github/SUPPORT.md found *(Add a SUPPORT.md documenting how users can get help)*
- **[agentic-rules-2]** CLAUDE.md lacks recognized structural sections *(Add sections like "Critical Rules", "Project Structure", "Common Tasks" to improve agent guidance.)*
- **[TIMEOUT-ai-repo-detection]** Scanner "ai-repo-detection" timed out after undefinedms *(Increase scannerTimeout in configuration or check network connectivity)*
- **[TIMEOUT-dataset-provenance]** Scanner "dataset-provenance" timed out after undefinedms *(Increase scannerTimeout in configuration or check network connectivity)*
- **[TIMEOUT-model-card-detection]** Scanner "model-card-detection" timed out after undefinedms *(Increase scannerTimeout in configuration or check network connectivity)*
- **[TIMEOUT-model-card-scoring]** Scanner "model-card-scoring" timed out after undefinedms *(Increase scannerTimeout in configuration or check network connectivity)*
- **[TIMEOUT-diminishing-language-scanner]** Scanner "diminishing-language-scanner" timed out after undefinedms *(Increase scannerTimeout in configuration or check network connectivity)*
- **[TIMEOUT-inclusive-code-scanner]** Scanner "inclusive-code-scanner" failed: Cannot read properties of undefined (reading 'termListUrl') *(Check scanner implementation for errors)*
- **[TIMEOUT-inclusive-doc-scanner]** Scanner "inclusive-doc-scanner" failed: Cannot read properties of undefined (reading 'termListUrl') *(Check scanner implementation for errors)*
- **[TIMEOUT-inclusive-naming-scanner]** Scanner "inclusive-naming-scanner" failed: Cannot read properties of undefined (reading 'termListUrl') *(Check scanner implementation for errors)*
- **[interaction-templates-1]** No issue templates configured *(Add .github/ISSUE_TEMPLATE/ with bug report and feature request templates)*

## Info

- **[branch-protection-1]** GitHub token not provided. Cannot check branch protection settings.
- **[asset-protection-1]** No trademark policy found (optional)
- **[asset-protection-2]** No export control documentation found (optional)
- **[asset-protection-3]** No CLA or DCO requirement detected
- **[asset-protection-4]** Contributor friction level: Low
- **[bus-factor-1]** Bus factor: 1, Elephant factor: 74% (2 contributors, 34 commits in last 12 months)
- **[dep-license-scanning-1]** package.json found but node_modules not installed — cannot scan dependency licenses
- **[governance-classification-1]** No governance model detected — governance files exist but no recognizable model pattern found
- **[governance-detection-1]** No governance documentation found
- **[license-compatibility-1]** Project license is MIT — no installed dependencies to check compatibility
- **[vendor-neutrality-domain-count]** Found 2 unique email domain(s) across 34 commits
- **[vendor-neutrality-no-succession]** No succession planning documentation found
- **[burnout-detection-1]** Burnout detection requires a GitHub token
- **[contributor-data-1]** 2 unique contributors with 34 commits in the last 12 months
- **[contributor-data-2]** Contributor emails span 2 domains
- **[contributor-funnel-1]** Contributor funnel: 0 core, 2 regular, 0 casual (2 total)
- **[funding-1]** No funding infrastructure detected
- **[issue-closure-1]** Issue closure analysis requires a GitHub token
- **[response-classification-1]** Response classification requires a GitHub token
- **[response-time-1]** Response time analysis requires a GitHub token
- **[stale-bot-1]** No stale bot configured
- **[support-channels-2]** Support channels detected: discord
- **[AK-GIT-CLONE-README.md:879]** Assumed knowledge: "clone" operation used without explanation
- **[AK-GIT-CLONE-README.md:880]** Assumed knowledge: "clone" operation used without explanation
- **[AK-ACRONYM-LLM-README.md:11]** Undefined acronym "LLM" may confuse newcomers
- **[AK-ACRONYM-RFC-README.md:17]** Undefined acronym "RFC" may confuse newcomers
- **[AK-ACRONYM-ESM-README.md:23]** Undefined acronym "ESM" may confuse newcomers
- **[AK-ACRONYM-CJS-README.md:23]** Undefined acronym "CJS" may confuse newcomers
- **[AK-ACRONYM-NEW-README.md:38]** Undefined acronym "NEW" may confuse newcomers
- **[AK-ACRONYM-GPT-README.md:39]** Undefined acronym "GPT" may confuse newcomers
- **[AK-ACRONYM-ENHANCED-README.md:46]** Undefined acronym "ENHANCED" may confuse newcomers
- **[AK-ACRONYM-OPTIMIZED-README.md:55]** Undefined acronym "OPTIMIZED" may confuse newcomers
- **[AK-ACRONYM-SVG-README.md:631]** Undefined acronym "SVG" may confuse newcomers
- **[AK-ACRONYM-CONTRIBUTING-README.md:874]** Undefined acronym "CONTRIBUTING" may confuse newcomers
- **[AK-ACRONYM-README-README.md:957]** Undefined acronym "README" may confuse newcomers
- **[linter-config-2]** Linter config found but no lint step detected in CI workflows
- **[release-cadence-1]** No releases or version tags found
- **[test-coverage-2]** Coverage configuration found: vitest.config.ts
- **[test-coverage-3]** No coverage badge found in README
- **[semver-validation-1]** No git tags found — cannot validate SemVer

## Recommendations

- **[MEDIUM impact / low effort]** Increase scannerTimeout in configuration or check network connectivity
- **[MEDIUM impact / low effort]** Consider pinning "@types/node" to an exact version for reproducible builds
- **[MEDIUM impact / low effort]** Increase scannerTimeout in configuration or check network connectivity
- **[MEDIUM impact / low effort]** Encourage contributions from additional organizations to improve vendor diversity
- **[MEDIUM impact / low effort]** Low casual-to-regular conversion suggests contributor onboarding friction
- **[MEDIUM impact / low effort]** Add a CODE_OF_CONDUCT.md — see https://www.contributor-covenant.org/
- **[MEDIUM impact / low effort]** Add a SUPPORT.md documenting how users can get help
- **[MEDIUM impact / low effort]** Add sections like "Critical Rules", "Project Structure", "Common Tasks" to improve agent guidance.
- **[MEDIUM impact / low effort]** Increase scannerTimeout in configuration or check network connectivity
- **[MEDIUM impact / low effort]** Increase scannerTimeout in configuration or check network connectivity
- **[MEDIUM impact / low effort]** Check scanner implementation for errors
- **[MEDIUM impact / low effort]** Add .github/ISSUE_TEMPLATE/ with bug report and feature request templates

## Score Rationale

Overall score is a weighted sum of six pillar scores (each scored 0–10).

| Pillar | Weight | Raw Score | Contribution |
|--------|--------|-----------|-------------|
| Security | 25% | 0.0 | 0.00 |
| Governance | 20% | 1.5 | 0.30 |
| Community | 15% | 0.5 | 0.07 |
| AI Readiness | 15% | 2.5 | 0.38 |
| Inclusive Language | 15% | 0.0 | 0.00 |
| Technical Rigor | 10% | 6.0 | 0.60 |
| **Overall** | **100%** | | **1.40** |

---
*quaid-scanner v0.1.2 | 2026-06-01T21:03:35.883Z*
*Commit: 7f0fa6e9c9259d3647ecd2dab9b66a44534296e8*