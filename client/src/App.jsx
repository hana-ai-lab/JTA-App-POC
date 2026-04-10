import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth.js';
import { useQuiz } from './hooks/useQuiz.js';
import { apiFetch, setToken, clearToken } from './api/client.js';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];
const api = apiFetch;

// --- Chapter Structure ---
const COURSES = [
  {
    id: 'lite',
    name: '入門講座',
    subtitle: 'コハク',
    parts: [
      { number: 1, title: 'なぜ負けるのか' },
      { number: 2, title: '感情をコントロールする' },
      { number: 3, title: '仕組みで守る' },
    ],
  },
  {
    id: 'basic_pro',
    name: '基礎講座',
    subtitle: 'コハナ',
    parts: [
      { number: 1, title: '全体像を把握し、最初の一歩を踏み出す' },
      { number: 2, title: 'チャートが語りかけてくるようになる5つの技術' },
      { number: 3, title: '読めるようになった相場で、どこで仕掛けるかを学ぶ' },
      { number: 4, title: '1回勝つことと、5年後もまだ市場にいることは別の話' },
    ],
  },
  {
    id: 'intermediate',
    name: '中級講座',
    subtitle: 'コハナ',
    parts: [
      { number: 1, title: 'トレード心理の上級編' },
      { number: 2, title: '経済指標トレードの実践' },
      { number: 3, title: 'MTF分析と環境認識の実践' },
      { number: 4, title: 'プライスアクション応用' },
      { number: 5, title: '大口の行動パターン実践編' },
      { number: 6, title: 'シナリオ構築の上級技法' },
    ],
  },
];

// --- Header ---
function Header() {
  const location = useLocation();
  const isQuizActive = location.pathname === '/quiz' || /^\/chapters\/\d+$/.test(location.pathname);

  if (isQuizActive) return null;

  return (
    <nav className="nav-bar">
      <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
        ホーム
      </NavLink>
      <NavLink to="/chapters" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
        章
      </NavLink>
    </nav>
  );
}

// --- ProgressBar ---
function ProgressBar({ value, max, label, gold }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress-wrap">
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-track">
        <div className={`progress-fill${gold ? ' gold' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// --- Shuffle utility ---
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- QuizCard ---
function QuizCard({ quiz, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [order] = useState(() => shuffleArray([1, 2, 3, 4]));

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
      <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 24, lineHeight: 1.7, fontFamily: 'var(--font-display)' }}>
        {quiz.question}
      </p>
      <div className="stagger">
        {order.map((i, idx) => (
          <button key={i} className={choiceClass(i)} onClick={() => handleSelect(i)}>
            <span className="choice-label">{CHOICE_LABELS[idx]}</span>
            {quiz[`choice_${i}`]}
          </button>
        ))}
      </div>
      {result && (
        <div className={`feedback ${result.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
          <div className="feedback-icon">{result.correct ? '○' : '×'}</div>
          <div className="feedback-text" style={{ color: result.correct ? 'var(--color-success)' : 'var(--color-error)' }}>
            {result.correct ? '正解！' : '不正解'}
          </div>
          {result.xpGained > 0 && <div className="feedback-xp">+{result.xpGained} XP</div>}
          {result.explanation && (
            <div className="feedback-explanation">{result.explanation}</div>
          )}
        </div>
      )}
    </div>
  );
}

