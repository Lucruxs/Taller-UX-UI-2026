import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Clock, ArrowRight, Users, BookOpen, CheckCircle2, Target, XCircle, Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EtapaIntroModal } from '@/components/EtapaIntroModal';
import { sessionsAPI, teamActivityProgressAPI } from '@/services';
import { toast } from 'sonner';
import { isDevMode } from '@/utils/devMode';
import { useGameStateRedirect } from '@/hooks/useGameStateRedirect';

interface Team {
  id: number;
  name: string;
  color: string;
  tokens_total: number;
  faculty?: number;
}

interface Topic {
  id: number;
  name: string;
  description: string;
  icon_name?: string;
}


interface Challenge {
  id: number;
  title: string;
  icon?: string;
  persona_name?: string;
  persona_age?: number;
  persona_story?: string;
  difficulty_level: string;
}

interface TeamProgress {
  team: Team;
  topic?: Topic;
  challenge?: Challenge;
  topicStatus: 'completed' | 'pending';
  challengeStatus: 'completed' | 'pending';
}

export function ProfesorSeleccionarTema() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // Redirigir automáticamente si el juego está en otro estado
  useGameStateRedirect();
  
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsProgress, setTeamsProgress] = useState<TeamProgress[]>([]);
  const [gameSession, setGameSession] = useState<any>(null);
  const [timerRemaining, setTimerRemaining] = useState<string>('--:--');
  const [allTopicsSelected, setAllTopicsSelected] = useState(false);
  const [showEtapaIntro, setShowEtapaIntro] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);
  const lastActivityIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate('/profesor/panel');
      return;
    }

    loadGameControl();
    intervalRef.current = setInterval(loadGameControl, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sessionId, navigate]);

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

  const loadGameControl = async () => {
    if (!sessionId) {
      navigate('/profesor/panel');
      return;
    }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const ensuredSessionId = sessionId;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/profesor/login');
        return;
      }

      const sessionData = await sessionsAPI.getById(ensuredSessionId);
      setGameSession(sessionData);

      // Verificar si debemos mostrar la intro de la etapa
      if (sessionData.current_stage_number === 2) {
        const introKey = `etapa_intro_${ensuredSessionId}_2`;
        const hasSeenIntro = localStorage.getItem(introKey);
        if (!hasSeenIntro) {
          setShowEtapaIntro(true);
        }
      }

      if (sessionData.status === 'finished' || sessionData.status === 'completed') {
        toast.info('El juego ha finalizado. Redirigiendo al panel...');
        setTimeout(() => navigate('/profesor/panel'), 2000);
        return;
      }

      if (sessionData.status === 'lobby') {
        toast.info('El juego está en el lobby. Redirigiendo...');
        setTimeout(() => navigate(`/profesor/lobby/${ensuredSessionId}`), 2000);
        return;
      }

      const currentStageNumber = sessionData.current_stage_number;
      const currentActivityId = sessionData.current_activity;
      const currentActivityName = sessionData.current_activity_name?.toLowerCase() || '';

      // Redirection logic if not in Stage 2 or not topic selection activity
      if (currentStageNumber !== 2) {
        toast.info('El juego no está en la Etapa 2. Redirigiendo...');
        setTimeout(() => navigate(`/profesor/panel`), 2000);
        return;
      }

      // La actividad de tema/desafío es la misma ahora
      const isTopicActivity = currentActivityName.includes('tema') || 
        currentActivityName.includes('desafio') || 
        currentActivityName.includes('desafío') ||
        (currentActivityName.includes('seleccionar'));

      if (!isTopicActivity && currentActivityId) {
        // Not topic/challenge activity, redirect based on activity name
        if (currentActivityName.includes('bubble') || currentActivityName.includes('mapa')) {
        setTimeout(() => navigate(`/profesor/etapa2/bubble-map/${ensuredSessionId}`), 1500);
        }
        return;
      }

      // If no current activity in Stage 2, it means stage is completed, redirect to results
      if (!currentActivityId && currentStageNumber === 2) {
        toast.info('Etapa 2 completada. Redirigiendo a resultados...');
        setTimeout(() => navigate(`/profesor/resultados/${ensuredSessionId}`), 2000);
        return;
      }

      // El nombre de la actividad ya viene del backend en sessionData.current_activity_name
      // No necesitamos hacer llamadas adicionales

      const gameSessionId = parseInt(ensuredSessionId);

      const [stages, fetchedTeams] = await Promise.all([
        sessionsAPI.getSessionStages(gameSessionId),
        sessionsAPI.getTeams(ensuredSessionId),
      ]);

      setTeams(fetchedTeams);

      const stage2 = Array.isArray(stages) ? stages.find((s: any) => s.stage_number === 2) : null;

      if (stage2 && currentActivityId) {
        await loadTeamsProgress(fetchedTeams, currentActivityId, stage2.id);
      }

      if (currentActivityId) {
        if (lastActivityIdRef.current !== currentActivityId) {
          lastActivityIdRef.current = currentActivityId;
          startTimer(gameSessionId);
        }
      } else if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        lastActivityIdRef.current = null;
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error loading game control:', error);
      toast.error('Error al cargar el control del juego: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  };

  const loadTeamsProgress = async (teamsList: Team[], activityId: number, stageId: number) => {
    try {
      // Obtener el progreso de todos los equipos en una sola llamada
      const progressList = await teamActivityProgressAPI.list({
        activity: activityId,
        session_stage: stageId,
      });
      const progressArray = Array.isArray(progressList) ? progressList : [progressList];
      const progressMap = new Map<number, any>();
      progressArray.forEach((p: any) => {
        if (p?.team != null) {
          progressMap.set(p.team, p);
        }
      });
      
      const teamsProgressList: TeamProgress[] = teamsList.map((team) => {
        const progress = progressMap.get(team.id);
        
        if (progress) {
          // El backend ya devuelve los objetos completos en selected_topic y selected_challenge
          const topic = progress.selected_topic ? (progress.selected_topic as Topic) : undefined;
          const challenge = progress.selected_challenge ? (progress.selected_challenge as Challenge) : undefined;
          
          // Determinar el estado según el progreso del backend
          const topicStatus: 'completed' | 'pending' = progress.selected_topic ? 'completed' : 'pending';
          const challengeStatus: 'completed' | 'pending' = progress.status === 'completed' ? 'completed' : 'pending';
          
          return {
            team,
            topic,
            challenge,
            topicStatus,
            challengeStatus,
          } as TeamProgress;
        }
        
        // Si no hay progreso, equipo está pendiente
        return {
          team,
          topic: undefined,
          challenge: undefined,
          topicStatus: 'pending',
          challengeStatus: 'pending',
        } as TeamProgress;
      });

      setTeamsProgress(teamsProgressList);

      // Verificar si todos los equipos han seleccionado tema y desafío
      const allTopicsSelected = teamsProgressList.every((tp) => tp.topicStatus === 'completed');
      const allChallengesSelected = teamsProgressList.every((tp) => tp.challengeStatus === 'completed');
      setAllTopicsSelected(allTopicsSelected && allChallengesSelected);
    } catch (error) {
      console.error('Error loading teams progress:', error);
    }
  };

  const startTimer = async (gameSessionId: number) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    try {
      const timerData = await sessionsAPI.getActivityTimer(gameSessionId);

      if (timerData.error || !timerData.timer_duration) {
        console.error('Error al obtener información del temporizador:', timerData.error);
        return;
      }

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
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleNextActivity = async (skipRequirements: boolean = false) => {
    if (!sessionId) return;
    setLoading(true);
    
    // Detener el polling mientras se avanza
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    try {
      const data = await sessionsAPI.nextActivity(sessionId);


      if (data.stage_completed) {
        toast.success('¡Etapa 2 completada! Redirigiendo a resultados...');
        setLoading(false);
        setTimeout(() => navigate(`/profesor/resultados/${sessionId}`), 1500);
      } else {
        // Verificar el nombre de la actividad para redirigir correctamente
        const nextActivityName = data.current_activity_name?.toLowerCase() || '';
        const currentOrder = data.current_activity_order_number || 0;
        
        
        // Siempre ir directo a bubble map (saltando ver-desafio)
        // En Etapa 2: orden 1 = Seleccionar Tema, orden 2 = Ver Desafío (se salta), orden 3 = Bubble Map
        const isBubbleMap = currentOrder === 3 || 
                           nextActivityName.includes('bubble') || 
                           nextActivityName.includes('mapa') ||
                           nextActivityName.includes('mapa mental') ||
                           nextActivityName.includes('bubblemap');
        
        if (isBubbleMap) {
          toast.success('¡Avanzando a Bubble Map!');
          setLoading(false);
          // Redirigir inmediatamente sin delay
          navigate(`/profesor/etapa2/bubble-map/${sessionId}`);
        } else {
          // Si por alguna razón no es bubble map, mostrar error y recargar
          toast.warning(`La actividad no cambió correctamente. Actividad actual: ${nextActivityName}. Recargando...`);
          setLoading(false);
          setTimeout(() => {
            loadGameControl();
          }, 1000);
        }
      }
    } catch (error: any) {
      toast.error('Error al avanzar a la siguiente actividad: ' + (error.response?.data?.error || error.message));
      // Reanudar polling en caso de error
      intervalRef.current = setInterval(loadGameControl, 5000);
      setLoading(false);
    }
  };

  if (loading && teamsProgress.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <motion.div
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '50px 50px' }}
        />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-30"
              initial={{ x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920), y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080) }}
              animate={{ y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 p-3 sm:p-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-3 sm:gap-4">
          {/* Botón Continuar - Arriba */}
          <div className="w-full mb-2 sm:mb-3 z-20 flex justify-center gap-2 flex-shrink-0">
            {allTopicsSelected && teamsProgress.every((tp) => tp.challengeStatus === 'completed') && (
              <Button
                onClick={() => handleNextActivity(false)}
                disabled={loading}
                className="px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold bg-gradient-to-r from-[#093c92] to-[#f757ac] hover:from-[#072e73] hover:to-[#e6498a] text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    Avanzando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </>
                )}
              </Button>
            )}
            {/* Botón Dev - Solo en modo desarrollo */}
            {isDevMode() && (
              <Button
                onClick={() => handleNextActivity(true)}
                disabled={loading}
                className="px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
                title="Modo Dev: Avanzar sin requisitos"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    Avanzando...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Dev
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-xl p-4 sm:p-5 flex-shrink-0"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#093c92] to-[#f757ac] rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-1">
                    Seleccionar Tema y Desafío
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
                    Sala: <span className="font-bold text-[#093c92]">{gameSession?.room_code || '---'}</span>
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/profesor/panel')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-2 hover:bg-gray-50 w-full sm:w-auto"
              >
                <XCircle className="w-4 h-4" />
                Volver al Panel
              </Button>
            </div>
          </motion.div>

          {/* Información de Etapa */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-[#093c92] via-[#1e5bb8] to-[#093c92] text-white rounded-xl p-4 sm:p-5 flex-shrink-0 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 flex-shrink-0">
                  <Target className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-1">Etapa 2: Empatía</h2>
                  <p className="text-sm sm:text-base opacity-90">
                    {gameSession?.current_activity_name || 'Seleccionar Tema'}
            </p>
          </div>
              </div>
              {timerRemaining !== '--:--' && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border-2 border-white/30 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-white animate-pulse" />
                    <span className="text-white font-bold text-sm sm:text-base">{timerRemaining}</span>
                  </div>
                </div>
              )}
          </div>
        </motion.div>

        {/* Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-shrink-0"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 sm:p-5 text-center shadow-lg"
              >
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-[#093c92] mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-[#093c92] mb-1">
                  {teams.length}
          </div>
                <div className="text-xs sm:text-sm text-blue-800 font-semibold">Equipos Totales</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 sm:p-5 text-center shadow-lg"
              >
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-green-700 mb-1">
              {teamsProgress.filter((tp) => tp.topicStatus === 'completed').length}
          </div>
                <div className="text-xs sm:text-sm text-green-800 font-semibold">Temas Seleccionados</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4 sm:p-5 text-center shadow-lg"
              >
                <Target className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">
              {teamsProgress.filter((tp) => tp.challengeStatus === 'completed').length}
                </div>
                <div className="text-xs sm:text-sm text-purple-800 font-semibold">Desafíos Seleccionados</div>
              </motion.div>
          </div>
        </motion.div>

        {/* Equipos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-xl p-4 sm:p-5 flex-shrink-0"
          >
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#093c92] to-[#f757ac] rounded-lg flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#093c92]">
                Equipos <span className="text-gray-500 font-normal text-base sm:text-lg">({teams.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {teamsProgress.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 text-sm sm:text-base">Cargando estado de los equipos...</p>
              </div>
            ) : (
                teamsProgress.map((teamProgress, index) => {
                  const teamColor = getTeamColorHex(teamProgress.team.color);
                  const isCompleted = teamProgress.topicStatus === 'completed' && teamProgress.challengeStatus === 'completed';

                  return (
                <motion.div
                  key={teamProgress.team.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className={`bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 sm:p-5 shadow-lg border-2 ${
                        isCompleted ? 'border-green-400 shadow-green-200/50' : 'border-gray-200'
                      } transition-all duration-200`}
                    >
                      {/* Header del equipo */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg flex-shrink-0"
                            style={{ 
                              backgroundColor: teamColor,
                              backgroundImage: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}dd 100%)`
                            }}
                    >
                      {teamProgress.team.color.charAt(0).toUpperCase()}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate mb-1">{teamProgress.team.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Equipo {teamProgress.team.color}</p>
                    </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 flex-shrink-0 ${
                            isCompleted
                              ? 'bg-green-100 text-green-800 border-2 border-green-300'
                              : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                          }`}
                        >
                          {isCompleted && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                          <span className="hidden sm:inline">{isCompleted ? 'Completo' : 'En Progreso'}</span>
                          <span className="sm:hidden">{isCompleted ? '✓' : '⏳'}</span>
                        </motion.div>
                  </div>

                  {/* Tema */}
                      <div className="mb-3 sm:mb-4 space-y-2.5 sm:space-y-3 pt-3 border-t border-gray-200">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2.5 sm:p-3 border border-blue-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[#093c92] flex-shrink-0" />
                              <span className="text-xs sm:text-sm font-semibold text-gray-700">Tema</span>
                            </div>
                      <Badge
                        className={`text-xs ${
                          teamProgress.topicStatus === 'completed'
                                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                  : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                        }`}
                      >
                        {teamProgress.topicStatus === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {teamProgress.topicStatus === 'completed' ? 'Seleccionado' : 'Pendiente'}
                      </Badge>
                    </div>
                    {teamProgress.topic ? (
                            <div className="mt-2">
                              <p className="text-sm sm:text-base font-bold text-[#093c92]">{teamProgress.topic.name}</p>
                        {teamProgress.topic.description && (
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{teamProgress.topic.description}</p>
                        )}
                      </div>
                    ) : (
                            <p className="text-xs sm:text-sm text-gray-500 italic mt-2">Aún no ha seleccionado</p>
                    )}
                  </div>

                  {/* Desafío */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2.5 sm:p-3 border border-purple-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-purple-600 flex-shrink-0" />
                              <span className="text-xs sm:text-sm font-semibold text-gray-700">Desafío</span>
                            </div>
                      <Badge
                        className={`text-xs ${
                          teamProgress.challengeStatus === 'completed'
                                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                  : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                        }`}
                      >
                        {teamProgress.challengeStatus === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {teamProgress.challengeStatus === 'completed' ? 'Seleccionado' : 'Pendiente'}
                      </Badge>
                    </div>
                    {teamProgress.challenge ? (
                            <div className="mt-2 space-y-1.5">
                              <p className="text-sm sm:text-base font-bold text-purple-800">{teamProgress.challenge.title}</p>
                        {teamProgress.challenge.persona_story && (
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{teamProgress.challenge.persona_story}</p>
                        )}
                      </div>
                    ) : (
                            <p className="text-xs sm:text-sm text-gray-500 italic mt-2">Aún no ha seleccionado</p>
                    )}
                  </div>
          </div>
        </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Introducción de Etapa */}
      <EtapaIntroModal
        etapaNumero={2}
        isOpen={showEtapaIntro}
        onClose={() => {
          setShowEtapaIntro(false);
          if (sessionId) {
            localStorage.setItem(`etapa_intro_${sessionId}_2`, 'true');
          }
        }}
      />

      {/* Música de fondo */}
    </div>
  );
}







