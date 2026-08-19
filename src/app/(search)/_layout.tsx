import { Stack } from "expo-router";

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="search" />
      <Stack.Screen name="lesson-player" />
      <Stack.Screen name="teacher-profile" />
      <Stack.Screen name="book-preview" />
      <Stack.Screen name="page-preview" />
      <Stack.Screen name="pdf-reader" />
    </Stack>
  );
}
