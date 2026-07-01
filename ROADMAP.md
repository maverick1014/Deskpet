# Pengu — "more like a real pet" roadmap

Owner approved building all of the below. Delivered in phases, each shipped as a
versioned release so every step is tested and downloadable. All new sprites/poses
go through the `pixel-art` skill (author → render → eyeball) per CLAUDE.md.

## Phase 1 — Smooth animation & purposeful idle  (v1.14.0)  ← in progress
1. **Easing** utilities (easeInOut / easeOutBack) applied to every action's
   start/stop instead of raw sine/linear — anticipation + settle, no snapping.
2. **Squash & stretch** on jump/land/peck/hop; anticipation crouch before hops.
3. **Continuous idle "breathing"** (subtle always-on scale pulse) + weight shifts.
4. **Smooth turning** — animate the facing flip (scaleX squash through 0) instead
   of instant mirror.
5. **Accel/decel walk** — ramp speed up/down; tighter body-bob synced to the walk.
6. **Look-at-cursor** — eyes + slight head tilt track the pointer when near.
7. **Needs-weighted idle picker** — choose the next idle behavior from weighted
   urges (hungry→beg, dirty→scratch, bored→explore, sleepy→settle) with
   no-repeat cooldowns, instead of a flat random pick.

## Phase 2 — Lifelike autonomy  (v1.15.0)
- Behavior state-machine with urges driving longer routines.
- Deepen circadian rhythm (night = sleepy/dim/curl-up; day = lively; time-aware
  greetings).
- Idle micro-behaviors expanded (preen, scratch, look-around, waddle, sit-watch,
  wake-stretch) sprinkled naturally.
- React to cursor/window: startle on fast pointer, follow on hover, peek at the
  edge when ignored a long time.
- Emotional continuity: mood decays/recovers gradually and colors motion speed.

## Phase 3 — Logical & consistent behavior  (v1.16.0)
- No-repeat + cooldowns across all behaviors.
- Path/edge logic: smooth turn-around at edges, stay near last interaction.
- Consequence memory: "just fed → refuse politely", remember return after away.
- State-matched reactions (won't play when starving; sick = weak + cough).

## Phase 4 — Richer pet-ness  (v1.17.0+)
- Grooming: stroke via click-drag → happiness + a bond stat unlocking warmer
  reactions over time.
- Sleep spots / props (pixel nest) instead of dropping in place.
- Seasonal/weather flavor (pixel-drawn).
- More real-event reactions (on the hour, away/return).
