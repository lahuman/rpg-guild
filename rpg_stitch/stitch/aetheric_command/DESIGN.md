```markdown
# Tactical Management Interface: Design System Documentation

## 1. Overview & Creative North Star

### Creative North Star: "The Arcane Command"
This design system is not a website; it is a high-fidelity tactical HUD for elite guild commanders. It rejects the soft, rounded "friendliness" of modern SaaS in favor of **Arcane Precision**. The interface should feel like a physical glass-and-metal console discovered in a high-fantasy archives—cold, authoritative, and immensely powerful.

**Breaking the Template:**
To achieve a signature look, we avoid the "card-in-a-grid" monotony. We use **intentional asymmetry**: large-scale status displays (Primary) anchored against dense, monospaced data streams (Secondary). Elements should overlap slightly, with "glass" panels creating a sense of three-dimensional depth within the dark slate void of the background.

---

## 2. Colors & Surface Philosophy

The palette is rooted in a deep, nocturnal base to allow our "magical" interactive elements to glow.

### Color Tokens
- **Base (Background):** `#0b1326` (The Void).
- **Primary (Amber):** `#ffbf00` — Reserved for wealth, elite rank, and high-tier rewards.
- **Secondary (Cyan):** `#00ffff` — Used for system telemetry, active navigation, and "mana" or progress metrics.
- **Alert (Rose):** `#e11d48` — Critical failures, resource costs, and lethal threats.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. They look "cheap" and digital. Boundaries must be defined through:
1. **Background Shifts:** Placing a `surface-container-high` (#222a3d) panel over the `surface` (#0b1326) base.
2. **Material Transition:** Moving from a solid slate to a semi-transparent glass panel.

### Glass & Texture
All floating panels must utilize **Glassmorphism**. Use `surface-variant` (#2d3449) at 60% opacity with a `backdrop-blur` of 12px. This creates a "frosted arcane glass" effect where the background navy bleeds through, softening the edges of the tactical data.

---

## 3. Typography: The Voice of Command

We combine three distinct typefaces to build the "world-building" feel.

- **Display & Headlines (Space Grotesk):** Sharp, wide, and authoritative. Use `display-lg` (3.5rem) for major world locations and `headline-md` (1.75rem) for guild stats. These should always be in high-contrast `on-surface` (#dae2fd).
- **Body (Manrope):** Our workhorse. High readability for mission descriptions and lore. Use `body-md` (0.875rem) for standard text.
- **Data & Labels (Inter / Monospace):** Use for stats, gold counts, and coordinates. The high-contrast, fixed-width nature of these digits conveys "tactical accuracy."

---

## 4. Elevation, Depth & The "Metal Frame"

Hierarchy is achieved through **Tonal Layering** and the "Metal Frame" aesthetic rather than traditional drop shadows.

### The Layering Principle
*   **Layer 0 (Base):** `surface` (#0b1326).
*   **Layer 1 (Sub-panels):** `surface-container-low` (#131b2e).
*   **Layer 2 (Active Modals):** `surface-container-highest` (#2d3449) with 20% opacity `outline-variant` (#504532) for a "machined metal" edge.

### The "Ghost Border"
If a container needs a border, use the **Ghost Border** method: `outline-variant` (#504532) at 15% opacity. This mimics a faint light reflection on a metal edge rather than a drawn line.

### Ambient Glows
Instead of black shadows, use **Cyan or Amber "Ambient Glows."** For high-rank cards, apply a 20px blur shadow using `primary-container` (#ffbf00) at 5% opacity to make the element appear as if it's emitting light.

---

## 5. Components

### Tactical Buttons
*   **Primary (Amber):** Rectangular (0px radius). Solid `primary-container` (#ffbf00) with `on-primary` (#402d00) text. On hover, apply a CSS `brightness(1.2)` and a "sheen" animation.
*   **System (Cyan):** Ghost-style. `outline` (#9c8f78) border at 20% with `secondary` (#ffffff) text.

### Stat Chips
Non-interactive data points. Background: `surface-container-high`. Left-side accent: A 2px vertical "glow bar" in either `primary` or `secondary` color depending on the data type.

### Tactical Cards
*   **No Dividers:** Use `spacing-6` (1.3rem) of vertical whitespace to separate header from content.
*   **The Lift:** On hover, cards should transition from `surface-container-low` to `surface-container-highest` and "rise" by 4px.

### Inputs
Text fields are `surface-container-lowest` (#060e20) with a 1px bottom-only border in `outline-variant`. When focused, the bottom border glows `secondary` (#00ffff).

---

## 6. Do’s and Don’ts

### Do:
*   **Use 0px Border Radius:** Everything is sharp, machined, and crystalline.
*   **Embrace Negative Space:** Allow the "dark slate" to breathe between complex data panels.
*   **Animate with Intent:** Use the "fade + slight rise" (200ms) for all new UI panels to simulate a system boot-up.
*   **Layer your Cyan:** Use the Cyan (#00FFFF) for "interactive" system info only. If it’s just text, use `on-surface-variant`.

### Don’t:
*   **No Rounded Corners:** Never use `border-radius`. It destroys the "Tactical Console" vibe.
*   **No Drop Shadows:** Avoid heavy, dark shadows. Use light-based glows or tonal shifts.
*   **No "Cute" Icons:** Use sharp, geometric, or heraldic iconography. Avoid bubbly, filled icons.
*   **No Flat Colors for Gold:** Gold/Amber should always have a subtle 5-degree linear gradient to feel metallic.

---

## 7. Motion & Interaction

1.  **Entry:** `Opacity 0% -> 100%`, `Y-offset 10px -> 0px` (Duration: 300ms, Easing: Power2.out).
2.  **State Change:** When a rank increases, trigger a "Sheen" animation—a diagonal white highlight (10% opacity) that sweeps across the element.
3.  **Active Toggle:** Navigation items should have a persistent "glow" (Box-shadow: 0 0 10px Cyan at 20% opacity) when active.