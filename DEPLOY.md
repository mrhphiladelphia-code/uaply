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
The app opens the hosted dev site (`mobile/capacitor.config.json`, `server.url`). Update that URL if Render's name differs,
then run `npx cap sync` in `mobile/`.
- **Already done:** the Android project (`mobile/android`) and iPhone project (`mobile/ios`) exist, with the UAply icon,
  splash screens and three phone features: interview reminders (local notifications), a vibration on each swipe, and
  the share sheet. These only run inside the app; the website is unchanged.
- **Android (works on Windows):** install Android Studio (accepting Google's Android SDK license), open `mobile/android`,
  and build a signed app bundle. Google Play developer account: one-time fee. Keep the signing key safe: losing it
  means you can't update the app.
- **iPhone (needs a Mac):** on Windows use a cloud Mac build service (for example Codemagic) with `mobile/ios`.
  Apple Developer account: yearly fee.
- **Review risk:** Apple can reject apps that only wrap a website ("minimum functionality"). The reminders, vibration,
  share sheet and offline screen help; push notifications for new matches (needs Apple and Firebase accounts) would help more.
- **Store forms:** both stores need the privacy policy URL (`/legal/privacy.html`) and accurate privacy answers; account
  deletion already exists in the app (Profile, Account).
