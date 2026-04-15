import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Coins,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GroupBadge } from '@/components/GroupBadge';
import { Confetti } from '@/components/Confetti';
import { CancelSessionModal } from '@/components/CancelSessionModal';
import { sessionsAPI } from '@/services';
import { toast } from 'sonner';

// Función para corregir problemas de encoding de tildes y caracteres especiales
const fixEncoding = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/EmpatÃa/g, 'Empatía')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã/g, 'í')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã'/g, 'í')
    .replace(/Ã"/g, 'í')
    .replace(/Ã¿/g, 'ÿ')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã"/g, 'Í')
    .replace(/Ã"/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã'/g, 'Á')
    .replace(/Ã±/g, 'Ñ');
};

interface TeamResult {
  team_id: number;
  team_name: string;
  team_color: string;
  tokens_stage: number;
  tokens_total: number;
  activities_progress: Array<{
    activity_name: string;
    status: string;
  }>;
}

interface StageResults {
  stage_number: number;
  stage_name: string;
  teams_results: TeamResult[];
}

interface GameSession {
  id: number;
  room_code: string;
  status: string;
  current_stage_number?: number;
}

export function ProfesorResultadosEtapa1() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [results, setResults] = useState<StageResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<string>('--:--');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stageId = searchParams.get('stage_id');

  useEffect(() => {
    if (sessionId) {
      loadResults();

      // Auto-refresh cada 5 segundos
      intervalRef.current = setInterval(() => {
        loadResults();
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
  }, [sessionId, stageId]);

  const loadResults = async () => {
    if (!sessionId) return;

    try {
      // Obtener información de la sesión
      const sessionData: GameSession = await sessionsAPI.getById(sessionId);
      setGameSession(sessionData);

      // Obtener resultados de la etapa
      const stageIdNum = stageId ? parseInt(stageId, 10) : undefined;
      const resultsData: StageResults = await sessionsAPI.getStageResults(sessionId, stageIdNum);
      setResults(resultsData);

      // Iniciar timer si hay actividad actual
      if (sessionData.current_activity) {
        startTimer(sessionData.current_activity, parseInt(sessionId));
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error loading results:', error);
      if (error.response?.status === 401) {
        navigate('/profesor/login');
      } else {
        toast.error('Error al cargar los resultados');
      }
      setLoading(false);
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

  const handleNextStage = async () => {
    if (!sessionId || !results) return;

    // Si estamos en etapa 4, ir directamente a reflexión
    if (results.stage_number === 4) {
      setAdvancing(true);
      try {
        // Marcar que el profesor está en reflexión
        await sessionsAPI.startReflection(sessionId);
        toast.success('Redirigiendo a reflexión...');
        navigate(`/profesor/reflexion/${sessionId}`);
      } catch (error: any) {
        console.error('Error iniciando reflexión:', error);
        toast.error('Error al iniciar reflexión. Redirigiendo de todas formas...');
        navigate(`/profesor/reflexion/${sessionId}`);
      } finally {
        setAdvancing(false);
      }
      return;
    }

    if (!confirm('¿Avanzar a la siguiente etapa? Esto iniciará la siguiente etapa del juego.')) {
      return;
    }

    setAdvancing(true);
    try {
      const data = await sessionsAPI.nextStage(sessionId);

      toast.success(`¡Avanzando a ${data.message}!`, { duration: 2000 });
      setTimeout(() => {
        const nextStage = data.next_stage_number || 2;
        // Redirigir a la primera actividad de la siguiente etapa (el modal se mostrará automáticamente)
        if (nextStage === 2) {
          window.location.replace(`/profesor/etapa2/seleccionar-tema/${sessionId}/`);
        } else if (nextStage === 3) {
          window.location.replace(`/profesor/etapa3/prototipo/${sessionId}/`);
        } else if (nextStage === 4) {
          window.location.replace(`/profesor/etapa4/formulario-pitch/${sessionId}/`);
        }
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al avanzar a la siguiente etapa');
    } finally {
      setAdvancing(false);
    }
  };

  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const handleFinalizeSession = async () => {
    if (!sessionId) return;
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (reason: string, reasonOther?: string) => {
    if (!sessionId) return;

    try {
      await sessionsAPI.finish(parseInt(sessionId), reason, reasonOther);
      toast.success('Sesión cancelada correctamente');
      setCancelModalOpen(false);
      setTimeout(() => {
        navigate('/profesor/panel');
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cancelar la sesión');
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

  const getStageIcon = (stageNumber: number) => {
    switch (stageNumber) {
      case 1:
        return '👥'; // Trabajo en Equipo
      case 2:
        return '💡'; // Empatía
      case 3:
        return '🧱'; // Creatividad
      case 4:
        return '📢'; // Comunicación
      default:
        return '🏆';
    }
  };

  const getStageGradient = (stageNumber: number) => {
    switch (stageNumber) {
      case 1:
        return 'from-blue-400 to-cyan-500';
      case 2:
        return 'from-purple-400 to-pink-500';
      case 3:
        return 'from-orange-400 to-red-500';
      case 4:
        return 'from-green-400 to-teal-500';
      default:
        return 'from-yellow-400 to-orange-500';
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 sm:w-7 sm:h-7 text-orange-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!gameSession || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Error al cargar los resultados.</p>
          <Button onClick={() => navigate('/profesor/panel')}>Volver al Panel</Button>
        </div>
      </div>
    );
  }

  // Ordenar equipos por tokens totales (mayor a menor)
  const teamsOrdered = [...results.teams_results].sort((a, b) => b.tokens_total - a.tokens_total);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Confetti active={!!results} />
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
          <div className="w-full mb-2 sm:mb-3 z-20 flex justify-center flex-shrink-0">
            <Button
              onClick={handleNextStage}
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
                  {results.stage_number === 4 ? (
                    '🧠 Ir a Reflexión'
                  ) : (
                    `Avanzar a Etapa ${results.stage_number + 1}`
                  )}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </>
              )}
            </Button>
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
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-1">
                    Resultados de la Etapa {results?.stage_number || ''}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Sala: <span className="font-bold text-[#093c92]">{gameSession.room_code}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleFinalizeSession}
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Cancelar Sala
                </Button>
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
            </div>
          </motion.div>

          {/* Estadísticas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-shrink-0"
          >
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 sm:p-5 text-center shadow-lg"
              >
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-blue-700 mb-1">
                  {teamsOrdered.length}
                </div>
                <div className="text-xs sm:text-sm text-blue-800 font-semibold">Equipos</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-4 sm:p-5 text-center shadow-lg"
              >
                <Coins className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-yellow-700 mb-1">
                  {teamsOrdered.reduce((sum, team) => sum + team.tokens_stage, 0)}
                </div>
                <div className="text-xs sm:text-sm text-yellow-800 font-semibold">Tokens Etapa</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4 sm:p-5 text-center shadow-lg"
              >
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">
                  {teamsOrdered.reduce((sum, team) => sum + team.tokens_total, 0)}
                </div>
                <div className="text-xs sm:text-sm text-purple-800 font-semibold">Tokens Total</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Clasificación */}
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
                Clasificación <span className="text-gray-500 font-normal text-base sm:text-lg">({teamsOrdered.length} equipos)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {teamsOrdered.map((teamResult, index) => {
                const rank = index + 1;
                const isTopThree = rank <= 3;
                const rankMedal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}°`;

                return (
                  <motion.div
                    key={teamResult.team_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className={`bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 sm:p-5 shadow-lg border-2 ${
                      isTopThree
                        ? rank === 1
                          ? 'border-yellow-400 shadow-yellow-200/50'
                          : rank === 2
                          ? 'border-gray-300 shadow-gray-200/50'
                          : 'border-orange-300 shadow-orange-200/50'
                        : 'border-gray-200'
                    } transition-all duration-200`}
                  >
                    {/* Header del equipo */}
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg flex-shrink-0"
                        style={{ 
                          backgroundColor: getTeamColorHex(teamResult.team_color),
                          backgroundImage: `linear-gradient(135deg, ${getTeamColorHex(teamResult.team_color)} 0%, ${getTeamColorHex(teamResult.team_color)}dd 100%)`
                        }}
                      >
                        {teamResult.team_color.charAt(0).toUpperCase()}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate mb-1">
                          {fixEncoding(teamResult.team_name)}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-lg sm:text-xl font-bold text-gray-600">{rankMedal}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tokens */}
                    <div className="space-y-2 pt-3 border-t border-gray-200">
                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-2.5 sm:p-3 border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700">Tokens etapa</span>
                          <div className="flex items-center gap-1.5">
                            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                            <span className="text-base sm:text-lg font-bold text-[#093c92]">
                              +{teamResult.tokens_stage}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-2.5 sm:p-3 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700">Tokens totales</span>
                          <div className="flex items-center gap-1.5">
                            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            <span className="text-base sm:text-lg font-bold text-gray-800">
                              {teamResult.tokens_total}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actividades */}
                    {teamResult.activities_progress && teamResult.activities_progress.length > 0 && (
                      <div className="pt-3 border-t border-gray-200 mt-3">
                        <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                          Actividades:
                        </p>
                        <div className="space-y-1.5">
                          {teamResult.activities_progress.map((activity, actIndex) => (
                            <div
                              key={actIndex}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-xs sm:text-sm text-gray-700 truncate flex-1 font-medium">
                                {fixEncoding(activity.activity_name)}
                              </span>
                              <Badge
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0 ${
                                  activity.status === 'completed'
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                }`}
                              >
                                {activity.status === 'completed' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                    <span className="hidden sm:inline">Completada</span>
                                    <span className="sm:hidden">✓</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    <span className="hidden sm:inline">En progreso</span>
                                    <span className="sm:hidden">⏳</span>
                                  </>
                                )}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Cancelación */}
      <CancelSessionModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        currentStage={gameSession?.current_stage_name}
        currentActivity={gameSession?.current_activity_name}
        roomCode={gameSession?.room_code}
      />

      {/* Música de fondo */}
    </div>
  );
}
