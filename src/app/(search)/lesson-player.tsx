// Re-export the root lesson-player screen so it lives inside the (search) Stack.
// Expo Router resolves this route as part of the search stack, enabling
// router.back() to return to the search screen automatically.
export { default } from "../lesson-player";
