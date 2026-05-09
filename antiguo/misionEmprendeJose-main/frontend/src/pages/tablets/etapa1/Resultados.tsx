import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Coins, Loader2, Users, CheckCircle2, Clock, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Confetti } from '@/components/Confetti';
import { UBotResultadosModal } from '@/components/UBotResultadosModal';
import { sessionsAPI, tabletConnectionsAPI } from '@/services';
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

interface Team {
  id: number;
  name: string;
  color: string;
  tokens_total?: number;
}

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

export function TabletResultadosEtapa1() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<StageResults | null>(null);
  const [myTeamResult, setMyTeamResult] = useState<TeamResult | null>(null);
  const [myRank, setMyRank] = useState<number>(0);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [gameSessionId, setGameSessionId] = useState<number | null>(null);
  const [showUBotModal, setShowUBotModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const ubotModalShownRef = useRef(false);

  useEffect(() => {
    const connId = searchParams.get('connection_id') || localStorage.getItem('tabletConnectionId');
    if (!connId) {
      navigate('/tablet/join');
      return;
    }
    setConnectionId(connId);
    loadGameState(connId);

    // Polling cada 5 segundos para detectar cuando el profesor avanza
    intervalRef.current = setInterval(() => {
      loadGameState(connId);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [searchParams, navigate]);

  const loadGameState = async (connId: string) => {
    try {
      const statusData = await tabletConnectionsAPI.getStatus(connId);
      
      if (!statusData || !statusData.team) {
        toast.error('Conexión no encontrada. Por favor reconecta.');
        setTimeout(() => {
          navigate('/tablet/join');
        }, 3000);
        return;
      }
      
      setTeam(statusData.team);
      const sessionId = statusData.game_session.id;
      setGameSessionId(sessionId);

      // Verificar estado del juego (usar lobby en lugar de getById para evitar problemas de autenticación)
      const lobbyData = await sessionsAPI.getLobby(statusData.game_session.id);
      const gameData = lobbyData.game_session;

      // Verificar si el profesor avanzó a la siguiente etapa
      const currentActivityId = gameData.current_activity;
      const currentActivityName = gameData.current_activity_name?.toLowerCase() || '';
      const currentStageNumber = gameData.current_stage_number || 1;

      // Obtener la URL actual para determinar qué etapa de resultados estamos viendo
      const currentPath = window.location.pathname;
      const isResultadosPage = currentPath.includes('/resultados');
      
      // Verificar si hay un stage_id en los query params
      const stageIdParam = searchParams.get('stage_id');
      let targetStageNumber = currentStageNumber;

      // Verificar si el juego ha finalizado o está en lobby
      // CRÍTICO: Si estamos en resultados de etapa 4 y la sala se completó (porque el profesor fue a reflexión),
      // NO redirigir a join. Las tablets deben permanecer en resultados para ver los resultados finales.
      // Solo redirigir si NO estamos en resultados de etapa 4
      const isStage4Results = isResultadosPage && (targetStageNumber === 4 || currentStageNumber === 4);
      
      if (gameData.status === 'finished' || gameData.status === 'completed') {
        // Si estamos en resultados de etapa 4, verificar si el profesor inició reflexión
        if (isStage4Results) {
          try {
            const stagesData = await sessionsAPI.getSessionStages(statusData.game_session.id);
            if (Array.isArray(stagesData)) {
              const stage4 = stagesData.find((s: any) => s.stage_number === 4);
              if (stage4?.presentation_timestamps?._reflection === true) {
                // El profesor inició reflexión, redirigir a reflexión
                window.location.href = `/tablet/reflexion/?connection_id=${connId}`;
                return;
              }
            }
          } catch (error) {
            // Si hay error, permanecer en resultados
            console.warn('Error verificando reflexión, permaneciendo en resultados:', error);
          }
          // Si no hay flag de reflexión, permanecer en resultados
          // NO redirigir a join
          return;
        }
        
        // Para otras etapas o si no estamos en resultados, redirigir normalmente
        toast.info('El juego ha finalizado. Redirigiendo...');
        setTimeout(() => {
          navigate('/tablet/join');
        }, 2000);
        return;
      }

      if (gameData.status === 'lobby') {
        navigate(`/tablet/lobby?connection_id=${connId}`);
        return;
      }

      // Si estamos en una página de resultados específica, usar esa etapa
      if (isResultadosPage) {
        // Prioridad 1: stage_id de query params (para /tablet/resultados?stage_id=4)
        if (stageIdParam) {
          targetStageNumber = parseInt(stageIdParam, 10) || currentStageNumber;
        } 
        // Prioridad 2: ruta específica (para /tablet/etapaX/resultados)
        else if (currentPath.includes('/etapa2/resultados')) {
          targetStageNumber = 2;
        } else if (currentPath.includes('/etapa3/resultados')) {
          targetStageNumber = 3;
        } else if (currentPath.includes('/etapa4/resultados')) {
          targetStageNumber = 4;
        } else if (currentPath.includes('/etapa1/resultados')) {
          targetStageNumber = 1;
        } 
        // Prioridad 3: ruta genérica /tablet/resultados sin stage_id, usar currentStageNumber
        else if (currentPath === '/tablet/resultados' || currentPath.includes('/tablet/resultados')) {
          targetStageNumber = currentStageNumber;
        } else {
          targetStageNumber = 1;
        }
      }

      // Si el profesor avanzó a una nueva etapa (diferente a la que estamos viendo), redirigir inmediatamente
      if (currentStageNumber > targetStageNumber && currentActivityId && currentActivityName) {
        // El profesor avanzó a una etapa posterior, redirigir según la etapa
        if (currentStageNumber === 3) {
          const normalizedName = currentActivityName;
          if (normalizedName.includes('prototipo') || normalizedName.includes('lego')) {
            window.location.href = `/tablet/etapa3/prototipo/?connection_id=${connId}`;
          } else {
            window.location.href = `/tablet/etapa3/resultados/?connection_id=${connId}`;
          }
        } else if (currentStageNumber === 4) {
          const normalizedName = currentActivityName;
          if (normalizedName.includes('formulario') || normalizedName.includes('pitch')) {
            window.location.href = `/tablet/etapa4/formulario-pitch/?connection_id=${connId}`;
          } else {
            window.location.href = `/tablet/lobby?connection_id=${connId}`;
          }
        } else {
          window.location.href = `/tablet/lobby?connection_id=${connId}`;
        }
        return;
      }

      // Si hay una actividad actual y no estamos en la página de resultados correspondiente, redirigir
      if (currentActivityId && currentActivityName && !isResultadosPage) {
        if (currentStageNumber === 2) {
          if (currentActivityName.includes('tema') || currentActivityName.includes('seleccionar')) {
            window.location.href = `/tablet/etapa2/seleccionar-tema/?connection_id=${connId}`;
          } else if (currentActivityName.includes('bubble') || currentActivityName.includes('mapa')) {
            window.location.href = `/tablet/etapa2/bubble-map/?connection_id=${connId}`;
          } else {
            window.location.href = `/tablet/lobby?connection_id=${connId}`;
          }
        } else if (currentStageNumber === 3) {
          // Etapa 3: Prototipo
          if (currentActivityName.includes('prototipo') || currentActivityName.includes('lego')) {
            window.location.href = `/tablet/etapa3/prototipo/?connection_id=${connId}`;
          } else {
            window.location.href = `/tablet/lobby?connection_id=${connId}`;
          }
        } else if (currentStageNumber === 4) {
          if (currentActivityName.includes('formulario') || currentActivityName.includes('pitch')) {
            window.location.href = `/tablet/etapa4/formulario-pitch/?connection_id=${connId}`;
          } else {
            window.location.href = `/tablet/lobby?connection_id=${connId}`;
          }
        } else {
          window.location.href = `/tablet/lobby?connection_id=${connId}`;
        }
        return;
      }

      // Si estamos en resultados pero el profesor avanzó a una nueva etapa con actividad, redirigir
      if (isResultadosPage && currentActivityId && currentActivityName && currentStageNumber > targetStageNumber) {
        // El profesor avanzó a una etapa posterior, redirigir según la etapa
        if (currentStageNumber === 3) {
          const normalizedName = currentActivityName;
          if (normalizedName.includes('prototipo') || normalizedName.includes('lego')) {
            window.location.href = `/tablet/etapa3/prototipo/?connection_id=${connId}`;
          } else {
            window.location.href = `/tablet/etapa3/resultados/?connection_id=${connId}`;
          }
        } else if (currentStageNumber === 4) {
          const normalizedName = currentActivityName;
          if (normalizedName.includes('formulario') || normalizedName.includes('pitch')) {
            window.location.href = `/tablet/etapa4/formulario-pitch/?connection_id=${connId}`;
          } else {
            window.location.href = `/tablet/lobby?connection_id=${connId}`;
          }
        } else {
          window.location.href = `/tablet/lobby?connection_id=${connId}`;
        }
        return;
      }

      // Cargar resultados de la etapa correspondiente
      // Si estamos en una página de resultados, cargar esa etapa
      // Si no hay actividad actual, cargar la etapa actual
      if (isResultadosPage || !currentActivityId) {
        let stageId: number | undefined = undefined;
        
        console.log('📊 Tablet - Cargando resultados para etapa:', targetStageNumber);
        
        // Intentar obtener el stage_id de la etapa correspondiente
        try {
          const stagesData = await sessionsAPI.getSessionStages(statusData.game_session.id);
          if (Array.isArray(stagesData)) {
            const targetStage = stagesData.find((s: any) => s.stage_number === targetStageNumber);
            if (targetStage && targetStage.stage) {
              // El campo 'stage' en SessionStageSerializer es el ID del Stage directamente
              stageId = typeof targetStage.stage === 'object' ? targetStage.stage.id : targetStage.stage;
              console.log('✅ Tablet - Stage ID encontrado:', stageId, 'para etapa', targetStageNumber);
              
              // Si estamos en etapa 4, verificar si el profesor inició reflexión
              if (targetStageNumber === 4) {
                const presentationTimestamps = targetStage.presentation_timestamps || {};
                if (presentationTimestamps._reflection === true) {
                  console.log('✅ Tablet - Profesor inició reflexión, redirigiendo...');
                  window.location.href = `/tablet/reflexion/?connection_id=${connId}`;
                  return;
                }
              }
            } else {
              console.warn('⚠️ Tablet - No se encontró stage para etapa', targetStageNumber);
            }
          }
        } catch (error) {
          console.warn('⚠️ Tablet - No se pudo obtener el stage_id específico, intentando sin parámetro:', error);
        }
        
        // Si no encontramos el stage_id, intentar sin parámetro (el backend usará current_stage)
        console.log('📊 Tablet - Llamando a loadStageResults con:', {
          gameSessionId: statusData.game_session.id,
          stageId: stageId,
          targetStageNumber: targetStageNumber
        });
        await loadStageResults(statusData.game_session.id, stageId, statusData.team, targetStageNumber);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error loading game state:', error);
      if (error.response?.status === 404) {
        toast.error('Conexión no encontrada. Por favor reconecta.');
        setTimeout(() => {
          navigate('/tablet/join');
        }, 3000);
      } else {
        toast.error('Error de conexión: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
      }
      setLoading(false);
    }
  };

  const loadStageResults = async (gameSessionId: number, stageId: number | undefined, currentTeam: Team, stageNumber?: number) => {
    try {
      // Solo usar stageId si está definido, es válido y es un número
      const validStageId = (stageId !== undefined && stageId !== null && !isNaN(Number(stageId)) && Number(stageId) > 0) 
        ? stageId 
        : undefined;
      // Si no hay stage_id, el backend usará current_stage automáticamente

      const resultsData: StageResults = await sessionsAPI.getStageResults(gameSessionId, validStageId);
      
      // Verificar que los resultados corresponden a la etapa esperada
      if (stageNumber && resultsData.stage_number !== stageNumber) {
        console.warn(`Los resultados obtenidos son de la etapa ${resultsData.stage_number}, pero se esperaba la etapa ${stageNumber}`);
      }
      
      setResults(resultsData);

      // Ordenar equipos por tokens totales
      const teamsOrdered = [...resultsData.teams_results].sort((a, b) => b.tokens_total - a.tokens_total);

      // Buscar nuestro equipo en los resultados
      if (currentTeam) {
        const myTeam = teamsOrdered.find(t => t.team_id === currentTeam.id);
        const rank = teamsOrdered.findIndex(t => t.team_id === currentTeam.id) + 1;
        
        if (myTeam) {
          setMyTeamResult(myTeam);
          setMyRank(rank);
          
          // Mostrar modal de U-Bot después de cargar los resultados
          const modalKey = `ubot_resultados_${gameSessionId}_${resultsData.stage_number}`;
          const hasSeenModal = localStorage.getItem(modalKey);
          
          if (!hasSeenModal && !ubotModalShownRef.current) {
            setTimeout(() => {
              setShowUBotModal(true);
              localStorage.setItem(modalKey, 'true');
              ubotModalShownRef.current = true;
            }, 500);
          }
        }
      }
    } catch (error: any) {
      console.error('Error cargando resultados:', error);
      toast.error('Error al cargar resultados: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
    }
  };

  // Función para formatear el nombre del startup
  const getStartupDisplayName = (teamName: string | null | undefined, teamColor?: string): string => {
    if (!teamName) {
      // Si no hay nombre, usar el color del equipo
      if (teamColor) {
        return `Start-up ${teamColor.charAt(0).toUpperCase() + teamColor.slice(1)}`;
      }
      return 'Start-up';
    }
    
    const fixedName = fixEncoding(teamName);
    
    // Verificar si es un nombre genérico de equipo (sin personalización)
    const genericPattern = /^Equipo\s+(Rojo|Verde|Azul|Amarillo|Naranja|Morado|Rosa|Celeste)$/i;
    if (genericPattern.test(fixedName)) {
      // Extraer el color y convertir a "Start-up {Color}"
      const match = fixedName.match(/^Equipo\s+(.+)$/i);
      if (match) {
        return `Start-up ${match[1]}`;
      }
    }
    
    // Si tiene personalización, mostrar "Start-up: {nombre}"
    return `Start-up: ${fixedName}`;
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

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 sm:w-7 sm:h-7 text-orange-600" />;
      default:
        return null;
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}°`;
  };

  // Mostrar modal de U-Bot al cargar los resultados (solo una vez)
  // IMPORTANTE: Este useEffect debe estar ANTES de cualquier return condicional
  useEffect(() => {
    if (results && myTeamResult && myRank > 0 && gameSessionId && !ubotModalShownRef.current) {
      const modalKey = `ubot_resultados_${gameSessionId}_${results.stage_number}`;
      const hasSeenModal = localStorage.getItem(modalKey);
      
      if (!hasSeenModal) {
        // Pequeño delay para asegurar que el componente esté completamente renderizado
        setTimeout(() => {
          setShowUBotModal(true);
          localStorage.setItem(modalKey, 'true');
          ubotModalShownRef.current = true;
        }, 300);
      } else {
        // Si ya se vio, marcar el ref para no intentar mostrarlo de nuevo
        ubotModalShownRef.current = true;
      }
    }
  }, [results, myTeamResult, myRank, gameSessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!team || !results || !myTeamResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Cargando resultados...</p>
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Ordenar equipos por tokens totales
  const teamsOrdered = [...results.teams_results].sort((a, b) => b.tokens_total - a.tokens_total);

  return (
    <div className="relative h-screen overflow-hidden flex flex-col">
      <Confetti active={!!results} />
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

      <div className="relative z-10 p-3 sm:p-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-3 sm:gap-4">
          {/* Header */}
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
                  {myTeamResult ? getStartupDisplayName(myTeamResult.team_name, myTeamResult.team_color) : getStartupDisplayName(team.name, team.color)}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Equipo {myTeamResult ? myTeamResult.team_color : team.color}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setShowUBotModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm sm:text-base flex items-center gap-2 shadow-lg"
              >
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>U-Bot</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-[#093c92] to-blue-700 text-white px-5 py-2.5 rounded-full font-semibold text-sm sm:text-base flex items-center gap-2 shadow-lg"
              >
                <Coins className="w-4 h-4 sm:w-5 sm:h-5" /> {team.tokens_total || 0} Tokens
              </motion.div>
            </div>
          </motion.div>

          {/* Posición del Equipo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#093c92] to-[#f757ac] rounded-xl shadow-xl p-4 sm:p-6 flex-shrink-0 text-center text-white"
          >
            <div className="text-5xl sm:text-6xl mb-2 sm:mb-3">{getMedalEmoji(myRank)}</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
              {myRank}° Lugar
            </h2>
            <p className="text-sm sm:text-base opacity-90 truncate">{getStartupDisplayName(myTeamResult.team_name, myTeamResult.team_color)}</p>
          </motion.div>

          {/* Tokens */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3 sm:gap-4 flex-shrink-0"
          >
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-3 sm:p-4 text-center shadow-lg">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-yellow-700 mb-1">+{myTeamResult.tokens_stage}</div>
              <div className="text-xs text-yellow-800 font-semibold">Capital Levantado (Ronda {results.stage_number})</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-3 sm:p-4 text-center shadow-lg">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-blue-700 mb-1">{myTeamResult.tokens_total}</div>
              <div className="text-xs text-blue-800 font-semibold">
                {results.stage_number === 4 ? 'Valoración Final (Capital)' : 'Valoración Total de la Start-up'}
              </div>
            </div>
          </motion.div>

          {/* Clasificación */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-xl p-3 sm:p-4 flex-shrink-0"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#093c92] to-[#f757ac] rounded-lg flex items-center justify-center shadow-md">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#093c92]">
                {results.stage_number === 4 ? '🏁 Ranking Final de Mercado' : 'Competencia de Mercado'}
              </h2>
            </div>
            <div className="space-y-2">
              {teamsOrdered.map((teamResult, index) => {
                const rank = index + 1;
                const isMyTeam = teamResult.team_id === team.id;
                const rankMedal = getMedalEmoji(rank);
                const isTopThree = rank <= 3;

                return (
                  <motion.div
                    key={teamResult.team_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`bg-gradient-to-r from-white to-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border-2 shadow-md hover:shadow-lg transition-all ${
                      isMyTeam
                        ? 'border-blue-400 shadow-blue-200/50 bg-blue-50/50'
                        : isTopThree
                        ? rank === 1
                          ? 'border-yellow-400 shadow-yellow-200/50'
                          : rank === 2
                          ? 'border-gray-300 shadow-gray-200/50'
                          : 'border-orange-300 shadow-orange-200/50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-xl sm:text-2xl font-bold text-gray-600 min-w-[35px] sm:min-w-[40px] text-center">
                        {rankMedal}
                      </div>
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md flex-shrink-0"
                        style={{ backgroundColor: getTeamColorHex(teamResult.team_color) }}
                      >
                        {teamResult.team_color.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={`font-semibold text-sm sm:text-base truncate flex-1 ${
                          isMyTeam ? 'text-blue-800 font-bold' : 'text-gray-700'
                        }`}
                      >
                        {getStartupDisplayName(teamResult.team_name, teamResult.team_color)} {isMyTeam && <span className="text-xs text-blue-600">(Ustedes)</span>}
                      </span>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 bg-yellow-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-yellow-200">
                        <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                        <span className="text-sm sm:text-base font-bold text-gray-800">
                          {teamResult.tokens_total}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Actividades */}
          {myTeamResult.activities_progress && myTeamResult.activities_progress.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-xl p-3 sm:p-4 flex-shrink-0"
            >
              <h3 className="text-sm sm:text-base font-bold text-[#093c92] mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Checklist de Misión
              </h3>
              <div className="space-y-2">
                {myTeamResult.activities_progress.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-xs sm:text-sm text-gray-700 truncate flex-1 font-medium">{fixEncoding(activity.activity_name)}</span>
                    <Badge
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0 ${
                        activity.status === 'completed'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      }`}
                    >
                      {activity.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          <span className="hidden sm:inline">Misión Cumplida</span>
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
            </motion.div>
          )}

          {/* Mensaje de Espera */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-3 sm:p-4 flex-shrink-0 text-center"
          >
            <p className="text-xs sm:text-sm font-semibold text-gray-700">
              {results.stage_number < 4 
                ? `⏳ Esperando a que el profesor inicie la Etapa ${results.stage_number + 1}...`
                : '🎉 ¡Felicidades! Has completado todas las etapas.'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Modal de U-Bot para Resultados */}
      {team && (
        <UBotResultadosModal
          isOpen={showUBotModal}
          onClose={() => setShowUBotModal(false)}
          rank={myRank}
          teamColor={team.color}
          stageNumber={results?.stage_number || 1}
          tokensTotal={myTeamResult?.tokens_total || 0}
        />
      )}

      {/* Música de fondo */}
    </div>
  );
}
