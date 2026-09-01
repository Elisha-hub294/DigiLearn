# DigiLearn – AI-Powered Learning Platform

<div align="center">

**DigiLearn** is a mobile-first educational platform designed to empower African students with AI-assisted learning, curated academic resources, and direct access to qualified educators.

Built with **React Native**, **Expo**, **Firebase**, and **Google Gemini API**.

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## Overview

DigiLearn bridges the gap between students and quality educational resources in underserved regions. The platform combines:

- **Comprehensive Study Materials**: Curated textbooks, past papers, notes, and marking guides
- **AI-Powered Study Assistant**: Personalized learning support powered by Google Gemini
- **Educator Network**: Direct connections to qualified teachers for guidance and mentorship
- **Personalized Learning**: Save resources, track progress, and customize your learning experience
- **Offline-First Design**: Download materials and access them without an internet connection

Designed for **students, teachers, and educators** across Africa seeking accessible, high-quality educational content.

---

## Features

### 📚 Academic Resources

- **Topical Study Notes** – Organized by subject and curriculum standard
- **Past Examination Papers** – UNEB and MOCS papers with marking guides
- **Textbook Library** – Recommended and curated textbooks for all subjects
- **Lesson Videos** – High-quality educational video content
- **Interactive Pages** – Subject-specific learning materials with embedded resources

### 🤖 AI-Powered Study Assistant

- **Personalized Tutoring** – Get real-time explanations for complex topics
- **Adaptive Learning** – Assistant learns from your study patterns and questions
- **Math & Science Support** – Specialized formatting for equations, formulas, and scientific notation
- **Exam Preparation** – Generate practice questions and revision tips
- **Multi-Subject Coverage** – Support across mathematics, sciences, languages, and humanities

### 👨‍🏫 Teacher & Educator Network

- **Find Qualified Teachers** – Browse educator profiles and teaching specializations
- **Direct Communication** – Connect with teachers for guidance and support
- **Teacher Content** – Access materials published by verified educators
- **Learning Resources** – Teacher-recommended study materials and practice questions

### 💾 Smart Study Management

- **Save for Later** – Bookmark lessons, pages, and resources
- **Reading History** – Track your learning progress across materials
- **Personalized Preferences** – Customize content by subject, difficulty level, and format
- **Profile Management** – Manage account settings and learning preferences

---

## Tech Stack

| Layer                | Technology         | Purpose                                          |
| -------------------- | ------------------ | ------------------------------------------------ |
| **Frontend**         | React Native, Expo | Cross-platform mobile app (iOS/Android)          |
| **Routing**          | Expo Router        | Type-safe navigation and deep linking            |
| **Backend**          | Firebase           | Authentication, real-time database, file storage |
| **Database**         | Firestore          | Scalable NoSQL data management                   |
| **Storage**          | Firebase Storage   | User uploads and resource management             |
| **AI/ML**            | Google Gemini API  | Intelligent study assistant                      |
| **Language**         | TypeScript         | Type-safe development                            |
| **UI Components**    | React Native       | Native cross-platform UI                         |
| **State Management** | React Context API  | Efficient state management                       |

---

## Quick Start

> **For Judges/Evaluators**: Please see [SETUP.md](SETUP.md) for detailed setup instructions including Firebase credentials configuration.

### Prerequisites

Ensure you have the following installed:

