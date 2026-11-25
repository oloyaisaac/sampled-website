# Aurelia Museum — experience spec

## Product idea
An editorial, cinematic invitation to an imagined exhibition about ancient Rome. The site tells one simple story: scroll through the city, from first light at its gates to the last light over the Forum, then reserve a visit.

## Seven scroll chapters
1. **The threshold** — title, location, dawn and a clear invitation to enter.
2. **The city** — the gates open; introduce the Via Sacra and Rome's seven hills.
3. **The everyday** — bread, aqueducts and insulae bring ordinary Roman lives into focus.
4. **The arena** — the Colosseum, its scale and its shared breath.
5. **The Forum** — public life and the Temple of Saturn at the edge of day.
6. **What remains** — the empire recedes; the city's story continues.
7. **Your visit** — three ticket experiences, date and party-size selection, email validation and a clear local confirmation state.

## Art direction
- **Palette:** midnight indigo, Roman terracotta, warm limestone, muted Egyptian blue, and sunset ochre. The scene moves gradually from cool pre-dawn to warm evening.
- **Typography:** Italiana display faces for the monumental headlines; DM Sans for readable body copy; DM Mono for coordinates, labels and wayfinding.
- **Composition:** large quiet type, restrained rules and annotations, generous negative space, fine film grain, and photorealistic historical reconstructions of Roman streets, the Colosseum, and Forum. Avoid generic rounded-card UI.
- **Motion:** scroll scrubs a continuous, forward-moving sequence of matched first-person frames—from a shadowed gate opening onto the Via Sacra, through a consistent Colosseum approach, entrance, passage, arena, and exit toward the Forum. Adjacent frames share perspective, light, and architecture; the final Forum view continues along the same road out of the Colosseum. Long eased crossfades and a gently damped camera follow make movement feel continuous. The Colosseum scene has an extended scroll runway, and reduced-motion preferences disable camera movement and damping.

## Build and interaction constraints
- Use locally bundled, optimized WebP scene imagery, with a dark contrast overlay behind text and responsive cover cropping. Avoid depending on WebGL or remote image requests.
- Keep the site readable and usable from 375px wide through desktop. Keep chapter controls and booking inputs operable with touch and keyboard.
- Ticket cards are selectable. The booking form validates email and a non-past date and reports a success message without pretending to send a real reservation to a server.
- Use semantic sections, labelled inputs, and an announced form status.

## Acceptance checklist
- [x] Seven distinct chapters with no placeholder copy.
- [x] Scroll-scrubbed first-person sequence from the city gate through the Colosseum and out toward the Forum, with continuous image blending, zoom, and drift.
- [x] Ticket selection, email/date/guest inputs, validation, and success feedback.
- [x] Responsive layout rules, touch navigation, and reduced-motion support.
- [x] JavaScript syntax and repository whitespace checks pass.
- [x] Interaction smoke test: ticket/guest total, invalid-email feedback, and reservation preview.
- [x] Internal navigation links resolve and all seven chapters are present.
- [x] Verify photorealistic scene transitions and booking interactions in headless Chromium at desktop and 375px; no browser errors or horizontal overflow.
- [ ] Verify visual quality and frame rate on a physical mid-range phone.
