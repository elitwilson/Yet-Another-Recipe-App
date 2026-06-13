// recipe-form.jsx — the structured editor (shared by manual entry, import
// review, and library edit) and the read-only recipe view.
const { useState: useStateRF, useRef: useRefRF } = React;

/* ---- Tag input ---- */
function TagInput({ tags, onChange }) {
  const [val, setVal] = useStateRF('');
  const add = (t) => {
    const clean = t.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean)) onChange([...tags, clean]);
    setVal('');
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
      border: '1px solid var(--input)', borderRadius: 'calc(var(--radius) - 2px)', padding: '5px 7px', minHeight: '2.25rem' }}>
      {tags.map((t) => (
        <span key={t} className="badge" style={{ paddingRight: 4 }}>
          {t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))} className="focusable"
            style={{ border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', color: 'var(--muted-foreground)', padding: 1, borderRadius: 4 }}>
            <Icon name="x" size={12} />
          </button>
        </span>
      ))}
      <input value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(val); }
          else if (e.key === 'Backspace' && !val && tags.length) onChange(tags.slice(0, -1));
        }}
        placeholder={tags.length ? 'Add tag…' : 'pasta, fast, vegetarian…'}
        style={{ flex: 1, minWidth: 90, border: 0, outline: 'none', background: 'transparent', fontSize: '0.85rem', fontFamily: 'inherit', color: 'var(--foreground)', height: '1.6rem' }} />
    </div>
  );
}

