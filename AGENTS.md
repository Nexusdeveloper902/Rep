# Repository Memory — Gym Workout Companion App

## Project
React Native + Expo + TypeScript gym workout companion app. See `.agents_tmp/PLAN.md` for the full spec.

## Stack
- Expo (SDK), TypeScript, Expo Router (file-based nav), Zustand (state), expo-sqlite (local DB), Zod (JSON validation/types), expo-document-picker/file-system/sharing, AsyncStorage, Jest + React Native Testing Library, lucide-react-native, React Native Paper (optional UI).

## Architecture (critical rules)
- **Pure engine**: `src/domain/workout/` MUST be framework-agnostic (no React Native imports). Pure functions `(Session, Action) => Session`. Independently testable with Jest.
- **Zod-first data model**: schemas in `src/domain/program/schema.ts` are the single source of truth; types via `z.infer`. Round-trip JSON fidelity.
- **Data-model separation**: PROGRAM (intended plan, immutable) · EXERCISE LIBRARY · WORKOUT SESSION (one execution) · WORKOUT HISTORY · SCHEDULE. Substitutions/skips live ONLY in the session. Never modify the underlying program.
- **Program = single JSON blob** in SQLite (`programs.json`); **history = relational** (sessions/set_logs/cardio_logs). Program export must exclude history.
- **Crash-safe**: active session persisted to SQLite on every engine mutation; resumable on reopen.

## Commands
- `npm test` — full Jest suite (jest-expo preset, 27 tests across 5 suites).
- `npm run test:core` — pure-TS engine/validator/repo tests (no expo preset, fast).
- `npm run lint` — eslint.
- `npm run typecheck` — `tsc --noEmit`.
- `npx expo start` — run app (requires Expo runtime; not available in this sandbox).
- `npx expo export --platform android` — sanity-check bundling (works in sandbox).

## Key environment gotchas (resolved)
- **React Native version**: Expo SDK 57 requires `react-native@0.86.2` exactly (per `expo/bundledNativeModules.json`). RN 0.87+ drops `rn-get-polyfills.js`, breaking `@expo/metro-config@57`. Pin RN to 0.86.2.
- **jest-expo preset**: unusable with RN 0.87 (missing `@react-native/assets-registry/registry`). Works fine once RN is pinned to 0.86.2 — no need for the split `jest.core.config.js` workaround for component tests, though the pure-TS config remains faster for engine/domain tests.
- **@react-native/jest-preset**: must be `0.86.2` to satisfy `jest-expo@57` peer (`^0.86.2`).
- **@testing-library/react-native**: must be `>=13.2.0` for `expo-router@57` (peerOptional).
- **expo-linking**: not auto-installed; `npx expo install expo-linking` (peer of expo-router).
- **expo-file-system v57**: new OO API (`File`, `Directory`, `Paths`); legacy `documentDirectory`/`writeAsStringAsync` live under `expo-file-system/legacy`. Import from there for the classic API.
- **lucide-react-native color prop**: typed via augmentation `src/types/lucide.d.ts` (LucideProps extends SvgProps). When passing a `ColorValue` (e.g. from tabBarIcon), cast `color as string` since ColorValue allows null.
- **App asset PNGs MUST be real images**: `assets/{icon,adaptive-icon,splash,favicon}.png` must be valid non-interlaced PNGs with a proper IHDR chunk + pixel data. An 8-byte signature-only stub will crash `expo prebuild` (jimp-compact fails reading `interlace` from missing IHDR). Note: `expo export` (Metro bundle) does NOT catch this — only `expo prebuild` exercises the native image pipeline. Generated current assets with a stdlib-only Python encoder (zlib/struct): interlace=0, colortype 6 (RGBA).
- **Substitution flow (§14)**: The `SUBSTITUTE_EXERCISE` reducer mutates `item.exerciseId` to the *performed* id but retains `item.plannedExerciseId` (set at `expandItem` time). The `session.substitutions` map keys by planned id → performed id. The original program is never mutated (session ≠ program). UI: `SubstituteSheet` resolves `exercise.alternatives` ids to `ExerciseMeta` via the program library; reachable both from the equipment gate ("Choose Alternative") and a standalone "Substitute" button (only shown when alternatives exist).

## Path alias
`@/*` → `src/*` (configured in tsconfig.json and babel.config.js).

## Sandbox note
The Expo/RN runtime cannot be executed in this environment. Verify logic via Jest (`npm test`). UI code is written to be correct but not runtime-verified here.
