import React, { useState, useEffect, useMemo, useRef } from "react";
import { Clock, MapPin, Bell, Calendar, Plus, X, BookOpen, AlertCircle } from "lucide-react";
import { storage } from "./storage.js";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// colores
const BG = "#10141a";
const SURFACE = "#1a2029";
const SURFACE2 = "#222a35";
const TEXT = "#eef1f5";
const SUBTEXT = "#8b96a5";
const LINE = "#2c3543";
const ACCENT = "#ff6b35";
const STUDY_COLOR = "#4f9dde";

// horarios de los bloques de la USM (cada bloque dura 35 min)
const USM_BLOCKS = [
  { n: 1, start: "08:15", end: "08:50" },
  { n: 2, start: "08:50", end: "09:25" },
  { n: 3, start: "09:40", end: "10:15" },
  { n: 4, start: "10:15", end: "10:50" },
  { n: 5, start: "11:05", end: "11:40" },
  { n: 6, start: "11:40", end: "12:15" },
  { n: 7, start: "12:30", end: "13:05" },
  { n: 8, start: "13:05", end: "13:40" },
  { n: 9, start: "14:40", end: "15:15" },
  { n: 10, start: "15:15", end: "15:50" },
  { n: 11, start: "16:05", end: "16:40" },
  { n: 12, start: "16:40", end: "17:15" },
  { n: 13, start: "17:30", end: "18:05" },
  { n: 14, start: "18:05", end: "18:40" },
  { n: 15, start: "18:55", end: "19:30" },
  { n: 16, start: "19:30", end: "20:05" },
  { n: 17, start: "20:20", end: "20:55" },
  { n: 18, start: "20:55", end: "21:30" },
  { n: 19, start: "21:45", end: "22:20" },
  { n: 20, start: "22:20", end: "22:55" },
];

function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function blocksForClass(c) {
  const startIdx = USM_BLOCKS.findIndex((b) => b.start === c.start);
  const endIdx = USM_BLOCKS.findIndex((b) => b.end === c.end);
  if (startIdx === -1 || endIdx === -1) return [];
  const blocks = [];
  for (let i = startIdx; i <= endIdx; i++) blocks.push(USM_BLOCKS[i].n);
  return blocks;
}

