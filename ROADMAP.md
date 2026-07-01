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

## Phase 2 — Lifelike autonomy  (v1.15.0)  ✅ done
- ✅ Weighted-urge idle picker (from Phase 1) drives purposeful behaviour.
- ✅ Circadian rhythm — night = drowsier (more doze/yawn/sit), dimmer, calmer;
  day = livelier.
- ✅ Existing micro-behaviours (preen/peck/look/stretch/flap/doze/…) retained and
  time/mood-weighted.
- ✅ React to cursor: **startle** on a fast whip-past, follow on hover, **peek at
  the edge** when ignored a while.
- ✅ Emotional continuity — mood colours resting motion speed/amplitude.

## Phase 3 — Logical & consistent behavior  (v1.15.0)  ✅ done
- ✅ Per-behaviour cooldowns + no back-to-back repeats.
- ✅ Edge peek / smooth turn-around (smooth turning from Phase 1).
- ✅ Consequence memory: stuffed pet **politely refuses** more food; **welcome
  back** after a long absence.
- ✅ State-matched reactions: sick = weak + **cough**; won't play when low-energy.

## Phase 4 — Richer pet-ness  (v1.15.0)  ✅ core done
- ✅ **Grooming** — stroke the pet (back-and-forth over it) → happiness + a
  persistent **bond** stat + XP + heart-eyed delight.
- ✅ **Sleep spot** — a little pixel cushion appears under the pet while it naps.
- ⏳ Seasonal/weather flavor — folded into the day/night rhythm for now; richer
  seasonal art is a future follow-up.
- ⏳ More real-event reactions (on the hour) — future follow-up.
