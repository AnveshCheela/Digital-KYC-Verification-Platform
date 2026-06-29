---
name: VerifyFlow Sentinel
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#EF4444'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  success: '#10B981'
  warning: '#F59E0B'
  surface-border: '#E2E8F0'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  code:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system embodies a **Corporate / Modern** aesthetic tailored for high-stakes fintech environments. The brand personality is rooted in **authority, precision, and transparency**. It aims to evoke a sense of absolute security and technical sophistication, reassuring both the end-user undergoing verification and the administrator managing the pipeline.

The visual direction prioritizes **Information Density and Data Clarity**. We utilize a systematic approach to hierarchy, where whitespace is used not just for aesthetics but as a functional separator to prevent cognitive overload during complex review tasks. The design rejects unnecessary decorative elements in favor of purposeful, utility-driven components that reflect the platform's production-grade reliability.

## Colors

The palette is anchored by **Deep Navy (#0F172A)**, used for primary navigation and high-level headers to establish a foundation of trust. **Action Blue (#3B82F6)** serves as the primary interactive color, reserved strictly for calls-to-action and primary buttons to maintain a clear path to completion.

**Slate (#64748B)** is utilized for secondary text and metadata, providing sufficient contrast while maintaining a clear visual hierarchy against primary headings. The background architecture uses a very light **Neutral (#F8FAFC)** to keep the interface feeling airy despite the data-heavy content. Semantic colors (Success Green, Warning Amber, Error Red) are used purposefully for status indicators (`Verified`, `Pending`, `Rejected`) and must be paired with clear iconography to ensure accessibility.

## Typography

The design system exclusively utilizes **Inter** for its exceptional readability in data-intensive interfaces. The typographic scale is designed to create a clear "scan-path" for administrators. 

- **Headlines:** Use tighter letter-spacing and heavier weights to anchor sections.
- **Labels:** Small, uppercase labels with increased letter-spacing are used for table headers and form field captions to differentiate them from user input.
- **Numeric Data:** In tables and OCR previews, ensure the use of tabular num alignment (tnum) to facilitate easy vertical comparison of ID numbers and dates.
- **Code:** A monospaced fallback is defined for technical audit logs and raw JSON data previews in the admin dashboard.

## Layout & Spacing

This design system uses a **Fixed Grid** approach for the main content area (max-width: 1280px) to ensure optimal line lengths for reading data, centered on the screen with fluid margins. 

### Grid Logic
- **Desktop:** 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 16px gutters.
- **Mobile:** 4-column grid with 16px gutters.

### Layout Patterns
- **The Dashboard:** Employs a sidebar-and-main-content structure. The sidebar is fixed-width (260px) while the main content area expands to the container max.
- **Step-based Forms:** Centered single-column layout (max-width: 640px) to minimize eye-travel and increase focus during the KYC upload process.
- **Admin Tables:** Use full-width layouts within the container to accommodate multiple columns of extracted data and action buttons.

## Elevation & Depth

We utilize **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows to maintain a clean, "flat-plus" professional aesthetic. 

- **Level 0 (Background):** Neutral (#F8FAFC).
- **Level 1 (Cards/Surface):** Pure white background with a 1px solid border (#E2E8F0).
- **Level 2 (Dropdowns/Modals):** Pure white background with a subtle, highly-diffused ambient shadow (0px 4px 12px rgba(15, 23, 42, 0.08)) to indicate temporary overlay without breaking the system's clean lines.

Depth is primarily communicated through color shifts (e.g., a slightly darker gray for the sidebar background) and structural borders rather than physical light metaphors.

## Shapes

The shape language is **Soft (0.25rem)**, striking a balance between the clinical precision of sharp corners and the overly casual nature of fully rounded elements. 

- **Primary UI Elements:** (Buttons, Input Fields, Checkboxes) utilize the base `0.25rem` (4px) radius.
- **Containers:** (Cards, Modals) utilize `rounded-lg` (8px) to soften the large layout blocks.
- **Status Badges:** Use `rounded-xl` (12px) to create a distinct, pill-like shape that differentiates status indicators from interactive buttons.

## Components

### Buttons
- **Primary:** Action Blue (#3B82F6) with white text. High contrast, bold weight.
- **Secondary:** Deep Navy (#0F172A) outline with matching text for secondary actions like "Download Audit Log".
- **Ghost:** Transparent background with Slate text for "Cancel" or "Back" actions.

### Cards
Cards are the primary container for "Verification Units." They must include a header section for the status badge and a body section for metadata. Use a subtle 1px border (#E2E8F0) instead of a shadow.

### Form Fields & Inputs
Inputs should have a white background, 1px Slate-200 border, and clear focus states using a 2px Action Blue ring. Validation errors must be indicated with both a red border and an error icon.

### Status Indicators (Chips)
Small badges with a light background tint of the semantic color and a darker text shade (e.g., Success Green background at 10% opacity with 100% opacity text).

### Data Tables
- Header row uses a light gray background (#F1F5F9) and uppercase `label-md` typography.
- Alternating row stripes are not required; use thin 1px horizontal dividers.
- The final column is reserved for "Quick Actions" (Approve/Reject).

### Steppers
For the user onboarding flow, a horizontal stepper at the top of the card shows progress. Completed steps use Action Blue; current steps use a thick Blue border; future steps use Slate.