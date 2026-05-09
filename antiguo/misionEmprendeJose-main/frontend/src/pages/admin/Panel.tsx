import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  History,
  Target,
  BookOpen,
  LogOut,
  GraduationCap,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
  CheckCircle2,
  Play,
  HelpCircle,
  X,
  Settings,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CancelSessionModal } from '@/components/CancelSessionModal';
import { authAPI, sessionsAPI, academicAPI, challengesAPI } from '@/services';
import { toast } from 'sonner';

interface Admin {
  id: number;
  full_name?: string;
  user?: {
    username: string;
    first_name?: string;
    last_name?: string;
  };
}

interface GameSession {
  id: number;
  room_code: string;
  status: 'lobby' | 'running' | 'completed' | 'cancelled';
  course_name?: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  current_stage_name?: string;
  current_stage_number?: number;
  current_activity_name?: string;
}

type Section = 'dashboard' | 'update-game' | 'history' | 'learning-objectives' | 'tutorial';

export function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
  
  // Determinar la sección basada en la ruta
  const getSectionFromPath = (): Section => {
    if (location.pathname === '/admin/tutorial') return 'tutorial';
    if (location.pathname === '/admin/update-game') return 'update-game';
    return 'dashboard';
  };
  
  const [currentSection, setCurrentSection] = useState<Section>(getSectionFromPath());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sessions: 0, students: 0 });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Actualizar sección cuando cambia la ruta
    setCurrentSection(getSectionFromPath());
  }, [location.pathname]);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      // Verificar que sea administrador
      const profile = await authAPI.getAdminProfile();
      if (!profile) {
        throw new Error('No es administrador');
      }
      setAdmin(profile);
      await loadPanelData();
    } catch (error: any) {
      // No es administrador o error de autenticación
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      toast.error('Acceso denegado', {
        description: 'Esta cuenta no tiene permisos de administrador',
      });
      navigate('/admin/login');
    }
  };

  const loadPanelData = async () => {
    setLoading(true);
    try {
      // Cargar estadísticas y sesiones (con admin_view=true para ver todas las sesiones)
      const sessionsList = await sessionsAPI.list({ ordering: '-created_at', admin_view: 'true' });
      const sessionsArray = Array.isArray(sessionsList) ? sessionsList : [sessionsList];
      setSessions(sessionsArray);

      // Calcular estadísticas
      const totalSessions = sessionsArray.length;
      const totalStudents = sessionsArray.reduce((sum: number, session: GameSession) => {
        // Aquí podrías calcular estudiantes si tienes esa información
        return sum;
      }, 0);

      setStats({ sessions: totalSessions, students: totalStudents });

      // Cargar sesiones activas
      const active = sessionsArray.filter((s: GameSession) => 
        s.status === 'lobby' || s.status === 'running'
      );
      
      if (active.length === 1) {
        setActiveSession(active[0]);
        setActiveSessions([]);
      } else if (active.length > 1) {
        setActiveSession(null);
        setActiveSessions(active);
      } else {
        setActiveSession(null);
        setActiveSessions([]);
      }

    } catch (error) {
      console.error('Error loading panel:', error);
      toast.error('Error al cargar el panel');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    navigate('/admin/login');
  };

  const handlePlayRedirect = () => {
    // Redirigir al panel del profesor para jugar
    toast.info('Redirigiendo al panel del profesor...');
    navigate('/profesor/panel');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Obtener nombre del administrador
  const firstName = admin?.user?.first_name || '';
  const lastName = admin?.user?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || admin?.full_name || admin?.user?.username || 'Administrador';

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Fondo - mismo que el panel del profesor */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]" />
      
      <div className="max-w-6xl mx-auto w-full relative z-10 p-4 sm:p-5 font-sans flex-1 flex flex-col">
        {/* Botón Cerrar Sesión - Arriba */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={handleLogout}
            className="bg-white text-blue-900 hover:bg-gray-100 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md text-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>

        {/* Mensaje de Bienvenida */}
        <div className="text-center mb-4 sm:mb-5">
          <h1 className="text-xl sm:text-2xl font-medium text-white mb-1 drop-shadow-md tracking-tight">
            ¡Bienvenido Administrador <span className="text-pink-300 font-bold">{displayName}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-white/85 font-normal">Mision Emprende UDD</p>
        </div>

        {/* Tarjetas de Acción */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Nueva Sesión - Redirige al profesor */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handlePlayRedirect}
            className="group cursor-pointer overflow-hidden relative"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 py-6 shadow-2xl border-0 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-purple-600">
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-pink-500 to-rose-500 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                  <Play className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-sm font-semibold text-blue-900 mb-1.5">
                  Jugar / Nueva Sesión
                </h3>
                
                <p className="text-xs text-gray-600 mb-2.5">
                  Ir al panel del profesor
                </p>

                <div className="mt-3 flex items-center text-pink-500 group-hover:text-white text-xs font-medium">
                  Ir al panel ✨
                </div>
              </div>
            </div>
          </motion.div>

          {/* Historial */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => navigate('/admin/historial')}
            className="group cursor-pointer overflow-hidden relative"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 py-6 shadow-2xl border-0 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-purple-600">
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                  <History className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-sm font-semibold text-blue-900 mb-1.5">
                  Historial
                </h3>
                
                <p className="text-xs text-gray-600 mb-2.5">
                  Ver juegos anteriores
                </p>

                <div className="mt-3 flex items-center text-pink-500 group-hover:text-white text-xs font-medium">
                  Ver más ✨
                </div>
              </div>
            </div>
          </motion.div>

          {/* Objetivos */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate('/admin/objetivos')}
            className="group cursor-pointer overflow-hidden relative"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 py-6 shadow-2xl border-0 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-purple-600">
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-purple-500 to-violet-500 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-sm font-semibold text-blue-900 mb-1.5">
                  Objetivos
                </h3>
                
                <p className="text-xs text-gray-600 mb-2.5">
                  Objetivos de aprendizaje
                </p>

                <div className="mt-3 flex items-center text-pink-500 group-hover:text-white text-xs font-medium">
                  Ver más ✨
                </div>
              </div>
            </div>
          </motion.div>

          {/* NUEVA: Actualizar Juego */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={() => navigate('/admin/update-game')}
            className="group cursor-pointer overflow-hidden relative"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 py-6 shadow-2xl border-0 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-purple-600">
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-sm font-semibold text-blue-900 mb-1.5">
                  Actualizar Juego
                </h3>
                
                <p className="text-xs text-gray-600 mb-2.5">
                  Configurar juego
                </p>

                <div className="mt-3 flex items-center text-pink-500 group-hover:text-white text-xs font-medium">
                  Configurar ✨
                </div>
              </div>
            </div>
          </motion.div>

          {/* NUEVA: Dashboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => navigate('/admin/dashboard')}
            className="group cursor-pointer overflow-hidden relative"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 py-6 shadow-2xl border-0 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-purple-600">
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-sm font-semibold text-blue-900 mb-1.5">
                  Dashboard
                </h3>
                
                <p className="text-xs text-gray-600 mb-2.5">
                  Estadísticas y métricas
                </p>

                <div className="mt-3 flex items-center text-pink-500 group-hover:text-white text-xs font-medium">
                  Ver más ✨
                </div>
              </div>
            </div>
          </motion.div>

          {/* NUEVA: Gestión de Profesores */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={() => navigate('/admin/professors')}
            className="group cursor-pointer overflow-hidden relative"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 py-6 shadow-2xl border-0 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-purple-600">
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-sm font-semibold text-blue-900 mb-1.5">
                  Profesores
                </h3>
                
                <p className="text-xs text-gray-600 mb-2.5">
                  Gestionar acceso de profesores
                </p>

                <div className="mt-3 flex items-center text-pink-500 group-hover:text-white text-xs font-medium">
                  Gestionar ✨
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Botones Flotantes */}
        <div className="fixed bottom-4 left-4 right-20 sm:right-24 flex justify-between items-center z-40 pointer-events-none gap-3">
          <Button
            onClick={() => navigate('/admin/tutorial')}
            className="bg-white text-blue-900 hover:bg-gray-100 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg pointer-events-auto text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Tutorial</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
