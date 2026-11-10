import { HashRouter, NavLink, Route, Routes, Link } from 'react-router-dom';
import './styles/app.css';
import './styles/steps.css';
import './styles/home.css';
import { ProgressProvider, useProgress } from './state/useProgress';
import { useState } from 'react';
import { LessonRoute } from './ui/LessonScreen';
import { Sprite } from './ui/sprites/Sprite';
import { StoriesScreen } from './ui/StoriesScreen';
import { HomeScreen } from './ui/HomeScreen';
import { ReviewScreen } from './ui/ReviewScreen';
import { SettingsScreen } from './ui/SettingsScreen';

function RecoveryNotice() {
  const { recoveredBackupKey } = useProgress();
  const [hidden, setHidden] = useState(false);
  if (!recoveredBackupKey || hidden) return null;
  return (
    <div className="feedback is-wrong notice" role="alert">
      <h3>Some saved progress couldn't be read</h3>
      <p>
        Everything still valid was kept, stories first. A full copy of the old data is saved in this browser under{' '}
        <code>{recoveredBackupKey}</code>, so nothing is lost.
      </p>
      <button type="button" className="btn" onClick={() => setHidden(true)}>
        Got it
      </button>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <Sprite name="shield" size={3} />
            Interview Quest
          </Link>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>
              Today
            </NavLink>
            <NavLink to="/review">Review</NavLink>
            <NavLink to="/stories">Stories</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <RecoveryNotice />
        {children}
      </main>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/lesson/:lessonId" element={<LessonRoute />} />
      <Route path="/review" element={<ReviewScreen />} />
      <Route path="/stories" element={<StoriesScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="*" element={<HomeScreen />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <HashRouter>
        <Shell>
          <AppRoutes />
        </Shell>
      </HashRouter>
    </ProgressProvider>
  );
}
