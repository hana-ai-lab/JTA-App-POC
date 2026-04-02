import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth.js';
import { useQuiz } from './hooks/useQuiz.js';
import { apiFetch, setToken, clearToken } from './api/client.js';

// --- Header ---
function Header() {
  const linkStyle = ({ isActive }) => ({
    textDecoration: 'none',
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
    fontWeight: isActive ? 700 : 400,
    fontSize: '0.9rem',
  });
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid var(--color-border)', padding: '12px 0', position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 10 }}>
      <NavLink to="/" style={linkStyle} end>ホーム</NavLink>
      <NavLink to="/chapters" style={linkStyle}>章</NavLink>
      <NavLink to="/progress" style={linkStyle}>進捗</NavLink>
    </nav>
  );
}

// --- ProgressBar ---
function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      {label && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>}
      <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-primary)', height: '100%', width: `${pct}%`, borderRadius: 8, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// --- QuizCard ---
function QuizCard({ quiz, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSelect(choice) {
    if (result) return;
    setSelected(choice);
    const r = await onAnswer(choice);
    setResult(r);
  }

  function choiceClass(i) {
    if (!result) return selected === i ? 'btn-choice selected' : 'btn-choice';
    if (i === result.correctAnswer) return 'btn-choice correct';
    if (i === selected && !result.correct) return 'btn-choice wrong';
    return 'btn-choice';
  }

  return (
    <div>
      <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 20, lineHeight: 1.6 }}>{quiz.question}</p>
      {[1, 2, 3, 4].map(i => (
        <button key={i} className={choiceClass(i)} onClick={() => handleSelect(i)}>
          {quiz[`choice_${i}`]}
        </button>
      ))}
      {result && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: result.correct ? 'var(--color-success)' : 'var(--color-error)' }}>
            {result.correct ? '正解！' : '不正解'}
          </div>
          {result.xpGained > 0 && <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>+{result.xpGained} XP</div>}
        </div>
      )}
    </div>
  );
}

// --- ExpChart ---
function ExpChart({ history }) {
  if (!history || history.length === 0) return <div style={{ color: 'var(--color-text-muted)' }}>データなし</div>;
  const maxExp = Math.max(...history.map(h => h.exp), 1);
  return (
    <svg viewBox="0 0 300 120" style={{ width: '100%', height: 120 }}>
      {history.slice().reverse().map((h, i) => {
        const height = (h.exp / maxExp) * 100;
        return (
          <g key={h.date}>
            <rect x={i * (300 / history.length) + 2} y={110 - height} width={Math.max(300 / history.length - 4, 4)} height={height} fill="var(--color-primary)" rx={3} />
          </g>
        );
      })}
    </svg>
  );
}

// --- Home ---
function Home() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  useEffect(() => { apiFetch('/progress').then(setProgress); }, []);
  if (!progress) return <div style={{ padding: 20 }}>Loading...</div>;
  return (
    <div style={{ padding: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{progress.streakDays}</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>日連続</div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Lv.{progress.level}</div>
        <ProgressBar value={100 - progress.expToNext} max={100} label={`次のレベルまで ${progress.expToNext} XP`} />
      </div>
      <button className="btn-primary" onClick={() => navigate('/quiz')} style={{ marginBottom: 16 }}>クイズを始める</button>
      <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>全体の進捗</div>
        <ProgressBar value={progress.masteredQuizzes} max={progress.totalQuizzes} label={`${progress.masteredQuizzes} / ${progress.totalQuizzes} 問マスター`} />
      </div>
    </div>
  );
}

// --- Quiz ---
function Quiz() {
  const navigate = useNavigate();
  const { currentQuiz, currentIndex, quizzes, loading, sessionDone, startSession, submitAnswer, nextQuiz, totalXp, correctCount, results } = useQuiz();
  useEffect(() => { startSession(); }, []);
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (sessionDone) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>セッション完了</h2>
        <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{correctCount}/{quizzes.length}</div>
        <div style={{ color: 'var(--color-text-muted)', marginBottom: 8 }}>正解</div>
        <div style={{ fontSize: '1.2rem', marginBottom: 24 }}>+{totalXp} XP</div>
        <button className="btn-primary" onClick={() => navigate('/')}>ホームに戻る</button>
      </div>
    );
  }
  if (!currentQuiz) return <div style={{ padding: 20 }}>クイズがありません</div>;
  const answered = results.length > currentIndex;
  return (
    <div style={{ padding: 20 }}>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>{currentIndex + 1} / {quizzes.length}</div>
      <QuizCard key={currentQuiz.id} quiz={currentQuiz} onAnswer={submitAnswer} />
      {answered && <button className="btn-primary" onClick={nextQuiz} style={{ marginTop: 20 }}>{currentIndex + 1 >= quizzes.length ? '結果を見る' : '次へ'}</button>}
    </div>
  );
}

