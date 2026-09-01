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

## Order form email notifications

The order form (`order-form.html`) sends a custom-formatted email via [Resend](https://resend.com) instead of Netlify's plain default notification. This is handled by `netlify/functions/submission-created.js`, which Netlify runs automatically on every form submission on the site (it only acts on the order form; other forms are untouched).

To enable it, set these in Netlify → Site settings → Environment variables:

- `RESEND_API_KEY` — required. From your Resend account.
- `ORDER_FORM_FROM_EMAIL` — optional, defaults to `Cowdog Print Co. Orders <orders@cowdogprint.co>`. The sending domain (`cowdogprint.co`) must be verified in Resend (DNS records) or sends will fail.
- `ORDER_FORM_TO_EMAIL` — optional, defaults to `info@cowdogprint.co`. Where order notifications land.

If `RESEND_API_KEY` isn't set, the function logs an error and no email sends — check Netlify function logs (Site → Logs → Functions) if an order submission doesn't show up in the inbox.
