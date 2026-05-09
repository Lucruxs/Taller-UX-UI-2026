import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Clock, ArrowRight, Users, CheckCircle2, FileText, Eye, X, Target, XCircle, Coins, Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GroupBadge } from '@/components/GroupBadge';
import { EtapaIntroModal } from '@/components/EtapaIntroModal';
import { sessionsAPI, challengesAPI, teamActivityProgressAPI, teamPersonalizationsAPI } from '@/services';
import { toast } from 'sonner';
import { isDevMode } from '@/utils/devMode';
import { useGameStateRedirect } from '@/hooks/useGameStateRedirect';

interface Team {
  id: number;
  name: string;
  color: string;
}

interface TeamPitch {
  team: Team;
  progress: {
    id: number;
    pitch_intro_problem: string | null;
    pitch_solution: string | null;
    pitch_value: string | null;
    pitch_impact: string | null;
    pitch_closing: string | null;
    status: string;
    progress_percentage: number;
  } | null;
}

interface GameSession {
  id: number;
  room_code: string;
  current_activity: number | null;
  current_activity_name: string | null;
}

export function ProfesorFormularioPitch() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // Redirigir automáticamente si el juego está en otro estado
  useGameStateRedirect();
  
  const [loading, setLoading] = useState(true);
  const [teamsWithPitch, setTeamsWithPitch] = useState<TeamPitch[]>([]);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [currentSessionStage, setCurrentSessionStage] = useState<any>(null);
  const [timerRemaining, setTimerRemaining] = useState<string>('--:--');
  const [allTeamsCompleted, setAllTeamsCompleted] = useState(false);
  const [previewTeam, setPreviewTeam] = useState<TeamPitch | null>(null);
  const [showEtapaIntro, setShowEtapaIntro] = useState(false);
  const [personalizations, setPersonalizations] = useState<Record<number, { team_name?: string }>>({});

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartTimeRef = useRef<number | null>(null);
  const timerDurationRef = useRef<number | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadGameControl();
      intervalRef.current = setInterval(() => {
        loadGameControl();
      }, 5000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (timerSyncIntervalRef.current) clearInterval(timerSyncIntervalRef.current);
      };
    }
  }, [sessionId]);

  const loadGameControl = async () => {
    if (!sessionId) return;

    try {
      const sessionData: GameSession = await sessionsAPI.getById(sessionId);
      setGameSession(sessionData);

      // Verificar si debemos mostrar la intro de la etapa
      if (sessionData.current_stage_number === 4) {
        const introKey = `etapa_intro_${sessionId}_4`;
        const hasSeenIntro = localStorage.getItem(introKey);
        if (!hasSeenIntro) {
          setShowEtapaIntro(true);
        }
      }

      const currentStageNumber = sessionData.current_stage_number || 1;
      if (currentStageNumber !== 4) {
        if (currentStageNumber === 3) {
          window.location.replace(`/profesor/etapa3/prototipo/${sessionId}/`);
        } else if (currentStageNumber === 2) {
          window.location.replace(`/profesor/etapa2/seleccionar-tema/${sessionId}/`);
        } else {
          window.location.replace(`/profesor/etapa1/personalizacion/${sessionId}/`);
        }
        return;
      }

      if (sessionData.current_activity) {
        const activityData = await challengesAPI.getActivityById(sessionData.current_activity);
        setCurrentActivity(activityData);

        const stagesData = await sessionsAPI.getSessionStages(Number(sessionId));
        const sessionStages = Array.isArray(stagesData) ? stagesData : [stagesData];
        const sessionStage = sessionStages.find((s: any) => s.stage_number === 4) || null;

        if (sessionStage) {
          setCurrentSessionStage(sessionStage);
          await loadTeamsPitch(sessionId, sessionData.current_activity, sessionStage.id);
          startTimer(sessionData.current_activity, parseInt(sessionId));
        }
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

  const loadTeamsPitch = async (gameSessionId: string, activityId: number, sessionStageId: number) => {
    try {
      const teams = await sessionsAPI.getTeams(gameSessionId);
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

      const teamsWithProgress: TeamPitch[] = await Promise.all(
        teamsArray.map(async (team) => {
          try {
            const progressList = await teamActivityProgressAPI.list({
              team: team.id,
              activity: activityId,
              session_stage: sessionStageId
            });
            const progressArray = Array.isArray(progressList) ? progressList : [progressList];
            const progress = progressArray[0] || null;

            return {
              team,
              progress,
            };
          } catch (error) {
            return {
              team,
              progress: null,
            };
          }
        })
      );

      setTeamsWithPitch(teamsWithProgress);
      const allCompleted = teamsWithProgress.every(
        (item) => item.progress && item.progress.status === 'completed'
      );
      setAllTeamsCompleted(allCompleted);
    } catch (error) {
      console.error('Error loading teams pitch:', error);
    }
  };

  const startTimer = async (activityId: number, gameSessionId: number) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
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

      timerSyncIntervalRef.current = setInterval(async () => {
        try {
          const syncData = await sessionsAPI.getActivityTimer(gameSessionId);
          if (syncData.started_at && syncData.timer_duration) {
            timerStartTimeRef.current = new Date(syncData.started_at).getTime();
            timerDurationRef.current = syncData.timer_duration;
          }
        } catch (error) {
          console.error('Error syncing timer:', error);
        }
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
        navigate(`/profesor/resultados/${sessionId}/?stage_id=${data.stage_id}`);
      } else {
        // Verificar si la siguiente actividad es de presentación
        const sessionData = await sessionsAPI.getById(sessionId);
        
        // Si estamos en Etapa 4 y la siguiente actividad es de presentación, redirigir
        if (sessionData.current_stage_number === 4) {
          const currentActivityName = sessionData.current_activity_name?.toLowerCase() || '';
          if (currentActivityName.includes('presentacion') || currentActivityName.includes('presentación')) {
            navigate(`/profesor/etapa4/presentacion-pitch/${sessionId}`);
            return;
          }
        }
        
        // Por defecto, recargar la página
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error advancing activity:', error);
      toast.error('Error al avanzar: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
      setLoading(false);
    }
  };

  const handlePreview = (teamPitch: TeamPitch) => {
    setPreviewTeam(teamPitch);
  };

  const handleClosePreview = () => {
    setPreviewTeam(null);
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

  const getStatusBadge = (status: string, progress: number) => {
    if (status === 'completed') {
      return { text: 'Completado', class: 'bg-green-100 text-green-800', status: 'completed' };
    } else if (status === 'in_progress') {
      return { text: `En Progreso (${progress}%)`, class: 'bg-yellow-100 text-yellow-800', status: 'in_progress' };
    } else {
      return { text: 'Pendiente', class: 'bg-gray-100 text-gray-800', status: 'pending' };
    }
  };

  if (loading && !gameSession) {
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
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-1">
                    Formulario de Pitch
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
                  <h2 className="text-lg sm:text-xl font-bold mb-1">Etapa 4: Comunicación</h2>
                  <p className="text-sm sm:text-base opacity-90">
                    {currentActivity?.name || 'Formulario de Pitch'}
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
                  {teamsWithPitch.length}
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
                  {teamsWithPitch.filter((tp) => tp.progress?.status === 'completed').length}
                </div>
                <div className="text-xs sm:text-sm text-green-800 font-semibold">Pitches Completados</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4 sm:p-5 text-center shadow-lg"
              >
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">
                  {teamsWithPitch.filter((tp) => tp.progress && tp.progress.status !== 'pending').length}
                </div>
                <div className="text-xs sm:text-sm text-purple-800 font-semibold">En Progreso</div>
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
                Equipos <span className="text-gray-500 font-normal text-base sm:text-lg">({teamsWithPitch.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {teamsWithPitch.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 text-sm sm:text-base">Cargando estado de los equipos...</p>
                </div>
              ) : (
                teamsWithPitch.map((teamPitch, index) => {
                  const hasPitch = teamPitch.progress !== null;
                  const isCompleted = teamPitch.progress?.status === 'completed';
                  const progress = teamPitch.progress?.progress_percentage || 0;
                  const statusInfo = getStatusBadge(teamPitch.progress?.status || 'pending', progress);
                  const teamColor = getTeamColorHex(teamPitch.team.color);

                  return (
                    <motion.div
                      key={teamPitch.team.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className={`bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 sm:p-5 shadow-lg border-2 ${
                        isCompleted ? 'border-green-400 shadow-green-200/50' : 'border-gray-200'
                      } transition-all duration-200`}
                    >
                      {/* Header del Equipo */}
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
                            {teamPitch.team.color.charAt(0).toUpperCase()}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate mb-1">
                              {personalizations[teamPitch.team.id]?.team_name 
                                ? `Equipo ${personalizations[teamPitch.team.id].team_name}` 
                                : teamPitch.team.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Equipo {teamPitch.team.color}
                            </p>
                          </div>
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-green-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* Estado */}
                      <div className="mb-3 sm:mb-4">
                        <Badge className={`text-xs sm:text-sm font-semibold ${statusInfo.class}`}>
                          {statusInfo.text}
                        </Badge>
                      </div>

                      {hasPitch && (
                        <>
                          {/* Barra de Progreso */}
                          <div className="mb-3 sm:mb-4">
                            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1.5">
                              <span className="font-semibold">Progreso</span>
                              <span className="font-bold">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                  isCompleted ? 'bg-green-500' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Checklist de Secciones */}
                          <div className="space-y-2 mb-3 sm:mb-4 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-700 font-medium">Problema:</span>
                              {teamPitch.progress?.pitch_intro_problem ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-700 font-medium">Solución:</span>
                              {teamPitch.progress?.pitch_solution ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-700 font-medium">Valor:</span>
                              {teamPitch.progress?.pitch_value ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-700 font-medium">Impacto:</span>
                              {teamPitch.progress?.pitch_impact ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-700 font-medium">Cierre:</span>
                              {teamPitch.progress?.pitch_closing ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>

                          <Button
                            onClick={() => handlePreview(teamPitch)}
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg border-2 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Pitch Completo
                          </Button>
                        </>
                      )}

                      {!hasPitch && (
                        <div className="text-center text-gray-500 text-xs sm:text-sm py-4 bg-gray-50 rounded-lg">
                          Aún no ha completado el formulario
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTeam && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClosePreview}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={handleClosePreview}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <h3 className="text-2xl font-bold text-[#093c92]">
                    Pitch de {personalizations[previewTeam.team.id]?.team_name 
                      ? `Equipo ${personalizations[previewTeam.team.id].team_name}` 
                      : previewTeam.team.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Equipo {previewTeam.team.color}
                  </p>
                </div>
                <Button onClick={handleClosePreview} variant="ghost" size="sm" className="hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {previewTeam.progress ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-lg text-[#093c92] mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5" /> Problema
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap min-h-[100px] border border-gray-200">
                      {previewTeam.progress.pitch_intro_problem || (
                        <span className="text-gray-400 italic">No completado</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-lg text-[#093c92] mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Solución
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap min-h-[100px] border border-gray-200">
                      {previewTeam.progress.pitch_solution || (
                        <span className="text-gray-400 italic">No completado</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-lg text-[#093c92] mb-3 flex items-center gap-2">
                      <Coins className="w-5 h-5" /> Valor
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap min-h-[100px] border border-gray-200">
                      {previewTeam.progress.pitch_value || (
                        <span className="text-gray-400 italic">No completado</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-lg text-[#093c92] mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5" /> Impacto
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap min-h-[100px] border border-gray-200">
                      {previewTeam.progress.pitch_impact || (
                        <span className="text-gray-400 italic">No completado</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-lg text-[#093c92] mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Cierre
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap min-h-[100px] border border-gray-200">
                      {previewTeam.progress.pitch_closing || (
                        <span className="text-gray-400 italic">No completado</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">Este equipo aún no ha completado el formulario de pitch.</p>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}

      {/* Modal de Introducción de Etapa */}
      <EtapaIntroModal
        etapaNumero={4}
        isOpen={showEtapaIntro}
        onClose={() => {
          setShowEtapaIntro(false);
          if (sessionId) {
            localStorage.setItem(`etapa_intro_${sessionId}_4`, 'true');
          }
        }}
      />
    </div>
  );
}

