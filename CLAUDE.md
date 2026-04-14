# CLAUDE.md

## Global Rules For All Agents

This file defines repository-wide operating rules. Role-specific personas live in:

- `agents/frontend/AGENT.md`
- `agents/backend/AGENT.md`

## Source Of Truth
- `docs/mvp-contract.md` is the product and API contract source of truth
- If code and docs conflict, align code to the contract or update the contract first
- Do not silently invent new request or response shapes

## Collaboration Model
- Frontend and backend work in parallel on separate branches
- Shared contract changes must be documented before implementation
- Shared ownership areas are `docs/**` and `packages/contracts/**`
- Role-specific ownership must be respected to reduce merge conflicts

## Non-Negotiable Rules
- Never commit secrets, API keys, or real `.env` values
- Never call SweetBook directly from the frontend
- Never return raw SweetBook upstream payloads directly to the UI
- Keep the MVP narrow and assignment-focused
- Prefer explicit, boring implementations over clever abstractions

## Delivery Priorities
1. Reviewer can run the project locally
2. `Books API` and `Orders API` are actually used
3. The UI demonstrates a coherent end-user product
4. Dummy data is included for instant verification
5. Contract drift between frontend and backend is prevented

## Contract Change Policy
- Update `docs/mvp-contract.md` first
- State exactly what changed and why
- Then implement both sides against the new contract

## Quality Bar
- Optimize for a complete vertical slice over broad but unfinished scope
- Treat upstream failure handling, validation, and reproducibility as core assignment quality
- Keep README eventual work simple enough that a reviewer can copy, paste, and run
