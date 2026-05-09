import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Tablet,
  Shuffle,
  Play,
  LogOut,
  X,
  Loader2,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CancelSessionModal } from '@/components/CancelSessionModal';
import { sessionsAPI, teamsAPI, tabletConnectionsAPI } from '@/services';
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
    qr_code?: string;
    status: string;
    current_stage_name?: string | null;
    current_activity_name?: string | null;
  };
  teams: Team[];
  tablet_connections: TabletConnection[];
  all_teams_connected: boolean;
  connected_teams: number;
  total_teams: number;
}

export function ProfesorLobby() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [lobbyData, setLobbyData] = useState<LobbyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedStudent, setDraggedStudent] = useState<{
    id: number;
    sourceTeamId: number;
  } | null>(null);
  const [startingGame, setStartingGame] = useState(false);
  const [finalizingSession, setFinalizingSession] = useState(false);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Título de la pestaña
    document.title = `Lobby - Misión Emprende`;
    
    if (sessionId) {
      loadLobby();
      
      // Auto-refresh cada 5 segundos
      intervalRef.current = setInterval(() => {
        loadLobby();
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        // Restaurar título por defecto al salir
        document.title = 'Misión Emprende';
      };
    }
  }, [sessionId]);

  const loadLobby = async () => {
    if (!sessionId) return;

    try {
      const data: LobbyData = await sessionsAPI.getLobby(sessionId);

      // Si el juego está corriendo, redirigir a la actividad actual
      if (data.game_session.status === 'running') {
        await determineAndRedirectToActivity(parseInt(sessionId));
        return;
      }

      setLobbyData(data);
      setLoading(false);
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate('/profesor/login');
      } else if (error.response?.status === 403) {
        toast.error('La sesión ya ha finalizado');
        setTimeout(() => navigate('/profesor/panel'), 3000);
      } else {
        toast.error('Error al cargar el lobby');
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

      // Si no hay etapa ni actividad, estamos en el video institucional (previo a etapas)
      if (!currentStageNumber && !currentActivityName) {
        window.location.href = `/profesor/etapa1/video-institucional/${sessionId}/`;
        return;
      }

      // Si no hay actividad actual pero hay etapa, ir a resultados
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
          redirectUrl = `/profesor/etapa1/video-institucional/${sessionId}/`;
        } else if (normalizedActivityName.includes('instructivo') || normalizedActivityName.includes('instrucciones')) {
          redirectUrl = `/profesor/etapa1/instructivo/${sessionId}/`;
        } else if (normalizedActivityName.includes('personaliz')) {
          redirectUrl = `/profesor/etapa1/personalizacion/${sessionId}/`;
        } else if (normalizedActivityName.includes('presentaci')) {
          redirectUrl = `/profesor/etapa1/presentacion/${sessionId}/`;
        }
      } else if (currentStageNumber === 2) {
        if (normalizedActivityName.includes('tema') || normalizedActivityName.includes('seleccionar') || normalizedActivityName.includes('desafio') || normalizedActivityName.includes('desafío')) {
          redirectUrl = `/profesor/etapa2/seleccionar-tema/${sessionId}/`;
        } else if (normalizedActivityName.includes('bubble') || normalizedActivityName.includes('mapa')) {
          redirectUrl = `/profesor/etapa2/bubble-map/${sessionId}/`;
        }
      } else if (currentStageNumber === 3) {
        if (normalizedActivityName.includes('prototipo')) {
          redirectUrl = `/profesor/etapa3/prototipo/${sessionId}/`;
        }
      } else if (currentStageNumber === 4) {
        if (normalizedActivityName.includes('pitch') && normalizedActivityName.includes('formulario')) {
          redirectUrl = `/profesor/etapa4/formulario-pitch/${sessionId}/`;
        } else if (normalizedActivityName.includes('confirmar') && normalizedActivityName.includes('orden')) {
          redirectUrl = `/profesor/etapa4/confirmar-orden-pitch/${sessionId}/`;
        } else if (normalizedActivityName.includes('pitch') && normalizedActivityName.includes('presentacion')) {
          redirectUrl = `/profesor/etapa4/presentacion-pitch/${sessionId}/`;
        }
      }

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error('Error determining activity:', error);
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

  const copyToClipboard = async (roomCode: string) => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar el código');
    }
  };

  const handleDragStart = (studentId: number, sourceTeamId: number) => {
    setDraggedStudent({ id: studentId, sourceTeamId });
  };

  const handleDragEnd = () => {
    setDraggedStudent(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetTeamId: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedStudent || draggedStudent.sourceTeamId === targetTeamId) {
      setDraggedStudent(null);
      return;
    }

    // Guardar valores antes de limpiar el estado
    const studentId = draggedStudent.id;
    const sourceTeamId = draggedStudent.sourceTeamId;

    // Actualización optimista: mover el estudiante localmente inmediatamente
    if (lobbyData) {
      const sourceTeam = lobbyData.teams.find(t => t.id === sourceTeamId);
      const targetTeam = lobbyData.teams.find(t => t.id === targetTeamId);
      const student = sourceTeam?.students?.find(s => s.id === studentId);

      if (sourceTeam && targetTeam && student) {
        // Actualizar estado local inmediatamente
        const updatedTeams = lobbyData.teams.map(team => {
          if (team.id === sourceTeamId) {
            return {
              ...team,
              students: team.students?.filter(s => s.id !== studentId) || [],
              students_count: (team.students_count || 0) - 1,
            };
          }
          if (team.id === targetTeamId) {
            return {
              ...team,
              students: [...(team.students || []), student],
              students_count: (team.students_count || 0) + 1,
            };
          }
          return team;
        });

        setLobbyData({
          ...lobbyData,
          teams: updatedTeams,
        });
      }
    }

    // Limpiar estado de arrastre inmediatamente
    setDraggedStudent(null);

    // Hacer la petición al backend en segundo plano
    try {
      await teamsAPI.moveStudent(sourceTeamId, studentId, targetTeamId);

      // Solo mostrar notificación si todo salió bien (silenciosa y corta)
      toast.success('Estudiante movido', {
        duration: 1500,
        style: {
          fontSize: '0.875rem',
          padding: '0.5rem 0.75rem',
        },
      });

      // Recargar datos en segundo plano para mantener sincronización
      setTimeout(() => {
        loadLobby();
      }, 300);
    } catch (error: any) {
      // Si falla, revertir cambios y mostrar error
      toast.error(error.response?.data?.error || 'Error al mover el estudiante', {
        duration: 2000,
      });
      // Recargar para revertir cambios
      loadLobby();
    }
  };

  const disconnectTablet = async (connectionId: number) => {
    if (!confirm('¿Desconectar esta tablet?')) return;

    try {
      await tabletConnectionsAPI.disconnect(connectionId);
      toast.success('Tablet desconectada exitosamente');
      setTimeout(() => {
        loadLobby();
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al desconectar tablet');
    }
  };

  const shuffleAllTeams = async () => {
    if (!confirm('¿Reorganizar todos los estudiantes aleatoriamente?')) return;

    try {
      await teamsAPI.shuffleAll(parseInt(sessionId || '0'));
      toast.success('Estudiantes reorganizados exitosamente');
      setTimeout(() => {
        loadLobby();
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al reorganizar estudiantes');
    }
  };

  const startGame = async () => {
    if (!confirm('¿Iniciar el juego? Todos los equipos deben tener su tablet conectada.')) {
      return;
    }

    setStartingGame(true);

    try {
      const response = await sessionsAPI.start(sessionId);
      console.log('✅ Juego iniciado, respuesta:', response);
      toast.success('¡Juego iniciado exitosamente! Redirigiendo al video institucional...');
      // Redirigir directamente al video institucional
      window.location.href = `/profesor/etapa1/video-institucional/${sessionId}/`;
    } catch (error: any) {
      console.error('❌ Error al iniciar juego:', error);
      const errorMessage = error.response?.data?.error || 'Error al iniciar el juego';
      toast.error(errorMessage);
      setStartingGame(false);
    }
  };

  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const finalizeSession = async () => {
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (reason: string, reasonOther?: string) => {
    setFinalizingSession(true);

    try {
      const data = await sessionsAPI.finish(Number(sessionId), reason, reasonOther);
      toast.success(`¡Sesión cancelada exitosamente! Se desconectaron ${data.tablets_disconnected || 0} tablets.`);
      setCancelModalOpen(false);
      setTimeout(() => {
        navigate('/profesor/panel');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cancelar la sesión');
      setFinalizingSession(false);
    }
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
          <Button onClick={() => navigate('/profesor/panel')}>Volver al Panel</Button>
        </div>
      </div>
    );
  }

  const { game_session, teams, tablet_connections, all_teams_connected } = lobbyData;

  const connectionProgress = (lobbyData.connected_teams / lobbyData.total_teams) * 100;

  // URL del juego para tablets
  const joinUrl = `${window.location.origin}/tablet/join/${game_session.room_code}`;
  const joinUrlShort = `misionemprende.cl/tablet/join/${game_session.room_code}`;

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
      
      <div className="relative z-10 max-w-6xl mx-auto p-3 sm:p-4">
        {/* Título de la página */}
        <div className="mb-3 sm:mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
            Lobby de Sala
          </h1>
        </div>

        {/* Header Compacto - Todo en una fila */}
        <div className="bg-white rounded-xl shadow-xl p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 sm:gap-4">
            {/* QR Code Compacto */}
            {game_session.qr_code && (
              <div className="flex-shrink-0">
                <img
                  src={game_session.qr_code}
                  alt="QR Code"
                  className="w-24 h-24 sm:w-28 sm:h-28 border-2 border-gray-200 rounded-lg shadow-sm"
                />
              </div>
            )}

            {/* Código y Link - Compacto */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Código */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-[#093c92] tracking-wider">
                  {game_session.room_code}
                </span>
                <Button
                  onClick={() => copyToClipboard(game_session.room_code)}
                  size="icon"
                  className="bg-[#f757ac] hover:bg-[#e6498a] text-white h-8 w-8 rounded-lg flex-shrink-0"
                  title="Copiar código"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Link */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#093c92] hover:text-[#072e73] font-medium text-xs sm:text-sm break-all hover:underline"
                >
                  {joinUrlShort}
                </a>
                <Button
                  onClick={() => copyToClipboard(joinUrl)}
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0"
                  title="Copiar link"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              {/* Estado de conexiones */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  {lobbyData.connected_teams}/{lobbyData.total_teams} Tablets
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#093c92] to-[#f757ac] transition-all duration-500 rounded-full"
                    style={{ width: `${connectionProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Botón Iniciar - Compacto */}
            <div className="w-full lg:w-auto flex-shrink-0">
              <Button
                onClick={startGame}
                disabled={!all_teams_connected || startingGame}
                className={`w-full lg:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold ${
                  all_teams_connected
                    ? 'bg-gradient-to-r from-[#093c92] to-[#1e5bb8] hover:from-[#072e73] hover:to-[#164a9a] text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {startingGame ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                    Iniciando...
                  </>
                ) : all_teams_connected ? (
                  <>
                    <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Iniciar Juego
                  </>
                ) : (
                  <>
                    <Tablet className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Esperando conexión...
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Botón Reorganizar */}
        <div className="mb-3 sm:mb-4 text-center">
          <Button
            onClick={shuffleAllTeams}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 mx-auto border-2 border-gray-300 hover:border-[#093c92] text-xs sm:text-sm"
          >
            <Shuffle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Reorganizar Aleatoriamente</span>
          </Button>
        </div>

        {/* Texto informativo sobre arrastrar */}
        <div className="mb-3 sm:mb-4 text-center">
          <p className="text-xs sm:text-sm text-white">
            💡 <strong>Arrastra</strong> estudiantes entre equipos para reorganizarlos
          </p>
        </div>

        {/* Equipos en Grid Horizontal - Mismo ancho que contenedor superior */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-3 sm:mb-4 ${
          teams.length === 3 
            ? 'lg:grid-cols-3' 
            : teams.length === 4 
            ? 'lg:grid-cols-4'
            : 'lg:grid-cols-4'
        }`}>
          {teams.map((team) => {
            const tabletConnection = tablet_connections.find((tc) => tc.team === team.id);
            const isConnected = tabletConnection?.is_connected || false;

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg sm:rounded-xl shadow-md border-l-4 p-3 sm:p-4"
                style={{ borderLeftColor: getTeamColorHex(team.color) }}
              >
                {/* Header del equipo */}
                <div className="flex items-center justify-between mb-3">
                  {/* Nombre del equipo (píldora) */}
                  <div
                    className="px-2 sm:px-3 py-1 rounded-full text-white text-xs sm:text-sm font-semibold"
                    style={{ backgroundColor: getTeamColorHex(team.color) }}
                  >
                    {team.name}
                  </div>

                  {/* Icono de tablet */}
                  <Button
                    onClick={() => tabletConnection && disconnectTablet(tabletConnection.id)}
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg ${
                      isConnected
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={isConnected ? 'Tablet conectada - Click para desconectar' : 'Sin tablet'}
                  >
                    <Tablet className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>

                {/* Lista de estudiantes */}
                <div
                  onDrop={(e) => handleDrop(e, team.id)}
                  onDragOver={handleDragOver}
                  className="space-y-1.5 sm:space-y-2 mb-3 min-h-[150px] sm:min-h-[180px]"
                >
                  {team.students && team.students.length > 0 ? (
                    team.students.map((student) => (
                      <div
                        key={student.id}
                        draggable
                        onDragStart={() => handleDragStart(student.id, team.id)}
                        onDragEnd={handleDragEnd}
                        className="flex items-center gap-2 p-1.5 sm:p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#093c92] hover:shadow-sm cursor-move transition-all group"
                        title={`${student.full_name} - Arrastra para mover`}
                      >
                        {/* Avatar circular con inicial */}
                        <div
                          className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow-sm"
                          style={{ backgroundColor: getTeamColorHex(team.color) }}
                        >
                          {getInitials(student.full_name)}
                        </div>
                        {/* Nombre del estudiante */}
                        <span className="flex-1 text-[10px] sm:text-xs text-gray-700 truncate">
                          {getShortName(student.full_name)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-6 text-[10px] sm:text-xs">
                      Sin estudiantes
                    </div>
                  )}
                </div>

                {/* Contador de estudiantes */}
                <div className="text-center text-gray-500 text-[10px] sm:text-xs font-medium">
                  {team.students_count} estudiante{team.students_count !== 1 ? 's' : ''}
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Modal de Cancelación */}
      <CancelSessionModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        currentStage={lobbyData?.game_session?.current_stage_name}
        currentActivity={lobbyData?.game_session?.current_activity_name}
        roomCode={lobbyData?.game_session?.room_code}
      />

      {/* Música de fondo */}
    </div>
  );
}
