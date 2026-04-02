import { useState } from 'react';
import { apiFetch } from '../api/client.js';

export function useQuiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  async function startSession(chapterId = null) {
    setLoading(true);
    const path = chapterId ? `/quiz/session?chapterId=${chapterId}` : '/quiz/session';
    const data = await apiFetch(path);
    setQuizzes(data.quizzes);
    setCurrentIndex(0);
    setResults([]);
    setSessionDone(false);
    setLoading(false);
  }

  async function submitAnswer(answer) {
    const quiz = quizzes[currentIndex];
    const data = await apiFetch('/quiz/answer', {
      method: 'POST',
      body: JSON.stringify({ quizId: quiz.id, answer }),
    });
    const result = { ...data, quizId: quiz.id };
    const newResults = [...results, result];
    setResults(newResults);
    return result;
  }

  function nextQuiz() {
    if (currentIndex + 1 >= quizzes.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  const currentQuiz = quizzes[currentIndex] || null;
  const totalXp = results.reduce((sum, r) => sum + r.xpGained, 0);
  const correctCount = results.filter(r => r.correct).length;

  return { currentQuiz, currentIndex, quizzes, results, loading, sessionDone, startSession, submitAnswer, nextQuiz, totalXp, correctCount };
}
