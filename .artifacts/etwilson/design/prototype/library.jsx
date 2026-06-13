// library.jsx — recipe library grid + detail/edit sheet.
const { useState: useStateLib, useMemo: useMemoLib } = React;

const SOURCE_ICON = { url: 'globe', paste: 'clipboard', manual: 'pencil' };
const SOURCE_LABEL = { url: 'imported', paste: 'pasted', manual: 'by hand' };

function RecipeCard({ recipe, onOpen, onToggleFav, density }) {
  const [hover, setHover] = useStateLib(false);
  const pad = density === 'compact' ? '0.95rem 1.05rem' : '1.2rem 1.3rem';
  return (
    <div className="card" onClick={() => onOpen(recipe)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        padding: pad, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: density === 'compact' ? 10 : 14,
        transition: 'transform .16s, box-shadow .16s, border-color .16s',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? '0 10px 30px rgba(0,0,0,.10)' : '0 1px 2px rgba(0,0,0,.04)',
        borderColor: hover ? 'color-mix(in oklch, var(--foreground) 18%, var(--border))' : 'var(--border)',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: density === 'compact' ? '0.98rem' : '1.08rem', fontWeight: 600, lineHeight: 1.3, textWrap: 'balance' }}>{recipe.title}</h3>
        <button className="focusable" onClick={(e) => { e.stopPropagation(); onToggleFav(recipe.id); }}
          title={recipe.favorite ? 'Unfavorite' : 'Favorite'}
          style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0,
            color: recipe.favorite ? 'oklch(0.72 0.16 60)' : 'var(--muted-foreground)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill={recipe.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 'auto' }}>
        {recipe.totalTime && <span style={metaStyle}><Icon name="clock" size={13} /> {fmtTime(recipe.totalTime)}</span>}
        {recipe.servings && <span style={metaStyle}><Icon name="users" size={13} /> {recipe.servings}</span>}
        <span style={metaStyle}><Icon name="list" size={13} /> {recipe.ingredients.length}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingTop: density === 'compact' ? 8 : 12, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {(recipe.tags || []).slice(0, 3).map((t) => <span key={t} className="badge badge-outline" style={{ fontSize: '0.66rem', whiteSpace: 'nowrap' }}>{t}</span>)}
        </div>
        <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.66rem', color: 'var(--muted-foreground)', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <Icon name={SOURCE_ICON[recipe.source?.type] || 'pencil'} size={11} /> {SOURCE_LABEL[recipe.source?.type] || ''}
        </span>
      </div>
    </div>
  );
}
const metaStyle = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--muted-foreground)' };

function LibraryView({ recipes, onOpen, onToggleFav, onAdd, density }) {
  const [query, setQuery] = useStateLib('');
  const [sort, setSort] = useStateLib('recent');
  const [favOnly, setFavOnly] = useStateLib(false);

  const filtered = useMemoLib(() => {
    let r = recipes;
    if (favOnly) r = r.filter((x) => x.favorite);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((x) => x.title.toLowerCase().includes(q)
        || (x.tags || []).some((t) => t.includes(q))
        || x.ingredients.some((i) => i.item.toLowerCase().includes(q)));
    }
    r = [...r];
    if (sort === 'recent') r.sort((a, b) => b.createdAt - a.createdAt);
    else if (sort === 'az') r.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'time') r.sort((a, b) => (a.totalTime || 999) - (b.totalTime || 999));
    return r;
  }, [recipes, query, sort, favOnly]);

  if (!recipes.length) return <EmptyLibrary onAdd={onAdd} />;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 220, maxWidth: 380 }}>
          <Icon name="search" size={16} style={{ position: 'absolute', left: 11, color: 'var(--muted-foreground)' }} />
          <input className="input" style={{ paddingLeft: 35 }} placeholder="Search title, tag, or ingredient…"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className={'btn btn-sm ' + (favOnly ? 'btn-secondary' : 'btn-ghost')} onClick={() => setFavOnly(!favOnly)}
          style={{ color: favOnly ? 'oklch(0.62 0.16 60)' : 'var(--muted-foreground)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill={favOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
          Favorites
        </button>
        <div style={{ flex: 1 }} />
        <span className="muted mono" style={{ fontSize: '0.74rem' }}>{filtered.length} / {recipes.length}</span>
        <select className="select" style={{ width: 'auto', height: '2.25rem' }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recent">Recently added</option>
          <option value="az">A–Z</option>
          <option value="time">Quickest first</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--muted-foreground)' }}>
          <Icon name="search" size={28} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: '0.95rem' }}>Nothing matches “{query}”.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map((r) => <RecipeCard key={r.id} recipe={r} onOpen={onOpen} onToggleFav={onToggleFav} density={density} />)}
        </div>
      )}
    </div>
  );
}

