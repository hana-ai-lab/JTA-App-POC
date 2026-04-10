# Gate Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4-digit PIN gate screen (8787) that blocks access until the correct PIN is entered, persisted per device via localStorage.

**Architecture:** A `GateScreen` React component is added to `App.jsx`. On app load, check `localStorage.getItem('jta_gate')`. If not `'1'`, render `GateScreen` instead of the app. Correct PIN sets the localStorage key and unmounts the gate.

**Tech Stack:** React, localStorage

---

### Task 1: Add GateScreen component and gate logic to App.jsx

**Files:**
- Modify: `client/src/App.jsx` — add `GateScreen` component and gate check in `App`

- [ ] **Step 1: Add GateScreen component**

In `client/src/App.jsx`, add this component before the `App` export:

```jsx
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
```

- [ ] **Step 2: Add gate state to App component**

In the `App` function, add gate state and conditional render:

```jsx
export default function App() {
  const { user, loading } = useAuth();
  const [gatePass, setGatePass] = useState(() => localStorage.getItem('jta_gate') === '1');

  if (!gatePass) return <GateScreen onPass={() => setGatePass(true)} />;
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    // ... existing JSX unchanged
  );
}
```

- [ ] **Step 3: Verify locally**

Start the dev server and confirm:
- Visiting the app shows the PIN screen
- Entering `8787` grants access
- Entering wrong PIN shows error and clears input
- Refreshing after correct PIN skips the gate screen

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: add 4-digit PIN gate screen for temporary access control"
```

---

### Task 2: Deploy to VPS

- [ ] **Step 1: Run deploy script**

```bash
./.claude/skills/deploy-vps/scripts/deploy.sh
```

- [ ] **Step 2: Verify on production**

Open `http://85.131.249.99:8000` and confirm the gate screen appears.
