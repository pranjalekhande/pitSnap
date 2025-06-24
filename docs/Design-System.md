# PitSnap Design System

**Purpose:** Comprehensive design specifications for PitSnap's F1-themed mobile application  
**Platform:** iOS & Android (React Native)  
**Design Philosophy:** Speed, Precision, Premium F1 Aesthetic  

---

## 🏎️ Typography System

### Primary Font Stack

#### **Display Font: "F1 Display" (Custom/Fallback)**
```css
font-family: 'F1Display', 'Orbitron', 'Rajdhani', 'Roboto Condensed', sans-serif;
```
- **Usage**: App title, major headings, race results
- **Characteristics**: Bold, geometric, racing-inspired
- **Fallback**: Orbitron (Google Fonts) for racing aesthetic

#### **UI Font: "F1 Regular" (System Optimized)**
```css
font-family: 'F1Regular', 'Inter', 'SF Pro Display', 'Roboto', system-ui, sans-serif;
```
- **Usage**: Body text, buttons, navigation, general UI
- **Characteristics**: Clean, readable, modern
- **Platform**: SF Pro on iOS, Roboto on Android

#### **Data Font: "F1 Mono" (Monospace)**
```css
font-family: 'F1Mono', 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
```
- **Usage**: Timing data, lap times, technical specifications
- **Characteristics**: Fixed-width, precise, technical
- **Requirement**: Essential for aligned timing displays

---

## 📐 Font Size Scale (Mobile-First)

### Typography Hierarchy

#### **Display Sizes**
```css
.display-xl    { font-size: 48px; line-height: 56px; } /* App launch screen */
.display-lg    { font-size: 36px; line-height: 44px; } /* Major race events */
.display-md    { font-size: 28px; line-height: 36px; } /* Race winners */
.display-sm    { font-size: 24px; line-height: 32px; } /* Section headers */
```

#### **Heading Sizes**
```css
.heading-xl    { font-size: 20px; line-height: 28px; } /* Screen titles */
.heading-lg    { font-size: 18px; line-height: 26px; } /* Card titles */
.heading-md    { font-size: 16px; line-height: 24px; } /* Driver names */
.heading-sm    { font-size: 14px; line-height: 20px; } /* Subheadings */
```

#### **Body Text Sizes**
```css
.body-lg       { font-size: 16px; line-height: 24px; } /* Primary text */
.body-md       { font-size: 14px; line-height: 20px; } /* Secondary text */
.body-sm       { font-size: 12px; line-height: 18px; } /* Captions, metadata */
.body-xs       { font-size: 10px; line-height: 14px; } /* Fine print */
```

#### **Data Display Sizes (Monospace)**
```css
.data-xl       { font-size: 32px; line-height: 36px; } /* Lap times (large) */
.data-lg       { font-size: 24px; line-height: 28px; } /* Position numbers */
.data-md       { font-size: 16px; line-height: 20px; } /* Sector times */
.data-sm       { font-size: 12px; line-height: 16px; } /* Gap timings */
```

---

## 🎨 Color Themes System

### Dynamic Team-Based Theming

#### **Core Brand Colors**
```css
:root {
  /* PitSnap Brand */
  --primary-red: #E10600;        /* F1 Official Red */
  --primary-black: #15151E;      /* Racing Black */
  --primary-white: #FFFFFF;      /* Clean White */
  --accent-gold: #FFD700;        /* Victory Gold */
  --accent-silver: #C0C0C0;      /* P2 Silver */
  --accent-bronze: #CD7F32;      /* P3 Bronze */
}
```

#### **Team Color Palettes** (Dynamic Theming)
```css
/* Red Bull Racing */
.theme-redbull {
  --team-primary: #0600EF;       /* Red Bull Blue */
  --team-secondary: #DC143C;     /* Red Bull Red */
  --team-accent: #FFD700;        /* Gold highlights */
}

/* Mercedes */
.theme-mercedes {
  --team-primary: #00D2BE;       /* Petronas Teal */
  --team-secondary: #000000;     /* Mercedes Black */
  --team-accent: #C0C0C0;        /* Silver accents */
}

/* Ferrari */
.theme-ferrari {
  --team-primary: #DC143C;       /* Ferrari Red */
  --team-secondary: #FFD700;     /* Ferrari Yellow */
  --team-accent: #000000;        /* Black details */
}

/* McLaren */
.theme-mclaren {
  --team-primary: #FF8700;       /* McLaren Orange */
  --team-secondary: #47C7FC;     /* McLaren Blue */
  --team-accent: #FFFFFF;        /* White highlights */
}

/* Alpine */
.theme-alpine {
  --team-primary: #0090FF;       /* Alpine Blue */
  --team-secondary: #FF1493;     /* Alpine Pink */
  --team-accent: #FFFFFF;        /* White accents */
}

/* Additional teams... */
```