- **Node.js** v20.19.x or higher ([download](https://nodejs.org/))
- **npm** or **yarn** (included with Node.js)
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** app on your mobile device, or Android/iOS emulator

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Elisha-hub294/DigiLearn.git
   cd DigiLearn
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables** (Required for full functionality)

   ```bash
   cp .env.example .env
   ```

   Fill in your Firebase and Google OAuth credentials in `.env`. See [SETUP.md](SETUP.md) for detailed instructions.

4. **Start the development server**

   ```bash
   npm start
   ```

5. **Launch on your device**
   - **Mobile Device**: Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - **Android Emulator**: Press `a` in the terminal
   - **iOS Simulator**: Press `i` in the terminal
   - **Web**: Press `w` to open in your browser

### Available Commands

```bash
npm start          # Start Expo development server
npm run android    # Build and run on Android emulator
npm run ios        # Build and run on iOS simulator
npm run web        # Start web version
npm run lint       # Run ESLint checks
```

---

## Project Structure

```
DigiLearn/
├── src/
│   ├── app/                 # Expo Router screens and layouts
│   │   ├── (tabs)/         # Tabbed navigation (Home, Library, etc.)
│   │   ├── (search)/       # Search and resource preview screens
│   │   └── ...             # Auth, settings, and other screens
│   │
│   ├── components/          # Reusable React components
│   │   ├── ui/             # Base UI components (buttons, cards, etc.)
│   │   ├── home/           # Home screen components
│   │   ├── library/        # Library and resource components
│   │   ├── profile/        # User profile components
│   │   └── assistant/      # AI assistant UI components
│   │
│   ├── services/            # Business logic and API integration
│   │   ├── firebaseConfig.ts      # Firebase setup
│   │   ├── socialAuth.ts          # Google/Facebook authentication
│   │   ├── aiAssistantService.ts  # AI assistant logic
│   │   ├── assistantChatService.ts # Chat message handling
│   │   ├── userProfile.ts         # User data management
│   │   ├── notifications.ts       # Push notifications
│   │   └── ...
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useGlobalSearch.ts
│   │   ├── useNotifications.ts
│   │   ├── useTrendingLessons.ts
│   │   └── useLibraryData.ts
│   │
│   ├── contexts/            # React Context providers
│   │   └── ProfileContext.tsx
│   │
│   ├── types/               # TypeScript type definitions
│   │   ├── activity.ts
│   │   ├── assets.d.ts
│   │   └── react-native-vector-icons.d.ts
│   │
│   ├── constants/           # App constants and configuration
│   │   ├── theme.ts
│   │   ├── layout.ts
│   │   ├── data.ts
│   │   └── homeData.ts
│   │
│   └── utils/               # Utility functions
│       ├── firebaseStorage.ts
│       ├── pdfThumbnail.ts
│       ├── videoUtils.ts
│       └── interestFilter.ts
│
├── app.json                 # Expo configuration
├── firebaseConfig.js        # Firebase setup (uses env variables)
├── firestore.rules          # Firestore security rules
├── storage.rules            # Firebase Storage security rules
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── .env.example             # Environment variables template
├── SETUP.md                 # Setup instructions for judges
└── README.md                # This file
```

---

## Architecture & Design Patterns

### Authentication Flow

- **Email/Password**: Firebase Authentication with secure password management
- **Google OAuth**: Native sign-in on mobile, popup-based on web
- **Session Persistence**: Automatic login using Firebase Auth state

### Data Management

- **Firestore Collections**:
  - `users/` – User profiles and preferences
  - `books/` – Textbook metadata and descriptions
  - `pages/` – Individual study page content
  - `config/` – App-wide configuration
  - `ai assistant/` – AI assistant metadata
  - `ai knowledge/` – Knowledge base for the assistant

### AI Assistant Architecture

- **Context-Aware Responses**: Uses app knowledge base for DigiLearn-specific answers
- **Conversation Management**: Stores chat history per user for continuity
- **Multi-Subject Support**: Formatted output for math, science, and humanities

### Security & Best Practices

- **Environment-Based Secrets**: All credentials managed via `.env` (never committed)
- **Firestore Rules**: Role-based access control for data protection
- **Storage Rules**: Authenticated uploads with file-size limits
- **OAuth Flow**: Secure server-side credential handling
- **No Client Secrets**: OAuth secrets never embedded in the app

---

## Authentication & Authorization

### Supported Sign-In Methods

1. **Email & Password** – Standard Firebase authentication
2. **Google OAuth** – Single sign-on via Google accounts
3. **Persistent Sessions** – Automatic login on app restart

### User Roles

- **Student** – Access learning resources, use AI assistant, save materials
- **Teacher** – Publish content, manage profiles, interact with students
- **Guest** – Limited browsing (available on web platform)

---

## API & External Services

### Firebase

- **Authentication** – User sign-in and account management
- **Firestore** – Real-time database for resources and user data
- **Storage** – File hosting for PDFs, images, and videos

### Google Gemini API

- **AI Study Assistant** – Powers conversational learning support
- **Content Generation** – Generates floating messages and study prompts
- **Math & Science Formatting** – LaTeX rendering for equations

---

## Environment Variables

Create a `.env` file with the following variables:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=<your-api-key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
EXPO_PUBLIC_FIREBASE_APP_ID=<your-app-id>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<your-google-client-id>
```

See `.env.example` and [SETUP.md](SETUP.md) for details.

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow code standards**
   - Use TypeScript for type safety
   - Follow React and React Native best practices
   - Run `npm run lint` before committing

3. **Commit with clear messages**

   ```bash
   git commit -m "feat: add feature description"
   ```

4. **Push and open a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## Development Roadmap

### Current Version

- ✅ Core resource browsing and search
- ✅ AI-powered study assistant
- ✅ Teacher discovery and profiles
- ✅ User authentication and profiles
- ✅ Save resources for later
- ✅ Mobile and web support

### Planned Features

- 📱 Offline content synchronization
- 📊 Learning analytics and progress tracking
- 🎯 Adaptive learning recommendations
- 💬 Real-time teacher-student messaging
- 🏆 Gamification and achievement badges
- 🌍 Multi-language support
- 📖 Expanded curriculum coverage for more African countries

---

## Performance & Optimization

- **Lazy Loading**: Components and resources loaded on-demand
- **Caching**: Conversations and content cached for fast access
- **Code Splitting**: Route-based code splitting via Expo Router
- **Image Optimization**: Responsive images with proper sizing
- **Database Indexing**: Firestore indexes for fast queries

---

## Security & Privacy

- **Data Encryption**: Firebase enforces HTTPS and encryption at rest
- **Access Control**: Role-based Firestore and Storage rules
- **No Tracking**: Privacy-first approach, minimal data collection
- **Credential Management**: Firebase secrets never hardcoded or committed
- **GDPR Compliant**: User data handling follows privacy standards

---

## Troubleshooting

### Common Issues

**"Firebase config is missing"**

- Ensure `.env` file exists and contains all required variables
- Run `cp .env.example .env` and fill in credentials

**"Google Sign-In not available in Expo Go"**

- Google Sign-In on mobile requires a native development build
- Use email/password authentication as an alternative
- Test on web with `npm run web`

**"Build fails on Android/iOS"**

- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version matches prerequisites

For additional support, contact **elishabagalw@gmail.com**.

---

## License

This project is released under the [MIT License](LICENSE). See the LICENSE file for details.

---

## Acknowledgments

Built with support from:

- **Google Gemini API** – AI Assistant capabilities
- **Firebase** – Backend infrastructure
- **Expo** – React Native development framework
- **React Native Community** – Open-source libraries and tools

---

## Contact & Support

- **Developer**: Elisha Bagalow
- **Email**: elishabagalw@gmail.com
- **GitHub**: [@Elisha-hub294](https://github.com/Elisha-hub294)

For questions, feedback, or collaboration opportunities, feel free to reach out!

---

<div align="center">

**Made with ❤️ for African students and educators**

⭐ If you find DigiLearn helpful, please consider starring this repository!

</div>
