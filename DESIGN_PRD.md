# Tzelem Design PRD
## Product Requirements Document for Design System

> **AI Context**: This document serves as the authoritative design reference for all development work on Tzelem. Always refer to this document when making design decisions, implementing components, or creating new features. Maintain strict adherence to these guidelines to ensure consistency across the application.

---

## Design Philosophy

### Core Principles
- **Premium Simplicity**: Clean, uncluttered interfaces that feel expensive and thoughtful
- **Functional Minimalism**: Every element serves a purpose; remove the unnecessary
- **Apple-Inspired Clarity**: Clear hierarchy, generous whitespace, intentional typography
- **Vercel-Level Polish**: Pixel-perfect execution with subtle, meaningful details
- **Enterprise Trustworthiness**: Professional, reliable, and confidence-inspiring

### Aesthetic Goals
- Sophisticated monochromatic foundation with strategic accent colors
- High contrast for accessibility and premium feel
- Subtle depth through shadows, borders, and layering
- Smooth, purposeful animations that enhance usability
- Clean typography with excellent readability

---

## Typography System

### Primary Font Family
```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Font Weights
- **Light**: 300 (reserved for large display text)
- **Regular**: 400 (body text, captions)
- **Medium**: 500 (emphasized body text, navigation)
- **Semibold**: 600 (buttons, labels, strong emphasis)
- **Bold**: 700 (headings, important actions)
- **Black**: 900 (hero titles, display text)

### Type Scale & Usage

#### Display Text
```css
/* Hero Headlines */
.display-large {
  font-size: clamp(48px, 8vw, 80px);
  font-weight: 900;
  line-height: 1.02;
  letter-spacing: -0.025em;
}

