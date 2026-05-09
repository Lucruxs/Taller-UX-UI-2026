import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Clock, Loader2, CheckCircle2, XCircle, Gamepad2, Coins, Hand, UserPlus, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UBotPersonalizacionModal } from '@/components/UBotPersonalizacionModal';
import { toast } from 'sonner';
import { tabletConnectionsAPI, sessionsAPI, teamPersonalizationsAPI } from '@/services';

interface Team {
  id: number;
  name: string;
  color: string;
  tokens_total?: number;
}

interface Personalization {
  id?: number;
  team_name?: string;
  team_members_know_each_other?: boolean;
}

export function TabletPersonalizacion() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [personalization, setPersonalization] = useState<Personalization | null>(null);
  const [teamName, setTeamName] = useState('');
  const [knowEachOther, setKnowEachOther] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<string>('--:--');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [gameSessionId, setGameSessionId] = useState<number | null>(null);
  const [currentActivityId, setCurrentActivityId] = useState<number | null>(null);
  const [showUBotModal, setShowUBotModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeExpiredRef = useRef<boolean>(false);
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connId = searchParams.get('connection_id') || localStorage.getItem('tabletConnectionId');
    if (!connId) {
      navigate('/tablet/join');
      return;
    }
    setConnectionId(connId);
    
    const loadInitialData = async () => {
      try {
        const statusData = await tabletConnectionsAPI.getStatus(connId);
        if (!statusData || !statusData.team || !statusData.game_session) {
          toast.error('Conexión no válida');
          navigate('/tablet/join');
          return;
        }

        setTeam(statusData.team);
        // Usar lobby en lugar de getById para evitar problemas de autenticación
        const lobbyData = await sessionsAPI.getLobby(statusData.game_session.id);
        const gameData = lobbyData.game_session;
        const sessionId = statusData.game_session.id;
        setGameSessionId(sessionId);

        // Guardar valores iniciales para comparación (COMO EN ETAPA 2)
        const initialActivityId = gameData.current_activity;
        const initialActivityName = gameData.current_activity_name || '';
        const initialSessionStageId = gameData.current_session_stage;
        const initialStageNumber = gameData.current_stage_number;

        // Mostrar U-Bot directamente si no se ha visto
        if (gameData.current_stage_number === 1) {
          const connId = searchParams.get('connection_id') || localStorage.getItem('tabletConnectionId');
          if (connId) {
            const hasSeenUBot = localStorage.getItem(`ubot_modal_personalizacion_${connId}`);
            if (!hasSeenUBot) {
              setTimeout(() => {
                setShowUBotModal(true);
                localStorage.setItem(`ubot_modal_personalizacion_${connId}`, 'true');
              }, 500);
            }
          }
        }

        // Verificar si el juego ha finalizado o está en lobby
        if (gameData.status === 'finished' || gameData.status === 'completed') {
          toast.info('El juego ha finalizado. Redirigiendo...');
          setTimeout(() => {
            navigate('/tablet/join');
          }, 2000);
          return;
        }

        if (gameData.status === 'lobby') {
          toast.info('El juego no ha iniciado. Redirigiendo al lobby...');
          setTimeout(() => {
            navigate(`/tablet/lobby?connection_id=${connId}`);
          }, 2000);
          return;
        }

        // Verificar actividad actual
        const currentActivityName = gameData.current_activity_name?.toLowerCase() || '';
        const currentStageNumber = gameData.current_stage_number;

        // Si no es personalización, redirigir
        if (currentStageNumber !== 1 || !currentActivityName.includes('personaliz')) {
          if (currentStageNumber === 1 && currentActivityName.includes('presentaci')) {
            try {
              const persList = await teamPersonalizationsAPI.list({ team: statusData.team.id });
              const persResults = Array.isArray(persList) ? persList : [persList];
              if (persResults.length > 0) {
                const personalization = persResults[0];
                const knowsEachOther = personalization.team_members_know_each_other;
                if (knowsEachOther === true) {
                  window.location.href = `/tablet/etapa1/minijuego/?connection_id=${connId}`;
                } else {
                  window.location.href = `/tablet/etapa1/presentacion/?connection_id=${connId}`;
                }
              } else {
                window.location.href = `/tablet/etapa1/presentacion/?connection_id=${connId}`;
              }
            } catch (error) {
              window.location.href = `/tablet/etapa1/presentacion/?connection_id=${connId}`;
            }
          } else {
            window.location.href = `/tablet/lobby?connection_id=${connId}`;
          }
          return;
        }

        setCurrentActivityId(initialActivityId);

        // Cargar datos de personalización
        try {
          const persList = await teamPersonalizationsAPI.list({ team: statusData.team.id });
          const persResults = Array.isArray(persList) ? persList : [persList];
          if (persResults.length > 0) {
            const existingPers = persResults[0];
            setPersonalization(existingPers);
            setTeamName(existingPers.team_name || '');
            setKnowEachOther(existingPers.team_members_know_each_other);
            setSubmitted(true);
          }
        } catch (error) {
          console.error('Error loading personalization:', error);
        }

        // Verificar si se debe mostrar el modal de U-Bot
        // Solo si ya se vio el modal de Etapa 1 antes pero no se ha visto U-Bot
        const hasSeenEtapaIntro = gameSessionId 
          ? localStorage.getItem(`tablet_etapa_intro_${gameSessionId}_1`)
          : null;
        const hasSeenUBot = localStorage.getItem(`ubot_modal_personalizacion_${connId}`);
        
        if (hasSeenEtapaIntro && !hasSeenUBot && statusData.team) {
          setTimeout(() => {
            setShowUBotModal(true);
            localStorage.setItem(`ubot_modal_personalizacion_${connId}`, 'true');
          }, 500);
        }

        // Iniciar timer si hay actividad
        if (initialActivityId) {
          await startTimer(initialActivityId, statusData.game_session.id);
        }

        // Verificar actividad y etapa periódicamente (COMO EN ETAPA 2)
        activityCheckIntervalRef.current = setInterval(async () => {
          try {
            // Usar lobby en lugar de getById para evitar problemas de autenticación
            const updatedLobbyData = await sessionsAPI.getLobby(statusData.game_session.id);
            const updatedSession = updatedLobbyData.game_session;
            
            // Verificar si cambió la actividad o el nombre de la actividad
            const activityChanged = updatedSession.current_activity !== initialActivityId || 
                                   (updatedSession.current_activity_name || '') !== initialActivityName;
            const stageChanged = updatedSession.current_stage_number !== initialStageNumber;
            
            if (activityChanged || stageChanged) {
              // Limpiar intervalos
              if (activityCheckIntervalRef.current) {
                clearInterval(activityCheckIntervalRef.current);
                activityCheckIntervalRef.current = null;
              }
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              
              // Verificar a qué actividad redirigir
              const newActivityName = (updatedSession.current_activity_name || '').toLowerCase();
              const newStageNumber = updatedSession.current_stage_number;
              
              // Si la etapa cambió o se completó, redirigir a resultados o siguiente etapa
              if (stageChanged || (!updatedSession.current_activity && !updatedSession.current_activity_name)) {
                if (newStageNumber === 1 && !updatedSession.current_activity) {
                  window.location.href = `/tablet/etapa1/resultados/?connection_id=${connId}`;
                  return;
                } else if (newStageNumber === 2) {
                  window.location.href = `/tablet/etapa2/seleccionar-tema/?connection_id=${connId}`;
                  return;
                } else {
                  window.location.href = `/tablet/lobby?connection_id=${connId}`;
                  return;
                }
              }
              
              // Si cambió la actividad pero sigue siendo etapa 1
              if (newActivityName.includes('presentaci')) {
                // Verificar si se conocen para redirigir a presentación o minijuego
                try {
                  const persList = await teamPersonalizationsAPI.list({ team: statusData.team.id });
                  const persResults = Array.isArray(persList) ? persList : [persList];
                  if (persResults.length > 0) {
                    const personalization = persResults[0];
                    const knowsEachOther = personalization.team_members_know_each_other;
                    if (knowsEachOther === true) {
                      window.location.href = `/tablet/etapa1/minijuego/?connection_id=${connId}`;
                    } else {
                      window.location.href = `/tablet/etapa1/presentacion/?connection_id=${connId}`;
                    }
                  } else {
                    window.location.href = `/tablet/etapa1/presentacion/?connection_id=${connId}`;
                  }
                } catch (error) {
                  window.location.href = `/tablet/etapa1/presentacion/?connection_id=${connId}`;
                }
                return;
              } else if (newActivityName.includes('personaliz')) {
                // Ya estamos en personalización, no redirigir
                return;
              } else {
                window.location.href = `/tablet/lobby?connection_id=${connId}`;
                return;
              }
            }
          } catch (error) {
            console.error('Error verificando actividad:', error);
          }
        }, 3000); // Verificar cada 3 segundos

        setLoading(false);
      } catch (error: any) {
        toast.error('Error al cargar datos: ' + (error.response?.data?.error || error.message));
        setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
      }
    };
  }, [searchParams, navigate]);

  // Reset timeExpired cuando cambia la actividad
  useEffect(() => {
    timeExpiredRef.current = false;
  }, [currentActivityId]);

  const startTimer = async (activityId: number, gameSessionId: number) => {
    // Si ya hay un intervalo corriendo, no iniciar otro
    if (timerIntervalRef.current) {
      return;
    }

    try {
      const timerData = await sessionsAPI.getActivityTimer(gameSessionId);
      if (timerData.error || !timerData.timer_duration) return;

      const timerDuration = timerData.timer_duration;
      const startTime = timerData.started_at 
        ? new Date(timerData.started_at).getTime()
        : new Date(timerData.current_time).getTime();

      // Verificar si el tiempo ya expiró antes de iniciar el intervalo
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);

      if (remaining <= 0) {
        setTimerRemaining('00:00');
        timeExpiredRef.current = true;
        return; // No iniciar el intervalo si ya expiró
      }

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
          timeExpiredRef.current = true;
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      toast.error('Por favor ingresa un nombre para el equipo');
      return;
    }

    if (knowEachOther === null) {
      toast.error('Por favor selecciona si se conocen o no');
      return;
    }

    if (!team || !connectionId) return;

    setSubmitting(true);

    try {
      const result = await teamPersonalizationsAPI.createOrUpdate({
        team: team.id,
        team_name: teamName.trim(),
        team_members_know_each_other: knowEachOther,
      });

      // Actualizar el estado local con la personalización guardada
      setPersonalization({
        id: result.id,
        team_name: teamName.trim(),
        team_members_know_each_other: knowEachOther,
      });

      toast.success('✓ Personalización guardada exitosamente');
      setSubmitted(true);
    } catch (error: any) {
      toast.error('Error: ' + (error.message || 'Error desconocido'));
    } finally {
      setSubmitting(false);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Error al cargar información del equipo</p>
          <Button onClick={() => navigate('/tablet/join')}>Volver a Conectar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Fondo animado igual que Panel */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Efectos de partículas adicionales */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-30"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              }}
              animate={{
                y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 p-3 sm:p-4">
        <div className="max-w-6xl mx-auto relative z-20">
        {/* Header Mejorado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 flex items-center justify-between flex-wrap gap-4"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg"
              style={{ backgroundColor: getTeamColorHex(team.color) }}
            >
              {team.color.charAt(0).toUpperCase()}
            </motion.div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {team.name?.replace(/^Equipo\s+/i, 'Start-up ') || `Start-up ${team.color}`}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">Start-up {team.color}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {team && (
              <motion.button
                onClick={() => setShowUBotModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm sm:text-base flex items-center gap-2 shadow-lg"
              >
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>U-Bot</span>
              </motion.button>
            )}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#093c92] to-blue-700 text-white px-5 py-2.5 rounded-full font-semibold text-sm sm:text-base flex items-center gap-2 shadow-lg"
            >
              <Coins className="w-4 h-4 sm:w-5 sm:h-5" /> {team.tokens_total || 0} Tokens
            </motion.div>
          </div>
        </motion.div>

        {/* Formulario Mejorado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-xl p-4 sm:p-6"
        >
          {/* Título y Descripción */}
          <div className="mb-4 sm:mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-2">
              1. Registro de Identidad
            </h2>
            <p className="text-gray-600 text-sm">
              Definan el nombre de su Start-up y estado actual.
            </p>
          </div>

          {/* Temporizador Mejorado */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 mb-4 sm:mb-5">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-yellow-700" />
              <span className="text-yellow-800 font-semibold text-sm sm:text-base">
                Tiempo restante: <span className="font-bold">{timerRemaining}</span>
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Campo Nombre del Equipo */}
            <div className="space-y-2">
              <Label htmlFor="teamName" className="text-[#093c92] font-semibold text-sm">
                Nombre de la Start-up
              </Label>
              <Input
                id="teamName"
                type="text"
                placeholder="Ej: Rocket Labs, Alpha Solutions, Futuro S.A..."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={100}
                required
                disabled={submitted || submitting}
                className="h-11 sm:h-12 text-sm sm:text-base border-2 focus:border-[#093c92]"
              />
            </div>

            {/* Pregunta sobre conocimiento */}
            <div className="space-y-3">
              <Label className="text-[#093c92] font-semibold text-sm sm:text-base block">
                Estado de conexión del equipo:
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  onClick={() => !submitted && !submitting && setKnowEachOther(true)}
                  disabled={submitted || submitting}
                  whileHover={!submitted && !submitting ? { scale: 1.02 } : {}}
                  whileTap={!submitted && !submitting ? { scale: 0.98 } : {}}
                  className={`p-4 sm:p-5 rounded-xl border-2 transition-all text-center font-semibold text-sm sm:text-base flex flex-col items-center justify-center gap-2 ${
                    knowEachOther === true
                      ? 'bg-[#093c92] text-white border-[#093c92] shadow-lg'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#093c92] hover:bg-blue-50'
                  } ${submitted || submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Hand className={`w-8 h-8 sm:w-10 sm:h-10 ${knowEachOther === true ? 'text-white' : 'text-[#093c92]'}`} />
                  <span>Ya nos conocemos</span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => !submitted && !submitting && setKnowEachOther(false)}
                  disabled={submitted || submitting}
                  whileHover={!submitted && !submitting ? { scale: 1.02 } : {}}
                  whileTap={!submitted && !submitting ? { scale: 0.98 } : {}}
                  className={`p-4 sm:p-5 rounded-xl border-2 transition-all text-center font-semibold text-sm sm:text-base flex flex-col items-center justify-center gap-2 ${
                    knowEachOther === false
                      ? 'bg-[#093c92] text-white border-[#093c92] shadow-lg'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#093c92] hover:bg-blue-50'
                  } ${submitted || submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <UserPlus className={`w-8 h-8 sm:w-10 sm:h-10 ${knowEachOther === false ? 'text-white' : 'text-[#093c92]'}`} />
                  <span>No nos conocemos</span>
                </motion.button>
              </div>
            </div>

            {/* Botón Entregar Mejorado */}
            <Button
              type="submit"
              disabled={submitted || submitting}
              className="w-full h-12 sm:h-14 bg-[#093c92] hover:bg-[#072e73] text-white text-sm sm:text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : submitted ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  ✓ Entregado
                </>
              ) : (
                'FUNDAR STARTUP'
              )}
            </Button>
          </form>
        </motion.div>
        </div>
      </div>

      {/* Modal de U-Bot para Personalización */}
      {team && (
        <UBotPersonalizacionModal
          isOpen={showUBotModal}
          onClose={() => setShowUBotModal(false)}
          onIniciar={() => {
            setShowUBotModal(false);
          }}
          teamColor={team.color}
        />
      )}

      {/* Música de fondo */}
    </div>
  );
}

