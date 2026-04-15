import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Clock, ArrowRight, Users, CheckCircle2, Eye, X, Sparkles, Lightbulb, XCircle, Target, UserCircle, Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GroupBadge } from '@/components/GroupBadge';
import { EtapaIntroModal } from '@/components/EtapaIntroModal';
import { sessionsAPI, challengesAPI, teamBubbleMapsAPI, teamPersonalizationsAPI, teamActivityProgressAPI } from '@/services';
import { toast } from 'sonner';
import { isDevMode } from '@/utils/devMode';
import { useGameStateRedirect } from '@/hooks/useGameStateRedirect';

interface Team {
  id: number;
  name: string;
  color: string;
  tokens_total: number;
}

// Nueva estructura de datos basada en Figma
interface Answer {
  id: number;
  text: string;
}

interface Question {
  id: number;
  question: string;
  answers: Answer[];
  isOptional: boolean;
}

interface BubbleMapData {
  central: {
    personName: string;
    profileImage?: string;
  };
  questions: Question[];
}

interface BubbleMap {
  id: number;
  team: number;
  map_data: BubbleMapData | {
    // Compatibilidad con estructura antigua
    nodes?: any[];
    edges?: any[];
  };
  created_at: string;
  updated_at: string;
}

interface TeamWithMap {
  team: Team;
  bubbleMap: BubbleMap | null;
}

