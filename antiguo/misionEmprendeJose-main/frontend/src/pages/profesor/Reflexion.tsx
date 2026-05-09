import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  Trophy,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Users,
  Lightbulb,
  Rocket,
  Target,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CancelSessionModal } from '@/components/CancelSessionModal';
import { sessionsAPI, teamsAPI, reflectionEvaluationsAPI } from '@/services';
import { toast } from 'sonner';
import { fixTextEncoding } from '@/utils/textEncoding';

interface GameSession {
  id: number;
  room_code: string;
  status: string;
}

interface Team {
  id: number;
  name: string;
  color: string;
  tokens_total?: number;
}

export function ProfesorReflexion() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [estudiantesRespondidos, setEstudiantesRespondidos] = useState(0);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [evaluationUrl, setEvaluationUrl] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [completedStages, setCompletedStages] = useState<any[]>([]);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
      // Polling para actualizar el progreso de respuestas
      const interval = setInterval(() => {
        loadProgress();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  const loadSessionData = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      
      // Cargar información de la sesión usando lobby (funciona aunque la sesión esté finalizada)
      const lobbyData = await sessionsAPI.getLobby(sessionId);
      const sessionData = lobbyData.game_session;
      setGameSession(sessionData);
      
      // CRÍTICO: En reflexión NO redirigimos aunque la sesión esté finalizada
      // El profesor debe permanecer aquí para ver el progreso de las encuestas
      // NO verificar el status aquí para evitar redirecciones automáticas

      // Los equipos vienen en lobbyData.teams
      const teamsData = Array.isArray(lobbyData.teams) ? lobbyData.teams : [];
      setTeams(teamsData);

      // Calcular total de estudiantes usando students_count del serializer
      const total = teamsData.reduce((sum: number, team: any) => {
        // Usar students_count si está disponible (del serializer), sino usar students.length
        const count = team.students_count ?? team.students?.length ?? 0;
        console.log(`Equipo ${team.name}: ${count} estudiantes`, {
          students_count: team.students_count,
          students_length: team.students?.length,
          students: team.students
        });
        return sum + count;
      }, 0);
      
      console.log('📊 Total de estudiantes calculado:', total, 'de', teamsData.length, 'equipos');
      setTotalEstudiantes(total);

      // Cargar progreso inicial
      loadProgress();
      
      // Cargar etapas completadas
      loadCompletedStages();
      
      // Cargar QR de evaluación
      loadReflectionQR();

    } catch (error: any) {
      console.error('Error loading session data:', error);
      toast.error('Error al cargar la información de la sesión');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!sessionId || !gameSession?.room_code) return;
    
    try {
      // Obtener número de evaluaciones recibidas y total de estudiantes
      const evaluationsData = await reflectionEvaluationsAPI.byRoom(gameSession.room_code);
      
      // El endpoint devuelve: { count, total_students, total_evaluations, results }
      console.log('📊 Datos de evaluaciones recibidos:', evaluationsData);
      if (evaluationsData && typeof evaluationsData === 'object') {
        // Si tiene la estructura correcta con count y total_students
        if ('count' in evaluationsData) {
          setEstudiantesRespondidos(evaluationsData.count || 0);
          console.log('📊 Estudiantes respondidos:', evaluationsData.count || 0);
          console.log('📊 Total estudiantes del backend:', evaluationsData.total_students);
          console.log('📊 Total estudiantes actual en estado:', totalEstudiantes);
          
          // Actualizar total si viene en la respuesta (solo si es mayor que 0)
          // Si total_students es 0, mantener el valor calculado desde loadSessionData
          if ('total_students' in evaluationsData && evaluationsData.total_students !== undefined && evaluationsData.total_students > 0) {
            console.log('✅ Usando total_students del backend:', evaluationsData.total_students);
            setTotalEstudiantes(evaluationsData.total_students);
          } else {
            console.log('⚠️ Backend devolvió total_students=0 o undefined, manteniendo valor calculado desde equipos:', totalEstudiantes);
            // No sobrescribir, mantener el valor calculado desde loadSessionData
          }
        } else {
          // Fallback: si es un array o tiene results
          const evaluationsArray = Array.isArray(evaluationsData) 
            ? evaluationsData 
            : (evaluationsData.results || []);
      setEstudiantesRespondidos(evaluationsArray.length);
        }
      } else {
        // Fallback para array simple
        const evaluationsArray = Array.isArray(evaluationsData) ? evaluationsData : [];
        setEstudiantesRespondidos(evaluationsArray.length);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const loadCompletedStages = async () => {
    if (!sessionId) return;
    
    try {
      const stagesData = await sessionsAPI.getSessionStages(Number(sessionId));
      const stagesArray = Array.isArray(stagesData) ? stagesData : [stagesData];
      
      // Filtrar solo las etapas completadas y ordenarlas por número
      const completed = stagesArray
        .filter((stage: any) => stage.status === 'completed')
        .sort((a: any, b: any) => {
          // Ordenar por número de etapa (stage.number o stage.stage según el serializer)
          const numA = a?.stage?.number ?? a?.stage_number ?? 0;
          const numB = b?.stage?.number ?? b?.stage_number ?? 0;
          return numA - numB;
        });
      
      setCompletedStages(completed);
    } catch (error) {
      console.error('Error loading completed stages:', error);
    }
  };
  
  const loadReflectionQR = async () => {
    if (!sessionId) return;
    
    try {
      console.log('📥 Cargando QR de reflexión para sesión:', sessionId);
      const qrData = await sessionsAPI.getReflectionQR(sessionId);
      console.log('✅ Respuesta del endpoint reflection_qr:', qrData);
      
      if (qrData?.qr_code) {
        setQrCode(qrData.qr_code);
        setEvaluationUrl(qrData.evaluation_url);
        console.log('✅ QR cargado correctamente');
      } else {
        console.warn('⚠️ El endpoint no devolvió qr_code');
        toast.error('No se pudo generar el código QR');
      }
    } catch (error: any) {
      console.error('❌ Error loading QR:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      toast.error('Error al cargar el código QR: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleFinalizeSession = async () => {
    if (!sessionId) return;
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (reason: string, reasonOther?: string) => {
    if (!sessionId) return;

    setFinalizing(true);
    try {
      // Finalizar la sesión - las tablets NO se redirigirán porque están en reflexión
      await sessionsAPI.finish(Number(sessionId), reason, reasonOther || 'Sesión completada después de reflexión');
      toast.success('Sesión finalizada correctamente. Las tablets permanecerán en reflexión.');
      
      // Actualizar el estado local para reflejar que la sesión está finalizada
      if (gameSession) {
        setGameSession({ ...gameSession, status: 'completed' });
      }
      
      // NO redirigir automáticamente - el profesor puede quedarse viendo el progreso
      // Solo mostrar un mensaje informativo
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al finalizar la sesión');
    } finally {
      setFinalizing(false);
      setCancelModalOpen(false);
    }
  };

  const porcentajeCompletado = totalEstudiantes > 0 
    ? (estudiantesRespondidos / totalEstudiantes) * 100 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Ordenar equipos por tokens totales
  const teamsOrdered = [...teams].sort((a, b) => (b.tokens_total || 0) - (a.tokens_total || 0));

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Fondo animado */}
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


      <div className="relative z-10 p-3 sm:p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-xl p-3 sm:p-6 mb-3 sm:mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4"
          >
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#093c92] mb-2 flex items-center gap-2">
              <Brain className="w-6 h-6 sm:w-7 sm:h-7" />
              Reflexión Final
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Código de sala: <span className="font-semibold">{gameSession?.room_code}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {gameSession?.status !== 'completed' && gameSession?.status !== 'cancelled' && (
              <Button
                onClick={handleFinalizeSession}
                disabled={finalizing}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {finalizing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  'Finalizar Sesión'
                )}
              </Button>
            )}
            {gameSession?.status === 'completed' || gameSession?.status === 'cancelled' ? (
              <Badge className="bg-green-500 text-white px-4 py-2">
                Sesión Finalizada
              </Badge>
            ) : null}
            <Button 
              onClick={() => navigate('/profesor/panel')} 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver al Panel</span>
              <span className="sm:hidden">Volver</span>
            </Button>
          </div>
        </motion.div>


        {/* QR Code Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
            <Card className="p-4 sm:p-8 bg-white shadow-xl border-2 border-[#093c92]/20 mb-3 sm:mb-4">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl text-[#093c92] mb-2 font-bold">
                  Escanea el código QR
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Los estudiantes deben escanear este código con sus teléfonos móviles
                </p>
              </div>

              {/* QR Code - Simple como en el lobby */}
              <div className="flex justify-center mb-4 sm:mb-6">
                {qrCode ? (
                  <motion.img
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    src={qrCode}
                    alt="QR Code Evaluación"
                    className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-gray-200 rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                    <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Instrucciones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl text-center border border-purple-200"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-md">
                    <span className="text-white text-lg sm:text-xl font-bold">1</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 font-medium">Abre la cámara de tu teléfono</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-3 sm:p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl text-center border border-pink-200"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-md">
                    <span className="text-white text-lg sm:text-xl font-bold">2</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 font-medium">Escanea el código QR</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center border border-blue-200"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-md">
                    <span className="text-white text-lg sm:text-xl font-bold">3</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 font-medium">Completa la encuesta</p>
                </motion.div>
              </div>

              {/* Progreso */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl border-2 border-purple-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    <span className="text-gray-700 text-sm sm:text-base font-semibold">Progreso de respuestas</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-[#093c92] to-[#f757ac] text-white border-0 text-xs sm:text-sm shadow-md">
                    {estudiantesRespondidos} / {totalEstudiantes}
                  </Badge>
                </div>
                <Progress value={porcentajeCompletado} className="h-2 sm:h-3 mb-2" />
                <p className="text-xs sm:text-sm text-gray-600 text-right font-medium">
                  {porcentajeCompletado.toFixed(0)}% completado
                </p>
              </motion.div>
            </Card>
        </motion.div>

          {/* Preguntas de la encuesta (info para el profesor) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 mb-3 sm:mb-4">
              <h3 className="text-[#093c92] text-lg sm:text-xl mb-4 font-bold">
                Preguntas de la Encuesta
              </h3>
              <div className="space-y-3">
                {[
                  '¿Qué tan efectiva fue la comunicación en tu equipo?',
                  '¿Qué tan creativa fue la solución propuesta?',
                  '¿Cómo calificarías el trabajo en equipo?',
                  '¿Qué tan empático fue tu equipo con el problema?',
                  '¿Qué tan bien se organizaron las tareas?',
                  '¿Qué tan satisfecho estás con el resultado final?'
                ].map((pregunta, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                  >
                    <div className="w-6 h-6 bg-gradient-to-r from-[#093c92] to-[#f757ac] rounded-full flex items-center justify-center text-white text-xs sm:text-sm flex-shrink-0 font-bold shadow-md">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 text-xs sm:text-sm">{pregunta}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Ranking Final */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-xl p-4 sm:p-6 mb-3 sm:mb-4"
          >
          <h3 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-4 sm:mb-6 text-center flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6" />
            Clasificación Final
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {teamsOrdered.map((team, index) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;
              const rankMedal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}°`;

              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`p-4 sm:p-6 rounded-xl shadow-md border-l-4 ${
                    isTopThree
                      ? rank === 1
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400 shadow-xl scale-105'
                        : rank === 2
                        ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 shadow-lg'
                        : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 shadow-lg'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md"
                        style={{ backgroundColor: team.color || '#667eea' }}
                      >
                        {team.color?.charAt(0).toUpperCase() || 'E'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base text-[#093c92]">
                          {team.name}
                        </h4>
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-600">
                      {rankMedal}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Tokens totales</span>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm sm:text-base font-bold text-gray-800">
                        {team.tokens_total || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        </div>
      </div>

      {/* Modal de Cancelación */}
      <CancelSessionModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        currentStage={gameSession?.current_stage_name}
        currentActivity={gameSession?.current_activity_name}
        roomCode={gameSession?.room_code}
      />
    </div>
  );
}
