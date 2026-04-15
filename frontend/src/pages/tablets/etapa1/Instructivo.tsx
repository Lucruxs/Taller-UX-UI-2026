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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5F0E8] flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Header con logo */}
      <header className="p-6 flex justify-end flex-shrink-0">
        <img
          src="/images/UDD-negro.png"
          alt="Logo UDD"
          className="h-8 sm:h-10 w-auto object-contain opacity-80"
        />
      </header>

      {/* Tarjeta principal */}
      <div className="flex-1 flex flex-col px-4 pb-6 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl shadow-sm p-4 sm:p-6 w-full max-w-5xl mx-auto flex flex-col flex-1 min-h-0"
        >
          {/* iframe */}
          <div className="flex-1 rounded-2xl overflow-hidden bg-black min-h-0">
            <iframe
              src={`${videoUrl}?autoplay=0&mute=0&controls=1&rel=0&modestbranding=1`}
              title="Instructivo del Juego"
              className="w-full h-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Texto inferior */}
          <div className="flex-shrink-0 mt-5 text-center">
            <p className="text-xl md:text-2xl font-bold text-slate-800">
              Instructivo del Juego
            </p>
            <p className="text-slate-500 mt-2 font-medium animate-pulse">
              Esperando a que el profesor inicie la Etapa 1...
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

