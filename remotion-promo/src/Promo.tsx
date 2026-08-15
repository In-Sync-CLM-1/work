import React from 'react';
import { AbsoluteFill, Sequence, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import './fonts';
import { DISPLAY, BODY } from './fonts';
import { C, FPS } from './theme';
import { SCENES } from './timings';
import { Bg, Words, Eyebrow, Chip, Device, GlowButton } from './ui';

// one solid highlight color per statement; varies by scene for rhythm
const HL = { hook: C.sky, sweep: '#a78bfa', outcome: C.emerald, cta: C.emerald };

const marksOf = (k: string): Record<string, number> => {
  const sc = SCENES.find((s) => s.k === k);
  return (sc ? { ...sc.marks } : {}) as Record<string, number>;
};

// portrait (1080x1920) rendering: scenes stack vertically and type scales down
const VertCtx = React.createContext(false);
const useVert = () => React.useContext(VertCtx);

const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 8%', ...style }}>{children}</AbsoluteFill>
);

const H1 = 118, H2 = 84;

// ── Scene: Hook ───────────────────────────────────────────────────────────────
const Hook: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const V = useVert();
  const M = marksOf('hook');
  const subS = spring({ frame: frame - M.sub, fps, config: { damping: 200 } });
  const keepS = spring({ frame: frame - M.keeps, fps, config: { damping: 15, stiffness: 130 } });
  return (
    <Center>
      <div>
        <Eyebrow text="Work-Sync" delay={0} />
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: V ? 88 : H1, lineHeight: 1.04, letterSpacing: -2, marginTop: 24 }}>
          <Words text="You gave the task." delay={6} />
          <br />
          <Words text="Is it done?" delay={22} accentColor={HL.hook} />
        </div>
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: V ? 34 : 42, color: C.dim, marginTop: 40, opacity: subS, transform: `translateY(${interpolate(subS, [0, 1], [24, 0])}px)` }}>
          A group chat is not a system.
        </div>
        <div style={{ marginTop: V ? 46 : 40, opacity: keepS, transform: `scale(${interpolate(keepS, [0, 1], [0.8, 1])})` }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: V ? 50 : 62, color: '#fff' }}>
            The filing nobody closed &mdash; <span style={{ color: '#fb7185', textShadow: '0 0 44px rgba(251,113,133,.4)' }}>&#8377;200 a day.</span>
          </span>
        </div>
      </div>
    </Center>
  );
};

// ── Scene: Sweep (device cycling module stills, cuts locked to the voice) ────
const SWEEP_KEYS = ['dashboard', 'tasks', 'board', 'timeline', 'team'];
const SWEEP_LABELS = ['Live dashboard', 'Every task, listed', 'Board', 'Timeline', 'Team workload'];

const sweepIdx = (frame: number, M: Record<string, number>) => {
  let idx = 0;
  for (let i = 0; i < SWEEP_KEYS.length; i++) if (frame >= (M[`f${i}`] ?? 1e9)) idx = i;
  return idx;
};

const SweepDevice: React.FC<{ idx: number }> = ({ idx }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const V = useVert();
  const s = spring({ frame: frame - 20, fps, config: { damping: 200, stiffness: 80 } });
  const float = Math.sin(frame / 26) * 12;
  const push = 1 + Math.min(frame * 0.00028, 0.045);
  return (
    <div style={{
      width: V ? 1010 : 1220, opacity: s, borderRadius: 18, overflow: 'hidden', margin: '0 auto',
      transform: `perspective(2000px) rotateX(6deg) translateY(${interpolate(s, [0, 1], [40, 0]) + float}px) scale(${interpolate(s, [0, 1], [0.92, 1]) * push})`,
      boxShadow: '0 70px 160px rgba(0,0,0,.62), 0 0 120px rgba(139,92,246,.34), 0 0 0 1px rgba(255,255,255,.10)', background: '#0b0b18',
    }}>
      <div style={{ height: 46, background: '#15162b', display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
        <div style={{ marginLeft: 16, height: 22, flex: 1, maxWidth: 360, background: 'rgba(255,255,255,.09)', borderRadius: 11 }} />
      </div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: V ? '1342/1000' : '1600/1000', background: '#0b0b18', overflow: 'hidden' }}>
        {SWEEP_KEYS.map((k, i) => (
          <Img key={k} src={staticFile(`ui/${k}.png`)} style={{ position: 'absolute', top: 0, left: V ? '-19.2%' : 0, width: V ? '119.2%' : '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left', opacity: i === idx ? 1 : 0, transition: 'opacity .3s' }} />
        ))}
      </div>
    </div>
  );
};

