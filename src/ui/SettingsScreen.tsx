import { useState, type ChangeEvent } from 'react';
import { exportProgress, importProgress, type Progress } from '../state/progress';
import { useProgress } from '../state/useProgress';
import { backupStatus, describeLastBackup } from '../state/backup';
import { applyTheme, readTheme, type Theme } from './theme';

export function SettingsScreen() {
  const { progress, dispatch, today } = useProgress();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Progress | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(readTheme);

  function download() {
    const exported = { ...progress, lastExport: today };
    const blob = new Blob([exportProgress(exported)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-quest-progress-${today}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    dispatch({ type: 'markExported', today });
    setMessage('Progress exported.');
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    setError(null);
    setMessage(null);
    setPending(null);
    if (!file) return;
    const r = importProgress(await file.text());
    if (!r.ok) setError(r.error);
    else setPending(r.progress);
  }

  function confirmImport() {
    if (!pending) return;
    dispatch({ type: 'replace', progress: pending });
    setPending(null);
    setMessage('Progress imported.');
  }

  return (
    <section className="settings">
      <h1>Settings</h1>

      <div className="panel">
        <h2>Move your progress</h2>
        <p>
          Progress lives only in this browser. Export a file to keep a backup or to move to another device. The file
          includes your private stories.
        </p>
        <p className="muted">{describeLastBackup(backupStatus(progress, today))}</p>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={download}>
            Export progress
          </button>
          <label className="btn file-btn">
            Import progress
            <input type="file" accept="application/json,.json" onChange={onFile} aria-label="Import progress" />
          </label>
        </div>
        {error && (
          <p className="run-msg is-wrong" role="alert">
            {error} Your current progress was not changed.
          </p>
        )}
        {pending && (
          <div className="feedback is-wrong" role="alertdialog" aria-label="Confirm import">
            <h3>Replace your current progress?</h3>
            <p>
              The file has {Object.keys(pending.completed).length} completed lessons, {Object.keys(pending.srs).length}{' '}
              review cards and a {pending.streak.current} day streak. Your current progress will be overwritten.
            </p>
            <div className="row">
              <button type="button" className="btn btn-primary" onClick={confirmImport}>
                Replace progress
              </button>
              <button type="button" className="btn" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {message && (
          <p className="muted" role="status">
            {message}
          </p>
        )}
      </div>

      <div className="panel">
        <h2>Appearance</h2>
        <div className="row" role="radiogroup" aria-label="Theme">
          {(['system', 'light', 'dark'] as Theme[]).map((t) => (
            <label key={t} className="choice">
              <input
                type="radio"
                name="theme"
                checked={theme === t}
                onChange={() => {
                  setTheme(t);
                  applyTheme(t);
                }}
              />
              <span>{t === 'system' ? 'Match system' : t === 'light' ? 'Parchment (light)' : 'Castle (dark)'}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
