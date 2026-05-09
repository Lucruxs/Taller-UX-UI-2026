import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sessionsAPI } from '@/services';
import api from '@/services/api'; // Temporal: para time_remaining hasta que se migre o corrija el endpoint
import { toast } from 'sonner';
import { isDevMode } from '@/utils/devMode';

// Videos aleatorios sobre emprendimiento y educación
const videoUrls = [
  'https://www.youtube.com/embed/jNQXAC9IVRw', // Video educativo sobre emprendimiento
  'https://www.youtube.com/embed/9bZkp7q19f0', // Video sobre innovación
  'https://www.youtube.com/embed/dQw4w9WgXcQ', // Video motivacional
];

interface GameSession {
  id: number;
  room_code: string;
  status: string;
  current_activity_name?: string;
  current_stage_number?: number;
  started_at?: string;
}

export function ProfesorVideoInstitucional() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [timerRemaining, setTimerRemaining] = useState<string>('--:--');
  const [advancing, setAdvancing] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Seleccionar un video aleatorio al cargar
  const [selectedVideo] = useState(() => {
    return videoUrls[Math.floor(Math.random() * videoUrls.length)];
  });

  useEffect(() => {
    if (sessionId) {
      loadGameSession();
      
      // Auto-refresh cada 5 segundos
      intervalRef.current = setInterval(() => {
        loadGameSession();
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

  const loadGameSession = async () => {
    if (!sessionId) return;

    try {
      const data: GameSession = await sessionsAPI.getById(sessionId);
      
      console.log('📹 Video Institucional - Estado actual:', {
        current_activity_name: data.current_activity_name,
        current_activity: data.current_activity,
        current_stage_number: data.current_stage_number
      });
      
      setGameSession(data);

      // El video es previo a las etapas, así que no hay current_activity_name
      // Si hay una actividad establecida, significa que ya pasamos el video, redirigir
      if (data.current_activity_name && data.current_stage_number) {
        console.log('🔄 Ya se inició la Etapa 1, redirigiendo desde Video Institucional:', data.current_activity_name);
        determineAndRedirectToActivity(parseInt(sessionId));
        return;
      }

      // Si no hay etapa ni actividad, estamos en el video (correcto)
      if (!data.current_stage_number && !data.current_activity_name) {
        console.log('✅ En video institucional (previo a etapas), permaneciendo en esta página');
      }

      // Iniciar temporizador si hay actividad actual
      if (data.current_activity && data.started_at && !timerIntervalRef.current) {
        startTimer(data.current_activity, data.started_at);
      }

      setLoading(false);
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate('/profesor/login');
      } else {
        toast.error('Error al cargar la sesión');
      }
      setLoading(false);
    }
  };

  const determineAndRedirectToActivity = async (sessionId: number) => {
    try {
      const gameData = await sessionsAPI.getById(sessionId);

      const currentActivityName = gameData.current_activity_name;
      const currentActivityId = gameData.current_activity;
      const currentStageNumber = gameData.current_stage_number;

      if (!currentActivityName || !currentActivityId) {
        if (currentStageNumber) {
          window.location.href = `/profesor/resultados/${sessionId}/?stage_id=${currentStageNumber}`;
        } else {
          navigate('/profesor/panel');
        }
        return;
      }

      const normalizedActivityName = currentActivityName.toLowerCase().trim();
      let redirectUrl = '';

      if (currentStageNumber === 1) {
        if (normalizedActivityName.includes('video') || normalizedActivityName.includes('institucional')) {
          // Si es video institucional, no redirigir (ya estamos aquí)
          console.log('✅ Actividad es Video Institucional, no redirigir');
          return;
        } else if (normalizedActivityName.includes('instructivo') || normalizedActivityName.includes('instrucciones')) {
          redirectUrl = `/profesor/etapa1/instructivo/${sessionId}/`;
        } else if (normalizedActivityName.includes('personaliz')) {
          redirectUrl = `/profesor/etapa1/personalizacion/${sessionId}/`;
        } else if (normalizedActivityName.includes('presentaci')) {
          redirectUrl = `/profesor/etapa1/presentacion/${sessionId}/`;
        }
      }

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error('Error determining activity:', error);
    }
  };

  const startTimer = (activityId: number, startedAt: string) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    const updateTimer = async () => {
      try {
        // NOTA: Este endpoint no existe en el backend. Necesita ser creado o usar getActivityTimer de la sesión
        // Por ahora se mantiene como está para no romper la funcionalidad
        const response = await api.get(`/sessions/activities/${activityId}/time_remaining/`);
        const data = response.data;
        
        if (data.time_remaining !== null && data.time_remaining > 0) {
          const minutes = Math.floor(data.time_remaining / 60);
          const seconds = data.time_remaining % 60;
          setTimerRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          setTimeExpired(false);
        } else {
          setTimerRemaining('00:00');
          setTimeExpired(true);
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
        }
      } catch (error) {
        console.error('Error al obtener tiempo restante:', error);
      }
    };

    updateTimer();
    timerIntervalRef.current = setInterval(updateTimer, 1000);
  };

  const handleNextActivity = async () => {
    if (!sessionId || !gameSession) return;

    setAdvancing(true);
    try {
      // Usar directamente set_instructivo_activity que establece Instructivo como actividad actual
      // Este endpoint ya maneja la creación de la actividad si no existe
      const data = await sessionsAPI.setInstructivoActivity(sessionId);
      
      console.log('✅ Actividad Instructivo establecida:', data);
      
      // Verificar que la actividad se estableció correctamente
      if (data.current_activity_name && data.current_activity_name.toLowerCase().includes('instructivo')) {
        toast.success('Actividad Instructivo establecida correctamente');
        
        // Actualizar el estado local para reflejar el cambio
        if (data.id) {
          const updatedSession: GameSession = {
            ...gameSession,
            current_activity_name: data.current_activity_name,
            current_stage_number: data.current_stage_number || undefined,
          };
          setGameSession(updatedSession);
        }
        
        // Redirigir a Instructivo después de un breve delay para asegurar que el backend guardó
        setTimeout(() => {
          window.location.href = `/profesor/etapa1/instructivo/${sessionId}/`;
        }, 300);
      } else {
        console.warn('⚠️ La actividad no se estableció correctamente:', data);
        toast.error('Error: La actividad no se estableció correctamente');
        setAdvancing(false);
      }
    } catch (error: any) {
      console.error('Error avanzando a Instructivo:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al avanzar a Instructivo';
      toast.error(errorMessage);
      setAdvancing(false);
    }
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
          <p className="text-xl mb-4">Error al cargar la sesión</p>
          <Button onClick={() => navigate('/profesor/panel')}>Volver al Panel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Fondo animado igual que Login y Registro */}
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

        <div className="w-full max-w-6xl flex flex-col h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex items-center justify-center relative z-20 flex-1 min-h-0"
          >
            {/* Video Container - Responsivo */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 md:p-5 border border-gray-200 w-full h-full flex flex-col">
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="flex-1 rounded-lg sm:rounded-xl shadow-xl overflow-hidden relative bg-black min-h-0"
              >
                <iframe
                  src={`${selectedVideo}?autoplay=0&mute=0&controls=1&rel=0&modestbranding=1`}
                  title="Video Institucional UDD"
                  className="w-full h-full"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </motion.div>

              {/* Botones y texto - En lugar del título */}
              <div className="text-center mt-3 sm:mt-4 flex-shrink-0 flex flex-col items-center gap-2">
                {/* Información - Compacta */}
                <p className="text-gray-600 text-xs sm:text-sm">
                  Los estudiantes están viendo el video institucional en sus tablets
                </p>

                {/* Botón Continuar */}
                <Button
                  onClick={handleNextActivity}
                  disabled={advancing}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold bg-gradient-to-r from-[#093c92] to-[#f757ac] hover:from-[#072e73] hover:to-[#e6498a] text-white shadow-md hover:shadow-lg transition-all"
                >
                  {advancing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Avanzando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

