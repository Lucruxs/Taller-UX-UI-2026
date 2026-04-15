import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';
import { sessionsAPI } from '@/services';
import { toast } from 'sonner';

interface GameSession {
  id: number;
  room_code: string;
  status: string;
  current_activity_name?: string;
  current_stage_number?: number;
  started_at?: string;
}

export function ProfesorInstructivo() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // URL del video explicativo del juego (cambiar por el video real)
  const videoUrl = 'https://www.youtube.com/embed/VIDEO_ID_AQUI'; // Reemplazar con el ID del video real

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
      };
    }
  }, [sessionId]);

  const loadGameSession = async () => {
    if (!sessionId) return;

    try {
      const data: GameSession = await sessionsAPI.getById(sessionId);
      
      console.log('📚 Instructivo - Estado actual:', {
        current_activity_name: data.current_activity_name,
        current_stage_number: data.current_stage_number
      });
      
      setGameSession(data);

      // Si hay una actividad establecida (Personalización), redirigir a Personalización
      if (data.current_activity_name && data.current_stage_number) {
        console.log('🔄 Ya se inició la Etapa 1, redirigiendo desde Instructivo:', data.current_activity_name);
        const normalizedName = data.current_activity_name.toLowerCase();
        if (normalizedName.includes('personaliz')) {
          window.location.href = `/profesor/etapa1/personalizacion/${sessionId}/`;
          return;
        } else if (normalizedName.includes('presentaci')) {
          window.location.href = `/profesor/etapa1/presentacion/${sessionId}/`;
          return;
        }
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

  const handleNextActivity = async () => {
    if (!sessionId || !gameSession) return;

    setAdvancing(true);
    try {
      // Iniciar la Etapa 1 después del instructivo
      await sessionsAPI.startStage1(sessionId);

      // Verificar que el estado del backend realmente refleja Personalización antes de redirigir.
      // Esto evita que la página de Personalización lea estado desactualizado al cargar.
      const freshData = await sessionsAPI.getById(sessionId);
      const isReady =
        freshData.current_stage_number === 1 &&
        (freshData.current_activity_name?.toLowerCase().includes('personaliz') ?? false);

      console.log('✅ Etapa 1 iniciada — verificación post-startStage1:', {
        current_stage_number: freshData.current_stage_number,
        current_activity_name: freshData.current_activity_name,
        isReady,
      });

      toast.success('Instructivo completado. Iniciando Etapa 1...');

      if (isReady) {
        // Estado confirmado — redirigir de inmediato
        window.location.href = `/profesor/etapa1/personalizacion/${sessionId}/`;
      } else {
        // Estado aún no propagado (raro) — dar un margen breve y redirigir de todas formas
        console.warn('⚠️ Estado no refleja Personalización tras startStage1:', freshData);
        setTimeout(() => {
          window.location.href = `/profesor/etapa1/personalizacion/${sessionId}/`;
        }, 800);
      }
    } catch (error: any) {
      console.error('Error al iniciar Etapa 1:', error);
      toast.error(error.response?.data?.error || 'Error al iniciar la Etapa 1');
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
      {/* Header con logo */}
      <header className="p-6 flex justify-between items-center flex-shrink-0">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5">
            Etapa 1 — Trabajo en Equipo
          </p>
          <h1
            className="text-xl sm:text-2xl font-black text-slate-900"
            style={{ fontFamily: 'Unbounded, sans-serif' }}
          >
            Instructivo
          </h1>
        </div>
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

          {/* Footer de la tarjeta */}
          <div className="flex items-center justify-between mt-5 flex-shrink-0">
            <p className="text-slate-500 font-medium text-sm">
              Los estudiantes están viendo el instructivo del juego en sus dispositivos.
            </p>
            <button
              onClick={handleNextActivity}
              disabled={advancing}
              className="mt-0 inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-8 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-4"
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










