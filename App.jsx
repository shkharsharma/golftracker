import { useState, useEffect, useMemo } from "react";

const CLUBS = ["Driver","3-Wood","5-Wood","Hybrid","3-Iron","4-Iron","5-Iron","6-Iron","7-Iron","8-Iron","9-Iron","PW","GW","SW","LW","Putter"];
const SHOT_TYPES = ["Tee Shot","Approach","Chip","Pitch","Bunker","Putt","Recovery","Punch","Lay-up"];
const MISTAKE_TYPES = ["Club Selection","Alignment","Ball Position","Grip","Tempo/Rhythm","Course Management","Mental/Focus","Setup/Posture","Follow Through","Shot Shape","Distance Control","Wind Misread","Lie Misread","Pre-shot Routine","Other"];
const OUTCOMES = ["Miss Left","Miss Right","Short","Long","Thin","Fat/Chunk","Shank","Top","Slice","Hook","Perfect","Acceptable"];
const STATUSES = ["Open","In Progress","Fixed","Recurring"];
const PRIORITIES = ["🔴 High","🟡 Medium","🟢 Low"];
const WEATHERS = ["Sunny","Partly Cloudy","Overcast","Light Wind","Strong Wind","Light Rain","Heavy Rain","Hot","Cold"];
const TEES = ["Red","Yellow","White","Blue","Black","Gold"];
const EMOTIONS = ["Calm & Focused","Nervous","Rushed","Distracted","Confident","Frustrated","In the Zone","Tired"];

const TABS = ["Round Log","Hole-by-Hole","Stats Dashboard","Club & Mistake Log","Mistake Summary"];

const emptyRound = () => ({
  id: Date.now(), date: "", course: "", par: 72, tee: "", gross: "", putts: "",
  fairways: "", gir: "", penalties: "", handicap: "", weather: "",
  rating: "", slope: "", bestHole: "", worstHole: "",
  mistakes: "", wentWell: "", focus: ""
});

const emptyHole = (n) => ({
  hole: n, par: "", strokes: "", putts: "", fir: "", gir_h: "", penalties: "",
  clubTee: "", clubApproach: "", sand: "", mistake: "", thought: "", reflection: "", emotion: ""
});

const emptyMistake = () => ({
  id: Date.now(), date: "", course: "", hole: "", club: "", shotType: "",
  mistakeType: "", outcome: "", issue: "", correction: "", status: "Open", priority: "🟡 Medium", resolvedOn: ""
});

const emptyRoundHoles = () => Array.from({length:18}, (_,i) => emptyHole(i+1));

const scoreLabel = (diff) => {
  if (diff === "") return "";
  const d = Number(diff);
  if (d <= -3) return "Albatross 🦅";
  if (d === -2) return "Eagle 🦅";
  if (d === -1) return "Birdie 🐦";
  if (d === 0)  return "Par ✓";
  if (d === 1)  return "Bogey";
  if (d === 2)  return "Double Bogey";
  return "Triple+ 💀";
};

const scoreLabelColor = (diff) => {
  if (diff === "" || diff === undefined) return "#e2e8f0";
  const d = Number(diff);
  if (d <= -2) return "#fbbf24";
  if (d === -1) return "#4ade80";
  if (d === 0)  return "#93c5fd";
  if (d === 1)  return "#fca5a5";
  if (d === 2)  return "#f87171";
  return "#ef4444";
};

const statusColor = (s) => ({
  "Open": "#93c5fd", "In Progress": "#fde68a", "Fixed": "#86efac", "Recurring": "#fca5a5"
}[s] || "#e2e8f0");

const priorityColor = (p) => ({
  "🔴 High": "#fca5a5", "🟡 Medium": "#fde68a", "🟢 Low": "#86efac"
}[p] || "#e2e8f0");

// ─── Shared Input Styles ───
const inputCls = "w-full bg-[#1a2e1a] border border-[#2d4a2d] rounded px-2 py-1 text-sm text-[#e8f5e9] focus:outline-none focus:border-[#4ade80] placeholder-[#4a6a4a] transition-colors";
const selectCls = "w-full bg-[#1a2e1a] border border-[#2d4a2d] rounded px-2 py-1 text-sm text-[#e8f5e9] focus:outline-none focus:border-[#4ade80] transition-colors";
const labelCls = "block text-xs text-[#86a986] mb-1 font-medium uppercase tracking-wide";
const cardCls = "bg-[#0f1f0f] border border-[#1e3a1e] rounded-xl p-4";
const btnPrimary = "bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer";
const btnSecondary = "bg-[#1a2e1a] hover:bg-[#243d24] border border-[#2d4a2d] text-[#86efac] text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer";
const btnDanger = "bg-[#3d1a1a] hover:bg-[#4d2020] border border-[#5a2a2a] text-[#fca5a5] text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer";

