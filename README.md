# Cowdog Print Co.

Site for [cowdogprint.co](https://cowdogprint.co) — artist-run screen printing studio, Columbus WI.

## Structure

```
/
├── index.html        # Main site (single page, anchor nav)
├── assets/           # Drop project photos here
│   └── (add photos as project-1.jpg, project-2.jpg, project-3.jpg)
├── netlify.toml      # Netlify config
└── README.md
```

## Adding project photos

1. Add your photo files to `/assets/`
2. In `index.html`, find each `.project-card`
3. Add an `<img class="project-img" src="assets/your-photo.jpg" alt="...">` inside the card, before `.project-label`
4. Remove the `.project-placeholder` div

## Logo

Replace the inline SVG in the `<nav>` with:
```html
<img src="assets/cowdog-logo.png" alt="Cowdog Print Co." style="height:28px; mix-blend-mode:lighten;">
```

## Deployment

Push to main → auto-deploys via Netlify. Form submissions appear in Netlify dashboard under Forms.
