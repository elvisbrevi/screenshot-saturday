# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Screenshot Saturday — a Hono web app deployed to Cloudflare Pages. Uses Hono's JSX renderer for server-side HTML and Vite for dev/build tooling.

## Commands

- `bun install` — install dependencies
- `bun run dev` — local dev server (Vite + Hono dev server with Cloudflare adapter)
- `bun run build` — production build (outputs to `dist/`)
- `bun run preview` — preview production build locally via `wrangler pages dev`
- `bun run deploy` — build and deploy to Cloudflare Pages
- `bun run cf-typegen` — regenerate `CloudflareBindings` type from wrangler.jsonc

## Architecture

- **Runtime**: Hono on Cloudflare Pages (not Workers). Config in `wrangler.jsonc`.
- **Entry point**: `src/index.tsx` — Hono app with routes and the JSX renderer middleware.
- **Layout**: `src/renderer.tsx` — `jsxRenderer` wrapping all pages in a shared HTML shell.
- **Static assets**: `public/static/` — served at `/static/*`.
- **JSX**: Hono's built-in JSX (`jsxImportSource: "hono/jsx"`) — not React.
- **Build**: Vite with `@hono/vite-build/cloudflare-pages` plugin. Output goes to `dist/`.
- **Bindings**: When adding Cloudflare bindings (KV, D1, R2, AI), uncomment in `wrangler.jsonc`, run `cf-typegen`, and use `Hono<{ Bindings: CloudflareBindings }>`.

## Linting

After finishing code changes, always run `npx oxlint` to check for warnings or errors and fix any issues before considering the task complete.
