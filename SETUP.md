# DigiLearn - Setup Guide for Judges

Thank you for evaluating DigiLearn! This guide walks you through setting up the project locally.

## Prerequisites

- Node.js 20.19.x or later
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- A mobile device or emulator (Android/iOS) OR use Expo Go

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd DigiLearn
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

The app requires Firebase and Google OAuth credentials to run.

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. **Contact the developer** for the actual Firebase and Google OAuth credentials and add them to `.env`

   The `.env` file should look like:

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=<your-api-key>
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
   EXPO_PUBLIC_FIREBASE_APP_ID=<your-app-id>
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<your-google-client-id>
   ```

### 4. Start the Development Server

```bash
npm start
```

You will see a QR code. You can:

- **On Android/iOS device**: Open Expo Go app and scan the QR code
- **On web**: Press `w` to open the web preview
- **On emulator**: Press `a` (Android) or `i` (iOS)

## Key Features

### Authentication

- Sign up and log in with Email & Password
- Google OAuth sign-in (native on mobile, popup on web)

### Study Resources

- Browse books, lessons, and pages
- Save resources for later
- AI-powered study assistant (powered by Gemini)

### Teacher Features

- Post study materials and announcements
- Manage uploaded content

## Troubleshooting

### "Firebase config is missing"

This warning appears if `.env` values are empty. **Ensure you have configured `.env` with the correct credentials.**

### "Google Sign-In not available in Expo Go"

Google Sign-In on mobile requires a development build. You can:

- Use email/password authentication instead
- Build the app locally using `eas build` (requires Expo account)
- Test on web with `npm run web`

### Build fails with "Constants.expoConfig is undefined"

Ensure you are running `npm start` from the project root directory.

## Architecture Notes

### Security Practices

- Firebase credentials are stored locally in `.env` and not committed to Git
- OAuth secrets are never stored in the app
- Firestore and Storage rules enforce authentication

### Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **AI**: Google Gemini API
- **Language**: TypeScript

## File Structure

```
src/
├── app/              # Expo Router screens
├── components/       # Reusable React components
├── services/         # Firebase, auth, and API services
├── contexts/         # React Context providers
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
└── types/            # TypeScript type definitions
```

## Questions?

For technical issues or clarifications, please contact the developer at **elishabagalw@gmail.com**.

To set up the app, you will need to request Firebase and Google OAuth credentials from the developer.

---

**Good luck with your evaluation!**
