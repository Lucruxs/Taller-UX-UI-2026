import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { sessionsAPI, tabletConnectionsAPI } from '@/services';
import { toast } from 'sonner';

interface GameSession {
  id: number;
  room_code: string;
  status: string;
  current_activity_name?: string;
  current_stage_number?: number;
}

export function TabletInstructivo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // URL del video explicativo del juego (cambiar por el video real)
  const videoUrl = 'https://www.youtube.com/embed/VIDEO_ID_AQUI'; // Reemplazar con el ID del video real

  useEffect(() => {
    const connId = searchParams.get('connection_id') || localStorage.getItem('tabletConnectionId');
    if (!connId) {
      navigate('/tablet/join');
      return;
    }
    
    const loadInitialData = async () => {
      try {
        const statusData = await tabletConnectionsAPI.getStatus(connId);
        
        if (!statusData.game_session || !statusData.game_session.id) {
          setLoading(false);
          return;
        }

        const gameSessionId = statusData.game_session.id;
        
        // Usar lobby en lugar de getById para evitar problemas de autenticación
        const lobbyData = await sessionsAPI.getLobby(gameSessionId);
        const gameData = lobbyData.game_session;
        
        // Guardar valores iniciales para comparación
        const initialActivityId = gameData.current_activity;
        const initialActivityName = gameData.current_activity_name || '';
        const initialSessionStageId = gameData.current_session_stage;
        const initialStageNumber = gameData.current_stage_number;

        // Si la sesión finaliza, redirigir al join
        if (gameData.status === 'finished' || gameData.status === 'completed') {
          setTimeout(() => navigate('/tablet/join'), 2000);
          return;
        }

        // Si ya hay etapa establecida (Etapa 1 iniciada), redirigir
        if (gameData.current_stage_number) {
          const normalizedName = (gameData.current_activity_name || '').toLowerCase();
          if (normalizedName.includes('personaliz')) {
            window.location.href = `/tablet/loading?redirect=/tablet/etapa1/personalizacion&connection_id=${connId}`;
            return;
          } else if (normalizedName.includes('presentaci')) {
            window.location.href = `/tablet/loading?redirect=/tablet/etapa1/presentacion&connection_id=${connId}`;
            return;
          }
        }

        setLoading(false);

        // Verificar actividad y etapa periódicamente (COMO EN ETAPA 2)
        activityCheckIntervalRef.current = setInterval(async () => {
          try {
            // Usar lobby en lugar de getById para evitar problemas de autenticación
            const updatedLobbyData = await sessionsAPI.getLobby(gameSessionId);
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
              
              // Redirigir según la nueva actividad
              const newActivityName = (updatedSession.current_activity_name || '').toLowerCase();
              const newStageNumber = updatedSession.current_stage_number;
              
              if (newStageNumber === 1) {
                if (newActivityName.includes('personaliz')) {
                  window.location.href = `/tablet/loading?redirect=/tablet/etapa1/personalizacion&connection_id=${connId}`;
                  return;
                } else if (newActivityName.includes('presentaci')) {
                  window.location.href = `/tablet/loading?redirect=/tablet/etapa1/presentacion&connection_id=${connId}`;
                  return;
                }
              } else if (newStageNumber && newStageNumber > 1) {
                window.location.href = `/tablet/lobby?connection_id=${connId}`;
                return;
              }
            }
          } catch (error) {
            console.error('Error verificando actividad:', error);
          }
        }, 2000); // Verificar cada 2 segundos
      } catch (error) {
        console.error('Error loading game state:', error);
        setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
      }
    };
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
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
      </div>

      <div className="relative z-10 h-screen flex flex-col items-center justify-center p-3 sm:p-4 pt-12 sm:pt-16 md:pt-20 lg:pt-24">
        {/* Logo UDD - Sticky en esquina superior derecha */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30">
          <img 
            src="/images/UDD-negro.png" 
            alt="Logo UDD" 
            className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto object-contain opacity-90 drop-shadow-lg"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-6xl flex items-center justify-center relative z-20 flex-1 min-h-0"
        >
          {/* Video Container - Responsivo */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 md:p-5 border border-gray-200 w-full h-full flex flex-col">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="flex-1 rounded-lg sm:rounded-xl shadow-xl overflow-hidden relative bg-black min-h-0"
            >
              <iframe
                src={`${videoUrl}?autoplay=0&mute=0&controls=1&rel=0&modestbranding=1`}
                title="Instructivo del Juego"
                className="w-full h-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>

            {/* Título del video - Compacto */}
            <div className="text-center mt-3 sm:mt-4 flex-shrink-0">
              <p className="text-[#093c92] text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2">
                Instructivo del Juego
              </p>

              {/* Mensaje de espera - Compacto */}
              <p className="text-gray-600 text-xs sm:text-sm">
                Esperando a que el profesor inicie la Etapa 1...
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

