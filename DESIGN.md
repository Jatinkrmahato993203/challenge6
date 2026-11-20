---
version: alpha
name: SaansAI
description: A household air-quality planner styled as a field ledger.
colors:
  primary: "#174945"
  on-primary: "#faf8f0"
  neutral: "#f5f2e9"
  surface: "#fffcf5"
  on-surface: "#202c28"
  secondary: "#53635b"
  border: "#d5d9cc"
  measurement: "#e8efea"
  on-measurement: "#174945"
  decision: "#8a481a"
  decision-surface: "#f6e7d3"
typography:
  headline-display:
    fontFamily: DM Serif Display
    fontSize: 72px
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Manrope Variable
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
  body-md:
    fontFamily: Manrope Variable
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label-md:
    fontFamily: Manrope Variable
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
components:
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    height: 44px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  forecast:
    backgroundColor: "{colors.measurement}"
    textColor: "{colors.on-measurement}"
  proposed-time:
    backgroundColor: "{colors.decision-surface}"
    textColor: "{colors.decision}"
---

# SaansAI design system

## Overview

Adapt Taste MCP’s Instrument Panel to a household field ledger. Warm paper and ruled rows keep the planner familiar. The visual signature is a paired forecast and decision record. The landing chart marks the two comparison times, and the Decision Twin carries that distinction through the actual schedule.

## Colors

Use teal for forecast data, modeled indicators, and primary controls. Use amber for a proposed schedule change or an explicitly labeled synthetic or caution state. Keep fixed activities neutral and label every status in text.

## Typography

Use DM Serif Display for page titles and major editorial headings. Use Manrope for controls, prose, and tabular figures. Use sentence case for UI labels. Reserve small uppercase text for column labels in the ledger.

## Layout

Use one shared left edge, a 1240px maximum width, and a 4px spacing grid. Use seams and rows to group data. Put the schedule comparison first on Decision Twin and keep the evidence one action away. At narrow widths, stack the content in reading order and allow wide tables to scroll independently.

## Elevation & Depth

Use hairlines and tonal changes to separate sections. Use a solid deep-teal surface only where the landing forecast benefits from contrast.

## Shapes

Use 4px, 8px, and 12px corners. Keep repeated activity and event rows flat.

## Components

Give every button, form field, and disclosure keyboard focus and a 44px target. At small sizes, use 16px text in editable fields. Use a visible loading label and content-shaped placeholders for data panels. Motion is limited to short transform and opacity transitions, with a reduced-motion fallback.

## Do's and Don'ts

- Pair the measured value with its units and the relevant source or demo label.
- Label the interpretation of a comparison. Never imply that a time is safe.
- Keep fixed and changed activities distinguishable in monochrome.
- Avoid decorative badge rows, glowing accents, and repeated icon-card sections.
