# DigiLearn - Setup Guide for Judges

Thank you for evaluating DigiLearn! I've put together this guide to help you get the project running smoothly on your machine.

## What You'll Need

Before you start, make sure you have:

- **Node.js** 20.19.x or later ([download here](https://nodejs.org/))
- **npm** or **yarn** (comes with Node.js)
- **Expo CLI**: Install with `npm install -g expo-cli`
- A mobile device with Expo Go app, OR an Android/iOS emulator, OR just use the web preview

## Getting Started

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd DigiLearn
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Your Environment Variables

DigiLearn needs Firebase and Google OAuth credentials to run fully. Here's what to do:

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. **Email me** at **elishabagalw@gmail.com** to request the Firebase and Google OAuth credentials

3. Once you receive them, add them to your `.env` file. It should look like this:

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=<your-api-key>
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
   EXPO_PUBLIC_FIREBASE_APP_ID=<your-app-id>
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<your-google-client-id>
   ```

### Step 4: Start the App

```bash
npm start
```

You'll see a QR code. Here's how to run it:

- **On your phone**: Open Expo Go (Android) or scan with your Camera app (iOS), then tap the notification
- **On web**: Press `w` in the terminal to open the web preview
- **On Android emulator**: Press `a`
- **On iOS simulator**: Press `i`

### Report Review

Reports are stored in Firestore and reviewed by admins in the Resource Reports
screen. Deploy the Firestore rules once so authenticated report submission and
admin review access are available:

```bash
npx firebase-tools deploy --only firestore:rules
```

## What You'll Find Inside

### Authentication

- Sign up and log in with your email and password
- Quick sign-in with Google (native on mobile, popup on web)

### Learning Resources

- Browse textbooks, past papers, and study notes
- Save materials for later study
- Chat with an AI study assistant powered by Google Gemini

### Teacher Features

- Post and share study materials
- Share announcements with students
- Manage all your uploaded content

## If Something Goes Wrong

### "Firebase config is missing"

You'll see this warning if your `.env` file is empty or missing values. Just make sure you've filled in all the credentials from Step 3 above.

### "Google Sign-In not available in Expo Go"

Google Sign-In on mobile requires a production build. No worries—you have options:

- Use email/password login instead (all features work the same)
- Test the Google sign-in on the web version with `npm run web`
- If you really want to test native Google Sign-In, let me know and I can build it for you

### "Constants.expoConfig is undefined"

This usually means you're not in the right directory. Make sure you're running `npm start` from the DigiLearn root folder.

## How I Built This

### Security (You'll Probably Ask About This)

- Firebase credentials are stored **only in local `.env` file**, they're never committed to Git
- OAuth secrets are **never hardcoded** in the app source
- Firestore and Storage have strict security rules that require authentication
- No credentials are exposed in the public repository

### Tech Stack Overview

| Component        | Technology                          |
| ---------------- | ----------------------------------- |
| **Mobile/Web**   | React Native with Expo              |
| **Backend**      | Firebase (Auth, Firestore, Storage) |
| **AI Assistant** | Google Gemini API                   |
| **Language**     | TypeScript                          |
| **Navigation**   | Expo Router                         |

### Project Layout

```
src/
├── app/              # All the screens and navigation
├── components/       # Reusable UI components
├── services/         # Firebase, auth, and API integrations
├── contexts/         # React Context for state management
├── hooks/            # Custom React hooks
├── utils/            # Helper functions
└── types/            # TypeScript definitions
```

## Need Help?

Reach out to me directly at **elishabagalw@gmail.com**. I'm happy to help with:

- Sending you the Firebase credentials
- Debugging any setup issues
- Explaining any part of the codebase
- Answering questions about the architecture

---

**Enjoy exploring DigiLearn! I'm excited for your feedback! 🚀**
