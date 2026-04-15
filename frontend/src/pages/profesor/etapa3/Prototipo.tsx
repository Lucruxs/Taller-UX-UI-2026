import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2,
  ArrowRight,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Upload,
  Box,
  Users,
  Target,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GroupBadge } from '@/components/GroupBadge';
import { EtapaIntroModal } from '@/components/EtapaIntroModal';
import { isDevMode } from '@/utils/devMode';
import { sessionsAPI, challengesAPI, teamActivityProgressAPI, teamPersonalizationsAPI } from '@/services';
import { toast } from 'sonner';
import { useGameStateRedirect } from '@/hooks/useGameStateRedirect';

interface Team {
  id: number;
  name: string;
  color: string;
}

interface TeamProgress {
  team: Team;
  progress: {
    id: number;
    status: string;
    prototype_image_url?: string;
    completed_at?: string;
  } | null;
}

interface GameSession {
  id: number;
  room_code: string;
  status: string;
  current_activity?: number;
  current_stage?: number;
  current_stage_number?: number;
  current_activity_name?: string | null;
}

export function ProfesorPrototipo() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // Redirigir automáticamente si el juego está en otro estado
  useGameStateRedirect();
  
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [teamsWithProgress, setTeamsWithProgress] = useState<TeamProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<string>('--:--');
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

      // Auto-refresh cada 3 segundos
      intervalRef.current = setInterval(() => {
        loadGameControl();
      }, 3000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        if (timerSyncIntervalRef.current) {
          clearInterval(timerSyncIntervalRef.current);
        }
      };
    }
  }, [sessionId]);

  const loadGameControl = async () => {
    if (!sessionId) return;

    try {
      const gameData: GameSession = await sessionsAPI.getById(sessionId);
      setGameSession(gameData);

      // Verificar si debemos mostrar la intro de la etapa
      if (gameData.current_stage_number === 3) {
        const introKey = `etapa_intro_${sessionId}_3`;
        const hasSeenIntro = localStorage.getItem(introKey);
        if (!hasSeenIntro) {
          setShowEtapaIntro(true);
        }
      }

      // Verificar que estamos en la etapa correcta
      const currentStageNumber = gameData.current_stage_number || 1;
      if (currentStageNumber !== 3) {
        // Redirigir a la etapa actual
        if (currentStageNumber === 4) {
          const currentActivityName = gameData.current_activity_name?.toLowerCase() || '';
          if (currentActivityName.includes('pitch') && currentActivityName.includes('formulario')) {
            window.location.replace(`/profesor/etapa4/formulario-pitch/${sessionId}/`);
          } else if (currentActivityName.includes('pitch') && currentActivityName.includes('presentacion')) {
            window.location.replace(`/profesor/etapa4/presentacion-pitch/${sessionId}/`);
          } else {
            window.location.replace(`/profesor/etapa4/formulario-pitch/${sessionId}/`);
          }
        } else if (currentStageNumber === 2) {
          window.location.replace(`/profesor/etapa2/seleccionar-tema/${sessionId}/`);
        } else if (currentStageNumber === 1) {
          window.location.replace(`/profesor/etapa1/personalizacion/${sessionId}/`);
        } else {
          window.location.replace(`/profesor/panel`);
        }
        return;
      }

      // Si la etapa 3 ya terminó (no hay actividad actual), no cargar prototipos
      if (!gameData.current_activity) {
        console.log('⚠️ Etapa 3 completada, no hay actividad actual');
        setLoading(false);
        return;
      }

      if (gameData.current_activity && !timerIntervalRef.current) {
        await startTimer(gameData.current_activity, parseInt(sessionId));
      }

      await loadTeamsPrototypes();
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading game control:', error);
      if (error.response?.status === 401) {
        navigate('/profesor/login');
      } else {
        toast.error('Error de conexión: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
      }
      setLoading(false);
    }
  };

  const loadTeamsPrototypes = async () => {
    if (!sessionId) return;

    try {
      const teams = await sessionsAPI.getTeams(sessionId);
      const teamsArray = Array.isArray(teams) ? teams : [teams];

      const sessionData = await sessionsAPI.getById(sessionId);

      if (!sessionData.current_stage) {
        return;
      }

      // Obtener session_stage para la etapa actual (Etapa 3: Creatividad)
      const stagesData = await sessionsAPI.getSessionStages(Number(sessionId));
      const sessionStages = Array.isArray(stagesData) ? stagesData : [stagesData];

      // Buscar el session_stage de la Etapa 3 (Creatividad)
      const sessionStage = sessionStages.find((s: any) => s.stage_number === 3) || 
                          sessionStages.find((s: any) => s.stage === sessionData.current_stage);

      if (!sessionStage) {
        console.warn('⚠️ No se encontró session_stage para Etapa 3');
        return;
      }

      // Validar que existe current_activity antes de intentar obtenerlo
      if (!sessionData.current_activity) {
        console.warn('⚠️ No hay actividad actual, la etapa ya terminó');
        return;
      }

      const activity = await challengesAPI.getActivityById(sessionData.current_activity);

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

      const progressPromises = teamsArray.map(async (team: Team) => {
        try {
          let progressList = await teamActivityProgressAPI.list({
            team: team.id,
            activity: activity.id,
            session_stage: sessionStage.id
          });

          if (!progressList || (Array.isArray(progressList) && progressList.length === 0)) {
            progressList = await teamActivityProgressAPI.list({
              team: team.id,
              activity: activity.id
            });
          }

          const progressArray = Array.isArray(progressList) ? progressList : [progressList];

          let progress = null;
          if (progressArray.length > 0) {
            progress = progressArray.find((p: any) => p.session_stage === sessionStage.id) ||
                      progressArray.find((p: any) => {
                        return p.stage_name && p.stage_name.toLowerCase().includes('creatividad');
                      }) ||
                      progressArray[0];
          }

          return { team, progress };
        } catch (error) {
          console.error(`Error al obtener progreso para equipo ${team.name}:`, error);
          return { team, progress: null };
        }
      });

      const teamsWithProgressData = await Promise.all(progressPromises);
      setTeamsWithProgress(teamsWithProgressData);
    } catch (error: any) {
      console.error('Error loading teams prototypes:', error);
      toast.error('Error al cargar prototipos: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
    }
  };

  const syncTimer = async (gameSessionId: number) => {
    try {
      const data = await sessionsAPI.getActivityTimer(gameSessionId);

      if (data.started_at && data.timer_duration) {
        timerStartTimeRef.current = new Date(data.started_at).getTime();
        timerDurationRef.current = data.timer_duration;
      }
    } catch (error) {
      console.error('Error sincronizando timer:', error);
    }
  };

  const startTimer = async (activityId: number, gameSessionId: number) => {
    try {
      await syncTimer(gameSessionId);

      if (timerSyncIntervalRef.current) {
        clearInterval(timerSyncIntervalRef.current);
      }

      timerSyncIntervalRef.current = setInterval(() => {
        syncTimer(gameSessionId);
      }, 5000);

      const updateTimer = () => {
        if (!timerStartTimeRef.current || !timerDurationRef.current) return;

        const now = Date.now();
        const elapsed = Math.floor((now - timerStartTimeRef.current) / 1000);
        const remaining = Math.max(0, timerDurationRef.current - elapsed);

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        setTimerRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

        if (remaining === 0 && timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
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

    setAdvancing(true);
    try {
      const response = await sessionsAPI.nextActivity(sessionId);

      if (response.stage_completed) {
        navigate(`/profesor/resultados/${sessionId}/?stage_id=${response.stage_id}`);
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error advancing activity:', error);
      toast.error('Error al avanzar: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
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

  const getStatusBadge = (status: string | undefined) => {
    if (!status) {
      return { text: 'Pendiente', class: 'bg-yellow-100 text-yellow-800', status: 'pending' };
    }

    switch (status) {
      case 'completed':
        return { text: 'Completado', class: 'bg-green-100 text-green-800', status: 'completed' };
      case 'submitted':
        return { text: 'Prototipo subido', class: 'bg-blue-100 text-blue-800', status: 'submitted' };
      default:
        return { text: 'Pendiente', class: 'bg-yellow-100 text-yellow-800', status: 'pending' };
    }
  };

  const allTeamsCompleted = teamsWithProgress.length > 0 && 
    teamsWithProgress.every(({ progress }) => progress?.status === 'completed' || progress?.status === 'submitted');

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
                  <Box className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-1">
                    Prototipo
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
                  <h2 className="text-lg sm:text-xl font-bold mb-1">Etapa 3: Creatividad</h2>
                  <p className="text-sm sm:text-base opacity-90">
                    Prototipos de Lego
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
                  {teamsWithProgress.length}
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
                  {teamsWithProgress.filter(({ progress }) => progress?.status === 'completed' || progress?.status === 'submitted').length}
                </div>
                <div className="text-xs sm:text-sm text-green-800 font-semibold">Prototipos Completados</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4 sm:p-5 text-center shadow-lg"
              >
                <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">
                  {teamsWithProgress.filter(({ progress }) => progress?.prototype_image_url).length}
                </div>
                <div className="text-xs sm:text-sm text-purple-800 font-semibold">Fotos Subidas</div>
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
                Equipos <span className="text-gray-500 font-normal text-base sm:text-lg">({teamsWithProgress.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {teamsWithProgress.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 text-sm sm:text-base">Cargando estado de los equipos...</p>
                </div>
              ) : (
                teamsWithProgress.map(({ team, progress }, index) => {
                  const hasImage = progress?.prototype_image_url && progress.prototype_image_url.trim() !== '';
                  const imageUrl = progress?.prototype_image_url || '';
                  const statusInfo = getStatusBadge(progress?.status);
                  const teamColor = getTeamColorHex(team.color);
                  const isCompleted = statusInfo.status === 'completed' || statusInfo.status === 'submitted';

                  return (
                    <motion.div
                      key={team.id}
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
                            {team.color.charAt(0).toUpperCase()}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate mb-1">
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

                      {/* Imagen del Prototipo */}
                      <div className="mb-3 sm:mb-4">
                        {hasImage ? (
                          <div className="relative group rounded-lg overflow-hidden">
                            <img
                              src={imageUrl.startsWith('/') ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${imageUrl}` : imageUrl}
                              alt={`Prototipo ${team.name}`}
                              className="w-full h-48 sm:h-64 object-contain rounded-lg bg-gray-50 p-2 border-2 border-gray-200"
                              onError={(e) => {
                                console.error('Error cargando imagen del prototipo:', imageUrl);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log('✅ Imagen del prototipo cargada:', imageUrl);
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-48 sm:h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                            <Upload className="w-12 h-12 text-gray-400 mb-2" />
                            <p className="text-gray-500 text-sm text-center px-4">Aún no ha subido el prototipo</p>
                          </div>
                        )}
                      </div>

                      {/* Estado */}
                      <div className="flex justify-center">
                        <Badge className={`text-xs sm:text-sm font-semibold ${statusInfo.class}`}>
                          {statusInfo.text}
                        </Badge>
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
        etapaNumero={3}
        isOpen={showEtapaIntro}
        onClose={() => {
          setShowEtapaIntro(false);
          if (sessionId) {
            localStorage.setItem(`etapa_intro_${sessionId}_3`, 'true');
          }
        }}
      />
    </div>
  );
}

