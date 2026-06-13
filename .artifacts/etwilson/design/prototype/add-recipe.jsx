// add-recipe.jsx — the ingestion centerpiece: URL import, paste import,
// and manual entry (two concepts). All roads converge on an editable draft.
const { useState: useStateAR, useEffect: useEffectAR, useRef: useRefAR } = React;

const emptyDraft = () => ({ title: '', servings: null, totalTime: null, tags: [], ingredients: [{ qty: '', unit: '', item: '' }], steps: [''], notes: [], warnings: [], confidence: null });

function isDraftValid(d) {
  return d && d.title.trim() && (d.ingredients || []).some((i) => i.item.trim()) && (d.steps || []).some((s) => (s || '').trim());
}

/* ---- confidence meter ---- */
function Confidence({ value }) {
  const tone = value >= 85 ? 'High' : value >= 60 ? 'Medium' : 'Low';
  const color = value >= 85 ? 'var(--primary)' : value >= 60 ? 'oklch(0.72 0.15 75)' : 'var(--destructive)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name="gauge" size={15} style={{ color: 'var(--muted-foreground)' }} />
      <span className="muted" style={{ fontSize: '0.8rem' }}>Parse confidence</span>
      <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--muted)', overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: value + '%', height: '100%', background: color, transition: 'width .5s cubic-bezier(.2,.7,.3,1)' }} />
      </div>
      <span className="mono" style={{ fontSize: '0.78rem', color, fontWeight: 600 }}>{tone}</span>
    </div>
  );
}

/* ---- provenance pill ---- */
function Provenance({ source }) {
  if (!source) return null;
  const map = {
    url: { icon: 'globe', label: source.host, sub: source.method },
    paste: { icon: 'clipboard', label: 'Pasted text', sub: source.method || 'parsed from text' },
    manual: { icon: 'wand', label: 'Freeform entry', sub: 'parsed as you type' },
  };
  const m = map[source.type] || map.paste;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '6px 11px', borderRadius: 99, background: 'var(--secondary)', border: '1px solid var(--border)' }}>
      <Icon name={m.icon} size={14} style={{ color: 'var(--muted-foreground)' }} />
      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{m.label}</span>
      <span className="mono muted" style={{ fontSize: '0.68rem' }}>· {m.sub}</span>
    </div>
  );
}

