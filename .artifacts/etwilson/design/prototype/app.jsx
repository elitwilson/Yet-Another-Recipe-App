// app.jsx — YARA shell: sidebar, routing, persistence, theme, tweaks.
const { useState: useStateApp, useEffect: useEffectApp } = React;

const STORE_KEY = 'yara.recipes.v1';
function loadRecipes() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return SEED_RECIPES;
}

const ACCENT_MAP = { '#404040': '', '#2f6fdb': 'accent-blue', '#2f8f57': 'accent-green', '#cc6433': 'accent-orange' };
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#404040",
  "density": "comfortable",
  "dark": false
}/*EDITMODE-END*/;

function NavItem({ icon, label, active, disabled, badge, onClick }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} className="focusable"
      style={{
        display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
        padding: '0.55rem 0.7rem', borderRadius: 'calc(var(--radius) - 2px)', border: 0, cursor: disabled ? 'default' : 'pointer',
        fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit',
        background: active ? 'var(--secondary)' : 'transparent',
        color: disabled ? 'var(--muted-foreground)' : active ? 'var(--secondary-foreground)' : 'var(--foreground)',
        opacity: disabled ? 0.55 : 1, transition: 'background .14s',
      }}
      onMouseEnter={(e) => { if (!active && !disabled) e.currentTarget.style.background = 'var(--accent)'; }}
      onMouseLeave={(e) => { if (!active && !disabled) e.currentTarget.style.background = 'transparent'; }}>
      <Icon name={icon} size={17} style={{ color: active ? 'var(--foreground)' : 'var(--muted-foreground)' }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span className="badge mono" style={{ fontSize: '0.58rem', padding: '0.18rem 0.4rem', background: 'var(--muted)', color: 'var(--muted-foreground)', border: 0 }}>{badge}</span>}
    </button>
  );
}

function Sidebar({ view, setView, dark, toggleDark, recipeCount }) {
  const toast = useToast();
  return (
    <aside style={{
      width: 248, flexShrink: 0, height: '100%', background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '1.1rem 0.85rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.3rem 0.5rem 1.1rem' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--primary)', color: 'var(--primary-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chefHat" size={17} />
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div className="mono" style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>YARA</div>
          <div className="muted" style={{ fontSize: '0.6rem', letterSpacing: '0.02em' }}>yet another recipe app</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavItem icon="book" label="Library" active={view === 'library'} onClick={() => setView('library')} badge={String(recipeCount)} />
        <NavItem icon="plus" label="Add recipe" active={view === 'add'} onClick={() => setView('add')} />
      </nav>

      <div className="divider" style={{ margin: '1rem 0.2rem' }} />
      <div className="mono muted" style={{ fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 0.7rem 0.5rem' }}>Coming later</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavItem icon="calendar" label="Meal plan" disabled badge="v1" />
        <NavItem icon="list" label="Shopping list" disabled badge="v1" />
      </nav>

      <div style={{ flex: 1 }} />

      <div className="card" style={{ padding: '0.8rem 0.85rem', display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--background)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: 'oklch(0.7 0.16 150)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Working locally</span>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.5 }}>
          No account. Saved in this browser. Sign up later to sync — nothing is lost.
        </p>
        <button className="btn btn-outline btn-sm" style={{ marginTop: 2 }} onClick={() => toast('Accounts arrive with sync — local data will migrate up.', { icon: 'info' })}>
          Create account
        </button>
      </div>

      <button onClick={toggleDark} className="btn btn-ghost btn-sm" style={{ marginTop: 10, justifyContent: 'flex-start', color: 'var(--muted-foreground)', gap: 9 }}>
        <Icon name={dark ? 'sun' : 'moon'} size={15} /> {dark ? 'Light mode' : 'Dark mode'}
      </button>
    </aside>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [recipes, setRecipes] = useStateApp(loadRecipes);
  const [view, setView] = useStateApp('library');
  const [openRecipe, setOpenRecipe] = useStateApp(null);
  const toast = useToast();

  useEffectApp(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(recipes)); } catch (e) {} }, [recipes]);

  const accentClass = ACCENT_MAP[t.accent] || '';
  const rootClass = [t.dark ? 'dark' : '', accentClass].filter(Boolean).join(' ');

  const addRecipe = (r) => {
    setRecipes((prev) => [r, ...prev]);
    setView('library');
    toast('Added to your library', { action: { label: 'View', onClick: () => setOpenRecipe(r) } });
  };
  const updateRecipe = (r) => setRecipes((prev) => prev.map((x) => x.id === r.id ? r : x));
  const deleteRecipe = (id) => setRecipes((prev) => prev.filter((x) => x.id !== id));
  const toggleFav = (id) => setRecipes((prev) => prev.map((x) => x.id === id ? { ...x, favorite: !x.favorite } : x));

  // keep openRecipe in sync with edits
  const liveOpen = openRecipe ? recipes.find((r) => r.id === openRecipe.id) || null : null;

  return (
    <div className={rootClass} style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--background)', color: 'var(--foreground)' }}>
      <Sidebar view={view} setView={setView} dark={t.dark} toggleDark={() => setTweak('dark', !t.dark)} recipeCount={recipes.length} />

      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '2.2rem 2.6rem 4rem' }}>
          <header style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div>
              {view === 'add' && (
                <button className="btn btn-ghost btn-sm" onClick={() => setView('library')} style={{ marginLeft: -8, marginBottom: 6, color: 'var(--muted-foreground)' }}>
                  <Icon name="chevronLeft" size={15} /> Library
                </button>
              )}
              <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 650, letterSpacing: '-0.01em' }}>
                {view === 'library' ? 'Library' : 'Add a recipe'}
              </h1>
              <p className="muted" style={{ margin: '5px 0 0', fontSize: '0.92rem' }}>
                {view === 'library'
                  ? 'The handful of recipes you actually cook.'
                  : 'Get it in once — link, paste, or by hand. Everything is editable before it lands.'}
              </p>
            </div>
            {view === 'library' && recipes.length > 0 && (
              <button className="btn btn-primary btn-lg" onClick={() => setView('add')}><Icon name="plus" size={17} /> Add recipe</button>
            )}
          </header>

          {view === 'library'
            ? <LibraryView recipes={recipes} density={t.density} onOpen={setOpenRecipe} onToggleFav={toggleFav} onAdd={() => setView('add')} />
            : <AddRecipe onSave={addRecipe} onCancel={() => setView('library')} toast={toast} />}
        </div>
      </main>

      <RecipeDetail recipe={liveOpen} onClose={() => setOpenRecipe(null)} onSave={updateRecipe} onDelete={deleteRecipe} onToggleFav={toggleFav} toast={toast} />

      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak('dark', v)} />
        <TweakColor label="Accent" value={t.accent}
          options={['#404040', '#2f6fdb', '#2f8f57', '#cc6433']}
          onChange={(hex) => setTweak('accent', hex)} />
        <TweakRadio label="Density" value={t.density} options={['comfortable', 'compact']} onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider><App /></ToastProvider>
);
