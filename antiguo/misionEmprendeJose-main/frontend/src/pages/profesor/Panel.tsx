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
  Users,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
  CheckCircle2,
  Trophy,
  Play,
  HelpCircle,
  X,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CancelSessionModal } from '@/components/CancelSessionModal';
import { authAPI, sessionsAPI, academicAPI, challengesAPI } from '@/services';
import { toast } from 'sonner';

interface Professor {
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

interface Faculty {
  id: number;
  name: string;
}

interface Career {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
}

interface LearningObjective {
  id: number;
  title: string;
  description?: string;
  evaluation_criteria?: string;
  pedagogical_recommendations?: string;
  estimated_time?: number;
  stage_name?: string;
}

type Section = 'dashboard' | 'create-session' | 'history' | 'learning-objectives' | 'tutorial';

export function ProfesorPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
  
  // Determinar la sección basada en la ruta
  const getSectionFromPath = (): Section => {
    if (location.pathname === '/profesor/tutorial') return 'tutorial';
    return 'dashboard';
  };
  
  const [currentSection, setCurrentSection] = useState<Section>(getSectionFromPath());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sessions: 0, students: 0 });
  const [isAdmin, setIsAdmin] = useState(false);

  // Formulario crear sesión
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);

  // Historial
  const [historySessions, setHistorySessions] = useState<GameSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Objetivos de aprendizaje
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([]);
  const [loadingObjectives, setLoadingObjectives] = useState(false);

  // Tutorial accordions
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['checklist']));

  // Definir loadActiveSession antes de usarlo en useEffect
  const loadActiveSession = useCallback(async () => {
    try {
      const activeData = await sessionsAPI.getActiveSession();

      if (activeData?.active_sessions && Array.isArray(activeData.active_sessions)) {
        // Filtrar solo sesiones activas (running o lobby) - no mostrar completed o cancelled
        const activeOnly = activeData.active_sessions.filter(
          (s: any) => s.status === 'running' || s.status === 'lobby'
        );
        setActiveSessions(activeOnly);
        setActiveSession(activeOnly[0] || null);
      } else if (activeData?.active_session || (activeData?.room_code && activeData?.id)) {
        const session = activeData.active_session || activeData;
        
        // Verificar que la sesión esté activa (running o lobby)
        if (session.status !== 'running' && session.status !== 'lobby') {
          setActiveSession(null);
          setActiveSessions([]);
          return;
        }
        
        if (session?.current_stage_number === 4 && !session.current_activity_name) {
          try {
            const stagesData = await sessionsAPI.getSessionStages(session.id);
            if (Array.isArray(stagesData)) {
              const stage4 = stagesData.find((s: any) => s.stage_number === 4);
              if (stage4?.presentation_timestamps?._reflection === true) {
                session.current_activity_name = 'Reflexión';
              }
            }
          } catch (error) {
            console.warn('No se pudo verificar estado de reflexión:', error);
          }
        }
        setActiveSession(session || null);
        setActiveSessions(session ? [session] : []);
      } else {
        setActiveSession(null);
        setActiveSessions([]);
      }
    } catch (error) {
      setActiveSession(null);
      setActiveSessions([]);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  // Polling solo cuando hay sesión activa y después de que el panel se haya cargado
  useEffect(() => {
    // No hacer polling si está cargando o no hay sesión activa
    if (loading || (!activeSession && activeSessions.length === 0)) {
      return;
    }

    const interval = setInterval(() => {
      loadActiveSession();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [loading, activeSession?.id, activeSessions.length, loadActiveSession]);

  useEffect(() => {
    // Actualizar sección cuando cambia la ruta
    setCurrentSection(getSectionFromPath());
  }, [location.pathname]);

  useEffect(() => {
    // Solo cargar tutorial si es necesario
    // Historial y Objetivos ahora tienen sus propias páginas
  }, [currentSection]);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/profesor/login');
      return;
    }

    try {
      // Verificar que sea profesor o administrador
      // El endpoint /professors/me/ ahora crea automáticamente el perfil de profesor para administradores
      const profile = await authAPI.getProfile();
      
      setProfessor(profile);
      
      // Verificar si es administrador
      try {
        await authAPI.getAdminProfile();
        setIsAdmin(true);
      } catch (error) {
        // No es administrador, está bien
        setIsAdmin(false);
      }
      
      await loadPanelData();
    } catch (error: any) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      navigate('/profesor/login');
    }
  };

  const loadPanelData = async () => {
    setLoading(true);
    try {
      const [activeData, sessionsList, facultiesList, statsData] = await Promise.all([
        sessionsAPI.getActiveSession().catch(() => null),
        sessionsAPI.list().catch(() => []),
        academicAPI.getFaculties().catch(() => []),
        authAPI.getStats().catch(() => ({ sessions: 0, students: 0 })),
      ]);

      if (activeData?.active_sessions && Array.isArray(activeData.active_sessions)) {
        // Filtrar solo sesiones activas (running o lobby) - no mostrar completed o cancelled
        const activeOnly = activeData.active_sessions.filter(
          (s: any) => s.status === 'running' || s.status === 'lobby'
        );
        setActiveSessions(activeOnly);
        setActiveSession(activeOnly[0] || null);
      } else if (activeData?.active_session || (activeData?.room_code && activeData?.id)) {
        const session = activeData.active_session || activeData;
        
        // Verificar que la sesión esté activa (running o lobby)
        if (session.status !== 'running' && session.status !== 'lobby') {
          setActiveSession(null);
          setActiveSessions([]);
        } else {
          setActiveSession(session);
          setActiveSessions(session ? [session] : []);
        }
      } else {
        setActiveSession(null);
        setActiveSessions([]);
      }

      setSessions(Array.isArray(sessionsList) ? sessionsList : []);
      setStats({ 
        sessions: statsData?.sessions || 0, 
        students: statsData?.students || 0 
      });
      setFaculties(Array.isArray(facultiesList) ? facultiesList : []);
    } catch (error) {
      console.error('Error loading panel:', error);
      toast.error('Error al cargar el panel');
    } finally {
      setLoading(false);
    }
  };

  const loadFaculties = async () => {
    try {
      const data = await academicAPI.getFaculties();
      setFaculties(data);
    } catch (error) {
      console.error('Error loading faculties:', error);
    }
  };

  const loadCareers = async (facultyId: string) => {
    setSelectedCareer('');
    setSelectedCourse('');
    setCareers([]);
    setCourses([]);
    
    try {
      const data = await academicAPI.getCareers(facultyId);
      setCareers(data);
    } catch (error) {
      console.error('Error loading careers:', error);
      toast.error('Error al cargar carreras');
    }
  };

  const loadCourses = async (careerId: string) => {
    setSelectedCourse('');
    setCourses([]);
    
    try {
      const data = await academicAPI.getCourses(careerId);
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Error al cargar cursos');
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const sessionsList = await sessionsAPI.list({ ordering: '-created_at' });
      setHistorySessions(sessionsList);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Error al cargar historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadLearningObjectives = async () => {
    setLoadingObjectives(true);
    try {
      const data = await challengesAPI.getLearningObjectives();
      setLearningObjectives(data);
    } catch (error) {
      console.error('Error loading objectives:', error);
      toast.error('Error al cargar objetivos');
    } finally {
      setLoadingObjectives(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFaculty || !selectedCareer || !selectedCourse) {
      toast.error('Por favor completa todos los campos: Facultad, Carrera y Curso');
      return;
    }

    if (!excelFile) {
      toast.error('Por favor selecciona un archivo Excel');
      return;
    }

    setCreatingSession(true);

    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('course_id', selectedCourse);
      formData.append('min_team_size', '3');
      formData.append('max_team_size', '8');

      const data = await sessionsAPI.createWithExcel(formData);

      toast.success(
        `¡Sala creada exitosamente! Código: ${data.game_session.room_code}. ` +
        `${data.students_processed} estudiantes procesados, ` +
        `${data.teams_created} equipos creados automáticamente.`
      );

      // Recargar sesión activa
      await loadActiveSession();

      // Redirigir al lobby después de 2 segundos
      setTimeout(() => {
        navigate(`/profesor/lobby/${data.game_session.id}`);
      }, 2000);
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.error === 'Ya tienes una sesión activa' && errorData.active_session_id) {
        const continueMsg = `Ya tienes una sesión activa (Sala: ${errorData.active_session_room_code}). ¿Deseas continuar con esa sesión?`;
        if (confirm(continueMsg)) {
          if (errorData.active_session_status === 'lobby') {
            window.location.href = `/lobby/${errorData.active_session_id}/`;
          } else {
            window.location.href = `/game-control/${errorData.active_session_id}/`;
          }
        } else {
          toast.error(errorData.message || errorData.error);
        }
      } else {
        toast.error(errorData?.error || 'Error al crear la sesión');
      }
    } finally {
      setCreatingSession(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    navigate('/profesor/login');
  };

  const getSessionLocation = (session: GameSession): string => {
    if (session.status === 'lobby') {
      return 'Lobby';
    }
    
    if (session.status === 'running') {
      const stageNumber = session.current_stage_number || 1;
      const activityName = (session.current_activity_name || '').toLowerCase();
      
      if (stageNumber === 1) {
        if (activityName.includes('video') || activityName.includes('institucional')) {
          return 'Etapa 1 - Video Institucional';
        } else if (activityName.includes('instructivo') || activityName.includes('instrucciones')) {
          return 'Etapa 1 - Instructivo';
        } else if (activityName.includes('personaliz')) {
          return 'Etapa 1 - Personalización';
        } else if (activityName.includes('presentaci')) {
          return 'Etapa 1 - Presentación';
        } else {
          return 'Etapa 1 - Video Institucional';
        }
      } else if (stageNumber === 2) {
        if (activityName.includes('tema') || activityName.includes('seleccionar')) {
          return 'Etapa 2 - Seleccionar Tema';
        } else if (activityName.includes('bubble') || activityName.includes('mapa')) {
          return 'Etapa 2 - Bubble Map';
        } else {
          return 'Etapa 2 - Seleccionar Tema';
        }
      } else if (stageNumber === 3) {
        return 'Etapa 3 - Prototipo';
      } else if (stageNumber === 4) {
        if (!activityName || activityName.trim() === '') {
          // Si no hay actividad, verificar si está en reflexión o en resultados
          // Por defecto, si no hay actividad y no hay flag de reflexión, está en resultados
          return 'Etapa 4 - Resultados';
        } else if (activityName.includes('presentacion') || activityName.includes('presentación')) {
          return 'Etapa 4 - Presentación Pitch';
        } else if (activityName.includes('formulario')) {
          return 'Etapa 4 - Formulario Pitch';
        } else if (activityName.includes('reflexion') || activityName.includes('reflexión')) {
          return 'Etapa 4 - Reflexión';
        } else {
          return 'Etapa 4 - Resultados';
        }
      }
    }
    
    return 'Sesión activa';
  };

  const continueActiveSession = async () => {
    if (!activeSession) return;

    if (activeSession.status === 'lobby') {
      navigate(`/profesor/lobby/${activeSession.id}`);
    } else if (activeSession.status === 'running') {
      // Determinar URL según etapa y actividad
      const activityName = (activeSession.current_activity_name || '').toLowerCase();
      const stageNumber = activeSession.current_stage_number || 1;

      let redirectUrl = '';
      if (stageNumber === 1) {
        if (activityName.includes('video') || activityName.includes('institucional')) {
          redirectUrl = `/profesor/etapa1/video-institucional/${activeSession.id}/`;
        } else if (activityName.includes('instructivo') || activityName.includes('instrucciones')) {
          redirectUrl = `/profesor/etapa1/instructivo/${activeSession.id}/`;
        } else if (activityName.includes('personaliz')) {
          redirectUrl = `/profesor/etapa1/personalizacion/${activeSession.id}/`;
        } else if (activityName.includes('presentaci')) {
          redirectUrl = `/profesor/etapa1/presentacion/${activeSession.id}/`;
        } else {
          redirectUrl = `/profesor/etapa1/personalizacion/${activeSession.id}/`;
        }
      } else if (stageNumber === 2) {
        if (activityName.includes('tema') || activityName.includes('seleccionar')) {
          redirectUrl = `/profesor/etapa2/seleccionar-tema/${activeSession.id}/`;
        } else if (activityName.includes('bubble') || activityName.includes('mapa')) {
          redirectUrl = `/profesor/etapa2/bubble-map/${activeSession.id}/`;
        } else {
          redirectUrl = `/profesor/etapa2/seleccionar-tema/${activeSession.id}/`;
        }
      } else if (stageNumber === 3) {
        redirectUrl = `/profesor/etapa3/prototipo/${activeSession.id}/`;
      } else if (stageNumber === 4) {
        // Si no hay actividad, verificar si está en reflexión
        if (!activityName || activityName.trim() === '') {
          // Verificar si hay flag de reflexión
          try {
            const stagesData = await sessionsAPI.getSessionStages(activeSession.id);
            if (Array.isArray(stagesData)) {
              const stage4 = stagesData.find((s: any) => s.stage_number === 4);
              if (stage4?.presentation_timestamps?._reflection === true) {
                // Está en reflexión, ir a reflexión
                redirectUrl = `/profesor/reflexion/${activeSession.id}`;
              } else {
                // No está en reflexión, ir a resultados
                // IMPORTANTE: Usar el ID del Stage (modelo de challenges), no el ID del SessionStage
                const stageId = stage4?.stage || activeSession.current_stage?.id || 4;
                redirectUrl = `/profesor/resultados/${activeSession.id}/?stage_id=${stageId}`;
              }
            } else {
              // Si no hay stagesData, usar el current_stage.id o 4 por defecto
              const stageId = activeSession.current_stage?.id || 4;
              redirectUrl = `/profesor/resultados/${activeSession.id}/?stage_id=${stageId}`;
            }
          } catch (error) {
            console.warn('No se pudo verificar estado de reflexión:', error);
            // Si hay error, usar el current_stage.id o 4 por defecto
            const stageId = activeSession.current_stage?.id || 4;
            redirectUrl = `/profesor/resultados/${activeSession.id}/?stage_id=${stageId}`;
          }
        } else if (activityName.includes('presentacion') || activityName.includes('presentación')) {
          redirectUrl = `/profesor/etapa4/presentacion-pitch/${activeSession.id}/`;
        } else {
          redirectUrl = `/profesor/etapa4/formulario-pitch/${activeSession.id}/`;
        }
      } else {
        redirectUrl = `/profesor/etapa1/personalizacion/${activeSession.id}/`;
      }

      window.location.href = redirectUrl;
    }
  };

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<{ id: number; roomCode: string; currentStage?: string | null; currentActivity?: string | null } | null>(null);

  const handleFinishSessionById = async (sessionId: number, roomCode: string, currentStage?: string | null, currentActivity?: string | null) => {
    setSessionToCancel({ id: sessionId, roomCode, currentStage, currentActivity });
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (reason: string, reasonOther?: string) => {
    if (!sessionToCancel) return;

    try {
      const response = await sessionsAPI.finish(sessionToCancel.id, reason, reasonOther);

      toast.success(
        `¡Sala ${sessionToCancel.roomCode} cancelada exitosamente! Se desconectaron ${response?.tablets_disconnected || 0} tablets.`
      );
      
      setCancelModalOpen(false);
      setSessionToCancel(null);
      
      // Recargar datos del panel
      await loadPanelData();
    } catch (error: any) {
      console.error('Error canceling session:', error);
      toast.error(
        error.response?.data?.error || 'Error al cancelar la sesión'
      );
    }
  };

  const handleFinishSession = async () => {
    if (!activeSession) return;
    await handleFinishSessionById(
      activeSession.id, 
      activeSession.room_code,
      activeSession.current_stage_name,
      activeSession.current_activity_name
    );
  };

  const viewSessionDetail = (sessionId: number) => {
    navigate(`/profesor/lobby/${sessionId}`);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      lobby: 'Lobby',
      running: 'En Curso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      lobby: 'bg-yellow-100 text-yellow-800',
      running: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  };

  const toggleAccordion = (id: string) => {
    const newOpen = new Set(openAccordions);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenAccordions(newOpen);
  };

  const getStageName = (stageName: string) => {
    const stageMap: Record<string, string> = {
      'Etapa 1': '🎯 Etapa 1: Trabajo en Equipo',
      'Etapa 2': '💡 Etapa 2: Empatía',
      'Etapa 3': '🧩 Etapa 3: Creatividad',
      'Etapa 4': '📢 Etapa 4: Comunicación',
      'General': '📖 Objetivos Generales',
    };
    return stageMap[stageName] || stageName;
  };

  const recentSessions = sessions
    .filter((s) => !activeSession || s.id !== activeSession.id)
    .filter((s) => s.status !== 'lobby' && s.status !== 'running')
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Obtener nombre y apellido del profesor
  const firstName = professor?.user?.first_name || '';
  const lastName = professor?.user?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || professor?.full_name || professor?.user?.username || 'Profesor';

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
      
      <div className="max-w-6xl mx-auto w-full relative z-10 p-4 sm:p-5 font-sans flex-1 flex flex-col">
        {/* Botones de Header - Arriba */}
        <div className="flex justify-between items-center mb-4">
          {/* Botón Panel de Administrador (solo si es admin) */}
          {isAdmin && (
            <Button
              onClick={() => navigate('/admin/panel')}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md text-sm font-medium"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Panel Admin</span>
            </Button>
          )}
          
          {/* Botón Cerrar Sesión */}
          <div className={isAdmin ? '' : 'ml-auto'}>
            <Button
              onClick={handleLogout}
              className="bg-white text-blue-900 hover:bg-gray-100 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md text-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>

        {/* Mensaje de Bienvenida */}
        <div className="text-center mb-4 sm:mb-5">
            <h1 className="text-xl sm:text-2xl font-medium text-white mb-1 drop-shadow-md tracking-tight">
              ¡Bienvenido Profesor <span className="text-[#f757ac] font-bold">{displayName}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-white/85 font-normal">Mision Emprende UDD</p>
          </div>
        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 py-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-1.5 font-normal">Juegos realizados</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.sessions}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 py-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-1.5 font-normal">Estudiantes activos</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.students}</p>
          </motion.div>
        </div>

        {/* Tarjetas de Acción */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/profesor/crear-sala')}
            className="group cursor-pointer overflow-hidden relative"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 py-6 shadow-2xl border-0 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-purple-600">
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-pink-500 to-rose-500 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                  <Play className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-sm font-semibold text-blue-900 mb-1.5">
                  Nueva Sesión
                </h3>
                
                <p className="text-xs text-gray-600 mb-2.5">
                  Comienza una nueva sesión
                </p>

                <div className="mt-3 flex items-center text-pink-500 group-hover:text-white text-xs font-medium">
                  Comenzar ✨
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => navigate('/profesor/historial')}
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

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate('/profesor/objetivos')}
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
        </div>

        {/* Sala(s) Activa(s) */}
        {activeSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 sm:mt-5 space-y-3"
          >
            {activeSessions.length === 1 ? (
              // Una sola sesión
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl p-5 py-6 shadow-2xl border-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-white mb-1">
                        Sala Activa
                      </h3>
                      <p className="text-xs text-white/90">
                        Código: <span className="font-mono font-bold">{activeSession?.room_code}</span>
                      </p>
                      <p className="text-xs text-white/80 mt-0.5">
                        {activeSession && getSessionLocation(activeSession)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={continueActiveSession}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/30 flex-1 sm:flex-none"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Acceder
                    </Button>
                    <Button
                      onClick={handleFinishSession}
                      className="bg-red-500/80 hover:bg-red-600 text-white border-0 flex-1 sm:flex-none"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Múltiples sesiones
              <>
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 shadow-xl border-0">
                  <h3 className="text-sm sm:text-base font-semibold text-white mb-2">
                    {activeSessions.length} Salas Activas
                  </h3>
                  <p className="text-xs text-white/90">
                    Tienes {activeSessions.length} sesiones activas en paralelo
                  </p>
                </div>
                {activeSessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            Sala {session.room_code}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {getSessionLocation(session)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => navigate(`/profesor/lobby/${session.id}`)}
                          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white flex-1 sm:flex-none text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Acceder
                        </Button>
                        <Button
                          onClick={() => handleFinishSessionById(
                            session.id, 
                            session.room_code,
                            session.current_stage_name,
                            session.current_activity_name
                          )}
                          className="bg-red-500 hover:bg-red-600 text-white flex-1 sm:flex-none text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </motion.div>
        )}

        {/* Botones Flotantes */}
        <div className="fixed bottom-4 left-4 right-20 sm:right-24 flex justify-between items-center z-40 pointer-events-none gap-3">
          <Button
            onClick={() => navigate('/profesor/tutorial')}
            className="bg-white text-blue-900 hover:bg-gray-100 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg pointer-events-auto text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Tutorial</span>
          </Button>
          <Button
            onClick={() => navigate('/profesor/crear-sala')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg pointer-events-auto text-sm flex-shrink-0"
          >
            <Play className="w-4 h-4" />
            <span>¡Comenzar Juego!</span>
          </Button>
        </div>

        {/* Content Sections - Solo Tutorial */}
        {currentSection === 'tutorial' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-xl p-4 sm:p-5 mb-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-blue-900">
                Tutorial y Guía
              </h2>
              <Button
                onClick={() => navigate('/profesor/panel')}
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Tutorial */}
          {currentSection === 'tutorial' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-4 sm:mb-6">Tutorial y Guía</h2>
              <div className="space-y-3">
                {/* Checklist */}
                <div className="bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200">
                  <button
                    onClick={() => toggleAccordion('checklist')}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 flex justify-between items-center font-semibold text-left"
                  >
                    <span>📋 Checklist Previo a la Sesión</span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        openAccordions.has('checklist') ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openAccordions.has('checklist') && (
                    <div className="p-4 space-y-2">
                      {[
                        'Archivo XLSX con estudiantes correcto (Nombre, Correo UDD, RUT)',
                        'Tablets listas y cargadas (1 por cada equipo)',
                        'Códigos QR generados para acceso de tablets',
                        'Material físico preparado (Legos para prototipos, etc.)',
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded">
                          <CheckCircle2 className="w-5 h-5 text-gray-400" />
                          <label className="text-sm">{item}</label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Guía Paso a Paso */}
                <div className="bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200">
                  <button
                    onClick={() => toggleAccordion('guia')}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 flex justify-between items-center font-semibold text-left"
                  >
                    <span>📹 Guía Paso a Paso</span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        openAccordions.has('guia') ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openAccordions.has('guia') && (
                    <div className="p-4">
                      <ol className="space-y-2 list-decimal list-inside text-sm">
                        <li>
                          <strong>Crear Sala:</strong> Selecciona Facultad, Carrera, Curso y sube
                          el archivo XLSX con estudiantes
                        </li>
                        <li>
                          <strong>Lobby:</strong> Revisa los equipos generados automáticamente,
                          espera que todas las tablets se conecten
                        </li>
                        <li>
                          <strong>Iniciar Juego:</strong> Una vez todas las tablets conectadas,
                          presiona "Iniciar Juego"
                        </li>
                        <li>
                          <strong>Control de Etapas:</strong> Controla cada etapa y actividad, puedes
                          avanzar cuando todos terminen o el temporizador expire
                        </li>
                        <li>
                          <strong>Validar Retos:</strong> En cada ruleta, valida los retos
                          completados por los equipos
                        </li>
                        <li>
                          <strong>Ver Resultados:</strong> Al finalizar, revisa los resultados y
                          métricas de cada equipo
                        </li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* FAQ */}
                <div className="bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200">
                  <button
                    onClick={() => toggleAccordion('faq')}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 flex justify-between items-center font-semibold text-left"
                  >
                    <span>❓ FAQ y Soluciones Rápidas</span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        openAccordions.has('faq') ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openAccordions.has('faq') && (
                    <div className="p-4 space-y-4">
                      <div>
                        <strong>Q: ¿Qué hacer si una tablet no se conecta?</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          A: Verifica que el código QR sea correcto. Puedes desconectar y reconectar
                          la tablet desde el lobby.
                        </p>
                      </div>
                      <div>
                        <strong>Q: ¿Qué hacer si falta un equipo?</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          A: Puedes reorganizar los equipos manualmente desde el lobby antes de
                          iniciar el juego.
                        </p>
                      </div>
                      <div>
                        <strong>Q: ¿Cómo interpretar las métricas?</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          A: Los tokens reflejan participación y completitud. Los tiempos muestran
                          eficiencia. La participación mide el compromiso del equipo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          </motion.div>
        )}
      </div>

      {/* Modal de Cancelación */}
      <CancelSessionModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSessionToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        currentStage={sessionToCancel?.currentStage}
        currentActivity={sessionToCancel?.currentActivity}
        roomCode={sessionToCancel?.roomCode}
      />

      {/* Música de fondo */}
    </div>
  );
}

