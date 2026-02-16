import { Redirect, useLocalSearchParams } from "expo-router";

export default function LegacyQuizResultsRoute() {
  const { id } = useLocalSearchParams();
  const resolvedId = Array.isArray(id) ? id[0] : id;

  if (!resolvedId) {
    return <Redirect href="/quizzes" />;
  }

  return <Redirect href={`/quiz-results/${resolvedId}`} />;
}