// ─── Stat Card ───
const StatCard = ({ label, value, sub }) => (
  <div className="bg-[#0a1a0a] border border-[#1e3a1e] rounded-xl p-4 flex flex-col gap-1">
    <span className="text-xs text-[#4a7a4a] uppercase tracking-widest font-medium">{label}</span>
    <span className="text-3xl font-bold text-[#4ade80] font-mono">{value ?? "—"}</span>
    {sub && <span className="text-xs text-[#4a7a4a]">{sub}</span>}
  </div>
);

// ═══════════════════════════════════════════════
// ROUND LOG
// ═══════════════════════════════════════════════
function RoundLog({ rounds, setRounds }) {
  const [form, setForm] = useState(emptyRound());
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const set = (k,v) => setForm(f => ({...f, [k]:v}));
  const net = (r) => r.gross !== "" && r.handicap !== "" ? Number(r.gross) - Number(r.handicap) : "";
  const plusMinus = (r) => r.gross !== "" && r.par ? Number(r.gross) - Number(r.par) : "";

  const save = () => {
    if (!form.date || !form.course) return;
    if (editId !== null) {
      setRounds(rs => rs.map(r => r.id === editId ? {...form, id: editId} : r));
      setEditId(null);
    } else {
      setRounds(rs => [...rs, {...form, id: Date.now()}]);
    }
    setForm(emptyRound());
  };

  const edit = (r) => { setForm({...r}); setEditId(r.id); };
  const del = (id) => setRounds(rs => rs.filter(r => r.id !== id));

  const pm = plusMinus(form);

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className={cardCls}>
        <h3 className="text-[#4ade80] font-bold text-sm uppercase tracking-widest mb-4">
          {editId ? "✏️ Edit Round" : "➕ Log New Round"}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[["date","Date","date"],["course","Course","text"],["par","Par","number"],["tee","",""]].map(([k,lbl,type]) =>
            k === "tee" ? (
              <div key={k}><label className={labelCls}>Tee</label>
                <select className={selectCls} value={form.tee} onChange={e=>set("tee",e.target.value)}>
                  <option value="">Select</option>{TEES.map(t=><option key={t}>{t}</option>)}
                </select></div>
            ) : (
              <div key={k}><label className={labelCls}>{lbl}</label>
                <input type={type} className={inputCls} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={lbl}/></div>
            )
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[["gross","Gross Score"],["putts","Total Putts"],["fairways","Fairways Hit"],["gir","GIR"]].map(([k,lbl])=>(
            <div key={k}><label className={labelCls}>{lbl}</label>
              <input type="number" className={inputCls} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder="0"/></div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[["penalties","Penalties"],["handicap","Handicap"],["rating","Course Rating"],["slope","Slope"]].map(([k,lbl])=>(
            <div key={k}><label className={labelCls}>{lbl}</label>
              <input type="number" className={inputCls} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder="—"/></div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div><label className={labelCls}>Weather</label>
            <select className={selectCls} value={form.weather} onChange={e=>set("weather",e.target.value)}>
              <option value="">Select</option>{WEATHERS.map(w=><option key={w}>{w}</option>)}
            </select></div>
          {[["bestHole","Best Hole"],["worstHole","Worst Hole"]].map(([k,lbl])=>(
            <div key={k}><label className={labelCls}>{lbl}</label>
              <input type="number" className={inputCls} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder="Hole #" min={1} max={18}/></div>
          ))}
          <div className="flex items-end gap-2">
            {form.gross && form.par ? (
              <div className="rounded-lg px-3 py-1.5 text-sm font-bold" style={{background: pm > 0 ? "#3d1a1a" : pm < 0 ? "#0a2a0a" : "#1a1a2a", color: pm > 0 ? "#fca5a5" : pm < 0 ? "#4ade80" : "#93c5fd"}}>
                {pm > 0 ? `+${pm}` : pm} {pm === 0 ? "E" : ""}
              </div>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {[["mistakes","Key Mistakes"],["wentWell","What Went Well"],["focus","Focus for Next Round"]].map(([k,lbl])=>(
            <div key={k}><label className={labelCls}>{lbl}</label>
              <textarea className={inputCls + " resize-none"} rows={2} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder="Notes..."/></div>
          ))}
        </div>
        <div className="flex gap-2">
          <button className={btnPrimary} onClick={save}>{editId ? "Update Round" : "Save Round"}</button>
          {editId && <button className={btnSecondary} onClick={()=>{setEditId(null);setForm(emptyRound());}}>Cancel</button>}
        </div>
      </div>

      {/* Rounds list */}
      <div className="space-y-2">
        {[...rounds].reverse().map(r => {
          const pm2 = plusMinus(r);
          const isOpen = expanded === r.id;
          return (
            <div key={r.id} className="bg-[#0a1a0a] border border-[#1e3a1e] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={()=>setExpanded(isOpen ? null : r.id)}>
                <div className="text-xs text-[#4a7a4a] w-24 shrink-0">{r.date}</div>
                <div className="flex-1 font-semibold text-[#e8f5e9] text-sm">{r.course || "—"}</div>
                <div className="text-xs text-[#4a7a4a] hidden md:block">Par {r.par}</div>
                {r.gross && <div className="font-mono font-bold text-lg text-[#e8f5e9]">{r.gross}</div>}
                {pm2 !== "" && (
                  <div className="text-sm font-bold px-2 py-0.5 rounded" style={{background: pm2>0?"#3d1a1a":pm2<0?"#0a2a0a":"#1a1a2a", color: pm2>0?"#fca5a5":pm2<0?"#4ade80":"#93c5fd"}}>
                    {pm2 > 0 ? `+${pm2}` : pm2 === 0 ? "E" : pm2}
                  </div>
                )}
                <span className="text-[#4a7a4a] text-xs">{isOpen ? "▲" : "▼"}</span>
              </div>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-[#1e3a1e] pt-3 space-y-3">
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                    {[["Putts",r.putts],["FWY",r.fairways],["GIR",r.gir],["Pen.",r.penalties],["HCP",r.handicap],["Net",net(r)]].map(([l,v])=>(
                      <div key={l} className="bg-[#1a2e1a] rounded p-2 text-center">
                        <div className="text-[#4a7a4a]">{l}</div>
                        <div className="font-bold text-[#e8f5e9]">{v || "—"}</div>
                      </div>
                    ))}
                  </div>
                  {(r.mistakes||r.wentWell||r.focus) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      {[["🚫 Mistakes",r.mistakes,"#3d1a1a","#fca5a5"],["✅ Went Well",r.wentWell,"#0a2a0a","#86efac"],["🎯 Focus Next",r.focus,"#1a1a0a","#fde68a"]].map(([l,v,bg,col])=>
                        v ? <div key={l} style={{background:bg,borderColor:col+"33"}} className="rounded p-2 border">
                          <div style={{color:col}} className="font-bold mb-1">{l}</div>
                          <div className="text-[#c8e6c9]">{v}</div>
                        </div> : null
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button className={btnSecondary} onClick={()=>edit(r)}>Edit</button>
                    <button className={btnDanger} onClick={()=>del(r.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {rounds.length === 0 && <div className="text-center text-[#4a7a4a] py-12 text-sm">No rounds logged yet. Add your first round above!</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// HOLE BY HOLE — per-round, fully saved
// ═══════════════════════════════════════════════
function HoleByHole({ rounds, holeData, setHoleData }) {
  // selectedRoundId: "new" or a round id
  const [selectedRoundId, setSelectedRoundId] = useState("new");
  const [newDate, setNewDate] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [saved, setSaved] = useState(false);

  // Current holes: either from saved data or blank
  const currentHoles = selectedRoundId === "new"
    ? (holeData["new"] || emptyRoundHoles())
    : (holeData[selectedRoundId] || emptyRoundHoles());

  const setHole = (i, k, v) => {
    setHoleData(prev => {
      const key = selectedRoundId;
      const existing = prev[key] || emptyRoundHoles();
      const updated = existing.map((h, j) => j === i ? {...h, [k]: v} : h);
      return {...prev, [key]: updated};
    });
    setSaved(false);
  };

  const holes = currentHoles;
  const totalStrokes = holes.reduce((s,h) => s + (Number(h.strokes)||0), 0);
  const totalPar     = holes.reduce((s,h) => s + (Number(h.par)||0), 0);
  const totalPutts   = holes.reduce((s,h) => s + (Number(h.putts)||0), 0);
  const totalBirdies = holes.filter(h => h.strokes && h.par && Number(h.strokes)-Number(h.par) <= -1).length;
  const totalBogeys  = holes.filter(h => h.strokes && h.par && Number(h.strokes)-Number(h.par) >= 1).length;

  const saveNewRound = () => {
    if (!newDate && !newCourse) return;
    const id = "hbh_" + Date.now();
    const holes = holeData["new"] || emptyRoundHoles();
    setHoleData(prev => {
      const next = {...prev, [id]: holes};
      delete next["new"];
      return next;
    });
    setSelectedRoundId(id);
    setNewDate("");
    setNewCourse("");
    setSaved(true);
  };

  const startNewRound = () => {
    setSelectedRoundId("new");
    setHoleData(prev => ({...prev, new: emptyRoundHoles()}));
    setSaved(false);
  };

  const deleteRound = (id) => {
    setHoleData(prev => { const next = {...prev}; delete next[id]; return next; });
    setSelectedRoundId("new");
  };

  // Saved rounds (keys starting with hbh_)
  const savedRounds = Object.keys(holeData)
    .filter(k => k !== "new" && k.startsWith("hbh_"))
    .map(k => {
      const hs = holeData[k];
      const firstHole = hs?.[0];
      return { id: k, holes: hs, label: firstHole?._label || k };
    });

  // Store label on first hole when saving
  const saveLabel = (id, label) => {
    setHoleData(prev => {
      const hs = [...(prev[id] || emptyRoundHoles())];
      hs[0] = {...hs[0], _label: label};
      return {...prev, [id]: hs};
    });
  };

  const roundLabel = (id) => {
    if (id === "new") return "New Round";
    const hs = holeData[id];
    return hs?.[0]?._label || id;
  };

  return (
    <div className="space-y-4">
      {/* Round selector */}
      <div className={cardCls}>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex-1 min-w-40">
            <label className={labelCls}>View / Edit Round</label>
            <select className={selectCls} value={selectedRoundId} onChange={e=>{ setSelectedRoundId(e.target.value); setSaved(false); }}>
              <option value="new">➕ New Round</option>
              {[...savedRounds].reverse().map(r => (
                <option key={r.id} value={r.id}>{roundLabel(r.id)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className={btnSecondary} onClick={startNewRound}>+ New Round</button>
            {selectedRoundId !== "new" && (
              <button className={btnDanger} onClick={()=>deleteRound(selectedRoundId)}>Delete Round</button>
            )}
          </div>
        </div>

        {selectedRoundId === "new" ? (
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-32"><label className={labelCls}>Date</label>
              <input type="date" className={inputCls} value={newDate} onChange={e=>setNewDate(e.target.value)}/></div>
            <div className="flex-1 min-w-40"><label className={labelCls}>Course</label>
              <input type="text" className={inputCls} value={newCourse} onChange={e=>setNewCourse(e.target.value)} placeholder="Course name"/></div>
            <button className={btnPrimary} onClick={() => {
              const label = `${newDate || "??"} · ${newCourse || "Unknown"}`;
              const id = "hbh_" + Date.now();
              setHoleData(prev => {
                const holes = prev["new"] || emptyRoundHoles();
                holes[0] = {...holes[0], _label: label};
                const next = {...prev, [id]: holes};
                delete next["new"];
                return next;
              });
              setSelectedRoundId(id);
              setNewDate(""); setNewCourse(""); setSaved(true);
            }}>Save & Name Round</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-[#4ade80]">📅 {roundLabel(selectedRoundId)}</div>
            {saved && <span className="text-xs text-[#4ade80] bg-[#0a2a0a] border border-[#1a4a1a] px-2 py-0.5 rounded-full">✓ Saved</span>}
          </div>
        )}
      </div>

      {/* Totals */}
      {totalStrokes > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Strokes" value={totalStrokes} sub={totalPar ? `Par ${totalPar}` : ""}/>
          <StatCard label="+/- Par" value={totalPar ? (totalStrokes-totalPar > 0 ? `+${totalStrokes-totalPar}` : totalStrokes-totalPar===0?"E":totalStrokes-totalPar) : "—"}/>
          <StatCard label="Putts" value={totalPutts || "—"}/>
          <StatCard label="Birdies" value={totalBirdies}/>
          <StatCard label="Bogeys+" value={totalBogeys}/>
        </div>
      )}

      {/* Hole rows */}
      <div className="space-y-2">
        {holes.map((h, i) => {
          if (i === 0 && h._label) return null; // skip label sentinel if rendered
          const diff = h.strokes && h.par ? Number(h.strokes)-Number(h.par) : "";
          const lbl = scoreLabel(diff);
          const lblCol = scoreLabelColor(diff);
          return (
            <div key={i} className="bg-[#0a1a0a] border border-[#1e3a1e] rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b border-[#1a2e1a]">
                <div className="col-span-1 text-center">
                  <div className="w-7 h-7 rounded-full bg-[#1a2e1a] flex items-center justify-center text-sm font-bold text-[#4ade80]">{h.hole}</div>
                </div>
                <div className="col-span-1">
                  <input type="number" className={inputCls+" text-center"} value={h.par} onChange={e=>setHole(i,"par",e.target.value)} placeholder="Par" min={3} max={5}/>
                </div>
                <div className="col-span-1">
                  <input type="number" className={inputCls+" text-center"} value={h.strokes} onChange={e=>setHole(i,"strokes",e.target.value)} placeholder="Shots" min={1}/>
                </div>
                <div className="col-span-2">
                  {lbl ? <div className="text-xs font-bold text-center rounded px-1 py-1" style={{background:lblCol+"22",color:lblCol,border:`1px solid ${lblCol}44`}}>{lbl}</div>
                  : <div className="text-xs text-[#4a7a4a] text-center">—</div>}
                </div>
                <div className="col-span-1">
                  <input type="number" className={inputCls+" text-center"} value={h.putts} onChange={e=>setHole(i,"putts",e.target.value)} placeholder="Putts" min={0}/>
                </div>
                <div className="col-span-2">
                  <select className={selectCls} value={h.clubTee} onChange={e=>setHole(i,"clubTee",e.target.value)}>
                    <option value="">Tee Club</option>{CLUBS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <select className={selectCls} value={h.clubApproach} onChange={e=>setHole(i,"clubApproach",e.target.value)}>
                    <option value="">App. Club</option>{CLUBS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-1">
                  {[["fir","FIR"],["gir_h","GIR"]].map(([k,l2])=>(
                    <select key={k} className={selectCls} value={h[k]} onChange={e=>setHole(i,k,e.target.value)}>
                      <option value="">{l2}</option><option>Y</option><option>N</option>
                    </select>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-3 py-2">
                {[["mistake","🚫 Mistake Made"],["thought","💭 Thought Process"],["reflection","🔁 Reflection"]].map(([k,pl])=>(
                  <textarea key={k} className={inputCls+" resize-none text-xs"} rows={2}
                    value={h[k]||""} onChange={e=>setHole(i,k,e.target.value)} placeholder={pl}/>
                ))}
              </div>
              <div className="px-3 pb-2">
                <select className={selectCls+" w-48 text-xs"} value={h.emotion||""} onChange={e=>setHole(i,"emotion",e.target.value)}>
                  <option value="">Emotion / Focus...</option>{EMOTIONS.map(e=><option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-[#4a7a4a] text-center">All changes save automatically · Hole · Par · Strokes · Score · Putts · Tee Club · App. Club · FIR · GIR</p>

      {/* Saved rounds list */}
      {savedRounds.length > 0 && (
        <div className={cardCls}>
          <h3 className="text-[#4ade80] font-bold text-xs uppercase tracking-widest mb-3">All Saved Rounds ({savedRounds.length})</h3>
          <div className="space-y-1">
            {[...savedRounds].reverse().map(r => {
              const hs = r.holes || [];
              const ts = hs.reduce((s,h)=>s+(Number(h.strokes)||0),0);
              const tp = hs.reduce((s,h)=>s+(Number(h.par)||0),0);
              return (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-[#1a2e1a] last:border-0">
                  <div className="flex-1 text-sm text-[#c8e6c9]">{roundLabel(r.id)}</div>
                  {ts > 0 && <div className="text-sm font-mono font-bold text-[#4ade80]">{ts}</div>}
                  {ts > 0 && tp > 0 && <div className="text-xs px-2 py-0.5 rounded font-bold" style={{background: ts-tp>0?"#3d1a1a":"#0a2a0a", color: ts-tp>0?"#fca5a5":"#4ade80"}}>{ts-tp>0?`+${ts-tp}`:ts-tp===0?"E":ts-tp}</div>}
                  <button className={btnSecondary} onClick={()=>setSelectedRoundId(r.id)}>View</button>
                  <button className={btnDanger} onClick={()=>deleteRound(r.id)}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// STATS DASHBOARD
// ═══════════════════════════════════════════════
function StatsDashboard({ rounds }) {
  const r = rounds.filter(r => r.gross);
  const withPutts = rounds.filter(r => r.putts);
  const withFwy = rounds.filter(r => r.fairways);
  const withGir = rounds.filter(r => r.gir);

  const avg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : null;
  const min = arr => arr.length ? Math.min(...arr) : null;

  const grossArr = r.map(x => Number(x.gross));
  const netArr = r.filter(x=>x.handicap).map(x => Number(x.gross)-Number(x.handicap));
  const pmArr = r.map(x => Number(x.gross)-Number(x.par));
  const puttArr = withPutts.map(x => Number(x.putts));
  const fwyArr = withFwy.map(x => Number(x.fairways));
  const girArr = withGir.map(x => Number(x.gir));
  const penArr = rounds.filter(r=>r.penalties).map(x=>Number(x.penalties));

  // Trend: last 5 vs previous 5
  const trend = (arr) => {
    if (arr.length < 6) return null;
    const last5 = arr.slice(-5).reduce((a,b)=>a+b,0)/5;
    const prev5 = arr.slice(-10,-5).reduce((a,b)=>a+b,0)/Math.min(5, arr.slice(-10,-5).length);
    return (last5 - prev5).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[#4ade80] font-bold text-xs uppercase tracking-widest mb-3">Scoring</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Rounds Played" value={r.length}/>
          <StatCard label="Best Gross" value={min(grossArr)} sub="all time"/>
          <StatCard label="Avg Gross" value={avg(grossArr)} sub={trend(grossArr) ? `Trend: ${trend(grossArr)>0?"+":""}${trend(grossArr)} (last 5)` : ""}/>
          <StatCard label="Avg +/- Par" value={avg(pmArr) ? (Number(avg(pmArr))>0?`+${avg(pmArr)}`:avg(pmArr)) : null}/>
        </div>
      </div>
      <div>
        <h3 className="text-[#4ade80] font-bold text-xs uppercase tracking-widest mb-3">Net Score</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Best Net" value={min(netArr)}/>
          <StatCard label="Avg Net" value={avg(netArr)}/>
          <StatCard label="Rounds w/ HCP" value={netArr.length}/>
        </div>
      </div>
      <div>
        <h3 className="text-[#4ade80] font-bold text-xs uppercase tracking-widest mb-3">Putting</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Avg Putts / Round" value={avg(puttArr)} sub="Tour avg: 29"/>
          <StatCard label="Best Putting Round" value={min(puttArr)}/>
          <StatCard label="Rounds Tracked" value={withPutts.length}/>
        </div>
      </div>
      <div>
        <h3 className="text-[#4ade80] font-bold text-xs uppercase tracking-widest mb-3">Accuracy</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Avg Fairways Hit" value={avg(fwyArr)} sub="per round"/>
          <StatCard label="Avg GIR" value={avg(girArr)} sub="scratch avg: 12"/>
          <StatCard label="Avg Penalties" value={avg(penArr)} sub="per round"/>
        </div>
      </div>

      {/* Score history mini chart */}
      {grossArr.length > 1 && (
        <div className={cardCls}>
          <h3 className="text-[#4ade80] font-bold text-xs uppercase tracking-widest mb-3">Score History</h3>
          <div className="flex items-end gap-1 h-20">
            {grossArr.slice(-20).map((g,i) => {
              const maxG = Math.max(...grossArr); const minG = Math.min(...grossArr);
              const range = maxG - minG || 1;
              const pct = (maxG - g) / range;
              const h = Math.max(8, Math.floor(pct * 64) + 8);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t" style={{height:`${h}px`, background: g <= minG ? "#4ade80" : "#2d4a2d"}}/>
                  <span className="text-[8px] text-[#4a7a4a]">{g}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#4a7a4a] mt-1">Last {Math.min(20,grossArr.length)} rounds · Taller bar = better score</p>
        </div>
      )}

      {rounds.length === 0 && <div className="text-center text-[#4a7a4a] py-12 text-sm">Log some rounds to see your stats here.</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════
// CLUB & MISTAKE LOG
// ═══════════════════════════════════════════════
function ClubMistakeLog({ mistakes, setMistakes }) {
  const [form, setForm] = useState(emptyMistake());
  const [editId, setEditId] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = () => {
    if (!form.date && !form.club && !form.mistakeType) return;
    if (editId !== null) {
      setMistakes(ms => ms.map(m => m.id===editId ? {...form,id:editId} : m));
      setEditId(null);
    } else {
      setMistakes(ms => [...ms, {...form, id: Date.now()}]);
    }
    setForm(emptyMistake());
  };
  const edit = (m) => { setForm({...m}); setEditId(m.id); };
  const del = (id) => setMistakes(ms => ms.filter(m=>m.id!==id));

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h3 className="text-[#4ade80] font-bold text-sm uppercase tracking-widest mb-4">
          {editId ? "✏️ Edit Entry" : "➕ Log Mistake / Club Issue"}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div><label className={labelCls}>Date</label><input type="date" className={inputCls} value={form.date} onChange={e=>set("date",e.target.value)}/></div>
          <div><label className={labelCls}>Course</label><input type="text" className={inputCls} value={form.course} onChange={e=>set("course",e.target.value)} placeholder="Course name"/></div>
          <div><label className={labelCls}>Hole #</label><input type="number" className={inputCls} value={form.hole} onChange={e=>set("hole",e.target.value)} placeholder="1–18" min={1} max={18}/></div>
          <div><label className={labelCls}>Club Used</label>
            <select className={selectCls} value={form.club} onChange={e=>set("club",e.target.value)}>
              <option value="">Select club</option>{CLUBS.map(c=><option key={c}>{c}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div><label className={labelCls}>Shot Type</label>
            <select className={selectCls} value={form.shotType} onChange={e=>set("shotType",e.target.value)}>
              <option value="">Select</option>{SHOT_TYPES.map(s=><option key={s}>{s}</option>)}
            </select></div>
          <div><label className={labelCls}>Mistake Type</label>
            <select className={selectCls} value={form.mistakeType} onChange={e=>set("mistakeType",e.target.value)}>
              <option value="">Select</option>{MISTAKE_TYPES.map(m=><option key={m}>{m}</option>)}
            </select></div>
          <div><label className={labelCls}>Outcome</label>
            <select className={selectCls} value={form.outcome} onChange={e=>set("outcome",e.target.value)}>
              <option value="">Select</option>{OUTCOMES.map(o=><option key={o}>{o}</option>)}
            </select></div>
          <div><label className={labelCls}>Priority</label>
            <select className={selectCls} value={form.priority} onChange={e=>set("priority",e.target.value)}>
              {PRIORITIES.map(p=><option key={p}>{p}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div><label className={labelCls}>Mistake / Issue</label>
            <textarea className={inputCls+" resize-none"} rows={2} value={form.issue} onChange={e=>set("issue",e.target.value)} placeholder="Describe the mistake in detail..."/></div>
          <div><label className={labelCls}>Correction to Try</label>
            <textarea className={inputCls+" resize-none"} rows={2} value={form.correction} onChange={e=>set("correction",e.target.value)} placeholder="What will you do differently?"/></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div><label className={labelCls}>Status</label>
            <select className={selectCls} value={form.status} onChange={e=>set("status",e.target.value)}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select></div>
          {form.status==="Fixed" && <div><label className={labelCls}>Resolved On</label>
            <input type="date" className={inputCls} value={form.resolvedOn} onChange={e=>set("resolvedOn",e.target.value)}/></div>}
        </div>
        <div className="flex gap-2">
          <button className={btnPrimary} onClick={save}>{editId ? "Update" : "Save Entry"}</button>
          {editId && <button className={btnSecondary} onClick={()=>{setEditId(null);setForm(emptyMistake());}}>Cancel</button>}
        </div>
      </div>

      <div className="space-y-2">
        {[...mistakes].reverse().map(m => (
          <div key={m.id} className="bg-[#0a1a0a] border border-[#1e3a1e] rounded-xl p-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs text-[#4a7a4a]">{m.date}</span>
              <span className="text-sm font-semibold text-[#e8f5e9]">{m.club || "—"}</span>
              {m.shotType && <span className="text-xs bg-[#1a2e1a] text-[#86efac] px-2 py-0.5 rounded-full">{m.shotType}</span>}
              {m.mistakeType && <span className="text-xs bg-[#1a1a2e] text-[#93c5fd] px-2 py-0.5 rounded-full">{m.mistakeType}</span>}
              {m.outcome && <span className="text-xs bg-[#2e1a1a] text-[#fca5a5] px-2 py-0.5 rounded-full">{m.outcome}</span>}
              <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto" style={{background:statusColor(m.status)+"22",color:statusColor(m.status)}}>{m.status}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{background:priorityColor(m.priority)+"22",color:priorityColor(m.priority)}}>{m.priority}</span>
            </div>
            {m.issue && <p className="text-xs text-[#c8e6c9] mb-1">🚫 {m.issue}</p>}
            {m.correction && <p className="text-xs text-[#86efac]">✅ {m.correction}</p>}
            <div className="flex gap-2 mt-2">
              <button className={btnSecondary} onClick={()=>edit(m)}>Edit</button>
              <button className={btnDanger} onClick={()=>del(m.id)}>Delete</button>
            </div>
          </div>
        ))}
        {mistakes.length === 0 && <div className="text-center text-[#4a7a4a] py-12 text-sm">No mistakes logged yet. Start tracking to spot patterns!</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MISTAKE SUMMARY
// ═══════════════════════════════════════════════
function MistakeSummary({ mistakes }) {
  const countBy = (arr, key) => arr.reduce((acc, x) => {
    const v = x[key]; if (v) acc[v] = (acc[v]||0)+1; return acc;
  }, {});

  const byClub = countBy(mistakes, "club");
  const byType = countBy(mistakes, "mistakeType");
  const byStatus = countBy(mistakes, "status");
  const byPriority = countBy(mistakes, "priority");
  const total = mistakes.length;

  const SummaryTable = ({ title, data, colorFn }) => {
    const sorted = Object.entries(data).sort((a,b)=>b[1]-a[1]);
    if (!sorted.length) return null;
    const max = sorted[0][1];
    return (
      <div className={cardCls}>
        <h3 className="text-[#4ade80] font-bold text-xs uppercase tracking-widest mb-3">{title}</h3>
        <div className="space-y-2">
          {sorted.map(([k,v]) => (
            <div key={k} className="flex items-center gap-2">
              <div className="text-xs text-[#c8e6c9] w-36 shrink-0 truncate">{k}</div>
              <div className="flex-1 bg-[#1a2e1a] rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${(v/max)*100}%`, background: colorFn ? colorFn(k) : "#4ade80"}}/>
              </div>
              <div className="text-xs font-bold text-[#4ade80] w-6 text-right">{v}</div>
              <div className="text-xs text-[#4a7a4a] w-8 text-right">{total ? `${Math.round(v/total*100)}%` : ""}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (mistakes.length === 0) return (
    <div className="text-center text-[#4a7a4a] py-16 text-sm">Log mistakes to see patterns here.</div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Logged" value={total}/>
        <StatCard label="Open Issues" value={byStatus["Open"]||0} sub="need attention"/>
        <StatCard label="Recurring" value={byStatus["Recurring"]||0} sub="keep happening"/>
        <StatCard label="Fixed" value={byStatus["Fixed"]||0} sub="resolved"/>
      </div>
      <SummaryTable title="Most Problematic Clubs" data={byClub}/>
      <SummaryTable title="Mistakes by Type" data={byType}/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryTable title="By Status" data={byStatus} colorFn={statusColor}/>
        <SummaryTable title="By Priority" data={byPriority} colorFn={priorityColor}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════
export default function GolfTracker() {
  const [tab, setTab] = useState(0);
  const [rounds, setRounds] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [holeData, setHoleData] = useState({}); // key: round id, value: holes array

  // Persist to localStorage
  useEffect(() => {
    try {
      const r = localStorage.getItem("golf_rounds");
      if (r) setRounds(JSON.parse(r));
    } catch {}
    try {
      const m = localStorage.getItem("golf_mistakes");
      if (m) setMistakes(JSON.parse(m));
    } catch {}
    try {
      const h = localStorage.getItem("golf_hole_data");
      if (h) setHoleData(JSON.parse(h));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("golf_rounds", JSON.stringify(rounds)); } catch {}
  }, [rounds]);

  useEffect(() => {
    try { localStorage.setItem("golf_mistakes", JSON.stringify(mistakes)); } catch {}
  }, [mistakes]);

  useEffect(() => {
    try { localStorage.setItem("golf_hole_data", JSON.stringify(holeData)); } catch {}
  }, [holeData]);

  const tabIcons = ["📋","⛳","📊","🏌️","📈"];

  return (
    <div className="min-h-screen bg-[#060e06] text-[#e8f5e9]" style={{fontFamily:"'DM Sans', 'Segoe UI', sans-serif"}}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a1f0a] to-[#061406] border-b border-[#1e3a1e] px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#4ade80] tracking-tight">⛳ Golf Performance Tracker</h1>
            <p className="text-xs text-[#4a7a4a] mt-0.5">Track · Analyse · Improve</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-[#e8f5e9]">{rounds.length} rounds</div>
            <div className="text-xs text-[#4a7a4a]">{mistakes.length} mistakes logged</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#0a1a0a] border-b border-[#1e3a1e] px-4 overflow-x-auto">
        <div className="max-w-5xl mx-auto flex gap-1 py-2">
          {TABS.map((t,i) => (
            <button key={i} onClick={()=>setTab(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                tab===i ? "bg-[#16a34a] text-white" : "text-[#4a7a4a] hover:text-[#86efac] hover:bg-[#1a2e1a]"
              }`}>
              <span>{tabIcons[i]}</span><span>{t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab===0 && <RoundLog rounds={rounds} setRounds={setRounds}/>}
        {tab===1 && <HoleByHole rounds={rounds} holeData={holeData} setHoleData={setHoleData}/>}
        {tab===2 && <StatsDashboard rounds={rounds}/>}
        {tab===3 && <ClubMistakeLog mistakes={mistakes} setMistakes={setMistakes}/>}
        {tab===4 && <MistakeSummary mistakes={mistakes}/>}
      </div>
    </div>
  );
}
