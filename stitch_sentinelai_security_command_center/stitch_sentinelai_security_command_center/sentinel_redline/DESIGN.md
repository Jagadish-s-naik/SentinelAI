# The Sentinel Design Specification

## 1. Overview & Creative North Star
**The Creative North Star: "The Precise Guardian"**

This design system moves beyond the generic "SaaS Dashboard" to create an atmosphere of high-stakes precision and unwavering authority. We are building a digital Security Operations Center (SOC) that feels like a physical architectural space—clean, structured, and intentional. 

By rejecting trendy glassmorphism and neon aesthetics in favor of "Organic Brutalism," we lean into high-contrast monochromatic panels, surgical red accents, and a strict adherence to a grid-based texture. The system breaks the "template" look by utilizing heavy asymmetric weights—specifically the deep `Black Panel` navigation against a surgical `Pure White` canvas—to guide the eye toward critical data correlations.

---

## 2. Colors & Surface Architecture

### Palette Definition
The color language is rooted in "Kalvium Red" and deep neutrals to signal professional-grade security.

| Role | Token | Value | Intent |
| :--- | :--- | :--- | :--- |
| **Page Background** | `surface` | #FFFFFF | Pure, surgical white for maximum readability. |
| **Primary Accent** | `primary` | #E53935 | Used for branding, critical alerts, and CTAs. |
| **Dark Navigation** | `inverse-surface` | #0D0D0D | The "Black Panel" providing visual weight and grounding. |
| **Secondary Surface** | `surface-container` | #FAFAFA | Used for cards and secondary content zones. |
| **Text Primary** | `on-surface` | #111827 | High-contrast black for headers and body. |
| **Text Muted** | `outline` | #9CA3AF | For non-interactive labels and dot-grid textures. |

### The "No-Line" Rule & Surface Hierarchy
While the original specs mention a 1px border, this system evolves beyond structural lines to achieve an editorial feel.
- **Tonal Layering:** Hierarchy is achieved by nesting `#FAFAFA` cards within the `#FFFFFF` dot-grid background. 
- **The Dot-Grid Canvas:** The background must always feature the radial-gradient texture (`#d1d5db` at 40% opacity). This provides a "blueprint" feel that replaces the need for heavy dividers.
- **Nesting:** Place `surface-container` (#FAFAFA) elements on the `surface` (#FFFFFF) background. To create further depth, use white-space padding rather than additional borders where possible.

---

## 3. Typography
The typographic system uses **Inter** for its neutral, authoritative Swiss-style legibility, paired with **JetBrains Mono** for technical data to emphasize the "AI/Machine" nature of the platform.

### Hierarchy
- **Display/H1:** `28px / 700 / Inter`. Used for page titles. Tight tracking (-0.02em).
- **Subhead/H2:** `22px / 600 / Inter`. For major section headers.
- **Headline/H3:** `16px / 600 / Inter`. For card titles and group headers.
- **Body:** `14px / 400 / Inter`. Standard data reading. Line height: 1.5.
- **Data/Monospace:** `13px / 500 / JetBrains Mono`. Used for IP addresses, logs, and timestamps.
- **Micro-Labels:** `11px / 600 / Inter`. **Uppercase with 0.06em spacing.** This is a signature element for metadata.

---

## 4. Elevation & Depth

### The Layering Principle
We avoid traditional drop shadows for an "airy" feel. Instead, depth is conveyed through:
1.  **Ambient Shadows:** Use only on "floating" elements like modals or dropdowns. `0 1px 3px rgba(0,0,0,0.08)`.
2.  **The Sidebar Anchor:** The `#0D0D0D` sidebar provides an absolute "Floor" to the UI, making the white content area feel like it is projected onto a screen.
3.  **Active Indicators:** Active states in the sidebar use a `3px` solid `#E53935` left border. This is the only place where a high-contrast vertical line is permitted.

### The "Ghost Border" Fallback
Where separation is strictly required for accessibility, use a `1px` border of `#E5E7EB`. Do not use black or primary red for borders unless signaling an error state.

---

## 5. Components

### Navigation (The Command Center)
- **Background:** `#0D0D0D`.
- **Active State:** Text color shifts to `#FFFFFF`, with a `3px` vertical strip of `#E53935` on the far left.
- **Inactive State:** Text color `#6B7280`.

### Buttons
- **Primary:** Background `#E53935`, Text `#FFFFFF`, Radius `8px`. No gradients.
- **Secondary:** Background `#FAFAFA`, Border `1px #E5E7EB`, Text `#111827`.
- **Ghost:** Text `#E53935`, No background. Used for low-priority actions within data tables.

### Status Badges (The Severity Scale)
Used for alert levels. Radius: `4px`. Text: `11px / 600 / Uppercase`.
- **Critical:** Background `#FEE2E2`, Text `#E53935`.
- **High:** Background `#FEF2F2`, Text `#EF4444`.
- **Medium:** Background `#DBEAFE`, Text `#3B82F6`.
- **Success/Low:** Background `#DCFCE7`, Text `#22C55E`.

### Data Tables & Lists
- **Rule:** Forbid horizontal divider lines between rows.
- **Alternative:** Use vertical white space (16px padding) and a subtle background hover state of `#FAFAFA`. 
- **Header:** Use the Micro-Label style (`11px Bold Uppercase`) with a bottom border of `2px #111827` to create an editorial "header-heavy" look.

---

## 6. Do’s and Don'ts

### Do:
- **Do** use JetBrains Mono for all numeric values and system IDs to reinforce the "Sentinel" persona.
- **Do** allow the dot-grid background to breathe; use wide margins (32px+) around the main content container.
- **Do** align the logo "⬡" icon precisely with the typography's cap height.

### Don’t:
- **Don't** use Glassmorphism or Background Blurs. The UI must feel solid, opaque, and dependable.
- **Don't** use Dark Mode for the main content area. This is a "Light Mode Only" SOC-grade professional tool.
- **Don't** use rounded corners larger than `8px`. Avoid "pills" for anything other than status badges; keep the architecture sharp and geometric.
- **Don't** use icons with thick strokes. All iconography must be "Thin-Stroke" to match the logo mark.