function EmptyLibrary({ onAdd }) {
  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '5rem 1rem', gap: 20 }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
        <Icon name="book" size={28} />
      </div>
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 600 }}>Your library is empty</h2>
        <p className="muted" style={{ margin: 0, fontSize: '0.92rem', maxWidth: 380, lineHeight: 1.6 }}>
          No feed, no catalog of ten thousand recipes you'll never make. Just the handful you actually cook. Add the first one.
        </p>
      </div>
      <button className="btn btn-primary btn-lg" onClick={onAdd}><Icon name="plus" size={17} /> Add a recipe</button>
    </div>
  );
}

/* ---- Detail / edit sheet ---- */
function RecipeDetail({ recipe, onClose, onSave, onDelete, onToggleFav, toast }) {
  const [editing, setEditing] = useStateLib(false);
  const [draft, setDraft] = useStateLib(recipe);
  const [confirmDel, setConfirmDel] = useStateLib(false);

  React.useEffect(() => { setDraft(recipe); setEditing(false); }, [recipe?.id]);
  if (!recipe) return null;

  const save = () => {
    const clean = { ...draft, title: draft.title.trim(),
      ingredients: (draft.ingredients || []).filter((i) => i.item.trim()),
      steps: (draft.steps || []).filter((s) => (s || '').trim()) };
    onSave(clean); setEditing(false); toast('Recipe updated');
  };

  return (
    <Sheet open={!!recipe} onClose={onClose} width={editing ? 660 : 560}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.85rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={17} /></button>
        <div style={{ flex: 1 }} />
        {!editing && <>
          <button className="btn btn-ghost btn-sm" onClick={() => { onToggleFav(recipe.id); }} style={{ color: recipe.favorite ? 'oklch(0.62 0.16 60)' : 'var(--muted-foreground)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill={recipe.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText('https://yara.app/s/' + recipe.id).catch(() => {}); toast('Read-only link copied', { icon: 'link' }); }}>
            <Icon name="link" size={15} /> Share
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><Icon name="pencil" size={14} /> Edit</button>
        </>}
        {editing && <>
          <button className="btn btn-ghost btn-sm" onClick={() => { setDraft(recipe); setEditing(false); }}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={save}><Icon name="check" size={14} /> Save</button>
        </>}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '1.6rem 1.8rem 2.5rem' }}>
        {!editing ? (
          <>
            <h1 style={{ margin: '0 0 6px', fontSize: '1.55rem', fontWeight: 650, lineHeight: 1.2, textWrap: 'balance' }}>{recipe.title}</h1>
            <div style={{ marginBottom: 22 }}>
              <span className="mono muted" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name={SOURCE_ICON[recipe.source?.type] || 'pencil'} size={12} />
                {recipe.source?.type === 'url' ? recipe.source.host : SOURCE_LABEL[recipe.source?.type] || 'recipe'}
                {recipe.source?.method ? ' · ' + recipe.source.method : ''}
              </span>
            </div>
            <RecipeView recipe={recipe} />
            <div style={{ marginTop: 32, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost btn-sm btn-destructive" onClick={() => setConfirmDel(true)}
                style={{ background: 'transparent', color: 'var(--destructive)' }}>
                <Icon name="trash" size={14} /> Delete recipe
              </button>
            </div>
          </>
        ) : (
          <RecipeForm draft={draft} setDraft={setDraft} />
        )}
      </div>

      <Modal open={confirmDel} onClose={() => setConfirmDel(false)} width={400}>
        <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 600 }}>Delete this recipe?</h3>
        <p className="muted" style={{ margin: '0 0 20px', fontSize: '0.88rem', lineHeight: 1.5 }}>
          “{recipe.title}” will be removed from your library. This can't be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setConfirmDel(false)}>Keep it</button>
          <button className="btn btn-destructive" onClick={() => { onDelete(recipe.id); setConfirmDel(false); onClose(); toast('Recipe deleted'); }}>
            <Icon name="trash" size={15} /> Delete
          </button>
        </div>
      </Modal>
    </Sheet>
  );
}

Object.assign(window, { LibraryView, RecipeDetail, RecipeCard });