export default function CampusApp() {
  const [classes, setClasses] = useState(null);
  const [evals, setEvals] = useState(null);
  const [studySessions, setStudySessions] = useState(null);
  const [now, setNow] = useState(new Date());
  const [view, setView] = useState("home");
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddEval, setShowAddEval] = useState(false);
  const [showAddStudy, setShowAddStudy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [notified, setNotified] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const c = await storage.get("classes");
        setClasses(c ? JSON.parse(c.value) : []);
      } catch { setClasses([]); }
      try {
        const e = await storage.get("evals");
        setEvals(e ? JSON.parse(e.value) : []);
      } catch { setEvals([]); }
      try {
        const s = await storage.get("studySessions");
        setStudySessions(s ? JSON.parse(s.value) : []);
      } catch { setStudySessions([]); }
      try {
        const n = await storage.get("notified");
        setNotified(n ? JSON.parse(n.value) : {});
      } catch { setNotified({}); }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded || classes === null) return;
    storage.set("classes", JSON.stringify(classes)).catch(() => {});
  }, [classes, loaded]);

  useEffect(() => {
    if (!loaded || evals === null) return;
    storage.set("evals", JSON.stringify(evals)).catch(() => {});
  }, [evals, loaded]);

  useEffect(() => {
    if (!loaded || studySessions === null) return;
    storage.set("studySessions", JSON.stringify(studySessions)).catch(() => {});
  }, [studySessions, loaded]);

  useEffect(() => {
    if (!loaded) return;
    storage.set("notified", JSON.stringify(notified)).catch(() => {});
  }, [notified, loaded]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!loaded || evals === null || notifPermission !== "granted") return;
    const checkAndNotify = () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      evals.forEach((ev) => {
        const diffDays = Math.round(
          (new Date(ev.date + "T00:00:00") - new Date(todayStr + "T00:00:00")) / 86400000
        );
        [7, 3, 1, 0].forEach((m) => {
          const key = `${ev.id}-${m}-${todayStr}`;
          if (diffDays === m && !notified[key]) {
            const body = m === 0 ? `Hoy: ${ev.subject} — ${ev.title}`
              : m === 1 ? `Mañana: ${ev.subject} — ${ev.title}`
              : `En ${m} días: ${ev.subject} — ${ev.title}`;
            try { new Notification("Recordatorio académico", { body, tag: key }); } catch {}
            setNotified((prev) => ({ ...prev, [key]: true }));
          }
        });
      });
    };
    checkAndNotify();
    const id = setInterval(checkAndNotify, 60000);
    return () => clearInterval(id);
  }, [loaded, evals, notifPermission, notified]);

  useEffect(() => {
    if (!loaded || studySessions === null || notifPermission !== "granted") return;
    const checkStudy = () => {
      const today = new Date();
      const dayIdx = (today.getDay() + 6) % 7;
      const nowMin = today.getHours() * 60 + today.getMinutes();
      const dateStr = today.toISOString().slice(0, 10);
      studySessions.forEach((s) => {
        if (s.day !== dayIdx) return;
        const minutesUntil = timeToMinutes(s.start) - nowMin;
        const key = `study-${s.id}-${dateStr}`;
        if (minutesUntil >= 0 && minutesUntil <= 15 && !notified[key]) {
          const body = s.description ? `${s.subject} a las ${s.start} — ${s.description}` : `${s.subject} a las ${s.start}`;
          try { new Notification("Sesión de estudio", { body, tag: key }); } catch {}
          setNotified((prev) => ({ ...prev, [key]: true }));
        }
      });
    };
    checkStudy();
    const id = setInterval(checkStudy, 60000);
    return () => clearInterval(id);
  }, [loaded, studySessions, notifPermission, notified]);

  const requestNotifications = () => {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then(setNotifPermission);
  };

  const todayIdx = (now.getDay() + 6) % 7;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const nextClass = useMemo(() => {
    if (!classes) return null;
    for (let offset = 0; offset < 7; offset++) {
      const dayIdx = (todayIdx + offset) % 7;
      if (dayIdx > 5) continue;
      const dayClasses = classes
        .filter((c) => c.day === dayIdx)
        .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
      for (const c of dayClasses) {
        if (offset === 0 && timeToMinutes(c.start) <= nowMinutes) continue;
        return { ...c, daysFromNow: offset };
      }
    }
    return null;
  }, [classes, todayIdx, nowMinutes]);

  const currentClass = useMemo(() => {
    if (!classes) return null;
    return classes.find(
      (c) => c.day === todayIdx && timeToMinutes(c.start) <= nowMinutes && nowMinutes < timeToMinutes(c.end)
    );
  }, [classes, todayIdx, nowMinutes]);

  const upcomingEvals = useMemo(() => {
    if (!evals) return [];
    const todayStr = now.toISOString().slice(0, 10);
    return evals
      .map((ev) => ({ ...ev, diff: Math.round((new Date(ev.date + "T00:00:00") - new Date(todayStr + "T00:00:00")) / 86400000) }))
      .filter((ev) => ev.diff >= 0 && ev.diff <= 14)
      .sort((a, b) => a.diff - b.diff);
  }, [evals, now]);

  const addClass = (data) => { setClasses((prev) => [...prev, { ...data, id: uid() }]); setShowAddClass(false); };
  const addEval = (data) => { setEvals((prev) => [...prev, { ...data, id: uid() }]); setShowAddEval(false); };
  const addStudy = (data) => { setStudySessions((prev) => [...prev, { ...data, id: uid() }]); setShowAddStudy(false); };
  const removeClass = (id) => setClasses((prev) => prev.filter((c) => c.id !== id));
  const removeEval = (id) => setEvals((prev) => prev.filter((e) => e.id !== id));
  const removeStudy = (id) => setStudySessions((prev) => prev.filter((s) => s.id !== id));

  if (!loaded || classes === null || evals === null || studySessions === null) {
    return (
      <div style={{ ...styles.app, alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: SUBTEXT, fontFamily: "system-ui" }}>Cargando…</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <header style={styles.header}>
        <div>
          <div style={styles.brandEyebrow}>USM</div>
          <div style={styles.brandName}>Asistente USM</div>
        </div>
        <div style={styles.clock}>
          {DAY_SHORT[todayIdx]} · {minutesToLabel(nowMinutes)}
        </div>
      </header>

      <main style={styles.main}>
        {view === "home" && (
          <Home
            currentClass={currentClass}
            nextClass={nextClass}
            upcomingEvals={upcomingEvals}
            notifPermission={notifPermission}
            requestNotifications={requestNotifications}
            todayIdx={todayIdx}
          />
        )}
        {view === "schedule" && (
          <ScheduleView classes={classes} studySessions={studySessions} todayIdx={todayIdx} onRemove={removeClass} />
        )}
        {view === "evals" && <EvalsView evals={evals} now={now} onRemove={removeEval} />}
        {view === "study" && <StudyView studySessions={studySessions} todayIdx={todayIdx} onRemove={removeStudy} />}
      </main>

      <nav style={styles.nav}>
        <NavButton active={view === "home"} onClick={() => setView("home")} icon={<Clock size={20} />} label="Ahora" />
        <NavButton active={view === "schedule"} onClick={() => setView("schedule")} icon={<Calendar size={20} />} label="Horario" />
        <NavButton active={view === "evals"} onClick={() => setView("evals")} icon={<AlertCircle size={20} />} label="Evaluaciones" />
        <NavButton active={view === "study"} onClick={() => setView("study")} icon={<BookOpen size={20} />} label="Estudio" />
      </nav>

      {showAddClass && <AddClassModal onSave={addClass} onClose={() => setShowAddClass(false)} />}
      {showAddEval && <AddEvalModal onSave={addEval} onClose={() => setShowAddEval(false)} />}
      {showAddStudy && <AddStudyModal onSave={addStudy} onClose={() => setShowAddStudy(false)} />}

      {view === "schedule" && !showAddClass && (
        <button style={styles.fab} onClick={() => setShowAddClass(true)}><Plus size={24} color={BG} /></button>
      )}
      {view === "evals" && !showAddEval && (
        <button style={styles.fab} onClick={() => setShowAddEval(true)}><Plus size={24} color={BG} /></button>
      )}
      {view === "study" && !showAddStudy && (
        <button style={{ ...styles.fab, background: STUDY_COLOR }} onClick={() => setShowAddStudy(true)}><Plus size={24} color={BG} /></button>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{ ...styles.navButton, color: active ? ACCENT : SUBTEXT }}>
      {icon}
      <span style={{ fontSize: 11, marginTop: 4 }}>{label}</span>
      {active && <div style={styles.navIndicator} />}
    </button>
  );
}

function Home({ currentClass, nextClass, upcomingEvals, notifPermission, requestNotifications, todayIdx }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {currentClass ? (
        <div style={{ ...styles.heroCard, borderColor: ACCENT }}>
          <div style={styles.heroEyebrow}><span style={styles.liveDot} />En curso ahora</div>
          <div style={styles.heroTitle}>{currentClass.subject}</div>
          <div style={styles.heroMeta}>
            <span style={styles.metaItem}><Clock size={14} /> {currentClass.start} – {currentClass.end}</span>
            <span style={styles.metaItem}><MapPin size={14} /> {currentClass.room || "Sin sala"}</span>
          </div>
        </div>
      ) : (
        <div style={styles.heroCard}>
          <div style={styles.heroEyebrow}>Próxima clase</div>
          {nextClass ? (
            <>
              <div style={styles.heroTitle}>{nextClass.subject}</div>
              <div style={styles.heroMeta}>
                <span style={styles.metaItem}><Clock size={14} /> {nextClass.start} – {nextClass.end}</span>
                <span style={styles.metaItem}><MapPin size={14} /> {nextClass.room || "Sin sala"}</span>
              </div>
              <div style={styles.heroSub}>
                {nextClass.daysFromNow === 0 ? "Hoy" : nextClass.daysFromNow === 1 ? "Mañana" : DAYS[(todayIdx + nextClass.daysFromNow) % 7]}
              </div>
            </>
          ) : (
            <div style={styles.heroSub}>No tienes más clases agendadas. Agrega tu horario en la pestaña Horario.</div>
          )}
        </div>
      )}

      {notifPermission !== "granted" && (
        <button onClick={requestNotifications} style={styles.notifBanner}>
          <Bell size={18} />
          <div style={{ textAlign: "left", flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Activar avisos de evaluaciones</div>
            <div style={{ fontSize: 12, color: SUBTEXT }}>Recibe alertas mientras tengas la app abierta</div>
          </div>
        </button>
      )}

      <div>
        <div style={styles.sectionLabel}>Próximo</div>
        {upcomingEvals.length === 0 ? (
          <div style={styles.emptyCard}>Sin controles ni certámenes próximos.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingEvals.map((ev) => (
              <div key={ev.id} style={styles.evalRow}>
                <div style={{ ...styles.countBadge, background: ev.diff <= 1 ? ACCENT : SURFACE2, color: ev.diff <= 1 ? BG : TEXT }}>
                  {ev.diff === 0 ? "Hoy" : ev.diff === 1 ? "1d" : `${ev.diff}d`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{ev.subject}</div>
                  <div style={{ fontSize: 12, color: SUBTEXT }}>
                    {ev.title} · {new Date(ev.date + "T00:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function ScheduleView({ classes, studySessions, todayIdx, onRemove }) {
  const [mode, setMode] = useState("grid");
  const [selectedDay, setSelectedDay] = useState(todayIdx > 5 ? 0 : todayIdx);

  const dayClasses = classes
    .filter((c) => c.day === selectedDay)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={styles.toggleRow}>
        <button onClick={() => setMode("grid")} style={{ ...styles.toggleBtn, background: mode === "grid" ? SURFACE2 : "transparent", color: mode === "grid" ? TEXT : SUBTEXT }}>Semana</button>
        <button onClick={() => setMode("list")} style={{ ...styles.toggleBtn, background: mode === "list" ? SURFACE2 : "transparent", color: mode === "list" ? TEXT : SUBTEXT }}>Lista</button>
      </div>

      {mode === "list" && (
        <div style={styles.dayPicker}>
          {DAY_SHORT.map((d, i) => (
            <button key={d} onClick={() => setSelectedDay(i)} style={{ ...styles.dayPill, background: selectedDay === i ? ACCENT : "transparent", color: selectedDay === i ? BG : TEXT, fontWeight: i === todayIdx ? 700 : 500, borderColor: i === todayIdx && selectedDay !== i ? ACCENT : LINE }}>
              {d}
            </button>
          ))}
        </div>
      )}

      {mode === "list" ? (
        dayClasses.length === 0 ? (
          <div style={styles.emptyCard}>No hay clases este día. Toca el botón + para agregar una.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dayClasses.map((c) => (
              <div key={c.id} style={styles.classRow}>
                <div style={styles.classTime}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.start}</div>
                  <div style={{ fontSize: 11, color: SUBTEXT }}>{c.end}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.subject}</div>
                  <div style={{ fontSize: 12, color: SUBTEXT, display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={12} /> {c.room || "Sin sala"}
                  </div>
                </div>
                <button onClick={() => onRemove(c.id)} style={styles.iconBtn}><X size={16} /></button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div style={styles.gridWrap}>
          <div style={styles.gridScroll}>
            <div style={{ display: "grid", gridTemplateColumns: `28px repeat(6, 1fr)`, minWidth: 28 + 6 * 60 }}>
              <div style={{ height: 32 }} />
              {DAY_SHORT.map((d, dayIdx) => (
                <div key={d} style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: dayIdx === todayIdx ? 700 : 500, color: dayIdx === todayIdx ? ACCENT : SUBTEXT, borderBottom: `1px solid ${LINE}` }}>
                  {d}
                </div>
              ))}
              {USM_BLOCKS.map((b) => (
                <React.Fragment key={b.n}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: SUBTEXT, fontWeight: 600, height: 28, borderTop: `1px solid ${LINE}` }}>
                    {b.n}
                  </div>
                  {Array.from({ length: 6 }).map((_, dayIdx) => {
                    const c = classes.find((cl) => cl.day === dayIdx && blocksForClass(cl).includes(b.n));
                    const s = !c && studySessions.find((st) => st.day === dayIdx && blocksForClass(st).includes(b.n));
                    const item = c || s;
                    const isStudy = !c && !!s;
                    const blocks = item ? blocksForClass(item) : [];
                    const isFirst = item && blocks[0] === b.n;
                    if (item && !isFirst) return null;
                    const itemColor = isStudy ? STUDY_COLOR : ACCENT;
                    return (
                      <div key={dayIdx} style={{ gridRow: item ? `span ${blocks.length}` : "span 1", borderTop: `1px solid ${LINE}`, borderLeft: `1px solid ${LINE}`, height: item ? 28 * blocks.length : 28, padding: item ? "3px 5px" : 0, background: item ? SURFACE2 : "transparent", borderLeftWidth: item ? 3 : 1, borderLeftColor: item ? itemColor : LINE, borderLeftStyle: "solid", overflow: "hidden" }}>
                        {item && (
                          <>
                            <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.2, color: TEXT }}>{item.subject}</div>
                            {blocks.length > 1 && <div style={{ fontSize: 9, color: SUBTEXT, marginTop: 2 }}>{isStudy ? "Estudio" : (item.room || "—")}</div>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EvalsView({ evals, now, onRemove }) {
  const sorted = [...evals].sort((a, b) => new Date(a.date) - new Date(b.date));
  const todayStr = now.toISOString().slice(0, 10);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={styles.sectionLabel}>Controles y certámenes</div>
      {sorted.length === 0 ? (
        <div style={styles.emptyCard}>No tienes evaluaciones registradas. Agrega una con el botón +.</div>
      ) : (
        sorted.map((ev) => (
          <div key={ev.id} style={{ ...styles.evalCard, opacity: ev.date < todayStr ? 0.4 : 1 }}>
            <BookOpen size={18} color={ACCENT} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{ev.subject}</div>
              <div style={{ fontSize: 13, color: TEXT }}>{ev.title}</div>
              <div style={{ fontSize: 12, color: SUBTEXT }}>
                {new Date(ev.date + "T00:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              {ev.description && <div style={{ fontSize: 12, color: SUBTEXT, marginTop: 4, lineHeight: 1.4 }}>{ev.description}</div>}
            </div>
            <button onClick={() => onRemove(ev.id)} style={styles.iconBtn}><X size={16} /></button>
          </div>
        ))
      )}
    </div>
  );
}

function StudyView({ studySessions, todayIdx, onRemove }) {
  const sorted = [...studySessions].sort((a, b) => a.day !== b.day ? a.day - b.day : timeToMinutes(a.start) - timeToMinutes(b.start));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={styles.sectionLabel}>Sesiones de estudio</div>
      {sorted.length === 0 ? (
        <div style={styles.emptyCard}>No tienes sesiones de estudio agendadas. Agrega una con el botón +.</div>
      ) : (
        sorted.map((s) => (
          <div key={s.id} style={styles.evalCard}>
            <BookOpen size={18} color={STUDY_COLOR} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.subject}</div>
              <div style={{ fontSize: 12, color: s.day === todayIdx ? STUDY_COLOR : SUBTEXT, fontWeight: s.day === todayIdx ? 700 : 400 }}>
                {DAYS[s.day]} · {s.start} – {s.end}
              </div>
              {s.description && <div style={{ fontSize: 12, color: SUBTEXT, marginTop: 4, lineHeight: 1.4 }}>{s.description}</div>}
            </div>
            <button onClick={() => onRemove(s.id)} style={styles.iconBtn}><X size={16} /></button>
          </div>
        ))
      )}
    </div>
  );
}

function BlockGrid({ day, selectedBlocks, onToggle, accentColor }) {
  return (
    <div style={styles.blockGridWrap}>
      <div style={styles.blockGridScroll}>
        <div style={{ display: "grid", gridTemplateColumns: `36px repeat(6, 1fr)`, minWidth: 36 + 6 * 56 }}>
          <div style={{ height: 24 }} />
          {DAY_SHORT.map((d) => <div key={d} style={styles.blockGridDayHeader}>{d}</div>)}
          {USM_BLOCKS.map((b) => (
            <React.Fragment key={b.n}>
              <div style={styles.blockGridNum}>{b.n}</div>
              {DAY_SHORT.map((d, dayIdx) => {
                const isSelected = day === dayIdx && selectedBlocks.includes(b.n);
                const isDisabled = day !== null && day !== dayIdx;
                return (
                  <button key={dayIdx} type="button" onClick={() => onToggle(dayIdx, b.n)}
                    style={{ ...styles.blockGridCell, background: isSelected ? accentColor : SURFACE2, opacity: isDisabled ? 0.35 : 1 }}
                    aria-label={`${d} bloque ${b.n}`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}


function rangeFromBlocks(selectedBlocks) {
  if (selectedBlocks.length === 0) return null;
  for (let i = 1; i < selectedBlocks.length; i++) {
    if (selectedBlocks[i] !== selectedBlocks[i - 1] + 1) return "non-contiguous";
  }
  const first = USM_BLOCKS[selectedBlocks[0] - 1];
  const last = USM_BLOCKS[selectedBlocks[selectedBlocks.length - 1] - 1];
  return { start: first.start, end: last.end };
}

function BlockHint({ day, selectedBlocks, range }) {
  if (range === "non-contiguous") return <div style={styles.blockHint}><span style={{ color: ACCENT }}>Los bloques deben ser consecutivos.</span></div>;
  if (range) return <div style={styles.blockHint}>{DAYS[day]} · Bloque{selectedBlocks.length > 1 ? "s" : ""} {selectedBlocks.join("-")} · {range.start} – {range.end}</div>;
  return <div style={styles.blockHint}>Toca las celdas de la grilla para marcar tu horario.</div>;
}

function AddClassModal({ onSave, onClose }) {
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");
  const [day, setDay] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [error, setError] = useState("");

  const toggleBlock = (dayIdx, blockN) => {
    if (day !== null && day !== dayIdx) { setDay(dayIdx); setSelectedBlocks([blockN]); return; }
    setDay(dayIdx);
    setSelectedBlocks(selectedBlocks.includes(blockN)
      ? selectedBlocks.filter((b) => b !== blockN)
      : [...selectedBlocks, blockN].sort((a, b) => a - b));
  };

  const range = rangeFromBlocks(selectedBlocks);

  const save = () => {
    if (!subject.trim()) { setError("Escribe el nombre del ramo."); return; }
    if (day === null || selectedBlocks.length === 0) { setError("Selecciona al menos un bloque en la grilla."); return; }
    if (range === "non-contiguous") { setError("Los bloques seleccionados deben ser consecutivos."); return; }
    onSave({ subject: subject.trim(), room: room.trim(), day, start: range.start, end: range.end });
  };

  return (
    <Modal title="Agregar clase" onClose={onClose}>
      <Field label="Ramo / asignatura"><input style={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej. MAT070" autoFocus /></Field>
      <Field label="Sala"><input style={styles.input} value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Ej. M-101" /></Field>
      <Field label="Selecciona bloque(s) y día">
        <BlockGrid day={day} selectedBlocks={selectedBlocks} onToggle={toggleBlock} accentColor={ACCENT} />
        <BlockHint day={day} selectedBlocks={selectedBlocks} range={range} />
      </Field>
      {error && <div style={styles.errorText}>{error}</div>}
      <button style={styles.primaryBtn} onClick={save}>Guardar clase</button>
    </Modal>
  );
}

function AddStudyModal({ onSave, onClose }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [day, setDay] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [error, setError] = useState("");

  const toggleBlock = (dayIdx, blockN) => {
    if (day !== null && day !== dayIdx) { setDay(dayIdx); setSelectedBlocks([blockN]); return; }
    setDay(dayIdx);
    setSelectedBlocks(selectedBlocks.includes(blockN)
      ? selectedBlocks.filter((b) => b !== blockN)
      : [...selectedBlocks, blockN].sort((a, b) => a - b));
  };

  const range = rangeFromBlocks(selectedBlocks);

  const save = () => {
    if (!subject.trim()) { setError("Escribe qué vas a estudiar."); return; }
    if (day === null || selectedBlocks.length === 0) { setError("Selecciona al menos un bloque en la grilla."); return; }
    if (range === "non-contiguous") { setError("Los bloques seleccionados deben ser consecutivos."); return; }
    onSave({ subject: subject.trim(), description: description.trim(), day, start: range.start, end: range.end });
  };

  return (
    <Modal title="Agregar sesión de estudio" onClose={onClose}>
      <Field label="Materia / tema"><input style={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej. Repasar Cálculo II" autoFocus /></Field>
      <Field label="Selecciona bloque(s) y día">
        <BlockGrid day={day} selectedBlocks={selectedBlocks} onToggle={toggleBlock} accentColor={STUDY_COLOR} />
        <BlockHint day={day} selectedBlocks={selectedBlocks} range={range} />
      </Field>
      <Field label="Descripción (opcional)">
        <textarea style={{ ...styles.input, resize: "vertical", minHeight: 70, fontFamily: "inherit" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Resolver guía de ejercicios..." />
      </Field>
      {error && <div style={styles.errorText}>{error}</div>}
      <button style={{ ...styles.primaryBtn, background: STUDY_COLOR }} onClick={save}>Guardar sesión</button>
    </Modal>
  );
}

function AddEvalModal({ onSave, onClose }) {
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const save = () => {
    if (!subject.trim() || !title.trim()) { setError("Completa el ramo y el tipo de evaluación."); return; }
    onSave({ subject: subject.trim(), title: title.trim(), date, description: description.trim() });
  };

  return (
    <Modal title="Agregar evaluación" onClose={onClose}>
      <Field label="Ramo / asignatura"><input style={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej. Cálculo II" autoFocus /></Field>
      <Field label="Tipo"><input style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Certamen 1, Control 3" /></Field>
      <Field label="Fecha"><input type="date" style={styles.input} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Descripción (opcional)">
        <textarea style={{ ...styles.input, resize: "vertical", minHeight: 70, fontFamily: "inherit" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Entran materias 1 a 4, traer calculadora..." />
      </Field>
      {error && <div style={styles.errorText}>{error}</div>}
      <button style={styles.primaryBtn} onClick={save}>Guardar evaluación</button>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={styles.iconBtn}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const styles = {
  app: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: BG, color: TEXT, minHeight: "100vh", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", position: "relative" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "20px 18px 14px", borderBottom: `1px solid ${LINE}` },
  brandEyebrow: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 2 },
  brandName: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" },
  clock: { fontSize: 13, color: SUBTEXT, fontVariantNumeric: "tabular-nums" },
  main: { flex: 1, padding: "16px 16px 90px", overflowY: "auto" },
  nav: { position: "sticky", bottom: 0, display: "flex", background: SURFACE, borderTop: `1px solid ${LINE}`, padding: "8px 0 calc(8px + env(safe-area-inset-bottom))" },
  navButton: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", background: "none", border: "none", padding: "6px 0", cursor: "pointer", position: "relative", fontFamily: "inherit" },
  navIndicator: { position: "absolute", top: -8, width: 24, height: 3, borderRadius: 2, background: ACCENT },
  heroCard: { background: SURFACE, border: `1px solid ${LINE}`, borderLeft: `4px solid ${LINE}`, borderRadius: 12, padding: 18 },
  heroEyebrow: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: SUBTEXT, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: "50%", background: ACCENT, display: "inline-block", animation: "pulse 1.6s ease-in-out infinite" },
  heroTitle: { fontSize: 22, fontWeight: 800, marginBottom: 10, letterSpacing: "-0.01em" },
  heroMeta: { display: "flex", gap: 16, flexWrap: "wrap" },
  metaItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: SUBTEXT },
  heroSub: { marginTop: 8, fontSize: 13, color: SUBTEXT, lineHeight: 1.5 },
  sectionLabel: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: SUBTEXT, fontWeight: 700, marginBottom: 10 },
  emptyCard: { background: SURFACE, border: `1px dashed ${LINE}`, borderRadius: 10, padding: 16, fontSize: 13, color: SUBTEXT, lineHeight: 1.5 },
  evalRow: { display: "flex", alignItems: "center", gap: 12, background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 10, padding: 12 },
  countBadge: { flexShrink: 0, width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 },
  notifBanner: { display: "flex", alignItems: "center", gap: 12, background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, color: TEXT, cursor: "pointer", textAlign: "left", fontFamily: "inherit" },
  toggleRow: { display: "flex", gap: 6, background: SURFACE, borderRadius: 10, padding: 4, border: `1px solid ${LINE}` },
  toggleBtn: { flex: 1, padding: "8px 0", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  dayPicker: { display: "flex", gap: 6, overflowX: "auto" },
  dayPill: { padding: "6px 12px", borderRadius: 20, border: `1px solid ${LINE}`, fontSize: 12, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 },
  classRow: { display: "flex", alignItems: "center", gap: 12, background: SURFACE, border: `1px solid ${LINE}`, borderLeft: `3px solid ${ACCENT}`, borderRadius: 8, padding: 12 },
  classTime: { width: 48, flexShrink: 0, textAlign: "left" },
  evalCard: { display: "flex", gap: 12, background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 10, padding: 12 },
  gridWrap: { background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden" },
  gridScroll: { overflowX: "auto" },
  iconBtn: { background: "none", border: "none", color: SUBTEXT, cursor: "pointer", padding: 4, display: "flex", alignItems: "center" },
  fab: { position: "fixed", bottom: "calc(80px + env(safe-area-inset-bottom))", right: 18, width: 52, height: 52, borderRadius: "50%", background: ACCENT, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(255,107,53,0.35)", zIndex: 10 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 },
  modal: { background: SURFACE, borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  label: { display: "block", fontSize: 12, color: SUBTEXT, marginBottom: 6, fontWeight: 600 },
  input: { width: "100%", background: SURFACE2, border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px", color: TEXT, fontSize: 14, fontFamily: "inherit" },
  primaryBtn: { width: "100%", background: ACCENT, color: BG, border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4, fontFamily: "inherit" },
  errorText: { color: ACCENT, fontSize: 12, marginBottom: 10 },
  blockGridWrap: { background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 8, overflow: "hidden" },
  blockGridScroll: { overflowX: "auto", padding: 6 },
  blockGridDayHeader: { height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: SUBTEXT },
  blockGridNum: { display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: SUBTEXT, fontWeight: 600 },
  blockGridCell: { height: 20, margin: 1, border: "none", borderRadius: 3, padding: 0, cursor: "pointer" },
  blockHint: { marginTop: 8, fontSize: 12, color: SUBTEXT, lineHeight: 1.4 },
};
