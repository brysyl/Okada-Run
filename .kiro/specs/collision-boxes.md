# Collision bounding boxes

All boxes are center-anchored AABBs (`src/game-engine/collision.ts`). Hitboxes are the sprite size times `HITBOX_SCALE` (0.8) for forgiving play.

| Entity | Sprite w x h | Behaviour on contact |
| --- | --- | --- |
| Player | 44 x 78 | |
| Danfo | 190 x 130 (two lanes, centred between lane centres) | Run ends (destroyed during nitro) |
| Keke Napep | 52 x 72 | Run ends (destroyed during nitro); steers toward neighbouring lanes at 140 u/s |
| Pothole | 62 x 40 | -1 life, 1.2s invulnerability; ignored with shield; destroyed during nitro |
| Naira | 30 x 22 | +10 x multiplier, +1 coin |
| Iron Helmet | 32 x 32 | 8s shield |
| Agbero Nitro | 32 x 36 | 3s turbo, clears all hazards on screen |

A Danfo never blocks all three lanes, so every wave is survivable.
