# NAFS Privacy Policy

> Draft for legal review before public release. Effective date: {{EFFECTIVE_DATE}}.

## 1. Who we are
NAFS ("the app", "we") is a daily Islamic reminder and good-deeds journal operated by {{OPERATOR}}. Contact: {{CONTACT}}. This policy explains what data the app handles and your choices. It is written to meet the Indonesian Personal Data Protection Law (Law No. 27 of 2022) and, where applicable, the EU/UK GDPR and similar laws.

## 2. The short version
- The app works **offline and without an account**. Your journal, secret deeds, reflections and notes stay on your device.
- **Secret deeds, reflections and debt/trust/will notes are end-to-end encrypted** before they ever leave your device. We cannot read them.
- We show **no ads**, use **no analytics or tracking SDKs**, and **never sell** your data.
- Your **location** is used only on your device to compute prayer times and the qibla. It is rounded to about 1 km and **never sent to us**.
- Cloud features (groups) are optional and need an account.

## 3. What data we handle
**On your device only (no account needed)**
- Journal entries, missions, points and streaks, reflections, debt/trust/will notes, dhikr and Qur'an reading progress, bookmarks, settings.
- Approximate location (2 decimals) and the place name resolved by your phone, used for prayer times and qibla.
- Secret and private items are stored encrypted. Some non-content fields (day, points, category, due date) are kept in plain form locally so that streaks, reminders and the home screen work without unlocking. Device backups (iCloud/Google) may include this local database.

**If you turn on cloud and groups (optional)**
- Account data: email address or sign-in identifier, display name, preferences (ranking visibility, sincerity mode).
- Content you choose to share with a group: deed text, reactions, comments, challenge contributions and the public points those create.
- Encrypted private items (ciphertext, a revision number and a day-level timestamp). The server cannot decrypt them. Coarse metadata, such as the existence, number and change day of private items, is visible to the server.
- If you enable group notifications: a push token for your device. Notification content only contains a sender name and fixed text.
- Reports and blocks you make.

**What we do not collect**: contacts, photos, microphone, advertising IDs, precise location, browsing data, or payment card data.

## 4. Why we use it (legal bases)
- To provide the features you ask for (contract / legitimate use).
- Your **consent** for optional cloud features, group sharing, location and notifications. You can withdraw consent at any time in the app.
- Safety and legal obligations, such as handling reports and abuse.

Information about religious practice is sensitive. We process it only to provide the app to you, never for profiling or advertising.

## 5. Who we share it with
- **Hosting/database provider** (Supabase) stores cloud data when you enable cloud.
- **Push delivery** (Expo push notification service) only if you enable group notifications.
- **Group members** see what you choose to share with that group.
- Authorities when required by law.
We do not sell personal data or share it for advertising. App stores (Google Play, Apple App Store) process their own data under their policies.

## 6. International transfers
Cloud data may be processed on servers outside your country. We use contractual safeguards where required by law.

## 7. Retention and deletion
- Local data stays until you delete it or uninstall the app (Profile › Security & data).
- Cloud data is kept while your account exists. **Delete account** in the app removes your cloud data (cascading delete). Backups are removed within a reasonable period.
- Reports needed to keep the community safe may be retained for a limited time after deletion where the law allows.

## 8. Your rights
You can access and export your data (JSON export in the app), correct your profile, delete local data, delete your account, withdraw consent, and object to processing. Depending on your country you may also have the right to restrict processing, data portability and to complain to your data protection authority (in Indonesia: the PDP agency; in the EU/UK: your supervisory authority). Contact us at {{CONTACT}}; we aim to reply within 30 days.

## 9. Security
End-to-end encryption (XChaCha20-Poly1305, keys wrapped with Argon2id from your passphrase and a recovery key), encryption keys kept in the device secure store, row-level access control on the server, optional app lock with biometrics, and screen-capture protection for secret screens.
**Important:** if you lose both your passphrase and your recovery key, secret items stored in the cloud **cannot be recovered**. The JSON export file is **not encrypted** — keep it safe.

## 10. Children
The app is for people aged **13 and over** (or the higher age required in your country). Under-13 users can use personal features with a parent's supervision, but groups and cloud are disabled unless age is confirmed. If you believe a child has used cloud features without permission, contact us and we will delete the data.

## 11. Voluntary support
If you choose to support the app, payment is handled by an external provider under its own terms and privacy policy. We do not receive your card details. Support never unlocks features or changes points, levels or rankings.

## 12. Changes
We may update this policy. Material changes will be announced in the app and the effective date above will change.

## 13. Contact
{{OPERATOR}} — {{CONTACT}}