/* ---- parsing progress animation ---- */
function ParseProgress({ steps, onDone }) {
  const [n, setN] = useStateAR(0);
  useEffectAR(() => {
    if (n >= steps.length) { const t = setTimeout(onDone, 280); return () => clearTimeout(t); }
    const t = setTimeout(() => setN(n + 1), n === 0 ? 220 : 300 + Math.random() * 220);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div className="card" style={{ padding: '1.6rem', maxWidth: 460 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((s, i) => {
          const done = i < n, active = i === n;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, opacity: i <= n ? 1 : 0.35, transition: 'opacity .3s' }}>
              <span style={{ display: 'flex', color: done ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                {done ? <Icon name="check" size={16} /> : active ? <Icon name="loader" size={16} className="spin" /> : <span style={{ width: 16, height: 16, borderRadius: 99, border: '1.5px solid var(--border)', display: 'block' }} />}
              </span>
              <span style={{ fontSize: '0.86rem', color: done || active ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- review + edit panel (shared by url / paste / freeform) ---- */
function ReviewPanel({ draft, setDraft, onBack, onSave, backLabel }) {
  const valid = isDraftValid(draft);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card" style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Provenance source={draft.source} />
          {draft.confidence != null && <div style={{ flex: 1, minWidth: 180, maxWidth: 280 }}><Confidence value={draft.confidence} /></div>}
        </div>
        {draft.warnings?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
            {draft.warnings.map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                <Icon name="info" size={14} style={{ marginTop: 2, flexShrink: 0 }} /> <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '1.4rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Icon name="pencil" size={15} style={{ color: 'var(--muted-foreground)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>Review &amp; tidy up</span>
          <span className="muted" style={{ fontSize: '0.8rem' }}>— everything is editable before it lands in your library.</span>
        </div>
        <RecipeForm draft={draft} setDraft={setDraft} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, position: 'sticky', bottom: 0, padding: '12px 0', background: 'linear-gradient(to top, var(--background) 70%, transparent)' }}>
        <button className="btn btn-ghost" onClick={onBack}><Icon name="chevronLeft" size={16} /> {backLabel || 'Back'}</button>
        <button className="btn btn-primary btn-lg" disabled={!valid} onClick={() => onSave(draft)}>
          <Icon name="check" size={16} /> Save to library
        </button>
      </div>
      {!valid && <div className="muted" style={{ fontSize: '0.76rem', textAlign: 'right', marginTop: -10 }}>Needs a title, at least one ingredient, and one step.</div>}
    </div>
  );
}

/* ====================== URL METHOD ====================== */
function UrlMethod({ onReview, toast }) {
  const [url, setUrl] = useStateAR('');
  const [stage, setStage] = useStateAR('input'); // input | parsing
  const go = () => {
    if (!url.trim()) return;
    setStage('parsing');
  };
  const examples = [
    { label: 'a tacos recipe', url: 'cooking-with-mara.com/charred-corn-tacos' },
    { label: 'a lentil soup', url: 'thecozykitchen.net/red-lentil-coconut-soup' },
    { label: 'a sheet-pan dinner', url: 'seriousweeknight.com/sheet-pan-gnocchi' },
  ];
  if (stage === 'parsing') {
    return (
      <div style={{ paddingTop: 8 }}>
        <ParseProgress
          steps={['Fetching the page…', 'Scanning for schema.org Recipe markup…', 'Found JSON-LD — reading fields…', 'Structuring ingredients & steps…']}
          onDone={() => { const d = importFromUrl(url); onReview(d); }} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 620 }}>
      <p className="muted" style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
        Paste a link to any recipe page. YARA reads the structured <span className="mono" style={{ fontSize: '0.82rem' }}>schema.org/Recipe</span> data most cooking sites already publish — no copy-pasting, no scrolling past someone's life story.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Icon name="link" size={16} style={{ position: 'absolute', left: 11, color: 'var(--muted-foreground)' }} />
          <input className="input" style={{ height: '2.6rem', paddingLeft: 36 }} placeholder="https://example.com/best-pasta"
            value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} />
        </div>
        <button className="btn btn-primary btn-lg" onClick={go} disabled={!url.trim()}>
          <Icon name="download" size={16} /> Fetch &amp; parse
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className="muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>No link handy? Try</span>
        {examples.map((ex) => (
          <button key={ex.url} className="badge" style={{ cursor: 'pointer' }} onClick={() => setUrl(ex.url)}>
            <Icon name="globe" size={11} /> {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ====================== PASTE METHOD ====================== */
function PasteMethod({ onReview }) {
  const [text, setText] = useStateAR('');
  const [stage, setStage] = useStateAR('input');
  const lines = text ? text.split('\n').filter((l) => l.trim()).length : 0;
  const go = () => { if (text.trim()) setStage('parsing'); };
  if (stage === 'parsing') {
    return (
      <div style={{ paddingTop: 8 }}>
        <ParseProgress steps={['Reading the text…', 'Detecting sections (ingredients vs steps)…', 'Parsing quantities & units…', 'Flagging anything unclear…']}
          onDone={() => {
            const parsed = parseRecipeText(text);
            onReview({ ...parsed, source: { type: 'paste', method: 'parsed from pasted text' } });
          }} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
      <p className="muted" style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
        Paste a recipe however you have it — copied from a page, texted by a friend, or generated by an LLM. YARA finds the structure. Messy is fine.
      </p>
      <textarea className="textarea mono" style={{ minHeight: 240, fontSize: '0.84rem', lineHeight: 1.6 }}
        placeholder={"Paste anything…\n\nGarlic Butter Pasta\nServes 4\n\nIngredients:\n- 400g spaghetti\n- 6 cloves garlic\n...\n\nInstructions:\n1. Boil the pasta..."}
        value={text} onChange={(e) => setText(e.target.value)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="muted" style={{ fontSize: '0.78rem' }}>Try an example:</span>
          <button className="btn btn-outline btn-sm" onClick={() => setText(SAMPLE_PASTE_CLEAN)}><Icon name="fileText" size={13} /> Clean</button>
          <button className="btn btn-outline btn-sm" onClick={() => setText(SAMPLE_PASTE_MESSY)}><Icon name="sparkles" size={13} /> Messy / texted</button>
          {text && <button className="btn btn-ghost btn-sm muted" onClick={() => setText('')}>Clear</button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lines > 0 && <span className="mono muted" style={{ fontSize: '0.72rem' }}>{lines} lines</span>}
          <button className="btn btn-primary btn-lg" onClick={go} disabled={!text.trim()}><Icon name="wand" size={16} /> Parse recipe</button>
        </div>
      </div>
    </div>
  );
}

/* ====================== MANUAL METHOD (two ideas) ====================== */
function ManualMethod({ draft, setDraft, mode, setMode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <p className="muted" style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 460 }}>
          Two ways to enter a recipe by hand. Same result, different starting point — pick whichever matches how the recipe lives in your head.
        </p>
        <Segmented value={mode} onChange={setMode} options={[
          { value: 'freeform', label: 'Freeform', icon: 'wand' },
          { value: 'form', label: 'Structured form', icon: 'rows' },
        ]} />
      </div>

      {mode === 'freeform' ? <FreeformManual draft={draft} setDraft={setDraft} />
        : (
          <div>
            <ConceptNote text="Idea B — the classic. Full control over every field, drag to reorder, unit-by-unit. Best when you're transcribing from a cookbook or know exactly what you want." />
            <div className="card" style={{ padding: '1.4rem 1.5rem', marginTop: 12 }}>
              <RecipeForm draft={draft} setDraft={setDraft} />
            </div>
          </div>
        )}
    </div>
  );
}

function ConceptNote({ text }) {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 'var(--radius)', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
      <Icon name="info" size={14} style={{ marginTop: 2, color: 'var(--muted-foreground)', flexShrink: 0 }} />
      <span className="muted" style={{ fontSize: '0.8rem', lineHeight: 1.55 }}>{text}</span>
    </div>
  );
}

// Idea A: one smart field, live structured preview — blurs manual & paste.
function FreeformManual({ draft, setDraft }) {
  const [text, setText] = useStateAR(draft._freeform || '');
  const parsed = text.trim() ? parseRecipeText(text) : null;
  useEffectAR(() => {
    if (parsed) setDraft({ ...parsed, tags: draft.tags || [], _freeform: text, source: { type: 'manual', method: 'parsed as you type' } });
    else setDraft({ ...emptyDraft(), _freeform: text });
  }, [text]);
  return (
    <div>
      <ConceptNote text="Idea A (recommended) — just write. Type the recipe like a note to yourself; YARA structures it live on the right. The same engine that powers paste-import, pointed at a blank page. Lowest friction, fully editable after." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="label mono" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>You write</label>
          <textarea className="textarea mono" style={{ minHeight: 360, fontSize: '0.84rem', lineHeight: 1.65 }}
            placeholder={"Shakshuka\nServes 2 · 35 min\n\n1 can tomatoes\n4 eggs\n1 onion, diced\n2 cloves garlic\n1 tsp cumin\n\nSoften the onion, add garlic and spices.\nPour in tomatoes and simmer until thick.\nMake wells, crack in eggs, cover until set."}
            value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="label mono" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>YARA structures →</label>
          <div className="card" style={{ padding: '1.2rem 1.3rem', minHeight: 360 }}>
            {parsed && (parsed.title || parsed.ingredients.length || parsed.steps.length)
              ? <LivePreview parsed={parsed} />
              : <div style={{ height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--muted-foreground)', textAlign: 'center' }}>
                  <Icon name="wand" size={26} /><span style={{ fontSize: '0.85rem', maxWidth: 200 }}>Start typing on the left. Structure appears here as you go.</span>
                </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LivePreview({ parsed }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{parsed.title || <span className="muted" style={{ fontWeight: 400 }}>Untitled recipe</span>}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          {parsed.totalTime && <span className="muted mono" style={{ fontSize: '0.72rem' }}>{fmtTime(parsed.totalTime)}</span>}
          {parsed.servings && <span className="muted mono" style={{ fontSize: '0.72rem' }}>serves {parsed.servings}</span>}
        </div>
      </div>
      {parsed.ingredients.length > 0 && (
        <div>
          <div style={sectionHeadStyle}>{parsed.ingredients.length} ingredients</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {parsed.ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.84rem', alignItems: 'baseline' }}>
                <span className="mono" style={{ minWidth: 72, color: ing.lowConf ? 'var(--destructive)' : 'var(--muted-foreground)', fontSize: '0.76rem' }}>{[ing.qty, ing.unit].filter(Boolean).join(' ') || (ing.lowConf ? '? ' : '—')}</span>
                <span>{ing.item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {parsed.steps.length > 0 && (
        <div>
          <div style={sectionHeadStyle}>{parsed.steps.length} steps</div>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {parsed.steps.map((s, i) => <li key={i} style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>{s}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ====================== SHELL ====================== */
function AddRecipe({ onSave, onCancel, toast }) {
  const [method, setMethod] = useStateAR('url');
  const [reviewDraft, setReviewDraft] = useStateAR(null);
  const [manualMode, setManualMode] = useStateAR('freeform');
  const [manualDraft, setManualDraft] = useStateAR(emptyDraft());

  const methods = [
    { value: 'url', label: 'From a link', icon: 'link' },
    { value: 'paste', label: 'Paste text', icon: 'clipboard' },
    { value: 'manual', label: 'By hand', icon: 'pencil' },
  ];

  const save = (draft) => {
    const clean = {
      id: uid(), title: draft.title.trim(),
      servings: draft.servings || null, totalTime: draft.totalTime || null,
      tags: draft.tags || [], favorite: false,
      ingredients: (draft.ingredients || []).filter((i) => i.item.trim()).map(({ qty, unit, item }) => ({ qty, unit, item })),
      steps: (draft.steps || []).filter((s) => (s || '').trim()),
      notes: (draft.notes || []).filter(Boolean),
      source: draft.source || { type: 'manual', method: 'manual entry' },
      createdAt: Date.now(),
    };
    onSave(clean);
  };

  // In review stage (url/paste produced a draft)
  if (reviewDraft) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <ReviewPanel draft={reviewDraft} setDraft={setReviewDraft} backLabel="Start over"
          onBack={() => setReviewDraft(null)} onSave={save} />
      </div>
    );
  }

  const manualValid = isDraftValid(manualDraft);

  return (
    <div style={{ maxWidth: method === 'manual' && manualMode === 'freeform' ? 960 : 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
        <Segmented value={method} onChange={setMethod} options={methods} />
      </div>

      {method === 'url' && <UrlMethod onReview={setReviewDraft} toast={toast} />}
      {method === 'paste' && <PasteMethod onReview={setReviewDraft} />}
      {method === 'manual' && (
        <div>
          <ManualMethod draft={manualDraft} setDraft={setManualDraft} mode={manualMode} setMode={setManualMode} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, position: 'sticky', bottom: 0, padding: '12px 0', background: 'linear-gradient(to top, var(--background) 70%, transparent)' }}>
            {!manualValid && <span className="muted" style={{ fontSize: '0.76rem', alignSelf: 'center' }}>Needs a title, an ingredient, and a step.</span>}
            <button className="btn btn-primary btn-lg" disabled={!manualValid} onClick={() => save(manualDraft)}>
              <Icon name="check" size={16} /> Save to library
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AddRecipe });