const Sweep: React.FC = () => {
  const frame = useCurrentFrame();
  const V = useVert();
  const M = marksOf('sweep');
  const idx = sweepIdx(frame, M);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 6%' }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: V ? 64 : H2, textAlign: 'center', letterSpacing: -1 }}>
        <Words text="One screen." delay={4} /><Words text=" Every task, every owner." delay={16} accentColor={HL.sweep} />
      </div>
      <div style={{ marginTop: V ? 56 : 34 }}><SweepDevice idx={idx} /></div>
      <div style={{ marginTop: V ? 52 : 30 }}><Chip key={idx} delay={0}>{SWEEP_LABELS[idx]}</Chip></div>
    </AbsoluteFill>
  );
};

// ── The real WhatsApp notification Work-Sync sends on a stage change ─────────
// Cropped to the single In-Sync row in scripts/promo-stills' source capture —
// the rest of that screenshot is a real personal inbox.
const NotifCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const V = useVert();
  const s = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 120 } });
  const float = Math.sin((frame - delay) / 22) * 6;
  return (
    <div style={{
      width: V ? 920 : 640, borderRadius: 20, overflow: 'hidden', background: '#fff',
      opacity: s, transform: `translateY(${interpolate(s, [0, 1], [34, 0]) + float}px) scale(${interpolate(s, [0, 1], [0.86, 1])})`,
      boxShadow: '0 34px 90px rgba(0,0,0,.55), 0 0 60px rgba(52,211,153,.35), 0 0 0 1px rgba(255,255,255,.16)',
    }}>
      <Img src={staticFile('ui/notif.png')} style={{ display: 'block', width: '100%' }} />
    </div>
  );
};

// ── Scene: Power beat ─────────────────────────────────────────────────────────
const Power: React.FC<{ k: string; n: string; title: string; chip: React.ReactNode; src: string; side: 'L' | 'R'; accentColor: string; zoom?: number; card?: React.ReactNode }>
  = ({ k, n, title, chip, src, side, accentColor, zoom, card }) => {
    const V = useVert();
    const M = marksOf(k);
    if (V) {
      return (
        <AbsoluteFill style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 5%' }}>
          <Eyebrow text={n} color={accentColor} delay={0} />
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 72, letterSpacing: -1, marginTop: 18 }}><Words text={title} delay={8} /></div>
          <div style={{ marginTop: 54 }}><Device src={src} side={side} width={1010} delay={6} zoom={zoom} cropLeft={0.161} /></div>
          {card ? <div style={{ marginTop: 38 }}>{card}</div> : null}
          <div style={{ marginTop: card ? 40 : 64 }}><Chip delay={M.chip ?? 22}>{chip}</Chip></div>
        </AbsoluteFill>
      );
    }
    const text = (
      <div style={{ flex: 1, padding: side === 'R' ? '0 4% 0 6%' : '0 6% 0 4%' }}>
        <Eyebrow text={n} color={accentColor} delay={0} />
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: H2, letterSpacing: -1, marginTop: 20 }}><Words text={title} delay={8} /></div>
        {card ? <div style={{ marginTop: 34 }}>{card}</div> : null}
        <div style={{ marginTop: 34 }}><Chip delay={M.chip ?? 22}>{chip}</Chip></div>
      </div>
    );
    const dev = <div style={{ flex: 1.15, display: 'flex', justifyContent: 'center' }}><Device src={src} side={side} width={980} delay={6} zoom={zoom} /></div>;
    return (
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 6%' }}>
        {side === 'R' ? <>{dev}{text}</> : <>{text}{dev}</>}
      </AbsoluteFill>
    );
  };

