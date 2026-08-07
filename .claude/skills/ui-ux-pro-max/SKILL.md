---
name: ui-ux-pro-max
description: Use this skill when designing or implementing polished UI/UX for AcademyOS web experiences. It guides the assistant through product-aware design, accessible implementation, and a pre-delivery quality checklist tailored to Next.js, TypeScript, and Tailwind.
license: Complete terms in LICENSE.txt
---

# UI/UX Pro Max for AcademyOS

Use this skill when the request is about building, refining, or reviewing a user‑facing interface for the AcademyOS web app. Treat it as a product designer and frontend engineer working together: first define the audience and intent, then choose a design system that fits the product rather than defaulting to generic templates.

## When to use this skill

Use it for:
- landing pages, marketing sites, and product surfaces
- dashboard and admin interface redesigns
- onboarding, booking, and workflow flows
- improving clarity, hierarchy, and visual polish
- reviewing existing UI for quality, accessibility, and consistency

## Core workflow

1. Clarify the product brief
- Identify the page goal, primary audience, and the single action users should take.
- If the request is vague, state assumptions explicitly before designing.

2. Choose a tailored design direction
- Match the experience to the product category and user context.
- Pick one strong pattern such as hero‑first, trust‑driven, feature‑led, dashboard‑centric, or workflow‑driven.
- Avoid generic "AI‑looking" choices unless the brief truly calls for them.

3. Create a compact design system
- Define 4‑6 colors, 2+ typography roles, spacing rhythm, surface treatment, and one signature element.
- Keep decisions purposeful and tied to the product context rather than copied from a stock template.
- If a design system already exists in the repository, extend it instead of inventing a new one.

4. Implement in the existing stack
- Prefer the Next.js app in apps/web for page‑level work.
- Use TypeScript and Tailwind, and reuse shared primitives from packages/ui when available.
- Keep accessibility and responsive behavior in mind from the start.

5. Validate before delivery
- Check hierarchy, contrast, spacing, CTA clarity, keyboard focus, reduced motion, empty states, error states, and mobile behavior.
- Remove decoration that does not support the user goal.

## AcademyOS‑specific guidance

- Prefer clear product structure over visual noise.
- Use accessible contrast and visible focus states in every interactive element.
- Make primary actions obvious and repeated where appropriate.
- For school and academy contexts, emphasize trust, clarity, and workflow efficiency.
- Keep content simple, direct, and action‑oriented.
- For admin and operations screens, favor scannable layouts and progressive disclosure.

## Design principles

- The hero should communicate the page's thesis.
- Typography should carry personality without becoming unreadable.
- Layout should encode meaning; use structure that reflects the content.
- Use motion sparingly and only where it improves comprehension.
- Make one memorable creative choice and let the rest stay disciplined.

## Implementation checklist

Before presenting the UI, confirm:
- [ ] The page has one clear primary job.
- [ ] Visual choices fit the product context.
- [ ] The interface is responsive from mobile to desktop.
- [ ] Text contrast meets accessible levels.
- [ ] Keyboard navigation is visible and logical.
- [ ] Hover, focus, and transition states feel intentional.
- [ ] Empty, loading, and error states are handled clearly.
- [ ] The implementation is consistent with the existing codebase and naming style.

## Prompting pattern

When asked to create or improve a UI, respond with:
1. A short product brief and assumptions.
2. A recommended layout pattern and design system.
3. The implementation plan for the current stack.
4. The completed UI, followed by a quick QA checklist.

Example prompts:
- Build a polished landing page for AcademyOS with a strong hero and clear CTA.
- Redesign the dashboard experience to feel more premium and easier to scan.
- Improve the onboarding flow with clearer hierarchy and stronger accessibility.