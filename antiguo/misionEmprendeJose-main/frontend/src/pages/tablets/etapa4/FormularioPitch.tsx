import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Clock, Save, CheckCircle2, FileText, Lightbulb, Target, Award, Bot, Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UBotFormularioPitchModal } from '@/components/UBotFormularioPitchModal';
import { sessionsAPI, tabletConnectionsAPI, teamActivityProgressAPI } from '@/services';
import { toast } from 'sonner';

interface Team {
  id: number;
  name: string;
  color: string;
  tokens_total?: number;
}

interface GameSession {
  id: number;
  current_activity: number | null;
  current_activity_name: string | null;
  current_stage_number?: number;
}

export function TabletFormularioPitch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [gameSessionId, setGameSessionId] = useState<number | null>(null);
  const [currentActivityId, setCurrentActivityId] = useState<number | null>(null);
  const [currentSessionStageId, setCurrentSessionStageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<string>('--:--');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [showUBotModal, setShowUBotModal] = useState(false);
  
  const [pitchIntroProblem, setPitchIntroProblem] = useState('');
  const [pitchSolution, setPitchSolution] = useState('');
  const [pitchValue, setPitchValue] = useState('');
  const [pitchImpact, setPitchImpact] = useState('');
  const [pitchClosing, setPitchClosing] = useState('');
  const [hasSaved, setHasSaved] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [lastSavedValues, setLastSavedValues] = useState<{
    intro_problem: string;
    solution: string;
    value: string;
    impact: string;
    closing: string;
  }>({ intro_problem: '', solution: '', value: '', impact: '', closing: '' });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUpdatingFromServerRef = useRef<boolean>(false);
  const isTypingRef = useRef<boolean>(false);
  const focusedFieldRef = useRef<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartTimeRef = useRef<number | null>(null);
  const timerDurationRef = useRef<number | null>(null);

  useEffect(() => {
    const connId = searchParams.get('connection_id') || localStorage.getItem('tabletConnectionId');
    if (!connId) {
      navigate('/tablet/join');
      return;
    }
    setConnectionId(connId);
    loadGameState(connId);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (timerSyncIntervalRef.current) clearInterval(timerSyncIntervalRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [searchParams, navigate]);

  const loadGameState = async (connId: string) => {
    try {
      const statusData = await tabletConnectionsAPI.getStatus(connId);
      
      if (!statusData || !statusData.team) {
        toast.error('Conexión no encontrada. Por favor reconecta.');
        setTimeout(() => {
          navigate('/tablet/join');
        }, 2000);
        return;
      }

      const teamData: Team = statusData.team;
      setTeam(teamData);
      setGameSessionId(statusData.game_session.id);

      // Usar lobby en lugar de getById para evitar problemas de autenticación
      const lobbyData = await sessionsAPI.getLobby(statusData.game_session.id);
      const gameData: GameSession = lobbyData.game_session;
      const sessionId = statusData.game_session.id;

      // Mostrar modal de U-Bot si no se ha visto
      if (gameData.current_stage_number === 4) {
        const ubotKey = `ubot_formulario_pitch_${sessionId}`;
        const hasSeenUBot = localStorage.getItem(ubotKey);
        if (!hasSeenUBot) {
          setTimeout(() => {
            setShowUBotModal(true);
            localStorage.setItem(ubotKey, 'true');
          }, 500);
        }
      }

      const currentStageNumber = gameData.current_stage_number || 1;
      const currentActivityName = gameData.current_activity_name?.toLowerCase() || '';

      if (currentStageNumber !== 4) {
        if (currentStageNumber === 3) {
          const normalizedName = currentActivityName;
          if (normalizedName.includes('prototipo') || normalizedName.includes('lego')) {
            window.location.href = `/tablet/etapa3/prototipo/?connection_id=${connId}`;
          } else {
            window.location.href = `/tablet/etapa3/resultados/?connection_id=${connId}`;
          }
        } else {
          window.location.href = `/tablet/lobby?connection_id=${connId}`;
        }
        return;
      }

      // Verificar si el profesor avanzó a la actividad de presentación
      if (currentActivityName && (currentActivityName.includes('presentacion') || currentActivityName.includes('presentación'))) {
        window.location.href = `/tablet/etapa4/presentacion-pitch/?connection_id=${connId}`;
        return;
      }

      // Si no hay actividad activa, puede ser que la etapa terminó
      if (!gameData.current_activity) {
        window.location.href = `/tablet/etapa4/resultados/?connection_id=${connId}`;
        return;
      }

      // Si la actividad cambió y ya no es formulario, redirigir al lobby para que determine
      if (currentActivityId && gameData.current_activity !== currentActivityId && !currentActivityName.includes('formulario')) {
        window.location.href = `/tablet/lobby?connection_id=${connId}`;
        return;
      }

      setCurrentActivityId(gameData.current_activity);

      const stages = await sessionsAPI.getSessionStages(statusData.game_session.id);
      const stagesArray = Array.isArray(stages) ? stages : [];
      const sessionStage = stagesArray.find((s: any) => s.stage_number === 4) || null;

      if (sessionStage) {
        setCurrentSessionStageId(sessionStage.id);
        // Solo cargar el estado inicial si no estamos escribiendo
        if (!isTypingRef.current && !focusedFieldRef.current) {
          await loadPitchStatus(statusData.game_session.id, teamData.id, gameData.current_activity, sessionStage.id);
        }
        startTimer(gameData.current_activity, statusData.game_session.id);
      }

      setLoading(false);

      // Limpiar intervalo anterior si existe antes de crear uno nuevo
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Solo actualizar si el usuario no está escribiendo
      intervalRef.current = setInterval(() => {
        // No actualizar si el usuario está escribiendo o hay un campo con foco (usar refs)
        if (!isTypingRef.current && !focusedFieldRef.current && !isUpdatingFromServerRef.current) {
          loadGameState(connId);
        }
      }, 5000);
    } catch (error: any) {
      // Ignorar errores de petición cancelada (ECONNABORTED)
      if (error.code === 'ECONNABORTED' || error.message === 'Request aborted') {
        return;
      }
      console.error('Error loading game state:', error);
      // Solo mostrar toast si no es un error de cancelación
      if (error.code !== 'ECONNABORTED' && error.message !== 'Request aborted') {
        toast.error('Error de conexión: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
      }
      setLoading(false);
    }
  };

  const loadPitchStatus = async (gameSessionId: number, teamId: number, activityId: number, sessionStageId: number) => {
    // No cargar si el usuario está escribiendo o hay un campo con foco (usar refs para valores actuales)
    if (isTypingRef.current || focusedFieldRef.current || isUpdatingFromServerRef.current) {
      return;
    }

    try {
      const progressList = await teamActivityProgressAPI.list({
        team: teamId,
        activity: activityId,
        session_stage: sessionStageId,
      });
      const progressArray = Array.isArray(progressList) ? progressList : [];
      const progress = progressArray[0];

      if (progress) {
        const serverIntro = progress.pitch_intro_problem || '';
        const serverSolution = progress.pitch_solution || '';
        const serverValue = progress.pitch_value || '';
        const serverImpact = progress.pitch_impact || '';
        const serverClosing = progress.pitch_closing || '';

        // Verificar nuevamente antes de actualizar (por si cambió el estado durante la petición)
        if (isTypingRef.current || focusedFieldRef.current || isUpdatingFromServerRef.current) {
          return;
        }

        isUpdatingFromServerRef.current = true;

        // Solo actualizar si el valor del servidor es diferente al valor actual
        // Y el campo no tiene foco (usar ref para valor actual)
        if (focusedFieldRef.current !== 'intro_problem' && serverIntro !== pitchIntroProblem) {
          setPitchIntroProblem(serverIntro);
        }
        if (focusedFieldRef.current !== 'solution' && serverSolution !== pitchSolution) {
          setPitchSolution(serverSolution);
        }
        if (focusedFieldRef.current !== 'value' && serverValue !== pitchValue) {
          setPitchValue(serverValue);
        }
        if (focusedFieldRef.current !== 'impact' && serverImpact !== pitchImpact) {
          setPitchImpact(serverImpact);
        }
        if (focusedFieldRef.current !== 'closing' && serverClosing !== pitchClosing) {
          setPitchClosing(serverClosing);
        }

        // Actualizar valores guardados para comparación futura
        setLastSavedValues({
          intro_problem: serverIntro,
          solution: serverSolution,
          value: serverValue,
          impact: serverImpact,
          closing: serverClosing,
        });

        setProgressPercentage(progress.progress_percentage || 0);
        setHasSaved(progress.status === 'completed');

        // Pequeño delay antes de permitir nuevas actualizaciones
        setTimeout(() => {
          isUpdatingFromServerRef.current = false;
        }, 100);
      }
    } catch (error: any) {
      // Ignorar errores de petición cancelada (ECONNABORTED)
      if (error.code === 'ECONNABORTED' || error.message === 'Request aborted') {
        return;
      }
      // Solo loguear errores que no sean de cancelación
      if (error.code !== 'ECONNABORTED' && error.message !== 'Request aborted') {
        console.error('Error loading pitch status:', error);
      }
      isUpdatingFromServerRef.current = false;
    }
  };

  const startTimer = async (activityId: number, gameSessionId: number) => {
    // Limpiar intervalos anteriores antes de crear nuevos
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (timerSyncIntervalRef.current) {
      clearInterval(timerSyncIntervalRef.current);
      timerSyncIntervalRef.current = null;
    }

    try {
      const timerData = await sessionsAPI.getActivityTimer(gameSessionId);

      if (timerData.error || !timerData.timer_duration) {
        return;
      }

      timerDurationRef.current = timerData.timer_duration;
      timerStartTimeRef.current = timerData.started_at
        ? new Date(timerData.started_at).getTime()
        : new Date(timerData.current_time).getTime();

      const updateTimer = () => {
        if (timerStartTimeRef.current && timerDurationRef.current) {
          const now = Date.now();
          const elapsed = Math.floor((now - timerStartTimeRef.current) / 1000);
          const remaining = Math.max(0, timerDurationRef.current - elapsed);

          const minutes = Math.floor(remaining / 60);
          const seconds = remaining % 60;
          setTimerRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

          if (remaining <= 0) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setTimerRemaining('00:00');
          }
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);

      // Limpiar intervalo de sincronización anterior si existe
      if (timerSyncIntervalRef.current) {
        clearInterval(timerSyncIntervalRef.current);
      }

      timerSyncIntervalRef.current = setInterval(async () => {
        try {
          const syncData = await sessionsAPI.getActivityTimer(gameSessionId);
          if (syncData.started_at && syncData.timer_duration) {
            timerStartTimeRef.current = new Date(syncData.started_at).getTime();
            timerDurationRef.current = syncData.timer_duration;
          }
        } catch (error: any) {
          // Ignorar errores de petición cancelada (ECONNABORTED)
          if (error.code !== 'ECONNABORTED' && error.message !== 'Request aborted') {
            console.error('Error syncing timer:', error);
          }
        }
      }, 5000);
    } catch (error: any) {
      // Ignorar errores de petición cancelada (ECONNABORTED)
      if (error.code !== 'ECONNABORTED' && error.message !== 'Request aborted') {
        console.error('Error starting timer:', error);
      }
    }
  };

  const savePitch = async (showToast = true) => {
    if (!team || !currentActivityId || !currentSessionStageId) {
      if (showToast) toast.error('Faltan datos necesarios');
      return;
    }

    try {
      const response = await teamActivityProgressAPI.savePitch({
        team_id: team.id,
        activity_id: currentActivityId,
        session_stage_id: currentSessionStageId,
        pitch_intro_problem: pitchIntroProblem,
        pitch_solution: pitchSolution,
        pitch_value: pitchValue,
        pitch_impact: pitchImpact,
        pitch_closing: pitchClosing,
      });

      const fieldsCompleted = [pitchIntroProblem, pitchSolution, pitchValue, pitchImpact, pitchClosing].filter(Boolean).length;
      const newProgress = Math.floor((fieldsCompleted / 5) * 100);
      setProgressPercentage(newProgress);

      if (fieldsCompleted === 5) {
        setHasSaved(true);
        if (showToast) toast.success('✓ Pitch guardado exitosamente');
      } else {
        if (showToast) toast.success(`Pitch guardado (${newProgress}% completado)`);
      }

      // Actualizar valores guardados después de guardar
      setLastSavedValues({
        intro_problem: pitchIntroProblem,
        solution: pitchSolution,
        value: pitchValue,
        impact: pitchImpact,
        closing: pitchClosing,
      });
    } catch (error: any) {
      console.error('Error saving pitch:', error);
      if (showToast) toast.error('Error al guardar: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
    }
  };

  const handleSavePitch = async () => {
    setSaving(true);
    await savePitch(true);
    setSaving(false);
  };

  const handleFieldChange = (field: 'intro_problem' | 'solution' | 'value' | 'impact' | 'closing', value: string) => {
    // No actualizar si estamos recibiendo datos del servidor
    if (isUpdatingFromServerRef.current) {
      return;
    }

    setIsTyping(true);
    isTypingRef.current = true;
    
    // Actualizar el campo correspondiente
    if (field === 'intro_problem') {
      setPitchIntroProblem(value);
    } else if (field === 'solution') {
      setPitchSolution(value);
    } else if (field === 'value') {
      setPitchValue(value);
    } else if (field === 'impact') {
      setPitchImpact(value);
    } else if (field === 'closing') {
      setPitchClosing(value);
    }

    // Cancelar el guardado anterior si existe
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Guardar automáticamente después de 2 segundos de inactividad
    saveTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      isTypingRef.current = false;
      savePitch(false); // Guardar sin mostrar toast
    }, 2000);
  };

  const handleFieldFocus = (field: 'intro_problem' | 'solution' | 'value' | 'impact' | 'closing') => {
    setFocusedField(field);
    focusedFieldRef.current = field;
    setIsTyping(true);
    isTypingRef.current = true;
  };

  const handleFieldBlur = () => {
    // Guardar inmediatamente al perder el foco
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    savePitch(false);

    // Esperar un poco antes de permitir actualizaciones del servidor
    setTimeout(() => {
      setFocusedField(null);
      focusedFieldRef.current = null;
      setIsTyping(false);
      isTypingRef.current = false;
    }, 500);
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
          <p className="text-xl mb-4">No se encontró el equipo</p>
          <Button onClick={() => navigate('/tablet/join')}>Volver</Button>
        </div>
      </div>
    );
  }

  const fieldsCompleted = [pitchIntroProblem, pitchSolution, pitchValue, pitchImpact, pitchClosing].filter(Boolean).length;
  const isComplete = fieldsCompleted === 5;

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
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">{team.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600">Equipo {team.color}</p>
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
                <Award className="w-4 h-4 sm:w-5 sm:h-5" /> {team.tokens_total || 0} Tokens
              </motion.div>
            </div>
          </motion.div>

          {/* Contenedor Principal Mejorado */}
          <div className="relative">
            {/* Temporizador en esquina superior derecha */}
            {timerRemaining !== '--:--' && (
              <div className="absolute top-0 right-0 bg-yellow-50 border-2 border-yellow-300 rounded-lg px-3 py-2 shadow-sm z-10" style={{ isolation: 'isolate' }}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-700" />
                  <span className="text-yellow-800 font-semibold text-sm sm:text-base">
                    <span className="font-bold">{timerRemaining}</span>
                  </span>
                </div>
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-xl p-4 sm:p-6 mb-3 sm:mb-4 relative pr-24 sm:pr-32"
            >
              {/* Título y Descripción */}
              <div className="mb-4 sm:mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#093c92] to-[#f757ac] rounded-lg flex items-center justify-center shadow-md">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#093c92]">
                    Formulario de Pitch
                  </h1>
                </div>
                <p className="text-gray-600 text-sm sm:text-base">
                  Redacten el discurso que usarán para vender su proyecto.
                </p>
              </div>

              {/* Barra de Progreso Mejorada */}
              {progressPercentage > 0 && (
              <div className="mb-3 sm:mb-4">
                <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1.5">
                  <span className="font-semibold">Progreso</span>
                  <span className="font-bold">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              )}

              {/* Formulario Mejorado */}
              <div className="space-y-4 sm:space-y-5 pt-3 border-t border-gray-200">
              {/* Problema */}
              <div>
                <label className="block text-base sm:text-lg font-semibold text-[#093c92] mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5" /> 1. El Dolor (Problema)
                </label>
                <textarea
                  value={pitchIntroProblem}
                  onChange={(e) => handleFieldChange('intro_problem', e.target.value)}
                  onFocus={() => handleFieldFocus('intro_problem')}
                  onBlur={handleFieldBlur}
                  placeholder="Describe el problema que identificaste en la Etapa 2 (Empatía)..."
                  rows={5}
                  className="w-full text-sm sm:text-base border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#093c92] focus:border-transparent resize-y"
                />
              </div>

              {/* Solución */}
              <div>
                <label className="block text-base sm:text-lg font-semibold text-[#093c92] mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" /> 2. El Rescate (Tu Solución)
                </label>
                <textarea
                  value={pitchSolution}
                  onChange={(e) => handleFieldChange('solution', e.target.value)}
                  onFocus={() => handleFieldFocus('solution')}
                  onBlur={handleFieldBlur}
                  placeholder="Describe tu solución basándote en el prototipo que construiste en la Etapa 3 (Creatividad)..."
                  rows={5}
                  className="w-full text-sm sm:text-base border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#093c92] focus:border-transparent resize-y"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-base sm:text-lg font-semibold text-[#093c92] mb-2 flex items-center gap-2">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5" /> 3. Diferencia (Valor)
                </label>
                <textarea
                  value={pitchValue}
                  onChange={(e) => handleFieldChange('value', e.target.value)}
                  onFocus={() => handleFieldFocus('value')}
                  onBlur={handleFieldBlur}
                  placeholder="Explica el valor que aporta tu solución..."
                  rows={5}
                  className="w-full text-sm sm:text-base border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#093c92] focus:border-transparent resize-y"
                />
              </div>

              {/* Impacto */}
              <div>
                <label className="block text-base sm:text-lg font-semibold text-[#093c92] mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5" /> 4. El Futuro (Impacto)
                </label>
                <textarea
                  value={pitchImpact}
                  onChange={(e) => handleFieldChange('impact', e.target.value)}
                  onFocus={() => handleFieldFocus('impact')}
                  onBlur={handleFieldBlur}
                  placeholder="Describe el impacto que tendrá tu solución..."
                  rows={5}
                  className="w-full text-sm sm:text-base border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#093c92] focus:border-transparent resize-y"
                />
              </div>

              {/* Cierre */}
              <div>
                <label className="block text-base sm:text-lg font-semibold text-[#093c92] mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> 5. Golpe Final (Cierre)
                </label>
                <textarea
                  value={pitchClosing}
                  onChange={(e) => handleFieldChange('closing', e.target.value)}
                  onFocus={() => handleFieldFocus('closing')}
                  onBlur={handleFieldBlur}
                  placeholder="Concluye tu pitch de manera impactante..."
                  rows={5}
                  className="w-full text-sm sm:text-base border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#093c92] focus:border-transparent resize-y"
                />
              </div>
              </div>

              {/* Save Button Mejorado */}
              <div className="flex justify-center mt-4 sm:mt-5 pt-4 border-t border-gray-200">
              <Button
                onClick={handleSavePitch}
                disabled={saving}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    [ GUARDAR GUION ]
                  </>
                )}
              </Button>
              </div>

              {/* Success Message Mejorado */}
              {hasSaved && isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border-2 border-green-400 rounded-lg p-3 sm:p-4 text-center mt-3 sm:mt-4"
              >
                <div className="flex items-center justify-center gap-2 text-green-800 font-semibold text-sm sm:text-base">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <p>✓ Pitch guardado exitosamente</p>
                </div>
              </motion.div>
            )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modal de U-Bot */}
      {team && (
        <UBotFormularioPitchModal
          isOpen={showUBotModal}
          onClose={() => setShowUBotModal(false)}
          onContinuar={() => setShowUBotModal(false)}
          teamColor={team.color}
        />
      )}

      {/* Música de fondo */}
    </div>
  );
}