// ── Scene: Outcome ────────────────────────────────────────────────────────────
const Outcome: React.FC = () => {
  const V = useVert();
  const M = marksOf('outcome');
  const lead = (f: number) => Math.max(0, f - 8);
  return (
    <Center>
      <div>
        <Eyebrow text="The result" color={C.emerald} delay={0} />
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: V ? 72 : 98, lineHeight: 1.16, letterSpacing: -1, marginTop: 26 }}>
          <div><Words text="Deadlines that hold." delay={lead(M.l0)} /></div>
          <div><Words text="A team nobody chases." delay={lead(M.l1)} accentColor={HL.outcome} /></div>
          <div><Words text="Penalties you never pay." delay={lead(M.l2)} /></div>
        </div>
      </div>
    </Center>
  );
};

// ── Scene: CTA ────────────────────────────────────────────────────────────────
const Cta: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const V = useVert();
  const M = marksOf('cta');
  const logoS = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  // The URL line is the actual destination — the voice only reaches "no card"
  // in the last second, so don't make the viewer wait that long to see it.
  const subS = spring({ frame: frame - Math.min(M.url, 60), fps, config: { damping: 200 } });
  return (
    <Center>
      <div>
        <div style={{ display: 'inline-block', background: '#fff', borderRadius: 22, padding: '20px 38px', boxShadow: '0 24px 70px rgba(0,0,0,.4)', opacity: logoS, transform: `scale(${interpolate(logoS, [0, 1], [0.7, 1])})` }}>
          <Img src={staticFile('logo.png')} style={{ height: V ? 78 : 92, display: 'block' }} />
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: V ? 60 : H2, letterSpacing: -1, marginTop: 44 }}>
          <Words text="You assign. It chases." delay={10} /><br /><Words text="Done means done." delay={30} accentColor={HL.cta} />
        </div>
        <div style={{ marginTop: 48 }}><GlowButton delay={M.btn}>Start free &mdash; 14 days</GlowButton></div>
        <div style={{ fontFamily: BODY, fontSize: V ? 26 : 30, color: C.dim, marginTop: 30, opacity: subS }}>work.in-sync.co.in &middot; no card needed</div>
      </div>
    </Center>
  );
};

// ── assembly with crossfades + slow per-scene push ────────────────────────────
const OVERLAP = 9;
const Fade: React.FC<{ dur: number; first?: boolean; last?: boolean; children: React.ReactNode }> = ({ dur, first, last, children }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, OVERLAP, dur, dur + OVERLAP], [first ? 1 : 0, 1, 1, last ? 1 : 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const push = 1 + Math.min(frame / (dur + OVERLAP), 1) * 0.014;
  return <AbsoluteFill style={{ opacity: op, transform: `scale(${push})` }}>{children}</AbsoluteFill>;
};

export const Promo: React.FC<{ vertical?: boolean }> = ({ vertical }) => {
  const comp: Record<string, React.ReactNode> = {
    hook: <Hook />, sweep: <Sweep />, outcome: <Outcome />, cta: <Cta />,
    p1: <Power k="p1" n="One" title="You assign. It chases." chip={<>Owner &middot; due date &middot; priority &mdash; reminders run themselves</>} src="tasks" side="R" accentColor={C.sky} zoom={1.35} />,
    p2: <Power k="p2" n="Two" title="Every change reaches the right person." chip={<>WhatsApp first &middot; email backup &middot; up the hierarchy</>} src="detail" side="L" accentColor={C.violet} zoom={1.2} card={<NotifCard delay={26} />} />,
    p3: <Power k="p3" n="Three" title="Done means done." chip={<>The person who assigned it signs it off</>} src="board" side="R" accentColor={C.emerald} zoom={1.25} />,
    adds: <Power k="adds" n="And you see it all" title="The whole team, measured." chip={<>Who&rsquo;s carrying what &middot; what&rsquo;s overdue right now</>} src="dashboard" side="L" accentColor={'#a78bfa'} />,
  };
  let acc = 0;
  const seqs = SCENES.map((sc, i) => {
    const dur = Math.round(sc.s * FPS);
    const from = acc;
    acc += dur;
    const last = i === SCENES.length - 1;
    return (
      <Sequence key={sc.k} from={from} durationInFrames={last ? undefined : dur + OVERLAP}>
        <Fade dur={dur} first={i === 0} last={last}>{comp[sc.k]}</Fade>
      </Sequence>
    );
  });
  return (
    <VertCtx.Provider value={!!vertical}>
      <AbsoluteFill style={{ background: C.bg1 }}>
        <Bg />
        {seqs}
      </AbsoluteFill>
    </VertCtx.Provider>
  );
};
