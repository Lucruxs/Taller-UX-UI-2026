import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StarField from './StarField';
import {
  sessionsAPI,
  tabletConnectionsAPI,
  challengesAPI,
  teamActivityProgressAPI,
} from '@/services';
import { getResultsRedirectUrl } from '@/utils/tabletResultsRedirect';
import { advanceActivityOnTimerExpiration } from '@/utils/timerAutoAdvance';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Team { id: number; name: string; color: string; }

interface Topic {
  id: number; name: string; icon?: string; description?: string;
}

interface Challenge {
  id: number; title: string; description?: string; icon?: string;
  persona_name?: string; persona_age?: number;
  persona_story?: string; persona_image_url?: string;
}

interface GameSession {
  id: number; status: string;
  current_activity?: number; current_activity_name?: string;
  current_stage_number?: number; course?: number; faculty?: number;
}

type Step = 'category' | 'challenge';
type TopicVariant = 'health' | 'sustain' | 'edu' | 'default';

// ─── Topic styling ────────────────────────────────────────────────────────────

const TOPIC_VARIANTS: Record<TopicVariant, { color: string; rgb: string }> = {
  health:  { color: '#c026d3', rgb: '192,38,211' },
  sustain: { color: '#10b981', rgb: '16,185,129' },
  edu:     { color: '#f59e0b', rgb: '245,158,11' },
  default: { color: '#c026d3', rgb: '192,38,211' },
};

function getTopicVariant(name: string): TopicVariant {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (n.includes('salud') || n.includes('health')) return 'health';
  if (n.includes('sustentabilidad') || n.includes('sostenibilidad')) return 'sustain';
  if (n.includes('educacion') || n.includes('edu')) return 'edu';
  return 'default';
}

