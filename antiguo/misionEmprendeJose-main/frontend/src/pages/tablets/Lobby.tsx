import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Tablet,
  Loader2,
  Gamepad2,
  CheckCircle2,
  XCircle,
  Clock,
  Rocket,
  Briefcase,
  Map,
  Cog,
  Bot,
} from 'lucide-react';
import { sessionsAPI, tabletConnectionsAPI } from '@/services';
import { UBotWelcomeModal } from '@/components/UBotWelcomeModal';
import { toast } from 'sonner';

interface Student {
  id: number;
  full_name: string;
  email?: string;
}

interface Team {
  id: number;
  name: string;
  color: string;
  students_count: number;
  students?: Student[];
  tokens_total?: number;
}

interface TabletConnection {
  id: number;
  team: number;
  is_connected: boolean;
}

interface LobbyData {
  game_session: {
    id: number;
    room_code: string;
    status: string;
  };
  teams: Team[];
  tablet_connections: TabletConnection[];
  all_teams_connected: boolean;
  connected_teams: number;
  total_teams: number;
}

export function TabletLobby() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [lobbyData, setLobbyData] = useState<LobbyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [myTeamId, setMyTeamId] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [loadingDots, setLoadingDots] = useState('');
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showUBotModal, setShowUBotModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadingMessages = [
    'Preparando tu misión',
    'Cargando recursos emprendedores',
    'Activando habilidades de innovación',
    'Iniciando el juego'
  ];

  // Obtener connection_id de la URL o localStorage (asegurar que sea string)
  const connectionId = String(searchParams.get('connection_id') || localStorage.getItem('tabletConnectionId') || '').trim();

  useEffect(() => {
    if (!connectionId) {
      navigate('/tablet/join');
      return;
    }

    const loadInitialData = async () => {
      try {
        // Obtener estado de la conexión de la tablet (con reintento si es 404)
        let statusData;
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            statusData = await tabletConnectionsAPI.getStatus(connectionId);
            break; // Si funciona, salir del loop
          } catch (error: any) {
            if (error.response?.status === 404 && retries < maxRetries - 1) {
              // Si es 404 y aún hay reintentos, esperar un poco y reintentar
              retries++;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
              continue;
            } else if (error.response?.status === 404) {
              // Si es 404 y no hay más reintentos, mostrar error
              toast.error('Conexión no encontrada. Por favor reconecta.');
              setTimeout(() => {
                navigate('/tablet/join');
              }, 3000);
              setLoading(false);
              return;
            } else {
              // Otro tipo de error, re-lanzar
              throw error;
            }
          }
        }

        if (!statusData || !statusData.team || !statusData.game_session) {
          toast.error('Conexión no válida');
          navigate('/tablet/join');
          setLoading(false);
          return;
        }

        setMyTeamId(statusData.team.id);
        
        // Cargar lobby inicial (esto también carga el gameData)
        await loadLobby();

        // Obtener gameData para guardar valores iniciales usando el endpoint lobby que ya funciona
        try {
          // Usar el endpoint lobby que ya sabemos que funciona sin autenticación
          const lobbyData = await sessionsAPI.getLobby(statusData.game_session.id);
          const gameData = lobbyData.game_session;
          
          // Guardar valores iniciales para comparación
          const initialActivityId = gameData.current_activity;
          const initialActivityName = gameData.current_activity_name || '';
          const initialSessionStageId = gameData.current_session_stage;
          const initialStageNumber = gameData.current_stage_number;

          // Verificar actividad y etapa periódicamente (COMO EN ETAPA 2)
          activityCheckIntervalRef.current = setInterval(async () => {
            try {
              // Usar lobby en lugar de getById para evitar problemas de autenticación
              const updatedLobbyData = await sessionsAPI.getLobby(statusData.game_session.id);
              const updatedSession = updatedLobbyData.game_session;
              
              // Verificar si cambió la actividad o etapa
              const activityChanged = updatedSession.current_activity !== initialActivityId || 
                                     (updatedSession.current_activity_name || '') !== initialActivityName;
              const stageChanged = updatedSession.current_stage_number !== initialStageNumber;
              
              if (activityChanged || stageChanged) {
                // Limpiar intervalos
                if (activityCheckIntervalRef.current) {
                  clearInterval(activityCheckIntervalRef.current);
                  activityCheckIntervalRef.current = null;
                }
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
                
                // Redirigir según la nueva actividad
                await determineAndRedirectToActivity(statusData.game_session.id);
              }
            } catch (error) {
              console.error('Error verificando actividad:', error);
            }
          }, 3000); // Verificar cada 3 segundos
        } catch (error) {
          console.error('Error obteniendo gameData inicial:', error);
          // Continuar sin la verificación de cambios si falla
        }

      } catch (error: any) {
        console.error('Error loading initial data:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        toast.error('Error de conexión: ' + errorMessage);
        setLoading(false);
      }
    };

    loadInitialData();

    // Auto-refresh cada 3 segundos (mantener para actualizar lobby)
    intervalRef.current = setInterval(() => {
      loadLobby();
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
      }
    };
  }, [connectionId, navigate]);

  // Animación de puntos suspensivos
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setLoadingDots((prev) => {
        if (prev === '') return '.';
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '';
      });
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  // Rotación de mensajes temáticos (solo cuando está en pantalla de carga)
  useEffect(() => {
    if (!showLoadingScreen) {
      setCurrentMessage(0);
      return;
    }
    
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(messageInterval);
  }, [showLoadingScreen, loadingMessages.length]);

  // Animación de progreso (solo cuando está en pantalla de carga)
  useEffect(() => {
    if (!showLoadingScreen) {
      // Limpiar intervalo si existe
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(0);
      return;
    }
    
    // CRÍTICO: Solo inicializar progreso si no hay un intervalo activo
    // Esto evita que se reinicie el progreso cuando loadLobby() se ejecuta periódicamente
    if (!progressIntervalRef.current) {
      setProgress(0);
      
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95;
          return prev + Math.random() * 3;
        });
      }, 200);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [showLoadingScreen]);

  const loadLobby = async () => {
    if (!connectionId) return;

    try {
      // Obtener estado de la conexión de la tablet
      let statusData;
      try {
        statusData = await tabletConnectionsAPI.getStatus(connectionId);
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error('Conexión no encontrada. Por favor reconecta.');
          setTimeout(() => {
            navigate('/tablet/join');
          }, 3000);
        }
        return;
      }

      setMyTeamId(statusData.team.id);

      // Obtener información completa del lobby
      let data: LobbyData;
      try {
        data = await sessionsAPI.getLobby(statusData.game_session.id);
      } catch (error: any) {
        if (error.response?.status === 403) {
          toast.error('La sesión ya ha finalizado. No puedes acceder al lobby.');
          setTimeout(() => {
            navigate('/tablet/join');
          }, 3000);
        } else {
          toast.error('Error al cargar el lobby');
        }
        return;
      }

      // Si el juego está corriendo, redirigir directamente (sin pantalla de carga)
      // La pantalla de carga aparecerá cuando se vaya del Instructivo a Personalización
      if (data.game_session.status === 'running' && !gameStarted) {
        setGameStarted(true);
        // Redirigir directamente sin pantalla de carga
        await determineAndRedirectToActivity(data.game_session.id);
        return;
      }

      setLobbyData(data);
      setLoading(false);
      
      // Mostrar modal de U-Bot cuando se carga el lobby por primera vez
      // Solo si hay equipos y el juego aún no ha comenzado
      if (data.teams && data.teams.length > 0 && data.game_session.status === 'lobby') {
        // Verificar si ya se mostró el modal antes (usando localStorage)
        const hasSeenModal = localStorage.getItem(`ubot_modal_${connectionId}`);
        if (!hasSeenModal) {
          setShowUBotModal(true);
          localStorage.setItem(`ubot_modal_${connectionId}`, 'true');
        }
      }
    } catch (error: any) {
      console.error('Error loading lobby:', error);
      toast.error('Error de conexión: ' + (error.message || 'Error desconocido'));
      setLoading(false);
    }
  };

  const determineAndRedirectToActivity = async (gameSessionId: number) => {
    try {
      // Usar lobby en lugar de getById para evitar problemas de autenticación
      const lobbyData = await sessionsAPI.getLobby(gameSessionId);
      const gameData = lobbyData.game_session;
      const currentActivityName = gameData.current_activity_name;
      const currentActivityId = gameData.current_activity;
      const currentStageNumber = gameData.current_stage_number;

      // Si no hay etapa ni actividad, estamos en el video institucional (previo a etapas)
      if (!currentStageNumber && !currentActivityName) {
        window.location.href = `/tablet/etapa1/video-institucional/?connection_id=${connectionId}`;
        return;
      }

      // Si no hay actividad actual pero hay etapa, redirigir a resultados de la etapa correspondiente
      if (!currentActivityName || !currentActivityId) {
        if (currentStageNumber === 1) {
          window.location.href = `/tablet/etapa1/resultados/?connection_id=${connectionId}`;
        } else if (currentStageNumber === 2) {
          window.location.href = `/tablet/etapa2/resultados/?connection_id=${connectionId}`;
        } else if (currentStageNumber === 3) {
          window.location.href = `/tablet/etapa3/resultados/?connection_id=${connectionId}`;
        } else if (currentStageNumber === 4) {
          window.location.href = `/tablet/etapa4/resultados/?connection_id=${connectionId}`;
        } else {
          window.location.href = `/tablet/etapa1/resultados/?connection_id=${connectionId}`;
        }
        return;
      }

      const normalizedActivityName = currentActivityName.toLowerCase().trim();
      let redirectUrl = '';

      if (currentStageNumber === 1) {
        if (normalizedActivityName.includes('video') || normalizedActivityName.includes('institucional')) {
          redirectUrl = `/tablet/etapa1/video-institucional/?connection_id=${connectionId}`;
        } else if (normalizedActivityName.includes('instructivo') || normalizedActivityName.includes('instrucciones')) {
          redirectUrl = `/tablet/etapa1/instructivo?connection_id=${connectionId}`;
        } else if (normalizedActivityName.includes('personaliz')) {
          redirectUrl = `/tablet/loading?redirect=/tablet/etapa1/personalizacion&connection_id=${connectionId}`;
        } else if (normalizedActivityName.includes('presentaci')) {
          redirectUrl = `/tablet/etapa1/presentacion/?connection_id=${connectionId}`;
        }
      } else if (currentStageNumber === 2) {
        if (normalizedActivityName.includes('tema') || normalizedActivityName.includes('seleccionar') || normalizedActivityName.includes('desafio') || normalizedActivityName.includes('desafío')) {
          redirectUrl = `/tablet/etapa2/seleccionar-tema/?connection_id=${connectionId}`;
        } else if (normalizedActivityName.includes('bubble') || normalizedActivityName.includes('mapa')) {
          redirectUrl = `/tablet/etapa2/bubble-map/?connection_id=${connectionId}`;
        }
      } else if (currentStageNumber === 3) {
        // Etapa 3: Prototipo
        if (normalizedActivityName.includes('prototipo') || normalizedActivityName.includes('lego')) {
          redirectUrl = `/tablet/etapa3/prototipo/?connection_id=${connectionId}`;
        } else {
          // Si hay actividad pero no es prototipo, ir a resultados
          redirectUrl = `/tablet/etapa3/resultados/?connection_id=${connectionId}`;
        }
      } else if (currentStageNumber === 4) {
        // Priorizar detección de presentación
        if (normalizedActivityName.includes('presentacion') || normalizedActivityName.includes('presentación')) {
          redirectUrl = `/tablet/etapa4/presentacion-pitch/?connection_id=${connectionId}`;
        } else if (normalizedActivityName.includes('formulario') || (normalizedActivityName.includes('pitch') && normalizedActivityName.includes('formul'))) {
          redirectUrl = `/tablet/etapa4/formulario-pitch/?connection_id=${connectionId}`;
        } else if (normalizedActivityName.includes('pitch')) {
          // Si solo dice "pitch", verificar más específicamente
          if (normalizedActivityName.includes('presentacion') || normalizedActivityName.includes('presentación')) {
            redirectUrl = `/tablet/etapa4/presentacion-pitch/?connection_id=${connectionId}`;
          } else {
            redirectUrl = `/tablet/etapa4/formulario-pitch/?connection_id=${connectionId}`;
          }
        }
      }

      if (redirectUrl) {
        console.log(`🔄 Redirigiendo a: ${redirectUrl} (Etapa ${currentStageNumber}, Actividad: ${currentActivityName})`);
        window.location.href = redirectUrl;
      } else {
        console.warn(`⚠️ No se encontró redirección para Etapa ${currentStageNumber}, Actividad: ${currentActivityName}`);
      }
    } catch (error: any) {
      console.error('Error determining activity:', error);
      toast.error('Error al determinar actividad: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
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

  if (!lobbyData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Error al cargar el lobby</p>
          <button
            onClick={() => navigate('/tablet/join')}
            className="bg-white text-[#093c92] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
          >
            Volver a Conectar
          </button>
        </div>
      </div>
    );
  }

  const { game_session, teams, tablet_connections } = lobbyData;
  const myTeam = teams.find(t => t.id === myTeamId);

  // Permitir ver la pantalla de carga con parámetro ?loading=true en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const forceLoading = urlParams.get('loading') === 'true';

  // Pantalla de carga cuando el juego está iniciando
  if (showLoadingScreen || forceLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        {/* Fondo animado igual que Panel.tsx */}
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

        {/* Logo en esquina superior derecha - Responsivo y minimalista */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 overflow-hidden opacity-80"
          style={{ height: 'clamp(50px, 6vw, 100px)', width: 'auto' }}
        >
          <img
            src="/images/UDD-negro.png"
            alt="Logo UDD"
            className="h-full w-auto object-contain drop-shadow-lg"
          />
        </motion.div>

        {/* Contenedor principal - Centrado y optimizado */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 min-h-[60vh] max-w-4xl mx-auto">
          {/* Título del juego - Foco principal */}
          <motion.h1
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-[#f757ac] mb-8 drop-shadow-2xl text-center"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(247, 87, 172, 0.4), 0 0 40px rgba(247, 87, 172, 0.2)'
            }}
          >
            Misión Emprende
          </motion.h1>

          {/* Íconos temáticos animados */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center gap-4 sm:gap-6 mb-8"
          >
            {[
              { Icon: Rocket, delay: 0 },
              { Icon: Briefcase, delay: 0.1 },
              { Icon: Map, delay: 0.2 },
              { Icon: Cog, delay: 0.3 }
            ].map(({ Icon, delay }, index) => (
              <motion.div
                key={index}
                initial={{ y: 0, opacity: 0 }}
                animate={{ 
                  y: [0, -10, 0],
                  opacity: 1
                }}
                transition={{
                  y: {
                    duration: 2,
                    repeat: Infinity,
                    delay: delay,
                    ease: 'easeInOut'
                  },
                  opacity: { duration: 0.5, delay: delay + 0.4 }
                }}
                className="text-[#f757ac] opacity-60"
              >
                <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
              </motion.div>
            ))}
          </motion.div>

          {/* Mensaje de carga temático - Rotativo */}
          <motion.div
            key={currentMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <h2 
              className="text-lg sm:text-xl md:text-2xl font-semibold text-white text-center px-4"
              style={{ 
                textShadow: '0 0 20px rgba(247, 87, 172, 0.8), 0 0 40px rgba(247, 87, 172, 0.5), 0 2px 10px rgba(0, 0, 0, 0.3)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {loadingMessages[currentMessage]}
              <span className="inline-block w-8 text-left">{loadingDots}</span>
            </h2>
          </motion.div>

          {/* Barra de progreso animada */}
          <div className="w-full max-w-md px-4 mb-4">
            <div className="relative h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#f757ac] via-[#e83e8c] to-[#f757ac] rounded-full relative overflow-hidden"
                style={{
                  boxShadow: '0 0 20px rgba(247, 87, 172, 0.6)'
                }}
              >
                {/* Efecto de brillo animado */}
                <motion.div
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
            <div className="text-center mt-2">
              <span className="text-xs sm:text-sm text-white/70 font-medium">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Fondo animado igual que Panel.tsx */}
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

      {/* Contenido */}
      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 mb-5 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#093c92]">
                Centro de Mando
              </h1>
              <p className="text-sm sm:text-base text-gray-500 font-medium mt-1">
                Código: <span className="font-mono font-bold text-[#093c92]">{game_session.room_code}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {myTeam && (
                <>
                  <div
                    className="px-4 py-2 rounded-full text-white text-sm sm:text-base font-semibold"
                    style={{ backgroundColor: getTeamColorHex(myTeam.color) }}
                  >
                    {myTeam.name}
                  </div>
                  {/* Botón para reabrir modal de U-Bot */}
                  <button
                    onClick={() => setShowUBotModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                    title="Ver mensaje de U-Bot"
                  >
                    <Bot className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">U-Bot</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm sm:text-base text-[#093c92] font-medium">
              Sincronizando sistemas... Esperando autorización de lanzamiento{loadingDots}
            </p>
          </div>
        </div>

        {/* Equipos */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-4 sm:mb-5">
            Escuadrones Activos ({teams.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {teams
              .sort((a, b) => {
                // Poner el equipo del usuario primero
                if (a.id === myTeamId) return -1;
                if (b.id === myTeamId) return 1;
                return 0;
              })
              .map((team, index) => {
              const tabletConnection = tablet_connections.find((tc) => tc.team === team.id);
              const isConnected = tabletConnection?.is_connected || false;
              const isMyTeam = team.id === myTeamId;
              const teamColorHex = getTeamColorHex(team.color);

              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-lg sm:rounded-xl shadow-md border-l-4 p-4 sm:p-5 ${
                    isMyTeam ? 'ring-2 ring-offset-2' : ''
                  }`}
                  style={{ 
                    borderLeftColor: teamColorHex,
                    ringColor: isMyTeam ? teamColorHex : undefined
                  }}
                >
                  {/* Header del equipo */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="px-3 py-1 rounded-full text-white text-xs sm:text-sm font-semibold"
                      style={{ backgroundColor: teamColorHex }}
                    >
                      {team.name.includes('Start-up') || team.name.includes('División') ? team.name : `Start-up ${team.color}`}
                    </div>

                    {/* Estado de conexión */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                      isConnected
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isConnected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="hidden sm:inline">En Línea</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Offline</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lista de estudiantes */}
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                      Agentes: {team.students_count}
                    </p>
                    {team.students && team.students.length > 0 ? (
                      <div className="space-y-2">
                        {team.students.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: teamColorHex }}
                            >
                              {getInitials(student.full_name)}
                            </div>
                            <span className="text-sm text-gray-700 flex-1">
                              {getShortName(student.full_name)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-2">
                        Sin estudiantes asignados
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Música de fondo */}
      
      {/* Modal de U-Bot */}
      {myTeam && (
        <UBotWelcomeModal
          isOpen={showUBotModal}
          onClose={() => setShowUBotModal(false)}
          startupName={myTeam.name.includes('Start-up') || myTeam.name.includes('División') ? myTeam.name : `Start-up ${myTeam.color}`}
          teamColor={myTeam.color}
        />
      )}
    </div>
  );
}


