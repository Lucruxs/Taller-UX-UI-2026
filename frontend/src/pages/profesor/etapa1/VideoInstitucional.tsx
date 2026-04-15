import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';
import { sessionsAPI } from '@/services';
import { toast } from 'sonner';

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
  const [advancing, setAdvancing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
        if (intervalRef.current) clearInterval(intervalRef.current);
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <div className="text-center bg-white rounded-3xl shadow-sm p-8 max-w-sm mx-4">
          <p className="text-lg font-semibold text-slate-700 mb-4">Error al cargar la sesión</p>
          <button
            onClick={() => navigate('/profesor/panel')}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Volver al Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5F0E8] flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5">
              Etapa 1 — Trabajo en Equipo
            </p>
            <h1
              className="text-xl sm:text-2xl font-black text-slate-900"
              style={{ fontFamily: 'Unbounded, sans-serif' }}
            >
              Video Institucional
            </h1>
          </div>
          <img
            src="/images/UDD-negro.png"
            alt="Logo UDD"
            className="h-8 sm:h-10 w-auto object-contain opacity-80"
          />
        </div>

        {/* Video card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col min-h-0"
        >
          {/* iframe */}
          <div className="flex-1 rounded-2xl overflow-hidden bg-black min-h-0">
            <iframe
              src={`${selectedVideo}?autoplay=0&mute=0&controls=1&rel=0&modestbranding=1`}
              title="Video Institucional UDD"
              className="w-full h-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Footer de la tarjeta */}
          <div className="flex items-center justify-between mt-4 flex-shrink-0">
            <p className="text-sm text-slate-500">
              Los estudiantes están viendo este video en sus dispositivos.
            </p>
            <button
              onClick={handleNextActivity}
              disabled={advancing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-4"
            >
              {advancing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Avanzando…</>
              ) : (
                <>Continuar <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

