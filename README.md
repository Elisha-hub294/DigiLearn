# DigiLearn

**DigiLearn** is a cross-platform mobile application built with React Native and Expo that connects students with academic resources, video lessons, and educators.
Designed in Figma, the app's development was accelerated using **GPT-5.6** and **Codex** to translate design files into production-ready React Native code, handle Firebase integrations, and build responsive interfaces.

---

## Features

* **Academic Resource Hub:** Access past examination papers, detailed class notes, and online textbooks.
* **Interactive Lessons Screen:** Watch educational video content powered by an embedded YouTube iFrame.
* **Responsive User Profile:** Manage personal information, settings, and learning progress.
* **Teacher Connection:** Reach out directly to educators for study guidance and support.
* **Cross-Platform Support:** Runs natively on both Android and iOS via Expo.

---

## Tech Stack & AI Assistance

* **Mobile Framework:** React Native (Expo)
* **Backend & Database:** Firebase (Firestore)
* **Media Integration:** YouTube iFrame (`react-native-youtube-iframe`)
* **UI Design:** Figma
* **AI Tooling:** GPT-5.6, OpenAI Codex, and Github Copilot

---

## Built with Github Copilot, GPT-5.6 & Codex

**Github Copilot**, **GPT-5.6** and **Codex** were embedded directly into the development workflow to speed up building, styling, and integrating features:

### 1. Figma-to-Code Pipeline

* **GPT-5.6** was used to parse and extract raw structural data, layout properties, and styling specs directly from Figma UI designs.
* This extracted design context was fed into **Codex**, which automatically generated clean, structured React Native components matching the original designs.

### 2. Rapid Interface Development

* **Codex** rapidly scaffolded responsive components for the core **Lessons** and **User Profile** screens, cutting down manual layout time.

### 3. Firebase & Media Integration

* **Codex** wrote the integration logic to hook up the UI components directly to **Firebase Firestore** for live data retrieval.
* **GPT-5.6** assisted in suggesting production-ready app features.

---

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher)
* [Expo Go](https://expo.dev/go) app installed on your phone (or an active Android/iOS emulator)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/digilearn.git
cd digilearn

```

2. **Install dependencies:**
```bash
npm install

```

3. **Start the development server:**
```bash
npx expo start

```


4. **Launch application:** Scan the generated QR code using **Expo Go** (Android) or the **Camera app** (iOS).
