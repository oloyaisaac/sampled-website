# Aurelia Museum — Rome, remembered

A cinematic, seven-chapter museum experience. Scroll from the city gate, over the rooftops, through the Colosseum, and into the Forum as the camera and evening light travel with you.

## Run locally

```sh
npm install
npm run dev
```

Vite binds to `0.0.0.0` for preview environments. Use `npm run build` to make a production bundle.

## Implementation notes

- A coordinated set of locally generated, photorealistic frames creates one forward camera path from a shadowed city gate along the Via Sacra, into the Colosseum, through its passage and arena, then out toward the Forum. The opening frame now matches the street ahead. Adjacent frames share architecture, perspective, lighting, and camera direction; eased crossfades and a lightly damped camera follow make scroll feel more like one continuous shot.
- Italiana, DM Sans, and DM Mono are bundled locally so the design does not depend on a third-party font request.
- The ticket form demonstrates client-side ticket/guest pricing, validation, and a reservation-preview success state. It does not store a booking or send email; the interface says so explicitly.

## Publishing

GitHub Actions deploys the static site to GitHub Pages on pushes to `main` (and via manual workflow dispatch). The workflow enables Pages if needed and builds with the repository subpath. The local and Vercel builds continue to use the root path. After the first successful Pages deployment, the site is available at `https://oloyaisaac.github.io/sampled-website/`.
