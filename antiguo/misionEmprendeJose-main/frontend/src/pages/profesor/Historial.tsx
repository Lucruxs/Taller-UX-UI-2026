import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sessionsAPI } from '@/services';
import { toast } from 'sonner';

interface GameSession {
  id: number;
  room_code: string;
  status: 'lobby' | 'running' | 'completed' | 'cancelled';
  course_name?: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  current_stage_number?: number;
  current_stage_name?: string;
  current_activity_name?: string;
  cancellation_reason?: string;
  cancellation_reason_other?: string;
}

export function Historial() {
  const navigate = useNavigate();
  const location = useLocation();
  const [historySessions, setHistorySessions] = useState<GameSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Detectar si estamos en la ruta de admin o profesor
  const isAdminRoute = location.pathname.startsWith('/admin/historial');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      // Si es ruta de admin, usar admin_view=true para ver todas las sesiones
      // Si es ruta de profesor, no usar admin_view (o usar false) para ver solo sus sesiones
      const params: Record<string, any> = { ordering: '-created_at' };
      if (isAdminRoute) {
        params.admin_view = 'true';
      }
      const sessionsList = await sessionsAPI.list(params);
      const sessionsArray = Array.isArray(sessionsList) ? sessionsList : [sessionsList];
      setHistorySessions(sessionsArray);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Error al cargar historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  const viewSessionDetail = (sessionId: number) => {
    // Navegar a la ruta correcta según si es admin o profesor
    if (isAdminRoute) {
      navigate(`/admin/historial/${sessionId}`);
    } else {
      navigate(`/profesor/historial/${sessionId}`);
    }
  };

  const getStatusText = (session: GameSession) => {
    // El backend maneja la lógica, el frontend solo muestra el status
    const statusMap: Record<string, string> = {
      lobby: 'Lobby',
      running: 'En Curso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return statusMap[session.status] || session.status;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-CL', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // La lógica de completado/cancelado ahora está en el backend
  // El frontend solo muestra lo que el backend indica:
  // - status = 'completed' → Juego Completado (el backend lo marca cuando se completa etapa 4)
  // - status = 'cancelled' → Juego Cancelado (el backend lo marca cuando se presiona "Cancelar Sala")

  const getStatusClass = (session: GameSession) => {
    // El backend maneja la lógica, el frontend solo muestra el status
    const classMap: Record<string, string> = {
      lobby: 'bg-yellow-100 text-yellow-800',
      running: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return classMap[session.status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
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
      
      <div className="max-w-4xl mx-auto relative z-10 p-4 sm:p-6">
        <Button
          onClick={() => navigate(isAdminRoute ? '/admin/panel' : '/profesor/panel')}
          variant="ghost"
          className="mb-4 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Panel
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-xl p-4 sm:p-6"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-4 sm:mb-6">Historial de Sesiones</h2>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#093c92]" />
            </div>
          ) : historySessions.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm sm:text-base">
              No hay sesiones registradas aún.
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {historySessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => viewSessionDetail(session.id)}
                  className="bg-gray-50 p-3 sm:p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-[#093c92]"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                    <h4 className="font-semibold text-[#093c92] text-sm sm:text-base">
                      Sala: {session.room_code}
                    </h4>
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${getStatusClass(session)}`}
                    >
                      {getStatusText(session)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm">{session.course_name || 'Curso'}</p>
                  
                  {/* Fecha y hora de creación */}
                  <div className="mt-1">
                    <p className="text-gray-500 text-[10px] sm:text-xs">
                      Creada: {formatDateTime(session.created_at).date} a las {formatDateTime(session.created_at).time}
                    </p>
                  </div>

                  {/* Información de estado - El backend determina si está completado o cancelado */}
                  {session.status === 'completed' && (
                    <div className="mt-1">
                      <p className="text-green-600 text-[10px] sm:text-xs font-semibold">
                        ✅ Juego Completado
                      </p>
                      {session.ended_at && (
                        <p className="text-green-600 text-[10px] sm:text-xs mt-0.5">
                          Completada: {formatDateTime(session.ended_at).date} a las {formatDateTime(session.ended_at).time}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Información de cancelación */}
                  {session.status === 'cancelled' && (
                    <div className="mt-1">
                      <p className="text-red-600 text-[10px] sm:text-xs font-semibold">
                        ❌ Juego Cancelado
                        {session.current_stage_number && session.current_stage_name ? (
                          `: Etapa ${session.current_stage_number}: ${session.current_stage_name}${session.current_activity_name ? ` - ${session.current_activity_name}` : ''}`
                        ) : session.current_activity_name ? (
                          `: ${session.current_activity_name}`
                        ) : ''}
                      </p>
                      {session.ended_at && (
                        <p className="text-red-600 text-[10px] sm:text-xs mt-0.5">
                          Cancelada: {formatDateTime(session.ended_at).date} a las {formatDateTime(session.ended_at).time}
                        </p>
                      )}
                      {session.cancellation_reason && (
                        <p className="text-red-500 text-[10px] sm:text-xs mt-1">
                          Motivo: {session.cancellation_reason === 'Otro' && session.cancellation_reason_other 
                            ? session.cancellation_reason_other 
                            : session.cancellation_reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Información de inicio si existe */}
                  {session.started_at && (
                    <p className="text-gray-400 text-[10px] sm:text-xs mt-1">
                      Iniciada: {formatDateTime(session.started_at).date} a las {formatDateTime(session.started_at).time}
                    </p>
                  )}
                  
                  {!session.started_at && session.status === 'lobby' && (
                    <p className="text-gray-400 text-[10px] sm:text-xs mt-1">
                      En lobby - Click para ver
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

