import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Play,
  Award,
  ClipboardList,
  Gamepad2,
  Target,
  Sparkles,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EtapaIntroModal } from '@/components/EtapaIntroModal';
import { isDevMode } from '@/utils/devMode';
import { sessionsAPI, teamsAPI, teamPersonalizationsAPI, teamActivityProgressAPI } from '@/services';
import { toast } from 'sonner';
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
}

interface ActivityProgress {
  id?: number;
  team: number;
  status: string;
  response_data?: {
    type?: string;
    correct_answers?: number;
    total_words?: number;
    tokens_earned?: number;
    answers?: Array<{ word: string; answer: string }>;
    minigame_type?: string;  // Tipo de minijuego: 'anagrama' o 'word_search'
    minigame_part?: string;  // Parte del minijuego: 'word_search' o 'anagram'
    found_words?: string[];  // Palabras encontradas en sopa de letras
    correct_words?: string[];  // Palabras correctas encontradas
    word_search_words_found?: number;
    anagram_words_found?: number;
    word_search_total_words?: number;
    anagram_total_words?: number;
    part1_completed?: boolean;  // Parte 1: Presentación
    chaos?: {
      completed?: boolean;
      questions_answered?: number;
      shown_question_ids?: number[];
    };
    general_knowledge?: {
      answers?: Array<{ question_id: number; selected: number; correct?: boolean }>;
      correct_count?: number;
      total_questions?: number;
      completed?: boolean;
      questions_data?: any[];
    };
  };
  progress_percentage?: number;
}

interface GameSession {
  id: number;
  room_code: string;
  status: string;
  current_activity_name?: string;
  current_activity?: number;
  current_stage_number?: number;
  started_at?: string;
}