// --- ExpChart (Area Line) ---
function ExpChart({ history }) {
  if (!history || history.length === 0) return <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>データなし</div>;

  const W = 340, H = 130, PAD_LEFT = 40, PAD_TOP = 12, PAD_BOTTOM = 4;
  const chartW = W - PAD_LEFT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;
  const maxExp = Math.max(...history.map(h => h.exp), 1);

  // Y-axis ticks (0, ~mid, max)
  const niceRound = (v) => {
    if (v <= 0) return 0;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.ceil(v / mag) * mag;
  };
  const roundedMax = niceRound(maxExp);
  const ticks = [0, Math.round(roundedMax / 2), roundedMax];

  const points = history.map((h, i) => {
    const x = PAD_LEFT + (history.length === 1 ? chartW / 2 : (i / (history.length - 1)) * chartW);
    const y = PAD_TOP + chartH - (h.exp / roundedMax) * chartH;
    return { x, y, exp: h.exp };
  });

  // Smooth line path
  const linePath = points.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
  }).join(' ');

  // Area fill path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="exp-area-chart">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-primary-lighter)" />
          <stop offset="100%" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>
      {/* Y-axis ticks + grid lines */}
      {ticks.map(tick => {
        const ty = PAD_TOP + chartH - (tick / roundedMax) * chartH;
        return (
          <g key={tick}>
            <line x1={PAD_LEFT} y1={ty} x2={W} y2={ty} stroke="var(--color-border)" strokeWidth="0.8" strokeDasharray={tick === 0 ? 'none' : '3,3'} />
            <text x={PAD_LEFT - 6} y={ty + 3.5} textAnchor="end" className="exp-axis-label">{tick.toLocaleString()}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#areaGrad)" className="exp-area-fill" />
      <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" className="exp-area-line" />
      <circle cx={last.x} cy={last.y} r="4" fill="var(--color-primary)" className="exp-area-dot" />
      <circle cx={last.x} cy={last.y} r="8" fill="var(--color-primary)" opacity="0.15" className="exp-area-dot-glow" />
    </svg>
  );
}

// --- QuizCounter ---
function QuizCounter({ current, total }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="quiz-counter">
      <span>{current} / {total}</span>
      <div className="quiz-counter-bar">
        <div className="quiz-counter-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// --- Home ---
function Home() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api('/progress').then(setProgress);
    api('/progress/exp-history').then(data => setHistory(data.history));
  }, []);

  if (!progress) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    <div className="page stagger">
      {/* Streak + Today */}
      <div className="streak-container">
        <div className="streak-number">
          {progress.streakDays}
        </div>
        <div className="streak-label">日連続</div>
        <div className="today-activity">
          {progress.todayExp > 0 ? (
            <>
              <span className="today-stat">+{progress.todayExp} XP</span>
              <span className="today-divider" />
              <span className="today-stat">{progress.todayQuizzes}問クリア</span>
            </>
          ) : (
            <span className="today-nudge">今日はまだ未学習</span>
          )}
        </div>
        {progress.todayDue > 0 && (
          <div className="today-due">今日の復習予定: あと {progress.todayDue}問</div>
        )}
      </div>

      {/* Level & XP */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="section-title">レベル</span>
          <span className="level-badge">Lv.{progress.level}</span>
        </div>
        <ProgressBar value={100 - progress.expToNext} max={100} label={`次のレベルまで ${progress.expToNext} XP`} gold />
      </div>

      {/* Start Quiz */}
      <button className="btn-primary" onClick={() => navigate('/quiz')} style={{ marginBottom: 16 }}>
        クイズを始める
      </button>

      {/* Stats */}
      <div className="card stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-item">
          <div className="stat-value">{progress.exp}</div>
          <div className="stat-label">総XP</div>
        </div>
        <div className="stat-item">
          <div className="stat-value-dual">
            <div><span className="stat-num">{progress.completedQuizzes}</span><span className="stat-denom">/{progress.totalQuizzes}</span> <span className="stat-tag complete">コンプリート</span></div>
            <div><span className="stat-num">{progress.masteredQuizzes}</span><span className="stat-denom">/{progress.totalQuizzes}</span> <span className="stat-tag master">マスター</span></div>
          </div>
        </div>
      </div>

      {/* Exp Chart */}
      <div className="card">
        <div className="section-title" style={{ fontSize: '0.95rem', marginBottom: 12 }}>経験値推移</div>
        <ExpChart history={history} />
      </div>
    </div>
  );
}

// --- Quiz ---
function Quiz() {
  const navigate = useNavigate();
  const { currentQuiz, currentIndex, quizzes, loading, sessionDone, startSession, submitAnswer, nextQuiz, totalXp, correctCount, results } = useQuiz();
  useEffect(() => { startSession(); }, []);

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  if (sessionDone) {
    return (
      <div className="result-container page">
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 24, color: 'var(--color-text-muted)', fontSize: '0.95rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          セッション完了
        </h2>
        <div className="result-score">{correctCount}/{quizzes.length}</div>
        <div className="result-label">正解</div>
        <div className="result-xp">+{totalXp} XP</div>
        <button className="btn-primary" onClick={() => navigate('/')}>ホームに戻る</button>
      </div>
    );
  }

  if (!currentQuiz) return <div className="page" style={{ color: 'var(--color-text-muted)' }}>クイズがありません</div>;
  const answered = results.length > currentIndex;

  return (
    <div className="page">
      <QuizCounter current={currentIndex + 1} total={quizzes.length} />
      <div style={{ marginTop: 20 }}>
        <QuizCard key={currentQuiz.id} quiz={currentQuiz} onAnswer={submitAnswer} />
      </div>
      {answered && (
        <button className="btn-primary" onClick={nextQuiz} style={{ marginTop: 24 }}>
          {currentIndex + 1 >= quizzes.length ? '結果を見る' : '次へ'}
        </button>
      )}
    </div>
  );
}

