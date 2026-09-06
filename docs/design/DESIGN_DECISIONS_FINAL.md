# Design Decisions - Final (No Questions)
# Agency Revenue & Project Control Dashboard

**Version:** 1.0 (FINAL)  
**Date:** September 2026  
**Status:** Locked for Development

---

## TYPOGRAPHY (LOCKED)

### Font Family
**Inter** (single font only)
- Sourced: Google Fonts (free, open-source)
- Weights used: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- No alternatives, no fallbacks to different font families
- Clean, professional, widely supported across all browsers/devices

### Type Scale (Finalized)

**H1 - Page Titles**
- Size: 32px
- Weight: 600
- Line height: 40px (1.25)
- Letter spacing: 0
- Color: #161616
- Usage: Dashboard, Projects list, Clients list, Analytics
- Example: "Dashboard", "Projects", "Invoices"

**H2 - Section Headers**
- Size: 24px
- Weight: 600
- Line height: 32px (1.33)
- Letter spacing: 0
- Color: #161616
- Usage: Major sections within screens
- Example: "Team", "Expenses", "Milestones", "Recent Activity"

**H3 - Card/Modal Titles**
- Size: 18px
- Weight: 600
- Line height: 28px (1.56)
- Letter spacing: 0
- Color: #161616
- Usage: Card headers, modal titles, subsection titles
- Example: "Invoice Details", "Log Hours", "Create Project"

**H4 - Form Labels & Table Headers**
- Size: 16px
- Weight: 600
- Line height: 24px (1.5)
- Letter spacing: 0
- Color: #161616
- Usage: Form field labels, table column headers
- Example: "Project Name", "Invoice Amount", "Payment Date"

**Body - Standard Text**
- Size: 14px
- Weight: 400
- Line height: 20px (1.43)
- Letter spacing: 0
- Color: #525252 (secondary text)
- Usage: Body paragraphs, descriptions, list items
- Example: "Complete a milestone to create an invoice" (helper text)

**Body Large - Prominent Text**
- Size: 16px
- Weight: 400
- Line height: 24px (1.5)
- Letter spacing: 0
- Color: #161616
- Usage: Important descriptions, confirmation messages
- Example: "Are you sure you want to delete this project?" (modal text)

**Body Compact - Small Labels**
- Size: 12px
- Weight: 400
- Line height: 16px (1.33)
- Letter spacing: 0
- Color: #8D8D8D (muted)
- Usage: Badges, hints, secondary info, timestamps
- Example: "Updated 2 hours ago", "Invoice #INV-2026-001"

**Strong/Emphasis**
- Size: 14px (inherits from context)
- Weight: 500 or 600 (bold inline)
- Usage: Bold text within paragraphs, keywords
- Example: "**45 hours** invested on this project"

**Link Text**
- Size: 14px (inherits)
- Weight: 400
- Color: #0055CC
- Decoration: None by default, underline on hover
- Usage: All hyperlinks
- Example: "Forgot password?" link, "View more" link

**Monospace Font (Numbers & Data)**
- Font: IBM Plex Mono
- Size: 14px
- Weight: 400
- Line height: 20px (1.43)
- Usage: Currency ($10,000.00), percentages (48%), invoice numbers (INV-2026-001), timestamps
- Feature: Tabular figures (numbers align in columns)

---

## COLOR PALETTE (LOCKED)

### Primary Brand Color
**Blue: #0055CC**
- Usage: Primary CTA buttons, links, focus rings, active states
- Hex: #0055CC
- RGB: 0, 85, 204
- Accessibility: 8.5:1 contrast on white (WCAG AAA)
- Never change, never darken for "modern" look

#### Blue Variants (for states)
- Hover (darker): #003A9A
- Active (darkest): #002966
- Light background: #E3F0FF
- Very light: #F0F7FF

### Neutral Colors (Grayscale)

