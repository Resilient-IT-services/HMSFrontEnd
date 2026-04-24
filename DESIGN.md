---
name: VitalSync
colors:
  surface: '#f9f9ff'
  surface-dim: '#d9dadf'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f9'
  surface-container: '#ededf3'
  surface-container-high: '#e7e8ee'
  surface-container-highest: '#e2e2e8'
  on-surface: '#191c20'
  on-surface-variant: '#594138'
  inverse-surface: '#2e3035'
  inverse-on-surface: '#f0f0f6'
  outline: '#8d7167'
  outline-variant: '#e2bfb3'
  surface-tint: '#a83900'
  primary: '#a83900'
  on-primary: '#ffffff'
  primary-container: '#ff6b2b'
  on-primary-container: '#5c1c00'
  inverse-primary: '#ffb59a'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d8e3fb'
  on-secondary-container: '#5a6579'
  tertiary: '#5c5f61'
  on-tertiary: '#ffffff'
  tertiary-container: '#979a9c'
  on-tertiary-container: '#2f3234'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb59a'
  on-primary-fixed: '#380d00'
  on-primary-fixed-variant: '#802a00'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#e1e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f9f9ff'
  on-background: '#191c20'
  surface-variant: '#e2e2e8'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 32px
  section-gap: 24px
  component-gap: 16px
  gutter: 24px
  margin-page: 40px
---

## Brand & Style

This design system is built for the high-stakes, high-accuracy environment of modern healthcare management. It prioritizes clarity, efficiency, and a sense of calm reliability. The visual style is a refined take on **Corporate Modern**, blending a clinical "white-space-first" philosophy with energetic accents that signal action and urgency where appropriate.

The aesthetic response is one of professional trust and administrative ease. It leverages high legibility and spacious layouts to reduce cognitive load for hospital staff, ensuring that critical data is never obscured by decorative elements.

## Colors

The palette is anchored by a vibrant **Action Orange** (#FF6B2B), used strategically for primary calls to action, active navigation states, and critical progress indicators. This is balanced against a pristine white surface architecture to maintain a sterile, professional feel.

- **Primary:** Vitality and action. Used for buttons, active tabs, and primary icons.
- **Secondary (Deep Navy):** Stability and authority. Used for high-level navigation and primary headings.
- **Neutral/Surface:** A range of cool grays used for borders, secondary text, and background layering to define workspace boundaries without adding visual noise.
- **Semantic:** Standardized success (green), warning (amber), and error (red) tones are used strictly for status-based information.

## Typography

The typographic system utilizes a dual-font approach to balance character with utility. 

**Manrope** is used for headings to provide a modern, friendly, yet professional geometric touch. It ensures that section titles and page headers are prominent and approachable.

**Inter** is the workhorse for all functional UI elements, body copy, and data displays. Its high x-height and neutral tone ensure maximum legibility in dense administrative forms and patient records.

Hierarchy is primarily established through weight and color (using secondary navy for headers and neutral grays for meta-data) rather than excessive size shifts.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a max-width container for desktop viewing to prevent line lengths from becoming unreadable. A 12-column system is used for complex forms, allowing for flexible 1/2, 1/3, and 2/3 width splits.

The spacing rhythm is strictly based on an 8px baseline grid. Generous internal padding (24px to 32px) within cards and sections ensures the UI feels "breathable," which is essential in high-stress medical environments. Information density is managed through clear grouping rather than tight packing.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-Contrast Outlines** to define depth. 

- **Level 0 (Background):** A very light gray (#F9FAFB) surface that sits behind all content.
- **Level 1 (Cards/Containers):** Pure white surfaces with a subtle 1px border (#EAECF0). These containers hold all primary interactive content.
- **Shadows:** Only used sparingly on floating elements (modals, dropdowns) or to subtly lift primary cards. Shadows are highly diffused, using a low-opacity navy tint rather than pure black to maintain a soft, modern appearance.
- **In-Section Depth:** Subtle background tints (tertiary gray) are used inside cards to group related data points, such as "Current Patient" summaries.

## Shapes

The shape language is defined by a consistent **Rounded** (8px to 16px) corner radius. This softens the clinical nature of the application, making the software feel more accessible and user-friendly.

- **Standard Components (Inputs, Buttons):** 8px (0.5rem) radius.
- **Containers (Cards, Modals):** 12px to 16px (0.75rem to 1rem) radius.
- **Indicator Elements (Tags, Progress Bars):** Fully rounded/pill-shaped for distinct visual separation from functional inputs.

## Components

### Buttons
- **Primary:** Solid #FF6B2B with white text. High prominence, 12px vertical padding.
- **Secondary:** White background with a #D0D5DD border and dark text.
- **Ghost:** No background or border, used for utility actions like "Cancel."

### Input Fields
- **Text Inputs:** Soft gray border (#D0D5DD), 8px corner radius, and clear 14px placeholder text. Active state uses a 2px Primary Orange glow/border.
- **Search:** Includes a leading magnifying glass icon and a light background tint to distinguish it from standard data entry fields.

### Cards & Sections
- **Main Containers:** White background, 1px light gray border, 24px internal padding.
- **Data Callouts:** Use a light tertiary background color or a very thin tinted border to highlight specific read-only information.

### Status & Progress
- **Progress Bars:** Thick, 8px high bars with fully rounded caps. Active progress uses the primary orange.
- **Badges/Chips:** Small, semi-rounded labels with subtle background tints and high-contrast text for status indicators (e.g., "Non-AC", "Full").

### Feedback & Notifications
- Small inline alerts use a subtle background tint corresponding to the message type (e.g., light orange for info) with a 20px icon for immediate recognition.