import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Clock, Loader2, CheckCircle2, XCircle, ArrowRight, Code } from 'lucide-react';
import { EtapaIntroModal } from '@/components/EtapaIntroModal';
import { sessionsAPI, teamsAPI, teamPersonalizationsAPI } from '@/services';
import { toast } from 'sonner';
import { isDevMode } from '@/utils/devMode';
import { useGameStateRedirect } from '@/hooks/useGameStateRedirect';

interface Student {
  id: number;
  full_name: string;
}

interface Team {
  id: number;
  name: string;
  color: string;
  students_count: number;
  students?: Student[];
}

interface Personalization {
  id?: number;
  team: number;
  team_name?: string;
  team_members_know_each_other?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

interface GameSession {
  id: number;
  room_code: string;
  status: string;
  current_activity_name?: string;
  current_stage_number?: number;
  started_at?: string;
}

export function ProfesorPersonalizacion() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [personalizations, setPersonalizations] = useState<Record<number, Personalization>>({});
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<string>('--:--');
  const [advancing, setAdvancing] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [showEtapaIntro, setShowEtapaIntro] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Redirigir automáticamente si el juego está en otro estado
  useGameStateRedirect();

  useEffect(() => {
    if (sessionId) {
      loadGameControl();

      // Auto-refresh cada 5 segundos
      intervalRef.current = setInterval(() => {
        loadGameControl();
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [sessionId]);

  const loadGameControl = async () => {
    if (!sessionId) return;

    try {
      // Obtener información de la sesión
      const sessionData: GameSession = await sessionsAPI.getById(sessionId);

      // Verificar que estamos en Etapa 1
      if (sessionData.current_stage_number !== 1) {
        // Redirigir a la vista correcta según la etapa
        determineAndRedirect(sessionData);
        return;
      }

      // Verificar actividad actual
      const currentActivityName = sessionData.current_activity_name?.toLowerCase() || '';
      if (!currentActivityName.includes('personaliz')) {
        if (currentActivityName.includes('presentaci')) {
          window.location.href = `/profesor/etapa1/presentacion/${sessionId}/`;
          return;
        }
        // Actividad desconocida o en transición (ej. 'instructivo' durante cambio de estado):
        // no redirigir — el próximo poll resolverá el estado. useGameStateRedirect gestiona
        // las redirecciones correctas sin causar retrocesos.
        return;
      }

      setGameSession(sessionData);

      // Verificar si debemos mostrar la intro de la etapa
      if (sessionData.current_stage_number === 1) {
        const introKey = `etapa_intro_${sessionId}_1`;
        const hasSeenIntro = localStorage.getItem(introKey);
        if (!hasSeenIntro) {
          setShowEtapaIntro(true);
        }
      }

      // Obtener equipos
      const teamsList = await teamsAPI.list({ game_session: sessionId });
      const teamsData = Array.isArray(teamsList) ? teamsList : [teamsList];
      setTeams(teamsData);

      // Obtener personalizaciones de todos los equipos
      const persMap: Record<number, Personalization> = {};
      for (const team of teamsData) {
        try {
          const persList = await teamPersonalizationsAPI.list({ team: team.id });
          const persResults = Array.isArray(persList) ? persList : [persList];
          if (persResults.length > 0) {
            persMap[team.id] = persResults[0];
          }
        } catch (error) {
          console.error(`Error loading personalization for team ${team.id}:`, error);
        }
      }
      setPersonalizations(persMap);

      // Iniciar temporizador
      if (!timerIntervalRef.current) {
        startTimer(0, parseInt(sessionId));
      }
    } catch (error: any) {
      console.error('Error loading game control:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401) {
        navigate('/profesor/login');
      } else {
        toast.error('Error al cargar los datos de la etapa');
        setHasError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async (activityId: number, sessionId: number) => {
    try {
      const timerData = await sessionsAPI.getActivityTimer(sessionId);

      if (timerData.error || !timerData.timer_duration) return;

      const timerDuration = timerData.timer_duration;
      const startTime = timerData.started_at
        ? new Date(timerData.started_at).getTime()
        : new Date(timerData.current_time).getTime();

      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, timerDuration - elapsed);

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        setTimerRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

        if (remaining <= 0) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setTimerRemaining('00:00');
          // No mostrar notificación al profesor, solo actualizar el display
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const determineAndRedirect = (sessionData: GameSession) => {
    const currentStageNumber = sessionData.current_stage_number || 0;
    const currentActivityName = sessionData.current_activity_name?.toLowerCase() || '';

    // Estado previo a las etapas (Video Institucional o Instructivo)
    if (currentStageNumber === 0) {
      if (currentActivityName.includes('instructivo')) {
        window.location.href = `/profesor/etapa1/instructivo/${sessionId}/`;
      } else {
        window.location.href = `/profesor/etapa1/video-institucional/${sessionId}/`;
      }
      return;
    }

    if (currentStageNumber === 2) {
      if (currentActivityName.includes('tema') || currentActivityName.includes('seleccionar') || currentActivityName.includes('desafio') || currentActivityName.includes('desafío')) {
        window.location.href = `/profesor/etapa2/seleccionar-tema/${sessionId}/`;
      } else if (currentActivityName.includes('bubble') || currentActivityName.includes('mapa')) {
        window.location.href = `/profesor/etapa2/bubble-map/${sessionId}/`;
      }
    } else if (currentStageNumber === 3) {
      if (currentActivityName.includes('prototipo')) {
        window.location.href = `/profesor/etapa3/prototipo/${sessionId}/`;
      }
    } else if (currentStageNumber === 4) {
      if (currentActivityName.includes('pitch')) {
        if (currentActivityName.includes('formulario')) {
          window.location.href = `/profesor/etapa4/formulario-pitch/${sessionId}/`;
        } else if (currentActivityName.includes('presentacion')) {
          window.location.href = `/profesor/etapa4/presentacion-pitch/${sessionId}/`;
        }
      }
    }
  };

  const handleNextActivity = async (skipRequirements: boolean = false) => {
    if (!sessionId) return;

    if (!skipRequirements && !confirm('¿Avanzar a la siguiente actividad? Todos los equipos deben haber completado la actividad actual.')) {
      return;
    }

    setAdvancing(true);

    try {
      const data = await sessionsAPI.nextActivity(sessionId);

      if (data.stage_completed) {
        toast.success(`¡${data.message}!`);
        setTimeout(() => {
          window.location.href = `/profesor/resultados/${sessionId}/?stage_id=${data.stage_id}`;
        }, 1500);
      } else {
        const nextActivityName = data.current_activity_name;
        toast.success(`¡Avanzando a ${nextActivityName}!`);

        if (nextActivityName === 'Presentación' || nextActivityName.toLowerCase().includes('presentacion')) {
          setTimeout(() => {
            window.location.href = `/profesor/etapa1/presentacion/${sessionId}/`;
          }, 1500);
        } else {
          setTimeout(() => {
            loadGameControl();
          }, 1500);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al avanzar a la siguiente actividad');
      setAdvancing(false);
    }
  };

  const getTeamColorHex = (color: string) => {
    const colorMap: Record<string, string> = {
      Verde: '#28a745',
      Azul: '#007bff',
      Rojo: '#dc3545',
      Amarillo: '#ffc107',
      Naranja: '#fd7e14',
      Morado: '#6f42c1',
      Rosa: '#e83e8c',
      Cian: '#17a2b8',
      Gris: '#6c757d',
      Marrón: '#795548',
    };
    return colorMap[color] || '#667eea';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        <p className="text-slate-500 font-medium mt-4">Preparando la Etapa 1...</p>
      </div>
    );
  }

  // La carga completó pero la sesión no está en estado Personalización todavía
  // (transición de etapa, estado desactualizado o sesión redirigida).
  // Mostrar botón de recarga en vez de un spinner infinito.
  if (!gameSession && !hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="text-center bg-white rounded-3xl shadow-sm p-8 max-w-sm mx-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-base font-semibold text-slate-700 mb-1">Sincronizando estado...</p>
          <p className="text-sm text-slate-500 mb-6">
            La sesión puede estar transitando entre etapas. Se actualizará automáticamente.
          </p>
          <button
            onClick={() => { setLoading(true); loadGameControl(); }}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Recargar estado
          </button>
        </div>
      </div>
    );
  }

  if (hasError || !gameSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="text-center bg-white rounded-3xl shadow-sm p-8 max-w-sm mx-4">
          <p className="text-lg font-semibold text-slate-700 mb-4">Error al cargar la sesión</p>
          <button
            onClick={() => navigate('/profesor/panel')}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Volver al Panel
          </button>
        </div>
      </div>
    );
  }

  // Calcular estadísticas
  const completedCount = teams.filter(team => {
    const pers = personalizations[team.id];
    return pers && pers.team_name && pers.team_name.trim() !== '' && pers.team_members_know_each_other !== null;
  }).length;

  const inProgressCount = teams.length - completedCount;
  const allCompleted = completedCount === teams.length && teams.length > 0;

  return (
    <div
      className="min-h-screen bg-[#F8F7F4]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Header exterior — fondo claro */}
      <header className="px-6 pt-6 pb-4 flex justify-between items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5">
            Etapa 1 — Trabajo en Equipo
          </p>
          <h1
            className="text-xl sm:text-2xl font-black text-slate-900"
            style={{ fontFamily: 'Unbounded, sans-serif' }}
          >
            Personalización
          </h1>
        </div>
        <img
          src="/images/UDD-negro.png"
          alt="Logo UDD"
          className="h-8 sm:h-10 w-auto object-contain opacity-80"
        />
      </header>

      {/* Contenedor central oscuro — panel de misión */}
      <div className="px-4 sm:px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/50 max-w-6xl mx-auto"
        >
          {/* Barra superior del panel */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
            {/* Lado izquierdo: sala + píldoras de estado */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm text-slate-400">
                Sala:{' '}
                <span className="font-bold text-white tracking-wide">
                  {gameSession.room_code}
                </span>
              </span>

              {timerRemaining !== '--:--' && (
                <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-full text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {timerRemaining}
                </div>
              )}

              <div className="inline-flex items-center gap-1.5 bg-blue-400/10 border border-blue-400/20 text-blue-300 px-4 py-1.5 rounded-full text-xs font-medium">
                <Users className="w-3.5 h-3.5" />
                {teams.length} Equipos
              </div>

              <div className="inline-flex items-center gap-1.5 bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {completedCount} Completados
              </div>

              <div className="inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 text-amber-300 px-4 py-1.5 rounded-full text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                {inProgressCount} En Progreso
              </div>
            </div>

            {/* Lado derecho: acciones */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/profesor/panel')}
                className="bg-white/5 text-slate-300 border border-slate-600/50 hover:bg-white/10 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
              >
                Volver al Panel
              </button>

              {isDevMode() && (
                <button
                  onClick={() => handleNextActivity(true)}
                  disabled={advancing}
                  title="Modo Dev: Avanzar sin requisitos"
                  className="inline-flex items-center gap-1.5 bg-white/5 text-slate-300 border border-slate-600/50 hover:bg-white/10 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
                >
                  <Code className="w-4 h-4" />
                  Dev
                </button>
              )}

              {allCompleted && (
                <button
                  onClick={() => handleNextActivity(false)}
                  disabled={advancing}
                  className="inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-950 rounded-xl px-7 py-2.5 text-sm font-semibold transition-colors shadow-lg border border-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {advancing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Avanzando...</>
                  ) : (
                    <>Continuar Fase <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-slate-700/60 mb-6" />

          {/* Grid de tarjetas de equipos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {teams.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-slate-400 text-sm">Cargando estado de los equipos...</p>
              </div>
            ) : (
              teams.map((team, index) => {
                const pers = personalizations[team.id];
                const isCompleted = pers && pers.team_name && pers.team_name.trim() !== '' && pers.team_members_know_each_other !== null;
                const status = isCompleted ? 'completed' : (pers ? 'in-progress' : 'pending');
                const statusText = isCompleted ? 'Completado' : (pers ? 'En Progreso' : 'Pendiente');
                const teamColor = getTeamColorHex(team.color);

                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm"
                  >
                    {/* Cabecera del equipo */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: teamColor }}
                        >
                          {team.color.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{team.name}</h3>
                          <p className="text-xs text-slate-400">Equipo {team.color}</p>
                        </div>
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Detalles de personalización */}
                    {pers ? (
                      <div className="space-y-2">
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="text-xs text-slate-400 mb-0.5">Nombre del equipo</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {pers.team_name || (
                              <span className="text-slate-400 italic font-normal">No definido</span>
                            )}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="text-xs text-slate-400 mb-0.5">¿Se conocen?</p>
                          {pers.team_members_know_each_other !== null ? (
                            <div className="flex items-center gap-1.5">
                              {pers.team_members_know_each_other ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  <span className="text-sm font-medium text-emerald-700">Sí, ya se conocen</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-rose-500" />
                                  <span className="text-sm font-medium text-rose-700">No se conocen</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No indicado</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-200 text-center">
                        <p className="text-xs text-slate-400 italic">Aún no ha iniciado</p>
                      </div>
                    )}

                    {/* Badge de estado */}
                    <div className="mt-3 flex justify-center">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : status === 'in-progress'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {statusText}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal de Introducción de Etapa */}
      <EtapaIntroModal
        etapaNumero={1}
        isOpen={showEtapaIntro}
        onClose={() => {
          setShowEtapaIntro(false);
          if (sessionId) {
            localStorage.setItem(`etapa_intro_${sessionId}_1`, 'true');
          }
        }}
      />
    </div>
  );
}

