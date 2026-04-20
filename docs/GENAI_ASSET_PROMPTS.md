# GenAI Asset Generation Prompts

This document contains the complete prompt specification for generating game assets using AI image generation tools. All assets must follow the global art direction rules.

## Global Art Direction Rules

**ALL assets MUST follow:**
- **Style:** Top-down 2D arcade realism (not cartoon)
- **Readability:** Clean geometric, high contrast edges
- **Visual Noise:** Minimal, strong silhouette clarity
- **Camera:** Strict top-down (90°), no perspective tilt
- **Lighting:** Soft ambient shading only, no complex shadows
- **Background:** Transparent for sprites, asphalt-only for tiles
- **Scale:** Consistent scale system across all assets

**FORBIDDEN:**
- Photorealism
- Perspective rendering
- Cinematic lighting
- Complex textures

---

## Car Sprites

### Generic Car Prompt Template

```
Top-down 2D arcade car sprite designed for [DRIVETRAIN] behavior.

Emphasis:
[DRIVETRAIN-SPECIFIC CHARACTERISTICS]

Style:
- Clean geometric design
- High contrast body color
- Minimal detailing
- Centered, symmetrical top-down view
- Clear front orientation
- Subtle wheel indication (not detailed rims)
- Readable silhouette even at small scale

Background: transparent
```

### FWD Car Prompt

```
Top-down 2D arcade car sprite designed for front-wheel drive behavior.

Emphasis:
- Stable front-heavy visual balance
- Compact hatchback or sedan form
- Predictable handling feel visually communicated

Style:
- Clean geometric design
- High contrast body color (blue or white preferred)
- Minimal detailing
- Centered, symmetrical top-down view
- Clear front orientation
- Subtle wheel indication

Background: transparent
```

### RWD Car Prompt

```
Top-down 2D arcade car sprite designed for rear-wheel drive behavior.

Emphasis:
- Sporty proportions
- Slightly elongated rear section
- Aggressive stance
- Rear weight emphasis in design language

Style:
- Coupe or sports car silhouette
- High contrast red / dark tones
- Minimal detailing
- Centered top-down view
- Clear front orientation

Background: transparent
```

### AWD Car Prompt

```
Top-down 2D arcade car sprite designed for all-wheel drive behavior.

Emphasis:
- Balanced symmetrical body
- SUV or rally-inspired compact form
- Stability-focused silhouette
- Wider stance for control perception

Style:
- Rugged but clean design
- Neutral green / grey palette
- Minimal detailing
- Centered top-down view
- Clear front orientation

Background: transparent
```

---

## Parking Zone Sprites

### Parking Slot

```
Top-down parking slot marker for arcade driving game.

Design:
- Rectangular painted ground markings
- Slightly worn asphalt texture
- High visibility white/yellow boundary lines
- Minimal visual clutter
- Must be readable at small scale

Background: asphalt only
```

### Perfect Park Zone (Highlighted)

```
Top-down perfect parking zone marker.

Design:
- Glowing outline rectangle
- Subtle pulsing highlight effect (baked sprite version should simulate glow via gradient)
- Clean geometric shape
- High readability priority
- Green or cyan color scheme

Purpose: Indicates precision bonus area
Background: asphalt only
```

---

## Obstacles

### Traffic Cone

```
Top-down arcade traffic cone sprite.

Design:
- Simplified cone shape
- Orange and white bands
- Slight shadow for readability
- Exaggerated proportions for visibility
- High contrast

Background: transparent
```

### Barrier

```
Top-down road barrier sprite.

Design:
- Modular plastic or metal barricade
- Red/white striping
- Slightly worn edges
- Clear collision readability
- Visually distinct from parking zones

Background: transparent
```

---

## Moving Traffic Cars

```
Top-down AI traffic car sprite.

Design:
- Simplified civilian vehicle
- Lower detail than player car
- Muted colors (grey, beige, dull blue)
- No aggressive styling
- Clearly readable direction

Purpose: Background hazard / moving obstacle
Background: transparent
```

---

## Boss Element Sprites

### Moving Parking Zone (Boss Mechanic)

