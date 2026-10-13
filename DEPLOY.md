# Putting UAply online and in the app stores

## 1. Website (Render)
1. Push this repository to GitHub (the `sandbox` and `dev` branches).
2. At render.com: sign up, then **New > Blueprint** and pick this repository. It reads `render.yaml` and creates
   `uaply-dev` and `uaply-sandbox`, each with a 1 GB disk for accounts, applications and feedback.
3. When Render asks for the secret values, enter:
   - `ANTHROPIC_API_KEY`: your key from console.anthropic.com (turns on AI answers in the assistant).
   - `OWNER_PASSWORD`: a long password of your choice for `/outbox` and `/feedback`.
   - `SUPPORT_EMAIL`: the address for "Talk to a person".
   - `UAPLY_CONFIG_JSON`: optional; leave empty to stay in test mode (nothing is emailed to employers).
4. Your sites: `https://uaply-dev.onrender.com` and `https://uaply-sandbox.onrender.com` (Render shows the exact names).

Changing the API key later (for example to a business key) is only an edit of `ANTHROPIC_API_KEY` in Render's
dashboard; no code changes.

Before real users: fill the blanks in `legal/`, and keep `delivery` in test mode until partner employers have agreed.

## 2. App Store and Google Play (Capacitor, in `mobile/`)
The app opens the hosted dev site (`mobile/capacitor.config.json`, `server.url`). Update that URL if Render's name differs.
- **Android (works on Windows):** install Node.js and Android Studio, then in `mobile/`: `npm install`,
  `npm run add:android`, `npx cap open android`, and build a signed bundle. Google Play developer account: one-time fee.
- **iPhone (needs a Mac):** on Windows use a cloud Mac build service (for example Codemagic). Apple Developer account:
  yearly fee. Then `npm run add:ios` and upload through Xcode or the build service.
- **Review risk:** Apple can reject apps that only wrap a website ("minimum functionality"). Plan native touches
  before submitting: push notifications for interview reminders and new matches, offline screen, native share.
- **Store forms:** both stores need the privacy policy URL (`/legal/privacy.html`) and accurate privacy answers; account
  deletion already exists in the app (Profile, Account).
