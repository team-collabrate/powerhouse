# Dashboard Design Specification
# Matching FlowMail Aesthetic

**Reference:** FlowMail dashboard screenshot  
**Status:** Production-ready  
**Date:** September 2026

---

## DESIGN SYSTEM (LOCKED)

### Color Palette

```
Primary Green:      #5cd65c  (Growth, profit, positive metrics)
Secondary Purple:   #9933ff  (Buttons, accents, interactions)
Text Primary:       #161616  (Headings, important text)
Text Secondary:     #525252  (Body text, secondary info)
Text Muted:         #8D8D8D  (Labels, hints, disabled)
Background Page:    #ffffff  (Main background)
Background Card:    #fafafa  (Card backgrounds, subtle)
Background Alt:     #f4f4f4  (Hover states, borders)
Border:             #e0e0e0  (Dividers, subtle separation)
Success:            #1B8917  (Green badges, positive)
Warning:            #B89500  (Orange badges, caution)
Error:              #D13438  (Red badges, issues)
```

### Typography

```
Font: Inter (Google Fonts)
Weights: 400, 500, 600, 700

H1 (Welcome):           28px, 600 weight, #161616
H2 (Section titles):    16px, 600 weight, #161616
Labels:                 12px, 500 weight, uppercase, letter-spacing 0.5px
Body:                   14px, 400 weight, #525252
Small text:             12px, 400 weight, #8D8D8D
Metrics values:         32px, 600 weight, #161616
Table headers:          11px, 500 weight, uppercase
```

### Spacing (8px baseline)

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
3xl: 48px
```

### Border Radius

```
Small inputs/buttons: 8px
Cards/modals: 12px
Avatars: 50% (circles)
Icons: 8px
```

### Shadows

```
Elevation 1: 0 2px 4px rgba(0,0,0,0.08)
Elevation 2: 0 4px 8px rgba(0,0,0,0.12)
Elevation 3: 0 8px 16px rgba(0,0,0,0.16)
```

---

## LAYOUT STRUCTURE

### Sidebar (260px fixed)

**Properties:**
- Width: 260px
- Fixed left position
- White background with 1px border-right
- Padding: 24px (top/bottom), 16px (left/right)
- Z-index: 10
- Scrollable content

**Elements:**
1. **Logo + Brand Name** (top 32px + 24px margin-bottom)
   - Logo: 32px × 32px, background purple, border-radius 8px
   - Name: "Agency Pro", 16px bold
   
2. **Navigation Menu** (gap 8px between items)
   - 8 nav items (Dashboard, Projects, Time Tracking, etc.)
   - 12px padding, 8px border-radius
   - Hover: background #f4f4f4
   - Active: green background, white text
   - Icons + text (gap 12px)
   
3. **User Profile** (footer, 40px height + 16px top border)
   - Avatar: 40px circle, purple background
   - Name + plan (right side)
   - Clickable/hoverable

### Header (100% width, 56px height)

**Properties:**
- Fixed top
- White background with 1px bottom border
- Padding: 16px 32px
- Flex layout (space-between)

**Left Section:**
- Breadcrumb text ("Dashboard")
- Search box (300px max, #f4f4f4 background)

**Right Section:**
- Notification bell icon (40px, #f4f4f4 background)
- "Get Insights" button (purple, flex with icon + text)

### Main Content (scrollable)

**Properties:**
- Padding: 32px all sides
- White background
- 4 sections stacked vertically

**Section 1: Welcome**
- H1 + description (left)
- 2 action buttons (right): "New Project" (secondary), "Create Invoice" (primary)

**Section 2: Metrics Grid**
- 4 columns (responsive: 2 columns at 1400px, 1 column at 768px)
- 16px gap between cards
- 20px padding inside each card

**Section 3: Charts Grid**
- 3 columns (2fr 1fr 1fr) initially
- Responsive: 2 columns at 1400px, 1 column at 768px
- 16px gap

**Section 4: Bottom Section**
- 3 columns (equal width)
- Tables + insights card
- 16px gap
- Responsive: 2 columns at 1400px, 1 column at 768px

---

## COMPONENT SPECIFICATIONS

### Metric Card

```
Background: #fafafa
Border: 1px #e0e0e0
Border-radius: 12px
Padding: 20px
Transition: 0.3s ease