```
Top-down arcade parking challenge element.

Design:
- Large glowing rectangular parking zone
- Animated feel implied through motion blur style edges
- High contrast neon outline
- Clearly readable boundaries
- Purple or magenta color scheme

Purpose: Dynamic shifting parking target
Background: asphalt only
```

### Obstacle Swarm (Boss Phase)

```
Top-down arcade obstacle cluster sprite.

Design:
- Grouped hazard objects (cones/barriers)
- Visually chaotic but still readable
- Clustered motion system implied
- High contrast warning colors

Purpose: High difficulty dynamic challenge phase
Background: transparent
```

---

## Season Background Tiles

### Summer Asphalt

```
Top-down asphalt tile for arcade driving game.

Design:
- Warm tone asphalt
- Slight heat haze impression
- Clean road texture
- Low noise
- Medium grey-brown color

Mood: Dry, fast grip
```

### Winter Ice

```
Top-down icy road tile.

Design:
- Pale blue/grey surface
- Subtle frost texture
- Slightly reflective feel
- Reduced contrast visibility
- Cool color temperature

Mood: Low grip, slippery physics
```

### Rain Wet Road

```
Top-down wet asphalt tile.

Design:
- Dark reflective surface
- Subtle water streaks
- Light reflections
- Slightly blurred texture
- Dark grey-blue color

Mood: Medium grip, unstable braking
```

---

## UI Sprites

### Car Icon (HUD)

```
Minimal top-down car icon for UI HUD.

Design:
- Simplified silhouette only
- Flat color
- High contrast outline
- No detail
- Small scale optimized

Purpose: Garage selection + HUD indicators
Background: transparent
```

### Drivetrain Icons

Set of three minimal geometric UI symbols:

#### FWD Icon
```
Simple car silhouette with front axle highlighted.
- Front wheels/circles emphasized
- Minimal geometric style
- Blue color scheme
```

#### RWD Icon
```
Simple car silhouette with rear axle highlighted.
- Rear wheels/circles emphasized
- Minimal geometric style
- Red color scheme
```

#### AWD Icon
```
Simple car silhouette with all wheels highlighted.
- All four wheels/circles emphasized
- Minimal geometric style
- Green color scheme
```

---

## Audio Prompts (Optional)

### Engine Sound

```
Arcade driving game engine sound effect:
- Short engine loop
- Minimal distortion
- Clean synthetic tone
- Supports pitch variation for acceleration
- Sawtooth or square wave base
```

### Brake Sound

```
Arcade driving game brake sound effect:
- Short deceleration tone
- Frequency drop from high to low
- Clean synthetic
- Square wave with envelope
```

### Success Sound

```
Arcade game success jingle:
- Three-note ascending arpeggio
- Clean sine wave tones
- Major key (C-E-G)
- Short duration (~0.5s)
- Positive, rewarding feel
```

### Fail Sound

```
Arcade game fail sound effect:
- Descending tone
- Sawtooth wave
- Slight dissonance
- Short duration (~0.5s)
- Clear failure feedback
```

---

## Critical Consistency Rules

**ALL assets MUST:**
- Share the same top-down orientation
- Use consistent geometric readability style
- Follow consistent scale logic
- Use low-noise visual language
- Have transparent backgrounds (except tiles)

**ALL assets MUST NOT:**
- Introduce perspective rendering
- Add cinematic lighting
- Include complex textures
- Use photorealistic styling
- Break silhouette clarity

---

## Asset Naming Convention

When saving generated assets, use this naming:
- `car_fwd.png`
- `car_rwd.png`
- `car_awd.png`
- `parking_slot.png`
- `parking_perfect.png`
- `cone.png`
- `barrier.png`
- `traffic_car.png`
- `boss_moving_zone.png`
- `boss_swarm.png`
- `road_summer.png`
- `road_winter.png`
- `road_rain.png`
- `icon_car.png`
- `icon_fwd.png`
- `icon_rwd.png`
- `icon_awd.png`

---

## Implementation Notes

1. **Fallback System:** The AssetManager always has procedural L0 fallbacks, so the game works even without GenAI assets.
2. **URL Loading:** GenAI assets are loaded from URLs at runtime, not bundled.
3. **Lazy Loading:** Assets are loaded on-demand to improve initial load time.
4. **Error Handling:** Failed asset loads fall back to procedural generation silently.