/* ---- Editable ingredient rows with drag reorder ---- */
function IngredientRows({ rows, onChange }) {
  const dragIndex = useRefRF(null);
  const [over, setOver] = useStateRF(null);

  const update = (i, patch) => onChange(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => onChange([...rows, { qty: '', unit: '', item: '' }]);

  const onDrop = (i) => {
    const from = dragIndex.current;
    if (from === null || from === i) { setOver(null); return; }
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    onChange(next);
    dragIndex.current = null; setOver(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((r, i) => (
          <div key={i}
            onDragOver={(e) => { e.preventDefault(); setOver(i); }}
            onDrop={() => onDrop(i)}
            style={{
              display: 'grid', gridTemplateColumns: '20px 64px 88px 1fr 30px', gap: 6, alignItems: 'center',
              padding: '2px 2px', borderRadius: 8,
              outline: over === i ? '2px dashed var(--ring)' : 'none', outlineOffset: 2,
              background: r.lowConf ? 'color-mix(in oklch, var(--destructive) 8%, transparent)' : 'transparent',
            }}>
            <span draggable onDragStart={() => { dragIndex.current = i; }} onDragEnd={() => setOver(null)}
              title="Drag to reorder"
              style={{ cursor: 'grab', color: 'var(--muted-foreground)', display: 'flex', justifyContent: 'center' }}>
              <Icon name="grip" size={15} />
            </span>
            <input className="input" style={{ height: '2rem', padding: '0 0.45rem', textAlign: 'center' }}
              value={r.qty} placeholder="qty" onChange={(e) => update(i, { qty: e.target.value, lowConf: false })} />
            <input className="input" style={{ height: '2rem', padding: '0 0.45rem' }}
              value={r.unit} placeholder="unit" onChange={(e) => update(i, { unit: e.target.value })} />
            <input className="input" style={{ height: '2rem', padding: '0 0.55rem' }}
              value={r.item} placeholder="ingredient" onChange={(e) => update(i, { item: e.target.value, lowConf: false })} />
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(i)} title="Remove"
              style={{ color: 'var(--muted-foreground)' }}>
              <Icon name="x" size={15} />
            </button>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm" onClick={add} style={{ marginTop: 8, color: 'var(--muted-foreground)' }}>
        <Icon name="plus" size={14} /> Add ingredient
      </button>
    </div>
  );
}

/* ---- Editable step rows ---- */
function StepRows({ rows, onChange }) {
  const dragIndex = useRefRF(null);
  const [over, setOver] = useStateRF(null);
  const update = (i, v) => onChange(rows.map((r, idx) => idx === i ? v : r));
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => onChange([...rows, '']);
  const onDrop = (i) => {
    const from = dragIndex.current;
    if (from === null || from === i) { setOver(null); return; }
    const next = [...rows]; const [m] = next.splice(from, 1); next.splice(i, 0, m);
    onChange(next); dragIndex.current = null; setOver(null);
  };
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((r, i) => (
          <div key={i}
            onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDrop={() => onDrop(i)}
            style={{ display: 'grid', gridTemplateColumns: '20px 24px 1fr 30px', gap: 6, alignItems: 'start',
              outline: over === i ? '2px dashed var(--ring)' : 'none', outlineOffset: 2, borderRadius: 8 }}>
            <span draggable onDragStart={() => { dragIndex.current = i; }} onDragEnd={() => setOver(null)}
              style={{ cursor: 'grab', color: 'var(--muted-foreground)', display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
              <Icon name="grip" size={15} />
            </span>
            <span className="mono" style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', paddingTop: 9, textAlign: 'center' }}>{i + 1}</span>
            <textarea className="textarea" rows={2} style={{ minHeight: '2.4rem' }}
              value={r} placeholder="Describe this step…" onChange={(e) => update(i, e.target.value)} />
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(i)} style={{ color: 'var(--muted-foreground)', marginTop: 4 }}>
              <Icon name="x" size={15} />
            </button>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm" onClick={add} style={{ marginTop: 8, color: 'var(--muted-foreground)' }}>
        <Icon name="plus" size={14} /> Add step
      </button>
    </div>
  );
}

/* ---- Full structured form ---- */
function RecipeForm({ draft, setDraft }) {
  const set = (patch) => setDraft({ ...draft, ...patch });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <label className="label" style={{ marginBottom: 6 }}>Title</label>
        <input className="input" style={{ height: '2.5rem', fontSize: '1rem', fontWeight: 500 }}
          value={draft.title} placeholder="e.g. Garlic Butter Weeknight Pasta"
          onChange={(e) => set({ title: e.target.value })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label className="label" style={{ marginBottom: 6 }}>Serves</label>
          <input className="input" type="number" min="1" value={draft.servings ?? ''} placeholder="4"
            onChange={(e) => set({ servings: e.target.value ? parseInt(e.target.value, 10) : null })} />
        </div>
        <div>
          <label className="label" style={{ marginBottom: 6 }}>Total time (min)</label>
          <input className="input" type="number" min="0" value={draft.totalTime ?? ''} placeholder="25"
            onChange={(e) => set({ totalTime: e.target.value ? parseInt(e.target.value, 10) : null })} />
        </div>
      </div>

      <div>
        <label className="label" style={{ marginBottom: 6 }}>Tags</label>
        <TagInput tags={draft.tags || []} onChange={(tags) => set({ tags })} />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <label className="label">Ingredients</label>
          <span className="muted mono" style={{ fontSize: '0.72rem' }}>{(draft.ingredients || []).length} items</span>
        </div>
        <IngredientRows rows={draft.ingredients || []} onChange={(ingredients) => set({ ingredients })} />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <label className="label">Steps</label>
          <span className="muted mono" style={{ fontSize: '0.72rem' }}>{(draft.steps || []).length} steps</span>
        </div>
        <StepRows rows={draft.steps || []} onChange={(steps) => set({ steps })} />
      </div>
    </div>
  );
}

/* ---- Read-only recipe view ---- */
function RecipeView({ recipe }) {
  const sourceLabel = {
    url: recipe.source?.host || 'web', paste: 'pasted text', manual: 'entered by hand',
  }[recipe.source?.type] || 'recipe';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {recipe.totalTime && <Stat icon="clock" label={fmtTime(recipe.totalTime)} />}
        {recipe.servings && <Stat icon="users" label={`Serves ${recipe.servings}`} />}
        <Stat icon="list" label={`${recipe.ingredients.length} ingredients`} />
      </div>

      {recipe.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {recipe.tags.map((t) => <span key={t} className="badge badge-outline"><Icon name="tag" size={11} />{t}</span>)}
        </div>
      )}

      <div>
        <h3 style={sectionHeadStyle}>Ingredients</h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {recipe.ingredients.map((ing, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, padding: '0.5rem 0', borderBottom: '1px solid var(--border)', alignItems: 'baseline' }}>
              <span className="mono" style={{ minWidth: 96, color: 'var(--muted-foreground)', fontSize: '0.82rem', flexShrink: 0 }}>
                {[ing.qty, ing.unit].filter(Boolean).join(' ') || '—'}
              </span>
              <span style={{ fontSize: '0.92rem' }}>{ing.item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 style={sectionHeadStyle}>Steps</h3>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14, counterReset: 'step' }}>
          {recipe.steps.map((s, i) => (
            <li key={i} style={{ display: 'flex', gap: 14 }}>
              <span className="mono" style={{
                flexShrink: 0, width: 26, height: 26, borderRadius: 7, background: 'var(--secondary)',
                color: 'var(--secondary-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 600, marginTop: 1,
              }}>{i + 1}</span>
              <span style={{ fontSize: '0.92rem', lineHeight: 1.6, textWrap: 'pretty' }}>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {recipe.notes?.length > 0 && (
        <div>
          <h3 style={sectionHeadStyle}>Notes</h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recipe.notes.map((n, i) => <li key={i} style={{ fontSize: '0.88rem', lineHeight: 1.5 }} className="muted">{n}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

const sectionHeadStyle = {
  fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--muted-foreground)', margin: '0 0 12px', fontFamily: "'Geist Mono', monospace",
};

function Stat({ icon, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
      <Icon name={icon} size={15} /> {label}
    </span>
  );
}

Object.assign(window, { RecipeForm, RecipeView, TagInput, IngredientRows, StepRows, Stat });