Hover state:
  - Border-color: #5cd65c
  - Box-shadow: 0 4px 12px rgba(92,214,92,0.1)

Content:
  1. Header (space-between)
     - Left: Label (12px, uppercase, #8D8D8D)
     - Right: Menu dots (⋮, clickable)
  
  2. Value (32px, 600 weight, #161616)
  
  3. Change indicator (12px, flex row)
     - Arrow icon (↗ or ↘, 10px)
     - Text (positive: green, negative: red)
```

### Chart Card

```
Background: #fafafa
Border: 1px #e0e0e0
Border-radius: 12px
Padding: 24px

Header:
  - Title (16px, 600 weight)
  - Subtitle (12px, muted, below title)
  - Menu dots (right)

Content variations:
  1. Line chart: 200px height placeholder, gradient background
  2. Pie chart: 180px circle with center donut showing percentage
  3. Data card: List of items with metrics
```

### Status Badge

```
Padding: 4px 8px
Border-radius: 6px
Font-size: 11px, 500 weight
Background + text color combination:

Active:     bg: rgba(27,137,23,0.1)   text: #1B8917
Scheduled:  bg: rgba(185,149,0,0.1)   text: #B89500
Completed:  bg: rgba(209,52,56,0.1)   text: #D13438
```

### Button Styles

```
Primary Button:
  - Background: #9933ff
  - Text: white
  - Padding: 10px 20px
  - Border-radius: 8px
  - Hover: opacity 0.9, translateY(-2px)
  - Flex with icon + text (gap 8px)

Secondary Button:
  - Background: white
  - Border: 1px #e0e0e0
  - Text: #161616
  - Padding: 10px 16px
  - Hover: background #f4f4f4

Icon Button:
  - Width: 40px
  - Height: 40px
  - Background: #f4f4f4
  - Border-radius: 8px
  - Hover: background #e0e0e0
```

### Input Elements

```
Search Box:
  - Padding: 10px 16px
  - Border: 1px #e0e0e0
  - Border-radius: 8px
  - Background: #f4f4f4
  - Font-size: 14px
  - Placeholder color: #8D8D8D
  
  Focus:
    - Border-color: #5cd65c
    - Background: white
```

### Table

```
Font-size: 13px
Border-collapse: collapse

Header row:
  - Font-size: 11px
  - Weight: 500
  - Text-transform: uppercase
  - Color: #8D8D8D
  - Letter-spacing: 0.5px
  - Padding: 8px 0
  - Border-bottom: 1px #e0e0e0

Data rows:
  - Padding: 12px 0
  - Color: #525252
  - Border-bottom: 1px #f4f4f4
  
  Alternating: no (white only)
  Hover: subtle highlight (optional)
```

### Insights Card

```
Background: #fafafa
Border: 1px #e0e0e0
Border-radius: 12px
Padding: 24px

Each insight item (margin-bottom: 20px):
  - Flex row (gap 12px)
  - Icon: 40px × 40px, #f4f4f4 background, center-aligned
  - Content:
    * Title: 13px, 600 weight, #161616
    * Text: 12px, #8D8D8D
```

---

## RESPONSIVE BREAKPOINTS

### Desktop (1400px+)
- Sidebar: 260px fixed
- Metrics: 4 columns
- Charts: 3 columns (2fr 1fr 1fr)
- Bottom: 3 columns

### Tablet (768px - 1399px)
- Sidebar: 260px (collapsible to icons only at smaller sizes)
- Metrics: 2 columns
- Charts: 2 columns
- Bottom: 2 columns

### Mobile (< 768px)
- Sidebar: Hidden (overlay on hamburger click)
- Metrics: 1 column
- Charts: 1 column
- Bottom: 1 column
- Content padding: 20px (reduced from 32px)
- Header padding: reduce horizontally

---

## ANIMATION & INTERACTION

### Transitions

```
Default: all 0.2s ease
Cards hover: 0.3s ease (more pronounced)
Buttons: immediate feedback, 0.2s hover

Examples:
  - Card border: 0.3s ease
  - Button hover: 0.2s ease
  - Icon button: 0.2s ease
```

### Hover Effects

```
Metric Card:
  - Border color → green
  - Shadow → elevation 2

Chart Card:
  - Subtle shadow increase
  - Title bold on hover (optional)

Button:
  - Primary: opacity slight decrease, translate up 2px
  - Secondary: background → #f4f4f4
  - Icon: background → #e0e0e0

Table row:
  - Subtle background highlight (optional)
```

### Loading States

```
Placeholder cards: gradient animation
Chart placeholders: text + icon
Skeleton loaders: gray pulse animation
Spinners: rotating icon (optional)
```

### Empty States

```
Message: "No data yet"
Icon: relevant emoji or icon
CTA button: "Create new item"
Subtle illustration background (optional)
```

---

## ACCESSIBILITY

### Colors

✓ All text ≥ 4.5:1 contrast ratio
✓ Focus rings: 2px solid green (#5cd65c)
✓ No color-only indicators (always use icon/badge/text)

### Keyboard Navigation

✓ Tab through all interactive elements
✓ Enter to activate buttons
✓ Escape to close modals
✓ Arrow keys in tables (optional enhancement)

### Screen Readers

✓ Semantic HTML (header, nav, main, section)
✓ ARIA labels on icon buttons
✓ Table headers properly marked
✓ Form labels associated with inputs

### Responsive Touch

✓ Button minimum 44px × 44px
✓ Link minimum 44px × 44px
✓ Tap targets spaced ≥ 8px apart
✓ No hover-only content

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## DARK MODE (PHASE 2+)

Reserved for future implementation. Current MVP: light mode only.

---

## IMPLEMENTATION NOTES

### CSS Organization

```
1. Reset & variables (:root)
2. Body & general
3. Container & layout
4. Sidebar
5. Header
6. Main content
7. Components (cards, buttons, etc.)
8. Tables
9. Responsive (media queries)
10. Scrollbars
```

### Asset Requirements

- Icons: Feather Icons (monoline, 2px stroke, 16/20/24px sizes)
- Logo: Text-only wordmark (will be supplied)
- Charts: Chart.js or Recharts (for real data)
- Avatars: User initials on colored background

### Development Approach

1. Start with static HTML (provided in DASHBOARD_REDESIGN_FLOWMAIL_STYLE.html)
2. Connect to API endpoints via TanStack Query
3. Replace placeholder data with real API responses
4. Add chart libraries (Recharts for line/pie charts)
5. Implement real-time updates (Zustand + React Query cache invalidation)
6. Add interactive modals for create/edit flows

---

## DESIGN DEBT (Not in MVP)

❌ Advanced animations (particle effects, parallax)
❌ Custom chart visualizations (use standard libraries)
❌ Drag & drop interfaces
❌ Custom SVG illustrations
❌ Icon animations

✅ Solid, professional design
✅ Fast-loading, responsive
✅ Accessible & keyboard-friendly
✅ Clean visual hierarchy

---

## CONSISTENCY CHECKLIST

Before shipping any changes:

- [ ] Colors match palette (use CSS variables)
- [ ] Typography follows scale
- [ ] Spacing uses 8px grid
- [ ] Border radius consistent (8px or 12px)
- [ ] Shadows match elevation levels
- [ ] Buttons have hover/active states
- [ ] Forms have validation states
- [ ] Empty/loading states exist
- [ ] Responsive tested at 3 breakpoints
- [ ] Keyboard navigation works
- [ ] Focus rings visible
- [ ] Dark mode not implemented (Phase 2)
- [ ] No vibecoded startup patterns
- [ ] Professional SaaS aesthetic maintained

---

**Status: LOCKED FOR DEVELOPMENT**

**Reference:** DASHBOARD_REDESIGN_FLOWMAIL_STYLE.html (working prototype)

**Next:** Connect to real API data + add interactivity

