'use client';
// Gece/gündüz toggle — checked = gece (mevcut tema), unchecked = gündüz. html.light sınıfı + localStorage.
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(!document.documentElement.classList.contains('light'));
  }, []);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const isDark = e.target.checked;
    setDark(isDark);
    document.documentElement.classList.toggle('light', !isDark);
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
  }

  return (
    <div className="theme-switch" title="Toggle light / dark">
      <label className="switch">
        <input id="input" type="checkbox" checked={dark} onChange={onChange} aria-label="Toggle theme" />
        <div className="slider round">
          <div className="sun-moon">
            <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
            <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
            <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
            <svg id="light-ray-1" className="light-ray" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
            <svg id="light-ray-2" className="light-ray" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
            <svg id="light-ray-3" className="light-ray" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
            <svg id="cloud-1" className="cloud-dark" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
            <svg id="cloud-2" className="cloud-dark" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
            <svg id="cloud-3" className="cloud-dark" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
            <svg id="cloud-4" className="cloud-light" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
            <svg id="cloud-5" className="cloud-light" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
            <svg id="cloud-6" className="cloud-light" viewBox="0 0 100 100"><circle cx={50} cy={50} r={50} /></svg>
          </div>
          <div className="stars">
            <svg id="star-1" className="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" /></svg>
            <svg id="star-2" className="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" /></svg>
            <svg id="star-3" className="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" /></svg>
            <svg id="star-4" className="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" /></svg>
          </div>
        </div>
      </label>
    </div>
  );
}