// --- Chapters ---
function Chapters() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  useEffect(() => { apiFetch('/chapters').then(data => setChapters(data.chapters)); }, []);
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 16 }}>章一覧</h2>
      {chapters.map(ch => (
        <div key={ch.id} onClick={() => navigate(`/chapters/${ch.id}`)} style={{ background: 'var(--color-bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 12, cursor: 'pointer' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{ch.title}</div>
          <ProgressBar value={ch.mastered} max={ch.total_quizzes} label={`${ch.mastered}/${ch.total_quizzes}`} />
        </div>
      ))}
    </div>
  );
}

// --- ChapterQuiz ---
function ChapterQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentQuiz, currentIndex, quizzes, loading, sessionDone, startSession, submitAnswer, nextQuiz, totalXp, correctCount, results } = useQuiz();
  useEffect(() => { startSession(id); }, [id]);
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (sessionDone) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>完了</h2>
        <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{correctCount}/{quizzes.length}</div>
        <div style={{ color: 'var(--color-text-muted)', marginBottom: 8 }}>正解</div>
        <div style={{ fontSize: '1.2rem', marginBottom: 24 }}>+{totalXp} XP</div>
        <button className="btn-primary" onClick={() => navigate('/chapters')}>章一覧に戻る</button>
      </div>
    );
  }
  if (!currentQuiz) return <div style={{ padding: 20 }}>この章のクイズはありません</div>;
  const answered = results.length > currentIndex;
  return (
    <div style={{ padding: 20 }}>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>{currentIndex + 1} / {quizzes.length}</div>
      <QuizCard key={currentQuiz.id} quiz={currentQuiz} onAnswer={submitAnswer} />
      {answered && <button className="btn-primary" onClick={nextQuiz} style={{ marginTop: 20 }}>{currentIndex + 1 >= quizzes.length ? '結果を見る' : '次へ'}</button>}
    </div>
  );
}

// --- Progress ---
function ProgressPage() {
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);
  useEffect(() => {
    apiFetch('/progress').then(setProgress);
    apiFetch('/progress/exp-history').then(data => setHistory(data.history));
  }, []);
  if (!progress) return <div style={{ padding: 20 }}>Loading...</div>;
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 16 }}>進捗</h2>
      <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>レベル {progress.level}</div>
        <ProgressBar value={100 - progress.expToNext} max={100} label={`${progress.exp} XP（次まで ${progress.expToNext} XP）`} />
      </div>
      <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>マスター進捗</div>
        <ProgressBar value={progress.masteredQuizzes} max={progress.totalQuizzes} label={`${progress.masteredQuizzes} / ${progress.totalQuizzes}`} />
      </div>
      <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>経験値推移（30日間）</div>
        <ExpChart history={history} />
      </div>
    </div>
  );
}

// --- Diagnosis ---
function Diagnosis() {
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => { apiFetch('/diagnosis/quizzes').then(data => setQuizzes(data.quizzes)); }, []);

  async function handleSelect(choice) {
    if (selected !== null) return;
    setSelected(choice);
    const newAnswers = [...answers, { quizId: quizzes[currentIndex].id, answer: choice }];
    setAnswers(newAnswers);
    setTimeout(() => {
      if (currentIndex + 1 >= quizzes.length) {
        apiFetch('/diagnosis/submit', { method: 'POST', body: JSON.stringify({ answers: newAnswers }) }).then(setResult);
      } else {
        setCurrentIndex(currentIndex + 1);
        setSelected(null);
      }
    }, 500);
  }

  if (result) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>診断完了</h2>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{result.correctCount}/{result.totalCount}</div>
        <div style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>正解</div>
        {result.skippedLight && <p style={{ marginBottom: 16, color: 'var(--color-success)' }}>基礎問題をスキップしました</p>}
        <button className="btn-primary" onClick={() => window.location.reload()}>始める</button>
      </div>
    );
  }

  if (quizzes.length === 0) return <div style={{ padding: 20 }}>Loading...</div>;
  const quiz = quizzes[currentIndex];
  return (
    <div style={{ padding: 20 }}>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>レベル診断</div>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>{currentIndex + 1} / {quizzes.length}</div>
      <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 20, lineHeight: 1.6 }}>{quiz.question}</p>
      {[1, 2, 3, 4].map(i => (
        <button key={i} className={`btn-choice${selected === i ? ' selected' : ''}`} onClick={() => handleSelect(i)}>
          {quiz[`choice_${i}`]}
        </button>
      ))}
    </div>
  );
}

// --- App ---
export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  if (!user) {
    return <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ marginBottom: 20, fontSize: '1.2rem', fontWeight: 600 }}>JTA Quiz App</p>
      <button className="btn-primary" onClick={() => {/* TODO: FINCS redirect */}}>ログイン</button>
    </div>;
  }

  if (user.plan_type !== 'light' && !user.diagnosis_completed) {
    return <BrowserRouter><Routes><Route path="*" element={<Diagnosis />} /></Routes></BrowserRouter>;
  }

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/chapters" element={<Chapters />} />
        <Route path="/chapters/:id" element={<ChapterQuiz />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
