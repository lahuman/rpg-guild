# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

RPG Guild Manager is a gamified collaboration tool built with SvelteKit, TypeScript, and Firebase. It transforms daily tasks into RPG quests where users manage virtual characters who complete missions and earn gold rewards.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check

# Watch mode for type checking
npm run check:watch
```

## Architecture

### Tech Stack
- **Frontend Framework**: SvelteKit with TypeScript
- **Styling**: TailwindCSS 4.x with Vite plugin
- **Backend**: Firebase (Authentication, Firestore)
- **State Management**: Svelte Stores (reactive)
- **Build Tool**: Vite
- **Deployment**: Adapter-node for Docker deployment

### Key Architectural Decisions

1. **Firebase Integration**: All data persistence goes through Firebase Firestore. Authentication uses Google OAuth via popup.

2. **Store Pattern**: Complex business logic is organized in `src/lib/stores/` with domain-specific stores:
   - `guildStore.ts`: Main guild store combining character management, guild operations, and subscriptions
   - `missionStore.ts`: Mission/quest creation and completion logic
   - `itemStore.ts`: Shop item management
   - `logStore.ts`: Activity logging and timeline
   - `userStore.ts`: User authentication and profile management

3. **Modular Store Structure**: The guild store is decomposed into:
   - `guild/characters.ts`: Character CRUD and grade progression
   - `guild/management.ts`: Guild creation/joining/leaving
   - `guild/subscriptions.ts`: Real-time Firestore subscriptions
   - `guild/constants.ts`: Grade system constants and calculations
   - `guild/types.ts`: TypeScript interfaces

4. **Component Architecture**: 
   - Modal-based UI for complex interactions (PointTransferModal, MiniGameModal, ShopManager)
   - Feature-based organization in `src/lib/features/`
   - Firestore transaction-heavy operations centralized in stores

### Database Schema

**Collections:**
- `guilds`: Guild documents with members, settings
- `characters`: Subcollection under guilds for guild characters
- `missions`: Mission documents with completion tracking
- `items`: Shop items (guild-owned)
- `logs`: Activity logs for guild timeline
- `transferLogs`: Gold transfer transactions

### Important Implementation Details

1. **Grade System**: Characters progress through 20 ranks (Rank01-Rank20) with specific gold rewards and challenges at each level. Legacy grades (Bronze-Silver-Gold etc.) are supported for backward compatibility.

2. **Attendance System**: Daily check-in with consecutive day streaks (max 5 days) provides escalating gold rewards.

3. **Mission Types**: 
   - Solo missions: Single character completion
   - Party missions: Multiple characters collaborate
   - Once per day limit per character with duplicate prevention

4. **Economy**: Character-specific gold pouches, guild-shared shop, point transfers between characters

5. **Real-time Updates**: Firestore subscriptions keep all clients synchronized

## Critical Constraints

- All Firestore operations must handle offline scenarios and transaction conflicts
- Character grade progression is capped at Rank20
- Daily mission completion limits enforced at Firestore security rules level
- Gold transactions use Firestore transactions for atomicity
- Chrome popup blockers may affect Google OAuth - always use signInWithPopup with proper error handling
# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