function getTopicIcon(topic: Topic): string {
  if (topic.icon) return topic.icon;
  const icons: Record<TopicVariant, string> = {
    health: '🏥', sustain: '🌱', edu: '📚', default: '🎯',
  };
  return icons[getTopicVariant(topic.name)];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TabletSeleccionarTemaDesafioV2() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [gameSessionId, setGameSessionId] = useState<number | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [sessionStageId, setSessionStageId] = useState<number | null>(null);
  const [currentActivityId, setCurrentActivityId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('category');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [expandedChallengeId, setExpandedChallengeId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState('--:--');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);
  const timeExpiredRef = useRef(false);
  const sessionStageIdRef = useRef<number | null>(null);
  const topicsLoadedRef = useRef(false);

  useEffect(() => {
    const connId = searchParams.get('connection_id') || localStorage.getItem('tabletConnectionId');
    if (!connId) { navigate('/tablet/join'); return; }
    setConnectionId(connId);
    loadGameState(connId, true);
    intervalRef.current = setInterval(() => {
      if (!isFetchingRef.current) loadGameState(connId, false);
    }, 5000);
    return () => {
      clearInterval(intervalRef.current!);
      clearInterval(timerIntervalRef.current!);
      clearInterval(timerSyncRef.current!);
    };
  }, []);

  const loadGameState = async (connId: string, isInitialLoad: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const statusData = await tabletConnectionsAPI.getStatus(connId);
      setTeam(statusData.team);
      setGameSessionId(statusData.game_session.id);

      const lobbyData = await sessionsAPI.getLobby(statusData.game_session.id);
      const gameData: GameSession = lobbyData.game_session;

      const resultsUrl = getResultsRedirectUrl(gameData, connId);
      if (resultsUrl) { window.location.href = resultsUrl; return; }

      if (gameData.status === 'finished' || gameData.status === 'completed') {
        toast.info('El juego ha finalizado. Redirigiendo...');
        setTimeout(() => navigate('/tablet/join'), 2000);
        return;
      }
      if (gameData.status === 'lobby') {
        navigate(`/tablet/lobby?connection_id=${connId}`);
        return;
      }

      const activityName = (gameData.current_activity_name || '').toLowerCase();
      const stageNumber = gameData.current_stage_number;

      if (stageNumber === 2 && gameData.current_activity) {
        if (activityName.includes('bubble') || activityName.includes('mapa')) {
          window.location.href = `/tablet/etapa2/bubble-map/?connection_id=${connId}`;
          return;
        }
      }

      if (stageNumber !== 2) {
        if ((stageNumber || 0) > 2) {
          let dest = '';
          if (stageNumber === 3) dest = '/tablet/etapa3/prototipo/';
          else if (stageNumber === 4)
            dest = activityName.includes('presentaci')
              ? '/tablet/etapa4/presentacion-pitch/'
              : '/tablet/etapa4/formulario-pitch/';
          if (dest)
            window.location.href = `/tablet/etapa-warp?stage=${stageNumber}&redirect=${encodeURIComponent(dest)}&connection_id=${connId}`;
          else
            window.location.href = `/tablet/lobby?connection_id=${connId}`;
        } else {
          window.location.href = `/tablet/lobby?connection_id=${connId}`;
        }
        return;
      }

      if (!activityName || activityName.includes('resultados')) {
        window.location.href = `/tablet/etapa2/resultados/?connection_id=${connId}`;
        return;
      }

      setCurrentActivityId(gameData.current_activity ?? null);

      let stageId = sessionStageIdRef.current;
      if (!stageId && gameData.current_activity) {
        const stages = await sessionsAPI.getSessionStages(statusData.game_session.id);
        const stagesArr = Array.isArray(stages) ? stages : [];
        const stage2 = stagesArr.find((s: any) => s.stage_number === 2);
        if (stage2) {
          stageId = stage2.id;
          setSessionStageId(stageId);
          sessionStageIdRef.current = stageId;
        }
      }

      if (isInitialLoad && !topicsLoadedRef.current) {
        topicsLoadedRef.current = true;
        try {
          const topicList = await challengesAPI.getTopics({});
          const arr = Array.isArray(topicList) ? topicList : (topicList?.results || []);
          setTopics(arr);
        } catch (err) {
          console.error('Error loading topics:', err);
        }
        setLoading(false);
      } else if (isInitialLoad) {
        setLoading(false);
      }

      if (isInitialLoad && stageId) {
        syncTimer(statusData.game_session.id, connId, stageId);
        timerSyncRef.current = setInterval(
          () => syncTimer(statusData.game_session.id, connId, stageId!),
          30000
        );
      }
    } catch (err) {
      console.error('Error loading game state:', err);
      if (isInitialLoad) setLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  };

  const syncTimer = async (gsId: number, connId: string, stageId: number) => {
    try {
      const timerData = await sessionsAPI.getActivityTimer(gsId);
      if (!timerData) return;
      const remaining = timerData.remaining_seconds ?? 0;
      if (remaining <= 0 && !timeExpiredRef.current) {
        timeExpiredRef.current = true;
        await advanceActivityOnTimerExpiration(gsId, stageId, connId);
      }
      startLocalTimer(remaining);
    } catch {}
  };

  const startLocalTimer = (seconds: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    let s = seconds;
    const update = () => {
      const m = Math.floor(s / 60), sec = s % 60;
      setTimerRemaining(`${m}:${String(sec).padStart(2, '0')}`);
    };
    update();
    timerIntervalRef.current = setInterval(() => { s = Math.max(0, s - 1); update(); }, 1000);
  };

  const handleTopicClick = async (topic: Topic) => {
    setSelectedTopic(topic);
    setStep('challenge');
    try {
      const result = await challengesAPI.getChallenges({ topic: topic.id });
      const arr = Array.isArray(result) ? result : (result?.results || []);
      setChallenges(arr);
    } catch {
      toast.error('Error cargando desafíos');
    }
  };

  const handleChallengeClick = async (ch: Challenge) => {
    if (submitting || !team || !currentActivityId || !sessionStageId || !selectedTopic) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('team', String(team.id));
      fd.append('activity', String(currentActivityId));
      fd.append('session_stage', String(sessionStageId));
      fd.append('challenge', String(ch.id));
      fd.append('topic', String(selectedTopic.id));
      await teamActivityProgressAPI.selectChallenge(fd);
      window.location.href = `/tablet/etapa2/bubble-map/?connection_id=${connectionId}`;
    } catch {
      toast.error('Error al seleccionar el desafío');
      setSubmitting(false);
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <StarField />
        <div style={{
          position: 'relative', zIndex: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center', height: '100vh',
        }}>
          <div style={{ textAlign: 'center', color: '#fff', fontFamily: "'Orbitron', sans-serif" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
            <div style={{ fontSize: 14, letterSpacing: 3, opacity: 0.6 }}>CARGANDO...</div>
          </div>
        </div>
      </>
    );
  }

  const catVariant = selectedTopic ? TOPIC_VARIANTS[getTopicVariant(selectedTopic.name)] : TOPIC_VARIANTS.health;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <StarField />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '28px 24px', overflowY: 'auto', fontFamily: "'Exo 2', sans-serif",
      }}>

        {/* Timer pill */}
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 50,
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, color: '#fff',
          padding: '8px 18px', borderRadius: 50,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)', whiteSpace: 'nowrap',
        }}>
          ⏱ {timerRemaining}
        </div>

        {/* ── CATEGORY STEP ─────────────────────────────────────────────────── */}
        {step === 'category' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 700 }}>
            <div style={{
              fontFamily: "'Exo 2', sans-serif", fontSize: 10, fontWeight: 600,
              letterSpacing: 5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 50, padding: '6px 18px', marginBottom: 22,
            }}>Fase 2 · Empatía</div>

            <h1 style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, color: '#fff',
              letterSpacing: 2, textTransform: 'uppercase' as const, textAlign: 'center',
              marginBottom: 10, textShadow: '0 0 50px rgba(192,38,211,0.5)',
            }}>
              Elige tu<br />Sector de Impacto
            </h1>

            <p style={{
              fontSize: 'clamp(13px,1.7vw,15px)', fontWeight: 300,
              color: 'rgba(255,255,255,0.5)', lineHeight: 1.9,
              textAlign: 'center', marginBottom: 44, maxWidth: 500,
            }}>
              Su startup necesita un propósito. Seleccionen el sector donde quieren generar un cambio real en el mundo.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
              {topics.map(topic => {
                const v = TOPIC_VARIANTS[getTopicVariant(topic.name)];
                return (
                  <div
                    key={topic.id}
                    role="button"
                    onClick={() => handleTopicClick(topic)}
                    style={{
                      flex: 1, minWidth: 160, maxWidth: 220,
                      padding: '32px 20px 28px', borderRadius: 22,
                      background: 'rgba(255,255,255,0.04)',
                      border: `2px solid rgba(${v.rgb},0.25)`,
                      backdropFilter: 'blur(16px)', textAlign: 'center', cursor: 'pointer',
                      transition: 'transform 0.28s, box-shadow 0.28s, border-color 0.28s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = 'translateY(-6px)';
                      el.style.borderColor = `rgba(${v.rgb},0.6)`;
                      el.style.boxShadow = `0 12px 40px rgba(${v.rgb},0.25)`;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = '';
                      el.style.borderColor = `rgba(${v.rgb},0.25)`;
                      el.style.boxShadow = '';
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>{getTopicIcon(topic)}</div>
                    <div style={{
                      fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700,
                      letterSpacing: 1, color: '#fff', marginBottom: 8,
                    }}>{topic.name}</div>
                    <div style={{
                      fontSize: 12, fontWeight: 300,
                      color: 'rgba(255,255,255,0.4)', lineHeight: 1.6,
                    }}>{topic.description || ''}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CHALLENGE STEP ────────────────────────────────────────────────── */}
        {step === 'challenge' && selectedTopic && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 980 }}>

            {/* Header row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', marginBottom: 20, flexWrap: 'wrap' as const, gap: 10,
            }}>
              <div
                role="button"
                onClick={() => setStep('category')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.45)'; }}
              >
                ← Volver
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 'clamp(14px,2vw,20px)', fontWeight: 700,
                  letterSpacing: 2, textTransform: 'uppercase' as const, color: '#fff',
                }}>{selectedTopic.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                  Elige un desafío para explorar en profundidad
                </div>
              </div>
              <div style={{ width: 70 }} />
            </div>

            {/* Challenge cards */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, justifyContent: 'center', width: '100%' }}>
              {challenges.map(ch => (
                <div
                  key={ch.id}
                  role="button"
                  onClick={() => handleChallengeClick(ch)}
                  style={{
                    flex: 1, minWidth: 260, maxWidth: 300,
                    borderRadius: 20, background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(16px)', cursor: 'pointer',
                    transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
                    display: 'flex', flexDirection: 'column',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = 'translateY(-5px)';
                    el.style.borderColor = `${catVariant.color}55`;
                    el.style.boxShadow = `0 10px 36px ${catVariant.color}22`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = '';
                    el.style.borderColor = 'rgba(255,255,255,0.1)';
                    el.style.boxShadow = '';
                  }}
                >
                  {/* Top section */}
                  <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, flexShrink: 0,
                      border: '2px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)',
                    }}>
                      {ch.icon || '👤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                        {ch.persona_name || 'Persona'}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>
                        {ch.persona_age ? `${ch.persona_age} años` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                      fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700,
                      letterSpacing: 1, textTransform: 'uppercase' as const,
                      color: catVariant.color,
                    }}>
                      {ch.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                      {ch.description || ''}
                    </div>
                    <div
                      role="button"
                      onClick={e => {
                        e.stopPropagation();
                        setExpandedChallengeId(expandedChallengeId === ch.id ? null : ch.id);
                      }}
                      style={{
                        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                        width: 'fit-content',
                      }}
                    >
                      {expandedChallengeId === ch.id ? '▲ Ocultar' : '▼ Ver contexto completo'}
                    </div>
                    {expandedChallengeId === ch.id && (
                      <div style={{
                        fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.75, borderTop: '1px solid rgba(255,255,255,0.07)',
                        paddingTop: 8,
                      }}>
                        {ch.persona_story || ''}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'right' }}>
                    <span style={{
                      fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 700,
                      letterSpacing: 2, textTransform: 'uppercase' as const,
                      color: catVariant.color, opacity: submitting ? 0.4 : 0.7,
                    }}>
                      {submitting ? 'Guardando...' : 'Elegir este desafío →'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