export function ProfesorBubbleMap() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // Redirigir automáticamente si el juego está en otro estado
  useGameStateRedirect();
  
  const [loading, setLoading] = useState(true);
  const [teamsWithMaps, setTeamsWithMaps] = useState<TeamWithMap[]>([]);
  const [gameSession, setGameSession] = useState<any>(null);
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [currentSessionStage, setCurrentSessionStage] = useState<any>(null);
  const [timerRemaining, setTimerRemaining] = useState<string>('--:--');
  const [allTeamsCompleted, setAllTeamsCompleted] = useState(false);
  const [previewMap, setPreviewMap] = useState<{ team: Team; bubbleMap: BubbleMap } | null>(null);
  const [showEtapaIntro, setShowEtapaIntro] = useState(false);
  const [personalizations, setPersonalizations] = useState<Record<number, { team_name?: string }>>({});
  const [teamChallenges, setTeamChallenges] = useState<Record<number, { persona_name?: string; persona_image_url?: string }>>({});
  
  // Tamaño fijo para el bubble map (sin zoom)
  const BUBBLE_MAP_SIZE = { width: 1000, height: 1000 };

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartTimeRef = useRef<number | null>(null);
  const timerDurationRef = useRef<number | null>(null);

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
      if (timerSyncIntervalRef.current) clearInterval(timerSyncIntervalRef.current);
    };
  }, [sessionId, navigate]);

  // Función helper para obtener URL de imagen
  const getImageUrl = (imageSrc: string): string => {
    if (!imageSrc) return '';
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      return imageSrc;
    }
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    return `${baseUrl}${imageSrc.startsWith('/') ? '' : '/'}${imageSrc}`;
  };
  
  // Función para renderizar el Bubble Map en formato de lista (igual que tablets)
  const renderBubbleMap = (mapData: any, teamColor: string, teamId: number) => {
    const isNewStructure = mapData && 'questions' in mapData;
    
    if (isNewStructure) {
      const data = mapData as BubbleMapData;
      const questions = data.questions || [];
      const personName = data.central?.personName || 'Persona';
      let profileImageRaw = data.central?.profileImage || '';
      
      // Si no hay imagen en los datos guardados, usar la del desafío seleccionado
      if (!profileImageRaw && teamChallenges[teamId]) {
        profileImageRaw = teamChallenges[teamId].persona_image_url || '';
      }
      
      const profileImage = getImageUrl(profileImageRaw);
      
      return (
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header con persona */}
          <div className="flex-shrink-0 flex flex-col items-center py-3 px-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-xl overflow-hidden border-3 border-white relative" style={{ background: 'linear-gradient(135deg, #f757ac 0%, #d946a0 100%)' }}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={personName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center bg-white ${profileImage ? 'hidden' : ''}`}>
                <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
            </div>
            <div className="mt-2 px-3 py-1 rounded-full shadow-md text-center" style={{ background: '#f757ac' }}>
              <span className="text-white font-semibold text-sm sm:text-base">{personName}</span>
            </div>
          </div>
          
          {/* Lista scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-3">
            {questions.map((question) => (
              <div key={question.id} className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-lg border border-white/50 relative">
                {/* Question Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0 shadow-sm"></span>
                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Pregunta</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 leading-tight">{question.question}</h3>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-inner">
                  {/* Scrollable Answers List */}
                  <ul className="max-h-48 overflow-y-auto p-3 space-y-2 min-h-[60px]">
                    {question.answers.length === 0 && (
                      <li className="text-sm text-gray-400 italic text-center py-2">Sin respuestas</li>
                    )}
                    {question.answers.map((answer, idx) => (
                      <li key={answer.id || idx} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-purple-600 font-bold text-lg leading-none mt-0.5">•</span>
                        <span className="text-sm text-gray-700 flex-1 font-medium leading-snug">{answer.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      // Estructura antigua (compatibilidad)
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Formato de bubble map no compatible</p>
        </div>
      );
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

  const loadGameControl = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/profesor/login');
        return;
      }

      const sessionData = await sessionsAPI.getById(sessionId);
      setGameSession(sessionData);

      // Verificar si debemos mostrar la intro de la etapa
      if (sessionData.current_stage_number === 2) {
        const introKey = `etapa_intro_${sessionId}_2`;
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
        setTimeout(() => navigate(`/profesor/lobby/${sessionId}`), 2000);
        return;
      }

      const currentStageNumber = sessionData.current_stage_number;
      const currentActivityId = sessionData.current_activity;
      const currentActivityName = sessionData.current_activity_name?.toLowerCase() || '';

      // Redirection logic if not in Stage 2 or not bubble map activity
      if (currentStageNumber !== 2) {
        toast.info('El juego no está en la Etapa 2. Redirigiendo...');
        setTimeout(() => navigate(`/profesor/panel`), 2000);
        return;
      }

      const isBubbleMapActivity = currentActivityName.includes('bubble') || 
        currentActivityName.includes('mapa') || 
        currentActivityName.includes('mapa mental');

      if (!isBubbleMapActivity && currentActivityId) {
        // Not bubble map activity, redirect based on activity name
        if (currentActivityName.includes('tema') || currentActivityName.includes('seleccionar')) {
          setTimeout(() => navigate(`/profesor/etapa2/seleccionar-tema/${sessionId}`), 2000);
        }
        setLoading(false);
        return;
      }

      // If no current activity in Stage 2, it means stage is completed, redirect to results
      if (!currentActivityId && currentStageNumber === 2) {
        toast.info('Etapa 2 completada. Redirigiendo a resultados...');
        setTimeout(() => navigate(`/profesor/resultados/${sessionId}`), 2000);
        setLoading(false);
        return;
      }

      // Si no hay actividad actual pero estamos en etapa 2, puede ser que aún no se haya iniciado
      if (!currentActivityId) {
        setLoading(false);
        return;
      }

      // Fetch current activity details
      if (currentActivityId) {
        const activityData = await challengesAPI.getActivityById(currentActivityId);
        setCurrentActivity(activityData);
      }

      // Fetch current session stage
      const stages = await sessionsAPI.getSessionStages(Number(sessionId));
      const stagesList = Array.isArray(stages) ? stages : [stages];
      const stage2 = stagesList.find((s: any) => s.stage_number === 2);
      setCurrentSessionStage(stage2);

      if (stage2) {
        await loadBubbleMaps(stage2.id);
      }

      // Start timer
      if (currentActivityId) {
        startTimer(currentActivityId, parseInt(sessionId));
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error loading game control:', error);
      toast.error('Error al cargar el control del juego: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  const loadBubbleMaps = async (sessionStageId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch teams
      const teams = await sessionsAPI.getTeams(sessionId);
      const teamsArray: Team[] = Array.isArray(teams) ? teams : [teams];

      // Fetch personalizations for all teams
      const persMap: Record<number, { team_name?: string }> = {};
      for (const team of teamsArray) {
        try {
          const persList = await teamPersonalizationsAPI.list({ team: team.id });
          const persResults = Array.isArray(persList) ? persList : [persList];
          if (persResults.length > 0 && persResults[0].team_name) {
            persMap[team.id] = { team_name: persResults[0].team_name };
          }
        } catch (error) {
          console.error(`Error loading personalization for team ${team.id}:`, error);
        }
      }
      setPersonalizations(persMap);

      // Fetch bubble maps and challenges for each team
      const teamsWithMapsPromises = teamsArray.map(async (team) => {
        try {
          const mapList = await teamBubbleMapsAPI.list({
            team: team.id,
            session_stage: sessionStageId
          });
          const mapArray = Array.isArray(mapList) ? mapList : [mapList];
          const bubbleMap = mapArray[0] || null;
          
          // Cargar desafío seleccionado para este equipo
          try {
            const progressList = await teamActivityProgressAPI.list({
              team: team.id,
              session_stage: sessionStageId
            });
            const progressArray = Array.isArray(progressList) ? progressList : [progressList];
            const progress = progressArray[0];
            
            if (progress?.selected_challenge) {
              let challenge = typeof progress.selected_challenge === 'object' 
                ? progress.selected_challenge 
                : { id: progress.selected_challenge };
              
              // Si solo viene el ID, cargar desde la API
              if (!challenge.persona_name || !challenge.persona_image_url) {
                challenge = await challengesAPI.getChallengeById(challenge.id);
              }
              
              setTeamChallenges(prev => ({
                ...prev,
                [team.id]: {
                  persona_name: challenge.persona_name,
                  persona_image_url: challenge.persona_image_url
                }
              }));
            }
          } catch (error) {
            console.error(`Error loading challenge for team ${team.id}:`, error);
          }
          
          return { team, bubbleMap };
        } catch (error) {
          console.error(`Error loading bubble map for team ${team.id}:`, error);
          return { team, bubbleMap: null };
        }
      });

      const teamsWithMaps = await Promise.all(teamsWithMapsPromises);
      setTeamsWithMaps(teamsWithMaps);

      // Check if all teams have completed
      const allCompleted = teamsWithMaps.every(({ bubbleMap }) => {
        const status = getBubbleMapStatus(bubbleMap);
        return status.status === 'completed';
      });
      setAllTeamsCompleted(allCompleted);
    } catch (error) {
      console.error('Error loading bubble maps:', error);
    }
  };

  const syncTimer = async (gameSessionId: number) => {
    try {
      const timerData = await sessionsAPI.getActivityTimer(gameSessionId);

      if (timerData.error || !timerData.timer_duration) {
        setTimerRemaining('--:--');
        return;
      }

      const timerDuration = timerData.timer_duration;
      const startTime = timerData.started_at
        ? new Date(timerData.started_at).getTime()
        : new Date(timerData.current_time).getTime();

      // Actualizar referencias
      timerStartTimeRef.current = startTime;
      timerDurationRef.current = timerDuration;
      
      // Actualizar display inmediatamente
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      setTimerRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    } catch (error) {
      console.error('Error syncing timer:', error);
      setTimerRemaining('--:--');
    }
  };

  const startTimer = async (activityId: number, gameSessionId: number) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (timerSyncIntervalRef.current) {
      clearInterval(timerSyncIntervalRef.current);
      timerSyncIntervalRef.current = null;
    }

    try {
      // Sincronizar inicialmente
      await syncTimer(gameSessionId);

      if (!timerStartTimeRef.current || !timerDurationRef.current) {
        return;
      }

      const updateTimer = () => {
        if (!timerStartTimeRef.current || !timerDurationRef.current) return;

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
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);

      // Sincronizar periódicamente cada 5 segundos
      timerSyncIntervalRef.current = setInterval(() => {
        syncTimer(gameSessionId);
      }, 5000);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleNextActivity = async (skipRequirements: boolean = false) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await sessionsAPI.nextActivity(sessionId);

      if (data.stage_completed) {
        toast.success('¡Etapa 2 completada! Redirigiendo a resultados...');
        setTimeout(() => navigate(`/profesor/resultados/${sessionId}`), 1500);
      } else {
        toast.success('¡Avanzando a la siguiente actividad!');
        // Redirect based on the next activity name
        const nextActivityName = data.current_activity_name?.toLowerCase() || '';
        if (nextActivityName.includes('tema') || nextActivityName.includes('seleccionar')) {
          setTimeout(() => navigate(`/profesor/etapa2/seleccionar-tema/${sessionId}`), 1500);
        } else {
          // Fallback, reload current page
          setTimeout(() => loadGameControl(), 1500);
        }
      }
    } catch (error: any) {
      toast.error('Error al avanzar a la siguiente actividad: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getBubbleMapStatus = (bubbleMap: BubbleMap | null) => {
    if (!bubbleMap) {
      return { text: 'Pendiente', class: 'bg-yellow-100 text-yellow-800', status: 'pending' };
    }
    
    // Nueva estructura: preguntas y respuestas
    if ('questions' in (bubbleMap.map_data || {})) {
      const data = bubbleMap.map_data as BubbleMapData;
      const questions = data.questions || [];
      
      if (questions.length === 0) {
        return { text: 'Pendiente', class: 'bg-yellow-100 text-yellow-800', status: 'pending' };
      }
      
      // Obtener las 5 preguntas obligatorias (las que no son opcionales)
      const mandatoryQuestions = questions.filter(q => !q.isOptional);
      
      // Considerar completado si tiene al menos 5 preguntas obligatorias y cada una tiene al menos 2 respuestas
      const hasMinimumContent = mandatoryQuestions.length >= 5 && mandatoryQuestions.every(q => q.answers.length >= 2);
      if (hasMinimumContent) {
        return { text: 'Completado', class: 'bg-green-100 text-green-800', status: 'completed' };
      }
      
      return { text: 'En Progreso', class: 'bg-blue-100 text-blue-800', status: 'in_progress' };
    }
    
    // Estructura antigua (compatibilidad)
    const nodes = (bubbleMap.map_data as any)?.nodes || [];
    if (nodes.length === 0) {
      return { text: 'Pendiente', class: 'bg-yellow-100 text-yellow-800', status: 'pending' };
    }
    if (nodes.length >= 11) {
      return { text: 'Completado', class: 'bg-green-100 text-green-800', status: 'completed' };
    }
    return { text: 'En Progreso', class: 'bg-blue-100 text-blue-800', status: 'in_progress' };
  };

  if (loading && teamsWithMaps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Fondo animado - Igual que Panel.tsx */}
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


      <div className="relative z-10 p-3 sm:p-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-3 sm:gap-4">
          {/* Botón Continuar - Arriba */}
          <div className="w-full mb-2 sm:mb-3 z-20 flex justify-center gap-2 flex-shrink-0">
            {allTeamsCompleted && (
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
                  <Lightbulb className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-1">
                    Bubble Map
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
                    {currentActivity?.name || 'Bubble Map'}
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
                  {teamsWithMaps.length}
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
                  {teamsWithMaps.filter(({ bubbleMap }) => getBubbleMapStatus(bubbleMap).status === 'completed').length}
                </div>
                <div className="text-xs sm:text-sm text-green-800 font-semibold">Bubble Maps Completados</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4 sm:p-5 text-center shadow-lg"
              >
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">
                  {teamsWithMaps.reduce((total, { bubbleMap }) => {
                    if (!bubbleMap) return total;
                    if ('questions' in (bubbleMap.map_data || {})) {
                      const data = bubbleMap.map_data as BubbleMapData;
                      const questions = data.questions || [];
                      return total + questions.reduce((sum, q) => sum + q.answers.length, 0);
                    }
                    const nodes = (bubbleMap.map_data as any)?.nodes || [];
                    return total + nodes.length;
                  }, 0)}
                </div>
                <div className="text-xs sm:text-sm text-purple-800 font-semibold">Total de Respuestas</div>
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
                Equipos <span className="text-gray-500 font-normal text-base sm:text-lg">({teamsWithMaps.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {teamsWithMaps.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 text-sm sm:text-base">Cargando estado de los equipos...</p>
                </div>
              ) : (
                teamsWithMaps.map(({ team, bubbleMap }, index) => {
                  const status = getBubbleMapStatus(bubbleMap);
                  const teamColor = getTeamColorHex(team.color);
                  const isCompleted = status.status === 'completed';
                  
                  // Obtener estadísticas según la estructura
                  let totalAnswers = 0;
                  let totalQuestions = 0;
                  if (bubbleMap && 'questions' in (bubbleMap.map_data || {})) {
                    const data = bubbleMap.map_data as BubbleMapData;
                    totalQuestions = data.questions?.length || 0;
                    totalAnswers = data.questions?.reduce((sum, q) => sum + q.answers.length, 0) || 0;
                  } else {
                    const nodes = (bubbleMap?.map_data as any)?.nodes || [];
                    totalAnswers = nodes.length;
                  }

                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all hover:shadow-xl ${
                        isCompleted ? 'border-green-400' : 'border-gray-200'
                      }`}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-md"
                              style={{ backgroundColor: teamColor }}
                            >
                              {team.color.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-[#093c92] text-base sm:text-lg">
                                {personalizations[team.id]?.team_name 
                                  ? `Equipo ${personalizations[team.id].team_name}` 
                                  : team.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Equipo {team.color}
                              </p>
                            </div>
                          </div>
                          {isCompleted && (
                            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-green-500 flex-shrink-0" />
                          )}
                        </div>

                        <div className="mb-3 sm:mb-4">
                          <Badge className={`text-xs sm:text-sm font-semibold ${status.class}`}>
                            {status.text}
                          </Badge>
                        </div>

                        {totalAnswers > 0 || totalQuestions > 0 ? (
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs sm:text-sm">
                                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                {totalQuestions} {totalQuestions === 1 ? 'pregunta' : 'preguntas'} • {totalAnswers} {totalAnswers === 1 ? 'respuesta' : 'respuestas'}
                              </Badge>
                              <Badge 
                                className="text-xs sm:text-sm text-white border-0"
                                style={{ backgroundColor: teamColor }}
                              >
                                {team.tokens_total || 0} tokens
                              </Badge>
                            </div>
                            {bubbleMap && (totalAnswers > 0 || totalQuestions > 0) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full rounded-lg border-2 hover:bg-gray-50"
                                onClick={() => setPreviewMap({ team, bubbleMap })}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Bubble Map
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-4 sm:p-5 text-center">
                            <p className="text-gray-400 text-sm sm:text-base italic">
                              Aún no ha creado burbujas
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Vista Previa */}
      {previewMap && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewMap(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          >
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-6xl w-full max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <GroupBadge 
                    name={previewMap.team.name} 
                    color={getTeamColorHex(previewMap.team.color)} 
                    size="large"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewMap(null)}
                    className="rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Bubble Map Preview - formato de lista como tablets */}
              <div 
                className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 sm:p-8 border-4 mb-4 shadow-lg"
                style={{ 
                  borderColor: getTeamColorHex(previewMap.team.color),
                  minHeight: '600px',
                  height: '70vh',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {renderBubbleMap(previewMap.bubbleMap.map_data, getTeamColorHex(previewMap.team.color), previewMap.team.id)}
              </div>

              <div className="text-center p-4 border-t bg-gray-50">
                <Badge variant="outline" className="text-base px-6 py-2">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {(() => {
                    const mapData = previewMap.bubbleMap.map_data;
                    if (mapData && 'questions' in mapData) {
                      const data = mapData as BubbleMapData;
                      const totalAnswers = data.questions?.reduce((sum, q) => sum + q.answers.length, 0) || 0;
                      return `${data.questions?.length || 0} preguntas • ${totalAnswers} respuestas`;
                    }
                    const nodes = (mapData as any)?.nodes || [];
                    return `${nodes.length} ideas totales`;
                  })()}
                </Badge>
              </div>
            </div>
          </motion.div>
        </>
      )}

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
    </div>
  );
}

