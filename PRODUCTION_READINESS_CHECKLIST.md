# Production readiness checklist for DigiLearn

## 1) Security: remove embedded secrets

- Do not store Firebase or Google credentials in app.json, app.config.js, or public config objects.
- Keep runtime values in EXPO*PUBLIC*\* environment variables only.
- rotate any keys already committed to git or visible in client builds.

## 2) Security and auth hardening

- Require authenticated users for all privileged routes.
- Validate email verification and account creation flows.
- Check role-based access before letting users reach admin-only screens.
- Ensure deep links and onboarding redirects do not create auth loops.

## 3) Production monitoring

- Add Sentry or Firebase Crashlytics.
- Capture app crashes, auth failures, and network failures.
- Track sign-up, onboarding, save/download, and teacher-application flows.

## 4) Automated tests and CI

- Run unit tests on every pull request.
- Add security tests for Firestore and Storage rules.
- Add smoke tests for onboarding, sign in, and content save flows.
- Keep CI blocking if config checks fail or tests fail.

## 5) Startup and route stability

- Validate cold starts on iOS and Android.
- Confirm deep links, onboarding, and finishSignIn flow behave under slow networks.
- Test returning from background and re-opening the app.

## 6) Performance for mobile users

- Lazy-load large images and PDFs.
- Avoid unnecessary re-renders in list-heavy screens.
- Monitor memory use on low-end devices.
- Keep AI and document workflows optimized for weak connections.

## 7) Offline and network behavior

- Show clear offline state and retry guidance.
- Cache important content when downloads are successful.
- Handle storage or network failures without silent data loss.

## 8) Release metadata and config

- Confirm app names, bundle IDs, package names, and versions are production-safe.
- Update app icons, splash screens, and store metadata.
- Validate Android/iOS deep-link configuration before release.

## 9) Privacy, consent, and compliance

- Explain notification and photo permissions clearly.
- Provide a visible privacy policy and terms.
- Confirm account deletion and data handling flow matches your policy.
- Review third-party SDK access for student data.

## Release gate

Do not ship until the app passes:

- secret scan
- Firebase rules validation
- lint and unit tests
- Android/iOS smoke runs
- privacy review