**Black/Dark Text: #161616**
- Usage: All headings, primary text
- Hex: #161616
- RGB: 22, 22, 22
- Warmer than pure black (#000000), less jarring

**Secondary Text: #525252**
- Usage: Body text, descriptions, secondary info
- Hex: #525252
- RGB: 82, 82, 82
- 8.5:1 contrast on white (WCAG AAA)

**Muted Text (Disabled, Hints): #8D8D8D**
- Usage: Disabled text, placeholder, hints
- Hex: #8D8D8D
- RGB: 141, 141, 141
- 4.5:1 contrast on white (WCAG AA for disabled)

**Light Gray: #F4F4F4**
- Usage: Alternative backgrounds, input focus, hover states
- Hex: #F4F4F4
- RGB: 244, 244, 244
- Slightly off-white (not pure white #FFFFFF)

**Lighter Gray: #FAFAFA**
- Usage: Card backgrounds on gray page backgrounds
- Hex: #FAFAFA
- RGB: 250, 250, 250
- Between white and light gray

**Border Gray: #E0E0E0**
- Usage: Input borders, dividers, card borders
- Hex: #E0E0E0
- RGB: 224, 224, 224
- Subtle but visible

**Darkest Gray: #262626**
- Usage: Dark mode text (if Phase 2 implemented)
- Hex: #262626
- RGB: 38, 38, 38

### Status Colors (Semantic)

**Success (Green) - Paid, Complete, On-track: #1B8917**
- Hex: #1B8917
- RGB: 27, 137, 23
- Light variant: #E8F5E9 (background)
- Usage: Paid invoices, completed milestones, green status badges
- Contrast: 6:1 on white (WCAG AAA)

**Warning (Amber/Gold) - Overdue, At Risk: #B89500**
- Hex: #B89500
- RGB: 184, 149, 0
- Light variant: #FEF5E7 (background)
- Usage: Overdue invoices, projects over budget, amber status badges
- Contrast: 4.5:1 on white (WCAG AA - meets minimum)

**Error (Red) - Critical, Loss: #D13438**
- Hex: #D13438
- RGB: 209, 52, 56
- Light variant: #FADAD9 (background)
- Usage: Project losing money, network errors, destructive actions
- Contrast: 5:1 on white (WCAG AAA)

**Neutral (Gray) - Draft, Pending: #525252**
- Hex: #525252 (reuse secondary gray)
- Usage: Draft invoices, pending payments, neutral badges
- Contrast: 8.5:1 on white (WCAG AAA)

### Background & Surface Colors

**Page Background: #FFFFFF**
- Hex: #FFFFFF
- RGB: 255, 255, 255
- White, clean, professional
- On very light gray pages: Use #FAFAFA instead for card backgrounds

**Card Background: #FAFAFA**
- Hex: #FAFAFA
- RGB: 250, 250, 250
- Slightly off-white, reduces eye strain
- On white pages, cards have subtle shadow (not border)

**Surface/Modal Background: #FFFFFF**
- Hex: #FFFFFF
- Use white for modals and overlays (maximum contrast)

**Overlay/Scrim: rgba(0, 0, 0, 0.4)**
- 40% opacity black behind modals
- Blocks interaction with background
- 200ms fade animation

### Data Visualization Colors

**Revenue (Chart): #0055CC (primary blue)**
- Consistent with brand
- Easy to distinguish from expenses

**Expenses (Chart): #D13438 (error red)**
- Danger color = cost going out
- High contrast against background

**Profit (Chart): #1B8917 (success green)**
- Success color = profit is good
- Easy to understand at glance

**Trend Line (Chart): #525252 (neutral gray)**
- Secondary to other data
- Doesn't distract from main metrics

---

## LOGO & BRANDING

### Logo (Decided: Text-Only)

**Format:** Wordmark (text-only, no icon)
- Font: Inter (semibold, 600 weight)
- Size: 24px × 24px minimum
- Color: #0055CC (primary blue)
- Kerning: Tight
- Style: Uppercase or Title Case (TBD by design team based on name)

**Logo Variants:**
1. **Full Logo:** "Agency Dashboard" or product name (TBD)
   - Format: Horizontal wordmark
   - Color: #0055CC
   - Size: 120px × 40px (minimum)

2. **Mark/Favicon:** Single letter or symbol (optional, Phase 2)
   - If needed: Monogram (first 2 letters of product name in blue)
   - Color: #0055CC
   - Size: 32px × 32px

3. **Dark Mode Variant:** #FFFFFF on #0055CC background (if Phase 2)

4. **Monochrome:** #000000 (for black-and-white contexts only)

**Logo Placement:**
- Top left of header (desktop sidebar)
- Top left of header (mobile)
- Height: 32px (max)
- Padding: 16px left, 12px right

**Never:**
- ❌ Add drop shadow to logo
- ❌ Change color (always #0055CC)
- ❌ Rotate or distort
- ❌ Add glow effects
- ❌ Change fonts
- ❌ Make 3D

---

## COMPONENT COLORS (SYSTEM)

### Buttons

**Primary Button (Blue)**
- Background: #0055CC
- Text: #FFFFFF (white)
- Border: None
- Hover: #003A9A (darker blue)
- Active: #002966 (even darker)
- Disabled: #8D8D8D (gray text), 50% opacity
- Focus ring: #0055CC, 2px offset
- Shadow: None (no drop shadows)

**Secondary Button (White + Blue Border)**
- Background: #FFFFFF
- Text: #0055CC
- Border: 1px solid #0055CC
- Hover: #E3F0FF (light blue background)
- Active: #D1E3FF (darker light blue)
- Disabled: #8D8D8D (gray text), #F4F4F4 background, gray border
- Focus ring: #0055CC, 2px offset
- Shadow: None

**Tertiary Button (Link)**
- Background: None
- Text: #0055CC
- Border: None
- Hover: Underline, #0055CC
- Active: Underline remains
- Disabled: #8D8D8D
- Focus ring: #0055CC, 2px offset
- Shadow: None

**Danger Button (Red)**
- Background: #D13438 (red)
- Text: #FFFFFF (white)
- Border: None
- Hover: #A50E0E (darker red)
- Active: #7A0B0B (darkest red)
- Disabled: #8D8D8D, 50% opacity
- Focus ring: #D13438, 2px offset
- Shadow: None

**Icon Button (No Background)**
- Background: Transparent
- Icon color: #525252 (gray)
- Border: None
- Hover: #E3F0FF (light blue bg), #0055CC (blue icon)
- Active: #0055CC background, #FFFFFF icon
- Disabled: #8D8D8D, 50% opacity
- Focus ring: #0055CC, 2px offset
- Shadow: None

### Form Inputs

**Text Input / Number Input**
- Background: #FFFFFF
- Text: #161616
- Border: 1px solid #E0E0E0
- Placeholder: #8D8D8D
- Hover border: #525252
- Focus border: #0055CC (2px)
- Focus ring: #0055CC, 2px offset, box-shadow: 0 0 0 4px rgba(0, 85, 204, 0.1)
- Disabled: #F4F4F4 background, #8D8D8D text
- Error border: #D13438

**Select Dropdown**
- Background: #FFFFFF
- Text: #161616
- Border: 1px solid #E0E0E0
- Hover border: #525252
- Focus border: #0055CC
- Open: #0055CC border, options list white
- Hover option: #E3F0FF background
- Selected option: #0055CC background, #FFFFFF text
- Disabled: #F4F4F4 background

**Checkbox**
- Border: 1px solid #525252
- Background unchecked: #FFFFFF
- Background checked: #0055CC
- Checkmark: #FFFFFF
- Hover: Border #0055CC
- Focus ring: #0055CC, 2px offset
- Disabled: #8D8D8D border, #F4F4F4 background

**Radio Button**
- Border: 1px solid #525252
- Inner circle (checked): #0055CC
- Hover: Border #0055CC
- Focus ring: #0055CC, 2px offset
- Disabled: #8D8D8D, 50% opacity

### Cards & Containers

**Card Background: #FAFAFA**
- Border: None
- Border radius: 8px
- Shadow: 0 2px 4px rgba(0, 0, 0, 0.1)
- Hover shadow: 0 4px 8px rgba(0, 0, 0, 0.1)
- Padding: 16px

**Table**
- Background: #FFFFFF
- Header background: #F4F4F4
- Header border: 1px solid #E0E0E0
- Row border: 1px solid #E0E0E0
- Hover row: #F4F4F4 background
- Border radius: 8px

**Modal**
- Background: #FFFFFF
- Overlay: rgba(0, 0, 0, 0.4)
- Border radius: 8px
- Shadow: 0 8px 16px rgba(0, 0, 0, 0.15)
- Header border: 1px solid #E0E0E0 (optional)

### Status Badges & Indicators

**Badge - Success (Green)**
- Background: #E8F5E9
- Text: #1B8917
- Border: 1px solid #1B8917 (optional)
- Border radius: 4px
- Usage: "Paid", "Complete", "On Track"

**Badge - Warning (Amber)**
- Background: #FEF5E7
- Text: #7A5E00 (dark amber)
- Border: 1px solid #B89500 (optional)
- Border radius: 4px
- Usage: "Overdue", "At Risk"

**Badge - Error (Red)**
- Background: #FADAD9
- Text: #D13438
- Border: 1px solid #D13438 (optional)
- Border radius: 4px
- Usage: "Loss", "Critical"

**Badge - Neutral (Gray)**
- Background: #F4F4F4
- Text: #525252
- Border: 1px solid #E0E0E0 (optional)
- Border radius: 4px
- Usage: "Draft", "Pending"

### Alerts & Messages

**Alert - Error**
- Background: #FADAD9 (light red)
- Border: 1px solid #D13438
- Text: #8D3C3C (dark red)
- Icon: ⚠️ #D13438
- Border radius: 8px

**Alert - Warning**
- Background: #FEF5E7 (light amber)
- Border: 1px solid #B89500
- Text: #7A5E00 (dark amber)
- Icon: ⚠️ #B89500
- Border radius: 8px

**Alert - Success**
- Background: #E8F5E9 (light green)
- Border: 1px solid #1B8917
- Text: #0D5C0F (dark green)
- Icon: ✓ #1B8917
- Border radius: 8px

**Toast Notification**
- Background: #161616 (dark gray/black)
- Text: #FFFFFF (white)
- Border: None
- Border radius: 8px
- Shadow: 0 8px 16px rgba(0, 0, 0, 0.15)
- Duration: 4 seconds (auto-dismiss)
- Animation: Slide up from bottom (200ms)

---

## ICON SYSTEM (LOCKED)

### Icon Style
**Monoline** (single-stroke, professional)
- Stroke width: 2px (medium weight)
- Size: 16px (small), 24px (medium), 32px (large)
- Color: Inherit from text color or #525252 (gray)
- No fill, no solid fills

**Icon Sources:**
1. **Feather Icons** (simple, professional) — PRIMARY
2. **Heroicons** (alternative if Feather missing)
3. **Custom SVG** (if needed for specific actions)

Never use:
- ❌ Lucide Icons (too trendy)
- ❌ Emojis (completely forbidden)
- ❌ Font Awesome (too heavy)
- ❌ Complex multi-color icons
- ❌ Animated icons

### Icon Colors
- **Default:** #525252 (secondary gray)
- **Active/Hover:** #0055CC (primary blue)
- **Disabled:** #8D8D8D (muted)
- **Success:** #1B8917 (green)
- **Warning:** #B89500 (amber)
- **Error:** #D13438 (red)
- **White (on colored bg):** #FFFFFF

### Icon Usage (Examples)
- **Settings/Config:** ⚙️ (gear icon)
- **Menu:** ☰ (hamburger)
- **Close/Dismiss:** ✕ (X icon)
- **Edit:** ✎ (pencil)
- **Delete:** 🗑 (trash)
- **Search:** 🔍 (magnifying glass)
- **Dashboard:** 📊 (bar chart)
- **Projects:** 📋 (clipboard)
- **Invoices:** 📄 (document)
- **Clients:** 👥 (people)
- **Settings:** ⚙️ (gear)
- **Help:** ? (question mark in circle)
- **Logout:** ⬅️ (exit/arrow left)

---

## SHADOWS & DEPTH SYSTEM (LOCKED)

### Elevation Levels

**Elevation 0 (No Shadow)**
- Usage: Text, icons, backgrounds
- Shadow: None
- Example: Headings, disabled text

**Elevation 1 (Subtle Lift)**
- Usage: Cards, default components
- Shadow: `0 2px 4px rgba(0, 0, 0, 0.1)`
- Example: Project cards, invoice cards

**Elevation 2 (Raised)**
- Usage: Hover state on cards, dropdowns
- Shadow: `0 4px 8px rgba(0, 0, 0, 0.1)`
- Example: Card hover, dropdown menu

**Elevation 3 (Floating)**
- Usage: Modals, floating action buttons, top-level overlays
- Shadow: `0 8px 16px rgba(0, 0, 0, 0.15)`
- Example: Modal, floating help button

**Dark Mode Shadows:**
- Replace `rgba(0, 0, 0, X)` with `rgba(255, 255, 255, X)`
- Example: `0 2px 4px rgba(255, 255, 255, 0.1)` (light shadow on dark bg)

### Never Use:
- ❌ Drop shadow on buttons (use color instead)
- ❌ Multiple shadows (confusing depth)
- ❌ Inner shadows (looks old/dated)
- ❌ Soft, blurry shadows (unrealistic)
- ❌ Colored shadows (unnecessary)

---

## SPACING SCALE (LOCKED)

### Base Unit: 4px

**Full Scale:**
- **xs (4px):** Icon padding, tight gaps
- **sm (8px):** Button padding, form field gaps, component gaps
- **md (12px):** Section padding, space between form fields
- **lg (16px):** Card padding, space between sections
- **xl (24px):** Page margins, space between major sections
- **2xl (32px):** Space between different page areas
- **3xl (48px):** Large space between sections

### Usage (Finalized)

**Button Padding:**
- Horizontal: 12px
- Vertical: 8px
- Height minimum: 40px (desktop), 44px (mobile)

**Form Field Padding:**
- Horizontal: 12px
- Vertical: 8px
- Height minimum: 40px

**Card Padding:** 16px (all sides)

**Modal Padding:** 24px (all sides)

**Section Gaps:** 24px (between sections)

**Page Margins:** 24px (desktop), 16px (mobile)

**List Item Gap:** 8px (between items in list)

### Vertical Rhythm (Line Height)
- Base: 14px font + 20px line-height = 6px extra space (comfortable reading)
- Heading: 24px font + 32px line-height = 8px extra space
- Never: Line-height < 1.25 (too cramped)
- Never: Line-height > 1.8 (too loose, looks "soft")

---

## BORDER RADIUS (LOCKED)

**Radius Values (No Change):**
- **0px:** Sharp edges (NOT USED in this design)
- **4px:** Default for inputs, buttons, small components
- **8px:** Cards, modals, containers
- **16px:** Avatar images only (decorative)
- **50%:** Circular elements (badges, avatar placeholder)

**Never:**
- ❌ Use 12px or 20px (arbitrary, not in system)
- ❌ Use 2px (too subtle)
- ❌ Mix radius values (confusing)
- ❌ Soft radius on everything (Phase 2 decision, not now)

---

## BORDERS (LOCKED)

**Border Width:** 1px (standard)

**Border Styles:**
- Solid (only style used)
- Never dashed, dotted, or double

**Border Colors:**
- Default: #E0E0E0 (light gray) for inputs, cards, tables
- Focus: #0055CC (primary blue) for focused inputs
- Hover: #525252 (darker gray) for hover states
- Error: #D13438 (red) for validation errors
- Success: #1B8917 (green) for valid inputs (optional)

**Border Radius:** 4px (inputs), 8px (containers)

---

## TYPOGRAPHY RULES (HARD CONSTRAINTS)

**Never:**
- ❌ Use italics (except for emphasis, rare)
- ❌ Use all caps for body text (headings only, if needed)
- ❌ Use em dashes in UI (use hyphens or spaces)
- ❌ Use text shadows
- ❌ Use text outlines
- ❌ Underline text (use bold or color instead)
- ❌ Justify text (left-align only)
- ❌ Use different fonts (only Inter)

**Always:**
- ✅ Left-align all text (never center body text)
- ✅ Use consistent line-height (1.25–1.5)
- ✅ Use 14px minimum for body text (never smaller)
- ✅ 16px+ on mobile (prevents auto-zoom on focus)
- ✅ Pair headings with body text (never heading alone)

---

## ANIMATION TIMING (LOCKED)

**Standard Duration:** 200ms (default for most interactions)

**Animation Curves:**
- **Entrance:** ease-out (fast start, slow end)
- **Exit:** ease-in (slow start, fast end)
- **Hover:** ease-in-out (smooth both ways)

**Specific Timings:**
- Button hover: 200ms ease-in-out
- Modal entrance: 200ms ease-out (fade + scale)
- Modal exit: 200ms ease-in
- Dropdown open: 150ms ease-out
- Toast slide in: 200ms ease-out
- Focus ring: Instant (no animation)
- Loading spinner: 1s linear (continuous)
- Skeleton pulse: 0.8s ease-in-out (infinite)

**Reduced Motion:**
- Respects `prefers-reduced-motion: reduce`
- All animations → 0ms (instant)
- Pulsing skeleton → static
- Hover transitions → instant

---

## DARK MODE (DECIDED: PHASE 2+, NOT MVP)

**Status:** Locked for Phase 2+, do NOT build for MVP

**Will implement:** After MVP launch
**Why:** Adds complexity, testing burden, not in MVP scope
**When:** Based on user feedback and demand

---

## ACCESSIBILITY CONSTRAINTS (LOCKED)

**Minimum Contrast Ratios:**
- Normal text: 4.5:1 (WCAG AA)
- Target: 7:1+ (WCAG AAA, prefer this)
- All colors verified before implementation

**Focus Rings:**
- Always visible (never remove)
- 2px solid #0055CC
- 2px offset from element
- Tested on all interactive elements

**Touch Targets:**
- Minimum: 44px × 44px (mobile)
- Minimum: 40px × 40px (desktop, acceptable)
- Gap between targets: 8px minimum

**Font Size:**
- Minimum: 12px (very small labels only)
- Comfortable: 14px (body text)
- Mobile: 16px+ (prevents auto-zoom)

**Labels:**
- All form inputs have labels (not just placeholder)
- Labels linked to inputs
- Required fields marked with * (red)

---

## COLOR CODES (COPY-PASTE REFERENCE)

```
Primary Blue: #0055CC
Hover Blue: #003A9A
Dark Blue: #002966
Light Blue BG: #E3F0FF
Very Light Blue: #F0F7FF

Black Text: #161616
Secondary Text: #525252
Muted Text: #8D8D8D
Light Gray: #F4F4F4
Lighter Gray: #FAFAFA
Border Gray: #E0E0E0

Success Green: #1B8917
Success Light: #E8F5E9

Warning Amber: #B89500
Warning Light: #FEF5E7

Error Red: #D13438
Error Light: #FADAD9

White: #FFFFFF
Pure Black: #000000
```

---

## HANDOFF TO DEVELOPERS

### Figma Components (Built & Ready)
- [ ] Button (4 variants: Primary, Secondary, Tertiary, Danger)
- [ ] Input (Text, Select, Checkbox, Radio)
- [ ] Card (default, hover, loading states)
- [ ] Table (header, rows, hover, selected)
- [ ] Modal (header, body, footer)
- [ ] Badge (4 status variants)
- [ ] Toast (auto-dismiss)
- [ ] Alert (error, warning, success)
- [ ] Focus ring (auto-applied)

### CSS Variables (Ready for Dev)
```css
:root {
  --color-primary: #0055CC;
  --color-primary-hover: #003A9A;
  --color-primary-dark: #002966;
  --color-primary-light: #E3F0FF;
  
  --color-text-primary: #161616;
  --color-text-secondary: #525252;
  --color-text-muted: #8D8D8D;
  
  --color-bg-light: #F4F4F4;
  --color-bg-lighter: #FAFAFA;
  --color-border: #E0E0E0;
  
  --color-success: #1B8917;
  --color-warning: #B89500;
  --color-error: #D13438;
  
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  --spacing-3xl: 48px;
  
  --radius-sm: 4px;
  --radius-md: 8px;
  
  --shadow-1: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-2: 0 4px 8px rgba(0, 0, 0, 0.1);
  --shadow-3: 0 8px 16px rgba(0, 0, 0, 0.15);
  
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-base: 14px;
  --line-height-base: 1.43;
}
```

---

## SUMMARY: WHAT IS LOCKED

✅ **Typography:** Inter only, specific sizes & weights, no alternatives  
✅ **Colors:** Hex codes locked (primary blue #0055CC, neutrals, status colors)  
✅ **Spacing:** 4px base unit, all gaps/padding defined  
✅ **Radius:** 4px (inputs), 8px (cards), no variation  
✅ **Shadows:** 3 elevation levels only, specific RGBA values  
✅ **Buttons:** 4 variants (Primary, Secondary, Tertiary, Danger) with states  
✅ **Icons:** Feather/Heroicons monoline only, 2px stroke  
✅ **Logo:** Text-only wordmark in primary blue, no variations  
✅ **Animations:** 200ms standard, respects prefers-reduced-motion  
✅ **Accessibility:** Minimum contrast 4.5:1, focus rings always visible  
✅ **Dark mode:** Phase 2+, not MVP  

**No further decisions needed. Build from this.**

