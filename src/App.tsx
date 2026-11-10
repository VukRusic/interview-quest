import { HashRouter, NavLink, Route, Routes, Link } from 'react-router-dom';
import './styles/app.css';
import './styles/steps.css';
import { ProgressProvider } from './state/useProgress';
import { LessonRoute } from './ui/LessonScreen';
import { Sprite } from './ui/sprites/Sprite';
import { StoriesScreen } from './ui/StoriesScreen';

function Placeholder({ title }: { title: string }) {
  return <h1>{title}</h1>;
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
      <main className="main">{children}</main>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder title="Today" />} />
      <Route path="/lesson/:lessonId" element={<LessonRoute />} />
      <Route path="/review" element={<Placeholder title="Review" />} />
      <Route path="/stories" element={<StoriesScreen />} />
      <Route path="/settings" element={<Placeholder title="Settings" />} />
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