// --- Chapters ---
function ChapterProgress({ ch }) {
  if (!ch.total_quizzes || ch.total_quizzes === 0) return null;
  const total = ch.total_quizzes;
  const completed = ch.completed || 0;
  const mastered = ch.mastered || 0;
  const allMastered = mastered >= total;

  const allCompleted = completed >= total;

  if (allMastered) {
    return (
      <div className="ch-progress-indicator">
        <span className="ch-badge mastered">MASTER</span>
      </div>
    );
  }

  if (allCompleted) {
    return (
      <div className="ch-progress-indicator">
        <span className="ch-badge completed">COMPLETE</span>
        <div className="ch-dual-bars">
          <div className="ch-bar-row">
            <span className="ch-bar-label">★ {mastered}/{total}</span>
            <div className="ch-bar-track">
              <div className="ch-bar-fill master" style={{ width: `${(mastered / total) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completedPct = (completed / total) * 100;
  const masteredPct = (mastered / total) * 100;

  return (
    <div className="ch-progress-indicator">
      <div className="ch-dual-bars">
        <div className="ch-bar-row">
          <span className="ch-bar-label">✓ {completed}/{total}</span>
          <div className="ch-bar-track">
            <div className="ch-bar-fill complete" style={{ width: `${completedPct}%` }} />
          </div>
        </div>
        <div className="ch-bar-row">
          <span className="ch-bar-label">★ {mastered}/{total}</span>
          <div className="ch-bar-track">
            <div className="ch-bar-fill master" style={{ width: `${masteredPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Chapters() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    api('/chapters').then(data => setChapters(data.chapters || []));
  }, []);

  // Group chapters by course → section_number
  const grouped = {};
  for (const ch of chapters) {
    if (!grouped[ch.course]) grouped[ch.course] = {};
    if (!grouped[ch.course][ch.section_number]) grouped[ch.course][ch.section_number] = { title: ch.section_title, chapters: [] };
    grouped[ch.course][ch.section_number].chapters.push(ch);
  }

  function getCardStatus(ch) {
    if (ch.total_quizzes > 0 && ch.mastered >= ch.total_quizzes) return 'mastered';
    if (ch.total_quizzes > 0 && (ch.completed || 0) >= ch.total_quizzes) return 'completed';
    if (ch.total_quizzes > 0 && (ch.completed > 0 || ch.mastered > 0)) return 'in-progress';
    return '';
  }

  return (
    <div className="page">
      <h2 className="section-title" style={{ marginBottom: 4 }}>章一覧</h2>
      <p className="section-subtitle" style={{ marginBottom: 20 }}>トピックごとに学習しよう</p>

      {COURSES.map((course) => {
        const courseData = grouped[course.id];
        if (!courseData) return null;
        return (
          <div key={course.id} className="section-block">
            <h3 className="section-name">{course.name}</h3>
            {course.parts.map((part) => {
              const partData = courseData[part.number];
              if (!partData) return null;
              return (
                <div key={part.number} className="part-section">
                  <div className="part-header">
                    <span className="part-name">{part.number}部: {part.title}</span>
                  </div>
                  <div className="chapter-grid">
                    {partData.chapters.map((ch) => (
                      <div
                        key={ch.id}
                        className={`card card-clickable chapter-card-compact ${getCardStatus(ch)}`}
                        onClick={() => navigate(`/chapters/${ch.id}`)}
                      >
                        <div className="chapter-card-body">
                          <div className="chapter-num-badge">{ch.week_number}章</div>
                          <div className="chapter-label">{ch.title}</div>
                        </div>
                        <ChapterProgress ch={ch} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// --- ChapterQuiz ---
function ChapterQuiz() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const { currentQuiz, currentIndex, quizzes, loading, sessionDone, startSession, submitAnswer, nextQuiz, totalXp, correctCount, results } = useQuiz();

  useEffect(() => {
    api('/chapters').then(data => {
      const ch = (data.chapters || []).find(c => c.id === parseInt(chapterId));
      setChapter(ch);
    });
    startSession(parseInt(chapterId));
  }, [chapterId]);

  if (loading || !chapter) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  if (sessionDone) {
    return (
      <div className="result-container page">
        <div className="diagnosis-tag">{chapter?.section_title || ''}</div>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 24, color: 'var(--color-text-muted)', fontSize: '0.95rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {chapter?.title || ''} 完了
        </h2>
        <div className="result-score">{correctCount}/{quizzes.length}</div>
        <div className="result-label">正解</div>
        {totalXp > 0 && <div className="result-xp">+{totalXp} XP</div>}
        <button className="btn-primary" onClick={() => navigate('/chapters')} style={{ marginTop: 32 }}>章一覧に戻る</button>
      </div>
    );
  }

  if (!currentQuiz) return <div className="page" style={{ color: 'var(--color-text-muted)' }}>この章にはクイズがまだありません</div>;
  const answered = results.length > currentIndex;

  return (
    <div className="page">
      <div className="diagnosis-tag" style={{ marginBottom: 8 }}>{chapter?.section_title} · W{chapter?.week_number}</div>
      <QuizCounter current={currentIndex + 1} total={quizzes.length} />
      <div style={{ marginTop: 20 }}>
        <QuizCard key={currentQuiz.id} quiz={currentQuiz} onAnswer={submitAnswer} />
      </div>
      {answered && (
        <button className="btn-primary" onClick={nextQuiz} style={{ marginTop: 24 }}>
          {currentIndex + 1 >= quizzes.length ? '結果を見る' : '次へ'}
        </button>
      )}
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
      <div className="result-container page">
        <div className="diagnosis-tag">診断完了</div>
        <div className="result-score">{result.correctCount}/{result.totalCount}</div>
        <div className="result-label">正解</div>
        {result.skippedLight && (
          <p style={{ marginBottom: 24, color: 'var(--color-success)', fontSize: '0.9rem' }}>基礎問題をスキップしました</p>
        )}
        <button className="btn-primary" onClick={() => window.location.reload()}>始める</button>
      </div>
    );
  }

  if (quizzes.length === 0) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  const quiz = quizzes[currentIndex];

  return (
    <div className="page">
      <div className="diagnosis-tag">レベル診断</div>
      <QuizCounter current={currentIndex + 1} total={quizzes.length} />
      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 24, lineHeight: 1.7, fontFamily: 'var(--font-display)' }}>
          {quiz.question}
        </p>
        <div className="stagger">
          {[1, 2, 3, 4].map(i => (
            <button key={i} className={`btn-choice${selected === i ? ' selected' : ''}`} onClick={() => handleSelect(i)}>
              <span className="choice-label">{CHOICE_LABELS[i - 1]}</span>
              {quiz[`choice_${i}`]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- GateScreen ---
function GateScreen({ onPass }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (pin === '8787') {
      localStorage.setItem('jta_gate', '1');
      onPass();
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <div className="loading-screen" style={{ flexDirection: 'column', gap: 24 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>
        アクセスコード
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(false); }}
          placeholder="----"
          autoFocus
          style={{
            fontSize: '2rem',
            letterSpacing: '0.5em',
            textAlign: 'center',
            width: 160,
            padding: '12px 8px',
            border: `2px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
            borderRadius: 12,
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            outline: 'none',
          }}
        />
        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>
            コードが違います
          </div>
        )}
        <button type="submit" className="btn-primary" style={{ width: 160 }}>
          入る
        </button>
      </form>
    </div>
  );
}

// --- App ---
export default function App() {
  const { user, loading } = useAuth();
  const [gatePass, setGatePass] = useState(() => localStorage.getItem('jta_gate') === '1');

  if (!gatePass) return <GateScreen onPass={() => setGatePass(true)} />;
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  // Skip login & diagnosis screens — go straight to home
  return (
    <BrowserRouter>
      <div className="scroll-container">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/chapters" element={<Chapters />} />
        <Route path="/chapters/:chapterId" element={<ChapterQuiz />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </div>
      <Header />
    </BrowserRouter>
  );
}