export function ProfesorPresentacion() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // Redirigir automáticamente si el juego está en otro estado
  useGameStateRedirect();
  
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [personalizations, setPersonalizations] = useState<Record<number, Personalization>>({});
  const [activityProgress, setActivityProgress] = useState<Record<number, ActivityProgress>>({});
  const [loading, setLoading] = useState(true);
  const [timerRemaining, setTimerRemaining] = useState<string>('--:--');
  const [advancing, setAdvancing] = useState(false);
  const [showEtapaIntro, setShowEtapaIntro] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

      // Verificar si debemos mostrar la intro de la etapa
      if (sessionData.current_stage_number === 1) {
        const introKey = `etapa_intro_${sessionId}_1`;
        const hasSeenIntro = localStorage.getItem(introKey);
        if (!hasSeenIntro) {
          setShowEtapaIntro(true);
        }
      }

      // Verificar que estamos en Etapa 1
      if (sessionData.current_stage_number !== 1) {
        determineAndRedirect(sessionData);
        return;
      }

      // Verificar actividad actual
      const currentActivityName = sessionData.current_activity_name?.toLowerCase() || '';
      if (!currentActivityName.includes('presentacion') && !currentActivityName.includes('presentación')) {
        // Redirigir a la actividad correcta
        if (currentActivityName.includes('personaliz')) {
          window.location.href = `/profesor/etapa1/personalizacion/${sessionId}/`;
        } else {
          window.location.href = `/profesor/lobby/${sessionId}`;
        }
        return;
      }

      setGameSession(sessionData);

      // Obtener equipos
      const teamsList = await teamsAPI.list({ game_session: sessionId });
      const teamsData: Team[] = Array.isArray(teamsList) ? teamsList : [teamsList];
      setTeams(teamsData);

      // Obtener session_stage
      const stagesData = await sessionsAPI.getSessionStages(Number(sessionId));
      const stagesArray = Array.isArray(stagesData) ? stagesData : [stagesData];
      const sessionStageId = stagesArray.length > 0 ? stagesArray[0].id : null;

      // Obtener personalizaciones y progreso de actividad para todos los equipos
      const fetchedPersonalizations: Record<number, Personalization> = {};
      const fetchedProgress: Record<number, ActivityProgress> = {};

      for (const team of teamsData) {
        // Obtener personalización
        try {
          const persList = await teamPersonalizationsAPI.list({ team: team.id });
          const persResults = Array.isArray(persList) ? persList : [persList];
          if (persResults.length > 0) {
            fetchedPersonalizations[team.id] = persResults[0];
          }
        } catch (error) {
          console.error(`Error loading personalization for team ${team.id}:`, error);
        }

        // Obtener progreso de actividad
        if (sessionData.current_activity && sessionStageId) {
          try {
            const progressList = await teamActivityProgressAPI.list({
              team: team.id,
              activity: sessionData.current_activity,
              session_stage: sessionStageId
            });
            const progressResults = Array.isArray(progressList) ? progressList : [progressList];
            if (progressResults.length > 0) {
              const progressData = progressResults[0];
              fetchedProgress[team.id] = progressData;
            }
          } catch (error) {
            console.error(`Error loading progress for team ${team.id}:`, error);
          }
        }
      }

      setPersonalizations(fetchedPersonalizations);
      setActivityProgress(fetchedProgress);

      // Iniciar temporizador si hay actividad actual
      if (sessionData.current_activity && !timerIntervalRef.current) {
        startTimer(sessionData.current_activity, sessionData.id);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error loading game control:', error);
      if (error.response?.status === 401) {
        navigate('/profesor/login');
      } else {
        toast.error('Error al cargar la sesión');
      }
      setLoading(false);
    }
  };

  const startTimer = async (activityId: number, gameSessionId: number) => {
    try {
      const timerData = await sessionsAPI.getActivityTimer(gameSessionId);

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

    if (currentStageNumber === 1) {
      if (currentActivityName.includes('personaliz')) {
        window.location.href = `/profesor/etapa1/personalizacion/${sessionId}/`;
      } else if (currentActivityName.includes('presentaci')) {
        // Ya estamos aquí
        return;
      }
    } else if (currentStageNumber === 2) {
      if (currentActivityName.includes('tema') || currentActivityName.includes('seleccionar')) {
        window.location.href = `/profesor/etapa2/seleccionar-tema/${sessionId}/`;
      } else if (currentActivityName.includes('desafío') || currentActivityName.includes('desafio')) {
                        window.location.href = `/profesor/etapa2/bubble-map/${sessionId}/`;
      } else if (currentActivityName.includes('bubble') || currentActivityName.includes('mapa')) {
        window.location.href = `/profesor/etapa2/bubble-map/${sessionId}/`;
      }
    } else if (currentStageNumber === 3) {
      window.location.href = `/profesor/etapa3/prototipo/${sessionId}/`;
    } else if (currentStageNumber === 4) {
      window.location.href = `/profesor/etapa4/formulario-pitch/${sessionId}/`;
    } else if (sessionData.status === 'finished' || sessionData.status === 'completed') {
      window.location.href = `/profesor/resultados/${sessionId}/?stage_id=${currentStageNumber}`;
    } else {
      navigate('/profesor/panel');
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
        toast.success(`¡${data.message}`, { duration: 2000 });
        setTimeout(() => {
          window.location.replace(`/profesor/resultados/${sessionId}/?stage_id=${data.stage_id}`);
        }, 1500);
      } else {
        const nextActivityName = data.current_activity_name?.toLowerCase() || '';
        toast.success(`¡Avanzando a la actividad de ${nextActivityName}!`, { duration: 2000 });
        setTimeout(() => {
          determineAndRedirect(data);
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al avanzar a la siguiente actividad');
    } finally {
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

  const getShortName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    let lastName = '';
    if (nameParts.length === 2) {
      lastName = nameParts[1];
    } else if (nameParts.length >= 3) {
      lastName = nameParts[nameParts.length - 2];
    }
    return lastName ? `${firstName} ${lastName}`.trim() : firstName || fullName;
  };

  const getInitials = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/);
    const firstInitial = nameParts[0]?.[0]?.toUpperCase() || '';
    const lastInitial = nameParts[nameParts.length - 1]?.[0]?.toUpperCase() || '';
    return firstInitial + (lastInitial && lastInitial !== firstInitial ? lastInitial : '');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Error al cargar la sesión.</p>
          <Button onClick={() => navigate('/profesor/panel')}>Volver al Panel</Button>
        </div>
      </div>
    );
  }

  const completedTeams = teams.filter((team) => {
    const progress = activityProgress[team.id];
    return progress && progress.status === 'completed';
  }).length;

  const inProgressTeams = teams.filter((team) => {
    const progress = activityProgress[team.id];
    return progress && progress.status !== 'completed' && progress.status !== 'pending';
  }).length;

  const totalTeams = teams.length;
  const allTeamsCompleted = totalTeams > 0 && completedTeams === totalTeams;

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
            {allTeamsCompleted && (
              <Button
                onClick={() => handleNextActivity(false)}
                disabled={advancing}
                className="px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold bg-gradient-to-r from-[#093c92] to-[#f757ac] hover:from-[#072e73] hover:to-[#e6498a] text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
              >
                {advancing ? (
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
                disabled={advancing}
                className="px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
                title="Modo Dev: Avanzar sin requisitos"
              >
                {advancing ? (
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
                  <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-1">
                    Presentación / Minijuego
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Sala: <span className="font-bold text-[#093c92]">{gameSession.room_code}</span>
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
                  <h2 className="text-lg sm:text-xl font-bold mb-1">Etapa 1: Trabajo en Equipo</h2>
                  <p className="text-sm sm:text-base opacity-90">
                    {gameSession.current_activity_name || 'Presentación / Minijuego'}
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
                  {totalTeams}
                </div>
                <div className="text-xs sm:text-sm text-blue-800 font-semibold">Equipos Totales</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 sm:p-5 text-center shadow-lg"
              >
                <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-green-700 mb-1">
                  {completedTeams}
                </div>
                <div className="text-xs sm:text-sm text-green-800 font-semibold">Completados</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-4 sm:p-5 text-center shadow-lg"
              >
                <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-yellow-700 mb-1">
                  {inProgressTeams}
                </div>
                <div className="text-xs sm:text-sm text-yellow-800 font-semibold">En Progreso</div>
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
            {teams.map((team, index) => {
              const personalization = personalizations[team.id] || null;
              const progress = activityProgress[team.id] || null;
              const teamKnowsEachOther = personalization?.team_members_know_each_other;

              const isCompleted = progress && progress.status === 'completed';
              const status = isCompleted ? 'completed' : (progress ? 'in-progress' : 'pending');
              const statusText = isCompleted ? 'Listo' : progress ? 'En Progreso' : 'Pendiente';

              // Determinar tipo de actividad
              let activityType = 'unknown';
              let activityDetails = '';

              if (teamKnowsEachOther === true) {
                // Equipo que se conoce → minijuego (anagrama o sopa de letras)
                if (progress) {
                  const responseData = progress.response_data || {};
                  const minigameType = responseData.minigame_type || 'anagrama';
                  const minigamePart = responseData.minigame_part;
                  const correctAnswers = responseData.correct_answers || 0;
                  const totalWords = responseData.total_words || 10;
                  const tokensEarned = responseData.tokens_earned || 0;
                  const progressPercentage = progress.progress_percentage || 0;
                  
                  // Obtener progreso por partes
                  const foundWords = responseData.found_words || [];
                  const correctWords = responseData.correct_words || [];
                  const answers = responseData.answers || [];
                  
                  // Usar siempre los valores del backend cuando estén disponibles
                  const wordSearchWordsFound = responseData.word_search_words_found !== undefined 
                    ? responseData.word_search_words_found 
                    : foundWords.length;
                  
                  // Usar siempre anagram_words_found del backend cuando esté disponible
                  const anagramWordsFound = responseData.anagram_words_found !== undefined 
                    ? responseData.anagram_words_found 
                    : 0;
                  
                  // Usar campos separados para los totales de cada parte del minijuego
                  const wordSearchTotal = responseData.word_search_total_words ?? responseData.total_words ?? 5;
                  const anagramTotal = responseData.anagram_total_words ?? 5;
                  
                  // Determinar qué parte está activa o completada usando los valores del backend
                  const hasWordSearchProgress = wordSearchWordsFound > 0 || foundWords.length > 0;
                  const hasAnagramProgress = anagramWordsFound > 0 || answers.length > 0;
                  
                  // Verificar si las partes están completas usando los valores del backend
                  const wordSearchCompleted = wordSearchWordsFound >= wordSearchTotal;
                  const anagramCompleted = anagramWordsFound >= anagramTotal;
                  
                  // Mostrar el progreso usando siempre los valores del backend
                  const displayAnagramWordsFound = anagramWordsFound;

                  activityType = 'minigame';

                  activityDetails = (
                    <div className="mt-3 text-sm text-gray-700 space-y-2">
                      {/* Parte 1: Sopa de Letras */}
                      <div className={`p-2 rounded-lg border-2 ${
                        wordSearchCompleted 
                          ? 'bg-green-50 border-green-300' 
                          : hasWordSearchProgress 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs">
                            🔍 Parte 1: Sopa de Letras
                          </span>
                          {wordSearchCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        {hasWordSearchProgress ? (
                          <p className="text-xs">
                            <span className="font-medium">Palabras encontradas:</span>{' '}
                            <strong>{wordSearchWordsFound}/{wordSearchTotal}</strong>
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aún no iniciado</p>
                        )}
                      </div>

                      {/* Parte 2: Anagrama */}
                      <div className={`p-2 rounded-lg border-2 ${
                        anagramCompleted 
                          ? 'bg-green-50 border-green-300' 
                          : hasAnagramProgress 
                          ? 'bg-purple-50 border-purple-300' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs">
                            🧩 Parte 2: Anagrama
                          </span>
                          {anagramCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        {hasAnagramProgress ? (
                          <p className="text-xs">
                            <span className="font-medium">Palabras adivinadas:</span>{' '}
                            <strong>{displayAnagramWordsFound}/{anagramTotal}</strong>
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aún no iniciado</p>
                        )}
                      </div>

                      {/* Parte 3: Conocimiento General */}
                      {(() => {
                        const generalKnowledge = responseData.general_knowledge || {};
                        const generalKnowledgeAnswers = generalKnowledge.answers || [];
                        const generalKnowledgeCorrect = generalKnowledge.correct_count || 0;
                        // IMPORTANTE: Siempre usar 5 como total, independientemente de lo que venga del backend
                        // (puede haber datos antiguos con total_questions incorrecto)
                        const generalKnowledgeTotal = 5;
                        const generalKnowledgeCompleted = generalKnowledge.completed || false;
                        const hasGeneralKnowledgeProgress = generalKnowledgeAnswers.length > 0;

                        return (
                          <div className={`p-2 rounded-lg border-2 ${
                            generalKnowledgeCompleted 
                              ? 'bg-green-50 border-green-300' 
                              : hasGeneralKnowledgeProgress 
                              ? 'bg-indigo-50 border-indigo-300' 
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-xs">
                                🧠 Parte 3: Conocimiento General
                              </span>
                              {generalKnowledgeCompleted && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            {hasGeneralKnowledgeProgress ? (
                              <div className="space-y-1">
                                <p className="text-xs">
                                  <span className="font-medium">Preguntas respondidas:</span>{' '}
                                  <strong>{generalKnowledgeAnswers.length}/{generalKnowledgeTotal}</strong>
                                </p>
                                <p className="text-xs">
                                  <span className="font-medium">Respuestas correctas:</span>{' '}
                                  <strong className="text-green-600">{generalKnowledgeCorrect}/{generalKnowledgeTotal}</strong>
                                </p>
                                {generalKnowledgeCompleted && (
                                  <p className="text-xs text-green-600 font-semibold">
                                    ✅ Completado
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic">Aún no iniciado</p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Resumen general */}
                      <div className="pt-2 border-t border-gray-200">
                        {(() => {
                          const generalKnowledge = responseData.general_knowledge || {};
                          const generalKnowledgeCorrect = generalKnowledge.correct_count || 0;
                          const totalTokensFromActivity = wordSearchWordsFound + anagramWordsFound + generalKnowledgeCorrect;
                          
                          return (
                            <>
                              <p className="text-xs">
                                <span className="font-medium">Tokens ganados en esta actividad:</span>{' '}
                                <strong className="text-green-600">{totalTokensFromActivity} tokens</strong>
                                <span className="text-gray-500 ml-1">
                                  ({wordSearchWordsFound} sopa + {displayAnagramWordsFound} anagrama + {generalKnowledgeCorrect} conocimiento)
                                </span>
                              </p>
                              <p className="text-xs">
                                <span className="font-medium">Tokens totales del equipo:</span>{' '}
                                <strong className="text-blue-600">{team.tokens_total || 0} tokens</strong>
                              </p>
                              <p className="text-xs">
                                <span className="font-medium">Progreso total:</span>{' '}
                                <strong>{progressPercentage}%</strong>
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                } else {
                  activityType = 'minigame';
                  activityDetails = (
                    <div className="mt-3 text-sm text-gray-500 space-y-2">
                      <p className="italic">Aún no ha iniciado el minijuego</p>
                      <div className="text-xs space-y-1">
                        <p>🔍 Parte 1: Sopa de Letras - Pendiente</p>
                        <p>🧩 Parte 2: Anagrama - Pendiente</p>
                        <p>🧠 Parte 3: Conocimiento General - Pendiente</p>
                      </div>
                    </div>
                  );
                }
              } else if (teamKnowsEachOther === false) {
                // Equipo que NO se conoce → actividad de presentación (3 partes)
                activityType = 'presentation';
                
                if (progress) {
                  const responseData = progress.response_data || {};
                  const part1Completed = responseData.part1_completed || false;
                  const chaosData = responseData.chaos || {};
                  const chaosCompleted = chaosData.completed || false;
                  const chaosQuestionsAnswered = chaosData.questions_answered || 0;
                  const generalKnowledge = responseData.general_knowledge || {};
                  const generalKnowledgeAnswers = generalKnowledge.answers || [];
                  const generalKnowledgeCorrect = generalKnowledge.correct_count || 0;
                  // IMPORTANTE: Siempre usar 5 como total, independientemente de lo que venga del backend
                  // (puede haber datos antiguos con total_questions incorrecto)
                  const generalKnowledgeTotal = 5;
                  const generalKnowledgeCompleted = generalKnowledge.completed || false;
                  const hasGeneralKnowledgeProgress = generalKnowledgeAnswers.length > 0;
                  
                  activityDetails = (
                    <div className="mt-3 text-sm text-gray-700 space-y-2">
                      {/* Parte 1: Presentación */}
                      <div className={`p-2 rounded-lg border-2 ${
                        part1Completed 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs">
                            👋 Parte 1: Presentación
                          </span>
                          {part1Completed && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        {part1Completed ? (
                          <p className="text-xs text-green-600 font-semibold">✅ Completado</p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aún no iniciado</p>
                        )}
                      </div>

                      {/* Parte 2: Caos */}
                      <div className={`p-2 rounded-lg border-2 ${
                        chaosCompleted 
                          ? 'bg-green-50 border-green-300' 
                          : chaosQuestionsAnswered > 0 
                          ? 'bg-purple-50 border-purple-300' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs">
                            🎲 Parte 2: Preguntas del Caos
                          </span>
                          {chaosCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        {chaosQuestionsAnswered > 0 || chaosCompleted ? (
                          <p className="text-xs">
                            <span className="font-medium">Preguntas respondidas:</span>{' '}
                            <strong>{chaosCompleted ? 5 : chaosQuestionsAnswered}/5</strong>
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aún no iniciado</p>
                        )}
                      </div>

                      {/* Parte 3: Conocimiento General */}
                      <div className={`p-2 rounded-lg border-2 ${
                        generalKnowledgeCompleted 
                          ? 'bg-green-50 border-green-300' 
                          : hasGeneralKnowledgeProgress 
                          ? 'bg-indigo-50 border-indigo-300' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs">
                            🧠 Parte 3: Conocimiento General
                          </span>
                          {generalKnowledgeCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        {hasGeneralKnowledgeProgress ? (
                          <div className="space-y-1">
                            <p className="text-xs">
                              <span className="font-medium">Preguntas respondidas:</span>{' '}
                              <strong>{generalKnowledgeAnswers.length}/{generalKnowledgeTotal}</strong>
                            </p>
                            <p className="text-xs">
                              <span className="font-medium">Respuestas correctas:</span>{' '}
                              <strong className="text-green-600">{generalKnowledgeCorrect}/{generalKnowledgeTotal}</strong>
                            </p>
                            {generalKnowledgeCompleted && (
                              <p className="text-xs text-green-600 font-semibold">
                                ✅ Completado
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aún no iniciado</p>
                        )}
                      </div>

                      {/* Resumen general */}
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs">
                          <span className="font-medium">Tokens ganados en esta actividad:</span>{' '}
                          <strong className="text-green-600">
                            {(part1Completed ? 5 : 0) + (chaosCompleted ? 5 : 0) + generalKnowledgeCorrect} tokens
                          </strong>
                          <span className="text-gray-500 ml-1">
                            ({part1Completed ? 5 : 0} presentación + {chaosCompleted ? 5 : 0} caos + {generalKnowledgeCorrect} conocimiento)
                          </span>
                        </p>
                        <p className="text-xs">
                          <span className="font-medium">Tokens totales del equipo:</span>{' '}
                          <strong className="text-blue-600">{team.tokens_total || 0} tokens</strong>
                        </p>
                        <p className="text-xs">
                          <span className="font-medium">Progreso total:</span>{' '}
                          <strong>{progress.progress_percentage || 0}%</strong>
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  activityType = 'presentation';
                  activityDetails = (
                    <div className="mt-3 text-sm text-gray-500 space-y-2">
                      <p className="italic">Aún no ha iniciado la presentación</p>
                      <div className="text-xs space-y-1">
                        <p>👋 Parte 1: Presentación - Pendiente</p>
                        <p>🎲 Parte 2: Preguntas del Caos - Pendiente</p>
                        <p>🧠 Parte 3: Conocimiento General - Pendiente</p>
                      </div>
                    </div>
                  );
                }
              } else {
                // Aún no se ha definido
                activityType = 'pending';
                activityDetails = <p className="mt-3 text-sm text-gray-500 italic">Aún no ha iniciado la actividad</p>;
              }

              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={`bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 sm:p-5 shadow-lg border-2 ${
                    isCompleted ? 'border-green-400 shadow-green-200/50' : 'border-gray-200'
                  } transition-all duration-200`}
                >
                  {/* Header del equipo mejorado */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg flex-shrink-0"
                        style={{ 
                          backgroundColor: getTeamColorHex(team.color),
                          backgroundImage: `linear-gradient(135deg, ${getTeamColorHex(team.color)} 0%, ${getTeamColorHex(team.color)}dd 100%)`
                        }}
                      >
                        {team.color.charAt(0).toUpperCase()}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">
                          {personalizations[team.id]?.team_name 
                            ? `Equipo ${personalizations[team.id].team_name}` 
                            : team.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {team.students_count} {team.students_count === 1 ? 'estudiante' : 'estudiantes'}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 flex-shrink-0 ${
                        status === 'completed'
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                          : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                      }`}
                    >
                      {status === 'completed' && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                      {statusText}
                    </motion.div>
                  </div>

                  {/* Detalles de actividad mejorados */}
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#093c92]" />
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">
                          {activityType === 'minigame' ? (
                            <>🎮 Minijuego (Sopa de Letras + Anagrama + Conocimiento General)</>
                          ) : activityType === 'presentation' ? (
                            <>👋 Presentación (Presentación + Caos + Conocimiento General)</>
                          ) : (
                            <>⏳ Esperando</>
                          )}
                        </span>
                      </div>
                      {activityDetails}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </div>
          </motion.div>
        </div>
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

      {/* Música de fondo */}
    </div>
  );
}


