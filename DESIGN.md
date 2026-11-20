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
    lineHeight: 1.05
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

**Brief:** Help households planning around air quality compare a flexible activity at two times and see what stays fixed.

Adapt Taste MCP’s Instrument Panel to a household field ledger. Warm paper and ruled rows keep the planner familiar. The signature move is the **Delhi time switch**. Visitors can select a forecast time to change the reading and tone of the original rooftop illustration. The landing page moves through forecast, comparison, and guide chapters, each with a direct link.

## Colors

Use teal for forecast data, modeled indicators, and primary controls. Use amber for a proposed schedule change or an explicitly labeled synthetic or caution state. Keep fixed activities neutral and label every status in text.

Dark mode follows the system. Use a deep green-black canvas (`#151d1a`), raised surfaces (`#202b26`), off-white text (`#e6e9e4`), and muted teal (`#afcfc2`). Pair filled controls with their own text color. Reserve amber for decisions and warnings in both modes.

## Typography

Use DM Serif Display for page titles and major editorial headings. Set the entry poster in bold Manrope with a larger second line. Use Manrope for controls, prose, and tabular figures. The shared type scale is 12, 14, 16, 20, 24, and 32 px, with fluid display titles. Use regular, semibold, and bold only. Use sentence case for UI labels.

## Layout

Use one shared left edge, a 1240px maximum width, and a 4px spacing grid. Give landing chapters 96 px of vertical padding on desktop and 64 px on mobile. Keep app forms and tables compact. Use seams and rows to group data. Put the schedule comparison first on Decision Twin and keep the evidence one action away. At narrow widths, stack the content in reading order and allow wide tables to scroll independently.

## Elevation & Depth

Use hairlines and tonal changes to separate sections. Keep the landing headline on the same paper as the chapters. Use deep teal behind the scene controls and reserve the filled primary action for opening the planner.

## Shapes

Use 4px, 8px, and 12px corners. Keep repeated activity and event rows flat.

## Components

Give every button, form field, and disclosure keyboard focus and a 44px target. Use a 2px focus ring with a 2px offset. At small sizes, use 16px text in editable fields. Use a visible loading label and content-shaped placeholders for data panels. Pair unavailable states with a clear next action. The forecast scrubber is a native range control that announces the selected timestamp and value. The comparison preview visibly labels the selected schedule.

## Motion

Show actions and data on the first render. The Delhi time switch is the landing page’s only animated scene. The Delhi time switch uses a horizontal filmstrip. Each selected frame develops from a character print of the same skyline over 480 ms. Keep the location and forecast reading stationary over the moving scene. A 210 ms underline follows the current chapter. Use 210 ms for new results on the Decision Twin screen. Respect reduced motion, including in-page navigation. The illustration’s color does not encode a pollution threshold.

## Do's and Don'ts

- Pair the measured value with its units and the relevant source or demo label.
- Label the interpretation of a comparison. Never imply that a time is safe.
- Keep fixed and changed activities distinguishable in monochrome.
- Avoid decorative badge rows, glowing accents, and repeated icon-card sections.