/* Section Headlines */
.display-medium {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* Card Headlines */
.display-small {
  font-size: clamp(24px, 3.5vw, 36px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.015em;
}
```

#### Body Text
```css
/* Primary Body */
.body-large {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.6;
}

/* Secondary Body */
.body-medium {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}

/* Small Body */
.body-small {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

/* Captions */
.caption {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.01em;
}
```

#### Interface Text
```css
/* Button Text */
.button-text {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.005em;
}

/* Navigation */
.nav-text {
  font-size: 15px;
  font-weight: 500;
}

/* Labels */
.label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

---

## Color System

### Monochromatic Foundation

#### Light Theme (Default)
```css
:root {
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --bg-tertiary: #f5f5f5;
  --bg-elevated: #ffffff;
  
  /* Text Colors */
  --text-primary: #1a1a1a;
  --text-secondary: #525252;
  --text-tertiary: #737373;
  --text-disabled: #a3a3a3;
  
  /* Border Colors */
  --border-primary: #e5e5e5;
  --border-secondary: #f0f0f0;
  --border-focus: #1a1a1a;
  
  /* Interaction States */
  --hover-overlay: rgba(0, 0, 0, 0.05);
  --active-overlay: rgba(0, 0, 0, 0.1);
  --focus-ring: rgba(26, 26, 26, 0.2);
}
```

#### Dark Theme
```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Backgrounds */
    --bg-primary: #0a0a0a;
    --bg-secondary: #151515;
    --bg-tertiary: #1f1f1f;
    --bg-elevated: #252525;
    
    /* Text Colors */
    --text-primary: #fafafa;
    --text-secondary: #a3a3a3;
    --text-tertiary: #737373;
    --text-disabled: #525252;
    
    /* Border Colors */
    --border-primary: #262626;
    --border-secondary: #1f1f1f;
    --border-focus: #fafafa;
    
    /* Interaction States */
    --hover-overlay: rgba(255, 255, 255, 0.05);
    --active-overlay: rgba(255, 255, 255, 0.1);
    --focus-ring: rgba(250, 250, 250, 0.3);
  }
}
```

### Accent Colors
```css
:root {
  /* Primary Accent - Blue */
  --accent-primary: #0066ff;
  --accent-primary-hover: #0052cc;
  --accent-primary-light: rgba(0, 102, 255, 0.1);
  
  /* Success States */
  --success: #00d084;
  --success-light: rgba(0, 208, 132, 0.1);
  
  /* Warning States */
  --warning: #ff8800;
  --warning-light: rgba(255, 136, 0, 0.1);
  
  /* Error States */
  --error: #ff4444;
  --error-light: rgba(255, 68, 68, 0.1);
}
```

### Usage Guidelines
- **Primary backgrounds**: Use for main content areas
- **Secondary backgrounds**: Use for sidebars, navigation
- **Tertiary backgrounds**: Use for input fields, inactive states
- **Elevated backgrounds**: Use for modals, dropdowns, cards with shadow
- **Accent sparingly**: Only for primary actions and key interactive elements
- **High contrast**: Ensure minimum 4.5:1 contrast ratio for text

---

## Spacing System

### Scale (8px base unit)
```css
:root {
  --space-1: 4px;   /* 0.5 units */
  --space-2: 8px;   /* 1 unit */
  --space-3: 12px;  /* 1.5 units */
  --space-4: 16px;  /* 2 units */
  --space-5: 20px;  /* 2.5 units */
  --space-6: 24px;  /* 3 units */
  --space-8: 32px;  /* 4 units */
  --space-10: 40px; /* 5 units */
  --space-12: 48px; /* 6 units */
  --space-16: 64px; /* 8 units */
  --space-20: 80px; /* 10 units */
  --space-24: 96px; /* 12 units */
}
```

### Application
- **Component internal spacing**: Use --space-2 to --space-6
- **Component external margins**: Use --space-4 to --space-12
- **Section spacing**: Use --space-16 to --space-24
- **Micro-spacing**: Use --space-1 for fine adjustments

---

## Component System

### Buttons

#### Primary Button
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: var(--text-primary);
  color: var(--bg-primary);
  font: var(--button-text);
  border: 1px solid var(--text-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### Secondary Button
```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: transparent;
  color: var(--text-primary);
  font: var(--button-text);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: var(--hover-overlay);
  border-color: var(--border-focus);
}
```

### Cards
```css
.card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-featured {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: var(--accent-primary);
}
```

### Form Elements
```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  font: var(--body-medium);
  color: var(--text-primary);
  transition: all 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--border-focus);
  background: var(--bg-elevated);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

---

## Layout System

### Container Widths
```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.container-narrow {
  max-width: 800px;
}

.container-wide {
  max-width: 1400px;
}
```

### Grid System
```css
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
```

### Responsive Breakpoints
```css
/* Mobile First Approach */
/* xs: 0px and up (default) */
/* sm: 640px and up */
@media (min-width: 40rem) { }

/* md: 768px and up */
@media (min-width: 48rem) { }

/* lg: 1024px and up */
@media (min-width: 64rem) { }

/* xl: 1280px and up */
@media (min-width: 80rem) { }
```

---

## Interaction Design

### Animation Principles
- **Subtle and fast**: 150-250ms for most interactions
- **Easing**: Use `ease` or `cubic-bezier(0.4, 0, 0.2, 1)` for natural motion
- **Purpose-driven**: Animations should provide feedback or guide attention
- **Respectful**: Honor `prefers-reduced-motion` user preference

### Micro-interactions
```css
/* Hover states */
.interactive {
  transition: all 0.15s ease;
}

.interactive:hover {
  transform: translateY(-1px);
}

/* Focus states */
.focusable:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Loading states */
.loading {
  position: relative;
  color: transparent;
}

.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid var(--border-primary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Navigation & Header

### Header Specifications
```css
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-primary);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-secondary);
  padding: var(--space-4) 0;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: 700;
  font-size: 18px;
  color: var(--text-primary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.nav-link {
  font: var(--nav-text);
  color: var(--text-secondary);
  transition: color 0.15s ease;
}

.nav-link:hover,
.nav-link.active {
  color: var(--text-primary);
}
```

---

## Iconography

### Icon System
- **Size scale**: 16px, 20px, 24px, 32px
- **Style**: Minimal, 2px stroke weight
- **Usage**: Sparingly, only when they improve comprehension
- **Sources**: Heroicons, Lucide, or custom SVGs
- **Implementation**: SVG sprites or individual components

### Icon Guidelines
```css
.icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-small { width: 16px; height: 16px; }
.icon-large { width: 24px; height: 24px; }
.icon-xl { width: 32px; height: 32px; }
```

---

## Content Guidelines

### Voice & Tone
- **Clear and direct**: Avoid jargon, speak plainly
- **Confident but humble**: Authoritative without being arrogant
- **Professional warmth**: Approachable but serious about business
- **Concise**: Respect users' time with brief, meaningful content

### Writing Style
- Use active voice
- Start with action verbs for buttons and CTAs
- Use sentence case for headings (not title case)
- Keep paragraphs short (2-3 sentences max)
- Use bullet points for lists

### Error Messages
- Be specific about what went wrong
- Provide clear next steps
- Use encouraging, solution-focused language
- Avoid technical jargon

---

## Accessibility Standards

### WCAG 2.1 AA Compliance
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus indicators**: Visible focus states for all interactive elements
- **Keyboard navigation**: Full keyboard accessibility
- **Screen readers**: Proper semantic markup and ARIA labels
- **Motion**: Respect `prefers-reduced-motion` preference

### Implementation Checklist
- [ ] Alt text for all images
- [ ] Semantic HTML structure
- [ ] Proper heading hierarchy (h1 → h6)
- [ ] Form labels associated with inputs
- [ ] Focus trap in modals
- [ ] Skip navigation links
- [ ] Color is not the only way information is conveyed

---

## Performance Considerations

### Loading Strategy
- **Critical CSS**: Inline above-the-fold styles
- **Font loading**: Use `font-display: swap` for web fonts
- **Progressive enhancement**: Start with system fonts, enhance with Inter
- **Image optimization**: Use modern formats (WebP, AVIF) with fallbacks

### Bundle Optimization
- Tree-shake unused CSS
- Minimize animation libraries
- Use CSS custom properties for theming
- Compress and optimize SVG icons

---

## Implementation Notes for AI

### Development Priorities
1. **Mobile-first responsive design**: Start with mobile layout, enhance for desktop
2. **Accessibility by default**: Build with screen readers and keyboard navigation in mind
3. **Performance first**: Optimize for loading speed and smooth interactions
4. **Consistency over creativity**: Follow established patterns rather than inventing new ones

### Code Organization
```css
/* Recommended CSS structure */
/* 1. CSS Custom Properties */
/* 2. Reset/Base styles */
/* 3. Layout utilities */
/* 4. Component styles */
/* 5. State modifiers */
/* 6. Responsive overrides */
```

### Testing Requirements
- Test on multiple screen sizes (320px to 1920px+)
- Verify in both light and dark modes
- Test with keyboard-only navigation
- Validate with screen reader software
- Check color contrast ratios

---

## Visual Examples & References

### Inspiration Sources
- **Apple.com**: Clean typography, generous whitespace, subtle interactions
- **Vercel.com**: Minimal color palette, perfect contrast, smooth animations
- **Linear.app**: Sophisticated dark theme, premium feel, thoughtful details
- **Cluely screenshot**: Professional layout, clear hierarchy, modern button styling

### Key Visual Characteristics
- **High contrast**: Sharp distinction between elements
- **Minimal color**: Primarily black, white, and grays with strategic accent color
- **Clean typography**: Inter font with proper weights and spacing
- **Subtle depth**: Light shadows and borders for layering
- **Purposeful whitespace**: Generous spacing that feels intentional

---

**Remember**: This design system should feel premium, trustworthy, and effortlessly simple. Every design decision should serve the user's goals while maintaining visual consistency and brand integrity.

---

*Last updated: 2024*
*Version: 1.0*