#### **Semantic Colors**
```css
:root {
  /* Status Colors */
  --success-green: #00C851;      /* Fastest lap, wins */
  --warning-yellow: #FFD600;     /* Yellow flags, caution */
  --danger-red: #FF4444;         /* Red flags, penalties */
  --info-blue: #33B5E5;          /* Information, DRS */
  
  /* Timing Colors */
  --purple-sector: #9C27B0;      /* Fastest sector */
  --green-sector: #4CAF50;       /* Personal best */
  --yellow-sector: #FFC107;      /* Slower than best */
  --white-sector: #FFFFFF;       /* No time set */
  
  /* Social Colors */
  --like-red: #E10600;           /* Snap likes */
  --share-blue: #0090FF;         /* Share actions */
  --comment-gray: #666666;       /* Comments */
}
```

---

## 🏁 Visual Identity Elements

### Racing-Inspired Design Components

#### **Speed Lines & Motion**
```css
.speed-lines {
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(225, 6, 0, 0.1) 20%, 
    transparent 40%);
  animation: speed-sweep 2s infinite;
}

@keyframes speed-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

#### **Checkered Flag Pattern**
```css
.checkered-pattern {
  background-image: 
    linear-gradient(45deg, #000 25%, transparent 25%),
    linear-gradient(-45deg, #000 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #000 75%),
    linear-gradient(-45deg, transparent 75%, #000 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}
```

#### **Racing Stripes**
```css
.racing-stripes {
  background: linear-gradient(45deg,
    var(--team-primary) 0%,
    var(--team-primary) 45%,
    var(--team-secondary) 50%,
    var(--team-secondary) 55%,
    var(--team-primary) 100%);
}
```

---

## 📱 Component Typography Specifications

### **Navigation & Headers**
```css
.nav-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.tab-label {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### **Race Results & Timing**
```css
.position-number {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 900;
  line-height: 1;
}

.lap-time {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
  tabular-nums: true;
}

.sector-time {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  tabular-nums: true;
}
```

### **Social Elements**
```css
.username {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
}

.snap-caption {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
}

.timestamp {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 400;
  opacity: 0.7;
}
```

### **Buttons & CTAs**
```css
.button-primary {
  font-family: var(--font-ui);
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.button-secondary {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 500;
}
```

---

## 🎯 F1-Specific UI Patterns

### **Driver Cards**
```css
.driver-card {
  background: var(--team-primary);
  border-left: 4px solid var(--team-secondary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.driver-number {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 900;
  color: var(--team-secondary);
}

.driver-name {
  font-family: var(--font-ui);
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

### **Timing Tower**
```css
.timing-position {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  width: 24px;
  text-align: center;
}

.timing-gap {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}
```

### **Race Status Indicators**
```css
.flag-indicator {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.flag-green { background: var(--success-green); }
.flag-yellow { background: var(--warning-yellow); color: #000; }
.flag-red { background: var(--danger-red); }
```

---

## 📏 Spacing & Layout

### **Grid System** (8px base unit)
```css
:root {
  --space-xs: 4px;   /* 0.5 units */
  --space-sm: 8px;   /* 1 unit */
  --space-md: 16px;  /* 2 units */
  --space-lg: 24px;  /* 3 units */
  --space-xl: 32px;  /* 4 units */
  --space-2xl: 48px; /* 6 units */
  --space-3xl: 64px; /* 8 units */
}
```

### **Border Radius** (Racing-inspired curves)
```css
:root {
  --radius-sm: 4px;   /* Small elements */
  --radius-md: 8px;   /* Cards, buttons */
  --radius-lg: 12px;  /* Panels */
  --radius-xl: 16px;  /* Major components */
  --radius-pill: 50px; /* Pills, badges */
}
```

---

## 🌟 Animation & Motion

### **F1-Inspired Transitions**
```css
:root {
  /* Timing functions inspired by F1 acceleration curves */
  --ease-acceleration: cubic-bezier(0.4, 0.0, 1, 1);
  --ease-deceleration: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-pit-stop: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  /* Duration based on F1 timing */
  --duration-pit-stop: 230ms;  /* Average pit stop time */
  --duration-sector: 400ms;    /* Sector time feel */
  --duration-lap: 800ms;       /* Full lap transition */
}
```

### **Signature Animations**
```css
@keyframes flag-wave {
  0%, 100% { transform: translateX(0) skewX(0deg); }
  25% { transform: translateX(2px) skewX(-2deg); }
  75% { transform: translateX(-2px) skewX(2deg); }
}

@keyframes pit-stop-timer {
  0% { transform: scale(1); color: var(--success-green); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); color: var(--accent-gold); }
}
```

---

## 🔧 Implementation Guidelines

### **React Native StyleSheet Example**
```typescript
export const typography = StyleSheet.create({
  displayXL: {
    fontFamily: 'F1Display-Bold',
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '900',
  },
  bodyMD: {
    fontFamily: 'F1Regular-Medium',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  dataMD: {
    fontFamily: 'F1Mono-SemiBold',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    fontVariantNumeric: 'tabular-nums',
  },
});
```

### **Dynamic Theme Provider**
```typescript
interface ThemeContext {
  currentTeam: F1Team;
  colors: TeamColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
}
```

---

This design system ensures PitSnap feels authentically F1 while maintaining excellent usability and visual hierarchy across all mobile screens and interactions. 