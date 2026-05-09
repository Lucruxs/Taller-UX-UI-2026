import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Clock, ArrowRight, ArrowUp, ArrowDown, Play, CheckCircle2, 
  FileText, Eye, X, Users, Trophy, Image as ImageIcon, Target, Lightbulb, Coins, XCircle, Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EtapaIntroModal } from '@/components/EtapaIntroModal';
import { 
  sessionsAPI, 
  sessionStagesAPI, 
  teamPersonalizationsAPI,
  peerEvaluationsAPI
} from '@/services';
import { toast } from 'sonner';
import { useGameStateRedirect } from '@/hooks/useGameStateRedirect';
import { isDevMode } from '@/utils/devMode';

interface Team {
  id: number;
  name: string;
  color: string;
}

interface SessionStage {
  id: number;
  presentation_order: number[] | null;
  current_presentation_team_id: number | null;
  presentation_state: string;
  presentation_timestamps?: Record<string, string>;
}

interface GameSession {
  id: number;
  room_code: string;
  current_stage_number?: number;
}

export function ProfesorPresentacionPitch() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // Redirigir automáticamente si el juego está en otro estado
  useGameStateRedirect();
  
  const [loading, setLoading] = useState(true);
  const [isAdvancingTurn, setIsAdvancingTurn] = useState(false);
  const [isStartingPitch, setIsStartingPitch] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [sessionStage, setSessionStage] = useState<SessionStage | null>(null);
  const [presentationOrder, setPresentationOrder] = useState<number[]>([]);
  const [currentPresentationTeamId, setCurrentPresentationTeamId] = useState<number | null>(null);
  const [presentationState, setPresentationState] = useState<string | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<string>('01:30');
  const [currentTeamPrototype, setCurrentTeamPrototype] = useState<string | null>(null);
  const [currentTeamPitch, setCurrentTeamPitch] = useState<{
    intro_problem: string;
    solution: string;
    value: string;
    impact: string;
    closing: string;
  } | null>(null);
  const [evaluationProgress, setEvaluationProgress] = useState<{
    completed: number;
    total: number;
  }>({ completed: 0, total: 0 });
  const [allEvaluations, setAllEvaluations] = useState<any[]>([]);
  const [showEvaluations, setShowEvaluations] = useState(false);
  const [showEtapaIntro, setShowEtapaIntro] = useState(false);
  const [personalizations, setPersonalizations] = useState<Record<number, { team_name?: string }>>({});

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localTimerSecondsRef = useRef<number>(90);
  const presentationStateRef = useRef<string>('not_started');
  const syncCounterRef = useRef<number>(0);

  useEffect(() => {
    if (!sessionId) return;

    // Cargar estado inicial
      loadGameControl();
      
    // Polling optimizado: más frecuente durante presentación/evaluación
    const setupPolling = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      const pollInterval = presentationStateRef.current === 'presenting' || presentationStateRef.current === 'evaluating' ? 5000 : 8000;
        intervalRef.current = setInterval(() => {
          loadGameControl();
        }, pollInterval);
      };
      
    setupPolling();

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
  }, [sessionId]);
  
  // Actualizar intervalo cuando cambia el estado de presentación
  useEffect(() => {
    if (!sessionId || !intervalRef.current) return;
    const pollInterval = presentationState === 'presenting' || presentationState === 'evaluating' ? 5000 : 8000;
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        loadGameControl();
      }, pollInterval);
  }, [presentationState, sessionId]);

  // Calcular si todas las presentaciones están completadas
  const allPresentationsCompleted = presentationOrder.length > 0 && 
    !currentPresentationTeamId && 
    presentationState !== 'not_started';

  // Polling del progreso de evaluaciones cuando estamos en estado evaluating
  useEffect(() => {
    if (presentationState === 'evaluating' && currentPresentationTeamId && sessionStage?.id) {
      loadEvaluationProgress(currentPresentationTeamId);
      
      // Polling cada 4 segundos (suficiente para actualizar progreso)
      const progressInterval = setInterval(() => {
        loadEvaluationProgress(currentPresentationTeamId);
      }, 4000);
      
      return () => {
        clearInterval(progressInterval);
      };
    } else if (presentationState !== 'evaluating') {
      setEvaluationProgress({ completed: 0, total: 0 });
    }
  }, [presentationState, currentPresentationTeamId, sessionStage?.id]);

  // Cargar todas las evaluaciones cuando todas las presentaciones estén completadas
  useEffect(() => {
    if (allPresentationsCompleted && gameSession?.id && !showEvaluations) {
      loadAllEvaluations();
    }
  }, [allPresentationsCompleted, gameSession, showEvaluations]);

  const previousTeamIdRef = useRef<number | null>(null);
  const personalizationsLoadedRef = useRef<boolean>(false);

  const loadGameControl = async () => {
    if (!sessionId) return;

    try {
      const sessionData: GameSession = await sessionsAPI.getById(sessionId);
      setGameSession(sessionData);

      // Verificar si debemos mostrar la intro de la etapa (solo una vez)
      if (sessionData.current_stage_number === 4 && !showEtapaIntro) {
        const introKey = `etapa_intro_${sessionId}_4`;
        const hasSeenIntro = localStorage.getItem(introKey);
        if (!hasSeenIntro) {
          setShowEtapaIntro(true);
        }
      }

      const currentStageNumber = sessionData.current_stage_number || 1;
      if (currentStageNumber !== 4) {
        if (currentStageNumber === 3) {
          window.location.replace(`/profesor/etapa3/prototipo/${sessionId}/`);
        } else if (currentStageNumber === 2) {
          window.location.replace(`/profesor/etapa2/seleccionar-tema/${sessionId}/`);
        } else {
          window.location.replace(`/profesor/etapa1/personalizacion/${sessionId}/`);
        }
        return;
      }

      // CARGAR ESTADO DE PRESENTACIÓN PRIMERO (crítico para mostrar la pantalla correcta)
      // Cargar stages primero (más rápido que teams)
      const stagesData = await sessionsAPI.getSessionStages(Number(sessionId));
      const stagesList = Array.isArray(stagesData) ? stagesData : [stagesData];
      const stage4 = stagesList.find((s: any) => s.stage_number === 4) || null;

      if (stage4) {
        setSessionStage(stage4);
        
        // Establecer estado básico INMEDIATAMENTE desde stage4 (sin esperar nada más)
        const basicState = stage4.presentation_state || 'not_started';
        setPresentationState(basicState);
        presentationStateRef.current = basicState;
        
        if (stage4.current_presentation_team_id) {
          setCurrentPresentationTeamId(stage4.current_presentation_team_id);
          previousTeamIdRef.current = stage4.current_presentation_team_id;
        }
        
        if (stage4.presentation_order && stage4.presentation_order.length > 0) {
              setPresentationOrder(stage4.presentation_order);
        }
        
        // Marcar como cargado INMEDIATAMENTE (UI visible ahora)
        setLoading(false);
        
        // Cargar datos adicionales en background (no bloquean)
        Promise.all([
          // Cargar presentation_status para datos completos
          sessionStagesAPI.getPresentationStatus(stage4.id).catch(() => null),
          // Cargar teams si no están cargados
          teams.length === 0 ? sessionsAPI.getTeams(sessionId).catch(() => null) : Promise.resolve(null)
        ]).then(([statusData, teamsData]) => {
        
          // Actualizar estado si cambió
          if (statusData) {
            const presentationStateFromBackend = statusData.presentation_state || basicState;
            if (presentationStateFromBackend !== basicState) {
              setPresentationState(presentationStateFromBackend);
              presentationStateRef.current = presentationStateFromBackend;
            }
            
            // Cargar contenido del equipo actual si está presentando
            if (stage4.current_presentation_team_id) {
            if (statusData.current_team_prototype) {
              let imageUrl = statusData.current_team_prototype;
              if (imageUrl.startsWith('/')) {
                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const baseUrl = apiBaseUrl.replace('/api', '');
                imageUrl = `${baseUrl}${imageUrl}`;
              }
              setCurrentTeamPrototype(imageUrl);
            }
            
            if (statusData.current_team_pitch) {
              setCurrentTeamPitch(statusData.current_team_pitch);
            }
            }
          }

          // Cargar equipos si no están cargados
          if (teamsData && teams.length === 0) {
            const teamsArray = Array.isArray(teamsData) ? teamsData : [teamsData];
            setTeams(teamsArray);
            
            // Cargar personalizaciones en background
            if (!personalizationsLoadedRef.current) {
              const persMap: Record<number, { team_name?: string }> = {};
              Promise.all(
                teamsArray.map(async (team) => {
                  try {
                    const persList = await teamPersonalizationsAPI.list({ team: team.id });
                    const persResults = Array.isArray(persList) ? persList : [persList];
                    if (persResults.length > 0 && persResults[0].team_name) {
                      persMap[team.id] = { team_name: persResults[0].team_name };
                    }
                  } catch (error) {
                    // Silently fail
                  }
                })
              ).then(() => {
                setPersonalizations(persMap);
                personalizationsLoadedRef.current = true;
              });
            }
          }
        });

        // Generar orden solo si es necesario (en background)
        if (basicState === 'not_started' && (!stage4.presentation_order || stage4.presentation_order.length === 0)) {
          sessionStagesAPI.generatePresentationOrder(stage4.id)
            .then((orderResponse) => {
              setPresentationOrder(orderResponse.presentation_order || []);
            })
            .catch(() => {
              // Silently fail
            });
        }

        // Iniciar timer si está presentando (no bloquea)
        if (basicState === 'presenting' && stage4.current_presentation_team_id) {
          startPresentationTimer(stage4).catch(() => {
            // Silently fail
          });
        }
      } else {
        // Si no hay stage4, marcar como cargado de todas formas
      setLoading(false);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate('/profesor/login');
      } else {
        toast.error('Error al cargar la sesión');
      }
      setLoading(false);
    }
  };


  const loadEvaluationProgress = async (presentingTeamId: number) => {
    try {
      // Usar el endpoint del backend que devuelve el progreso de evaluaciones
      if (!sessionStage?.id) return;
      
      const progressData = await sessionStagesAPI.getPresentationEvaluationProgress(sessionStage.id);
      
      setEvaluationProgress({
        completed: progressData.completed || 0,
        total: progressData.total || 0,
      });
    } catch (error) {
      // Silently fail
    }
  };

  const startPresentationTimer = async (stage: SessionStage) => {
    // Asegurarse de que el estado esté actualizado en el ref
    presentationStateRef.current = 'presenting';
    
    // Limpiar intervalo anterior si existe
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (!stage) return;
    
    const stageId = stage.id;

    // Obtener el temporizador del servidor INMEDIATAMENTE (crítico para sincronización)
    let serverRemaining = 90; // Valor por defecto
    let isFinished = false;
    
    try {
      const timerData = await sessionStagesAPI.getPresentationTimer(stageId);
      
      if (timerData && !timerData.error) {
        isFinished = timerData.is_finished === true;
        serverRemaining = timerData.remaining_seconds ?? 90;
      }
    } catch (error) {
      // Silently fail, usar valor por defecto
    }

    // Si el timer ya terminó, mostrar 00:00 inmediatamente
        if (isFinished || serverRemaining <= 0) {
          localTimerSecondsRef.current = 0;
          setTimerRemaining('00:00');
          return;
        }
        
    // Establecer el tiempo restante del servidor
        localTimerSecondsRef.current = serverRemaining;

    // Actualizar display INMEDIATAMENTE con el valor del servidor
    const minutes = Math.floor(localTimerSecondsRef.current / 60);
    const seconds = localTimerSecondsRef.current % 60;
    setTimerRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

    const stageIdForTimer = stageId;
    syncCounterRef.current = 0;
    
    // Iniciar el intervalo de actualización
    timerIntervalRef.current = setInterval(() => {
      if (presentationStateRef.current !== 'presenting') {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        return;
      }

      if (localTimerSecondsRef.current > 0) {
        localTimerSecondsRef.current--;
      }
      
      const minutes = Math.floor(localTimerSecondsRef.current / 60);
      const seconds = localTimerSecondsRef.current % 60;
      setTimerRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

      if (localTimerSecondsRef.current <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setTimerRemaining('00:00');
        return;
      }
      
      syncCounterRef.current++;

      // Sincronizar con el servidor cada 5 segundos (más frecuente para mejor sincronización)
      if (syncCounterRef.current % 5 === 0 && localTimerSecondsRef.current > 0) {
        (async () => {
          try {
            const timerData = await sessionStagesAPI.getPresentationTimer(stageIdForTimer);
            if (timerData && !timerData.error) {
              const isFinished = timerData.is_finished === true;
              const serverRemaining = timerData.remaining_seconds ?? 0;
              
              if (isFinished || serverRemaining <= 0) {
                if (timerIntervalRef.current) {
                  clearInterval(timerIntervalRef.current);
                  timerIntervalRef.current = null;
                }
                localTimerSecondsRef.current = 0;
                setTimerRemaining('00:00');
                return;
              }
              
              // Si hay una diferencia significativa (>2 segundos), sincronizar
              if (Math.abs(localTimerSecondsRef.current - serverRemaining) > 2) {
                localTimerSecondsRef.current = serverRemaining;
                const minutes = Math.floor(localTimerSecondsRef.current / 60);
                const seconds = localTimerSecondsRef.current % 60;
                setTimerRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
              }
            }
          } catch (error) {
            // Silently fail
          }
        })();
      }
    }, 1000);
  };

  const handleGenerateOrder = async () => {
    if (!sessionStage) return;

    // No permitir generar si ya están presentando
    if (presentationState !== 'not_started' && currentPresentationTeamId) {
      toast.error('No se puede generar un nuevo orden mientras las presentaciones están en curso');
      return;
    }

    try {
      const response = await sessionStagesAPI.generatePresentationOrder(sessionStage.id);
      setPresentationOrder(response.presentation_order || []);
      toast.success('Orden de presentación generado');
    } catch (error: any) {
      toast.error('Error al generar orden: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleMoveTeam = async (index: number, direction: 'up' | 'down') => {
    // No permitir cambios si ya están presentando
    if (presentationState !== 'not_started' && currentPresentationTeamId) {
      toast.error('No se puede modificar el orden mientras las presentaciones están en curso');
      return;
    }
    
    const newOrder = [...presentationOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setPresentationOrder(newOrder);
    
    // Actualizar automáticamente en el servidor
    if (sessionStage) {
      try {
        await sessionStagesAPI.updatePresentationOrder(sessionStage.id, newOrder);
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Error al actualizar orden');
        // Revertir cambio local si falla
        setPresentationOrder(presentationOrder);
      }
    }
  };


  const handleStartPresentations = async () => {
    if (!sessionStage) return;

    try {
      await sessionStagesAPI.startPresentation(sessionStage.id);
      toast.success('Presentaciones iniciadas');
      loadGameControl();
    } catch (error: any) {
      toast.error('Error al iniciar: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleStartTeamPitch = async () => {
    if (!sessionStage || isStartingPitch) return;

    setIsStartingPitch(true);
    
    // Mostrar feedback inmediato
    toast.info('Iniciando pitch...');

    try {
      // Llamar al endpoint para iniciar el pitch del equipo (esto guarda el timestamp en el servidor)
      const response = await sessionStagesAPI.startTeamPitch(sessionStage.id);
      
      // Actualizar estado local INMEDIATAMENTE (sin esperar loadGameControl)
      setPresentationState('presenting');
      
      // Mostrar confirmación inmediata
      toast.success('✅ Pitch iniciado. El cronómetro comenzó.');
      
      // Iniciar el temporizador en background (no bloquea)
      startPresentationTimer(sessionStage).catch(() => {
        // Silently fail, el timer seguirá funcionando
      });
      
      // Recargar datos completos en background (no bloquea)
      loadGameControl().finally(() => {
        setIsStartingPitch(false);
      });
    } catch (error: any) {
      setIsStartingPitch(false);
      toast.error('Error al iniciar presentación: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleFinishPresentation = async () => {
    if (!sessionStage) return;

    try {
      await sessionStagesAPI.finishTeamPresentation(sessionStage.id);
      
      // Detener el temporizador (como en el HTML)
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimerRemaining('01:30');
      localTimerSecondsRef.current = 90;
      
      toast.success('✅ Presentación finalizada. Los equipos pueden evaluar ahora.');
      loadGameControl();
    } catch (error: any) {
      toast.error('Error al finalizar: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleNextPresentation = async () => {
    if (!sessionStage || isAdvancingTurn) return;

    setIsAdvancingTurn(true);
    
    // Mostrar feedback inmediato
    toast.info('Avanzando al siguiente turno...');

    try {
      const response = await sessionStagesAPI.nextPresentation(sessionStage.id);
      
      // Actualizar estado local INMEDIATAMENTE (sin esperar loadGameControl)
      if (!response.current_presentation_team_id) {
        // Todas las presentaciones completadas
        setCurrentPresentationTeamId(null);
        setPresentationState('not_started');
        toast.success('✅ Todas las presentaciones completadas');
      } else {
        // Siguiente equipo
        setCurrentPresentationTeamId(response.current_presentation_team_id);
        setPresentationState('preparing');
        toast.success('✅ Siguiente turno iniciado');
      }
      
      // Actualizar sessionStage localmente
      if (response.presentation_order) {
        setPresentationOrder(response.presentation_order);
      }
      
      // Recargar datos completos en background (no bloquea)
      loadGameControl().finally(() => {
        setIsAdvancingTurn(false);
      });
    } catch (error: any) {
      setIsAdvancingTurn(false);
      toast.error('Error al avanzar: ' + (error.response?.data?.error || error.message));
    }
  };

  const loadAllEvaluations = async () => {
    if (!gameSession?.id) return;

    try {
      const evaluations = await peerEvaluationsAPI.forProfessor(gameSession.id);
      setAllEvaluations(evaluations);
      setShowEvaluations(true);
    } catch (error: any) {
      // Silently fail
    }
  };

  const handleCompleteStageAndRedirect = async () => {
    if (!gameSession?.id) {
      toast.error('No hay sesión activa');
      return;
    }

    setLoading(true);
    
    try {
      // Completar la etapa 4 y redirigir a resultados
      await sessionsAPI.completeStage(gameSession.id, 4);
      toast.success('✅ Redirigiendo a resultados...');
      
      // Esperar un momento para que el backend procese todo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Obtener el stage_id de la etapa 4
      const stages = await sessionsAPI.getSessionStages(gameSession.id);
      const stagesArray = Array.isArray(stages) ? stages : [];
      const stage4 = stagesArray.find((s: any) => s.stage_number === 4);
      // IMPORTANTE: El stage_id debe ser el ID del Stage (modelo de challenges), no el ID del SessionStage
      // stage4.stage es el ID del Stage (modelo de challenges)
      const stageId = stage4?.stage || gameSession.current_stage?.id || '';
      
      // Redirigir a resultados de la etapa 4
      window.location.href = `/profesor/resultados/${gameSession.id}/?stage_id=${stageId}`;
    } catch (error: any) {
      console.error('Error completando etapa:', error);
      toast.error('Error al completar la etapa: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
      setLoading(false);
    }
  };

  const handleGoToReflection = async () => {
    if (!gameSession?.id) {
      toast.error('No hay sesión activa');
      return;
    }

    setLoading(true);
    
    try {
      // Iniciar reflexión
      await sessionsAPI.startReflection(gameSession.id);
      toast.success('✅ Redirigiendo a reflexión...');
      
      // Esperar un momento para que el backend procese todo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirigir a reflexión
      window.location.href = `/profesor/reflexion/${gameSession.id}`;
    } catch (error: any) {
      console.error('Error iniciando reflexión:', error);
      toast.error('Error al iniciar reflexión: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
      setLoading(false);
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

  const getTeamById = (teamId: number) => {
    return teams.find(t => t.id === teamId);
  };

  // Calcular estados derivados
  const currentTeam = currentPresentationTeamId ? getTeamById(currentPresentationTeamId) : null;
  const currentTeamIndex = presentationOrder.findIndex(id => id === currentPresentationTeamId);
  const hasMorePresentations = currentTeamIndex >= 0 && currentTeamIndex < presentationOrder.length - 1;

  // Función helper para obtener el nombre del equipo (con personalización si existe)
  const getTeamDisplayName = (team: Team | null): string => {
    if (!team) return '';
    const pers = team.id ? personalizations[team.id] : null;
    if (pers?.team_name) {
      return pers.team_name;
    }
    // Si el nombre del equipo es "Equipo [Color]", devolver solo el color
    const match = team.name?.match(/^Equipo\s+(.+)$/i);
    return match ? match[1] : (team.name || team.color);
  };
  const isLastTeam = currentTeamIndex >= 0 && currentTeamIndex === presentationOrder.length - 1;
  
  // Verificar si todas las evaluaciones están completadas para el equipo actual
  const allEvaluationsCompletedForCurrentTeam = evaluationProgress.total > 0 && 
                                                 evaluationProgress.completed >= evaluationProgress.total;
  
  // Mostrar botón de resultados solo cuando:
  // - Es el último equipo Y todas las evaluaciones están completadas
  // - O todas las presentaciones están completadas
  const shouldShowGoToResults = (isLastTeam && allEvaluationsCompletedForCurrentTeam) || 
                                 (allPresentationsCompleted && evaluationProgress.total > 0 && 
                                  evaluationProgress.completed >= evaluationProgress.total);

  // No mostrar nada hasta que el estado esté cargado (evita mostrar pantalla incorrecta)
  if (loading || presentationState === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }
  
  // Nota: currentTeamIndex, hasMorePresentations, allEvaluationsCompleted y shouldShowGoToResults 
  // ya están definidos arriba (líneas 655-658) antes del return

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
            className="bg-white rounded-xl shadow-xl p-4 sm:p-5 mb-3 sm:mb-4 flex-shrink-0"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#093c92] to-[#f757ac] rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-1">
                    Presentación del Pitch
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Sala: <span className="font-bold text-[#093c92]">{gameSession?.room_code || '---'}</span>
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/profesor/panel')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-2 hover:bg-gray-50 w-full sm:w-auto"
              >
                <XCircle className="w-4 h-4" />
                Volver al Panel
              </Button>
            </div>
          </motion.div>

          {/* Información de Etapa */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-[#093c92] via-[#1e5bb8] to-[#093c92] text-white rounded-xl p-4 sm:p-5 mb-3 sm:mb-4 flex-shrink-0 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 flex-shrink-0">
                  <Target className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-1">Etapa 4: Comunicación</h2>
                  <p className="text-sm sm:text-base opacity-90">
                    Los equipos presentan su pitch y reciben evaluación
                  </p>
                </div>
              </div>
              {timerRemaining !== '01:30' && timerRemaining !== '--:--' && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border-2 border-white/30 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-white animate-pulse" />
                    <span className="text-white font-bold text-sm sm:text-base">{timerRemaining}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

        {/* Orden de Presentación y Controles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-xl p-4 sm:p-6 mb-3 sm:mb-4"
        >
          {/* Orden de Presentación - Solo mostrar si no ha iniciado Y no hay equipo actual */}
          {presentationState === 'not_started' && !currentPresentationTeamId && (
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#093c92] to-[#f757ac] rounded-lg flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#093c92]">Orden de Presentación</h3>
              </div>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                Configura el orden en que los equipos presentarán. Puedes mover los equipos arriba o abajo.
              </p>

              {presentationOrder.length === 0 ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#093c92]" />
                  <p className="text-gray-500 text-sm sm:text-base">Generando orden de presentación...</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {presentationOrder.map((teamId, index) => {
                    const team = getTeamById(teamId);
                    if (!team) return null;
                    return (
                      <motion.div
                        key={teamId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border-2 border-gray-200 hover:border-[#093c92] transition-all shadow-sm"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0"
                          style={{ backgroundColor: getTeamColorHex(team.color) }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#093c92] text-sm sm:text-base truncate">
                            {personalizations[team.id]?.team_name 
                              ? `Equipo ${personalizations[team.id].team_name}` 
                              : team.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Equipo {team.color}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <Button
                            onClick={() => handleMoveTeam(index, 'up')}
                            disabled={index === 0 || (presentationState !== 'not_started' && currentPresentationTeamId)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-30"
                            title={presentationState !== 'not_started' && currentPresentationTeamId ? 'No se puede modificar durante las presentaciones' : ''}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleMoveTeam(index, 'down')}
                            disabled={index === presentationOrder.length - 1 || (presentationState !== 'not_started' && currentPresentationTeamId)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-30"
                            title={presentationState !== 'not_started' && currentPresentationTeamId ? 'No se puede modificar durante las presentaciones' : ''}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div className="flex justify-end mt-3 sm:mt-4">
                    <Button 
                      onClick={handleGenerateOrder} 
                      variant="outline" 
                      className="border-2"
                      disabled={presentationState !== 'not_started' && currentPresentationTeamId}
                      title={presentationState !== 'not_started' && currentPresentationTeamId ? 'No se puede regenerar durante las presentaciones' : ''}
                    >
                      🎲 Regenerar Orden
                    </Button>
                  </div>
                </div>
              )}

              {presentationOrder.length > 0 && (
                <Button
                  onClick={handleStartPresentations}
                  className="bg-green-600 hover:bg-green-700 w-full text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 shadow-lg"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar Presentaciones
                </Button>
              )}
            </div>
          )}

          {/* Estados de Presentación */}
          {presentationState !== null && presentationState !== 'not_started' && (
            <div>
              {/* Estado: Preparación */}
              {presentationState === 'preparing' && currentTeam && (
                <div className="bg-gradient-to-r from-[#093c92] via-[#764ba2] to-[#093c92] rounded-xl p-6 sm:p-8 text-center text-white mb-4 sm:mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
                  <div className="relative z-10">
                    <div className="text-5xl sm:text-6xl mb-4">🎤</div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
                      Iniciar Pitch - {getTeamDisplayName(currentTeam)}
                    </h2>
                    <p className="text-base sm:text-lg mb-2 sm:mb-3 opacity-90 font-semibold">
                      Equipo {currentTeam?.color}
                    </p>
                    <p className="text-base sm:text-lg mb-4 sm:mb-6 opacity-90">
                      El equipo debe prepararse para presentar. Pueden decidir quién presenta, revisar su pitch, etc.
                    </p>
                    <Button
                      onClick={handleStartTeamPitch}
                      disabled={isStartingPitch}
                      className="bg-white text-[#093c92] hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {isStartingPitch ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Iniciando...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Iniciar Pitch - {getTeamDisplayName(currentTeam)}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Estado: Presentando */}
              {presentationState === 'presenting' && currentTeam && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-400 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-4xl sm:text-5xl mb-3">🎤</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">
                      {currentTeam.name} está presentando
                    </h3>
                    <p className="text-green-700 text-sm sm:text-base">El equipo está presentando su pitch</p>
                  </div>

                  {/* Prototipo y Pitch */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 sm:mb-6">
                    {/* Prototipo */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg border border-gray-200">
                      <h4 className="font-semibold text-base sm:text-lg text-[#093c92] mb-3 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" /> Prototipo del Equipo
                      </h4>
                      {currentTeamPrototype ? (
                        <img
                          src={currentTeamPrototype}
                          alt="Prototipo"
                          className="w-full rounded-lg shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <p className="text-gray-400 italic text-center py-6 sm:py-8 text-sm">No hay prototipo</p>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={handleFinishPresentation}
                      className="bg-red-600 hover:bg-red-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
                      size="lg"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Finalizar Presentación - {currentTeam.name}
                    </Button>
                  </div>
                </div>
              )}

              {/* Estado: Evaluando */}
              {presentationState === 'evaluating' && currentTeam && (
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-4xl sm:text-5xl mb-3">⭐</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-yellow-800 mb-2">
                      Evaluación - {currentTeam.name}
                    </h3>
                    <p className="text-yellow-700 text-sm sm:text-base">Los otros equipos están evaluando al equipo que acaba de presentar</p>
                  </div>

                  {/* Progreso de evaluaciones */}
                  <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-lg">
                    <h4 className="font-semibold text-base sm:text-lg text-[#093c92] mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5" /> Progreso de Evaluaciones
                    </h4>
                    <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 mb-2">
                      <div
                        className="bg-green-500 h-3 sm:h-4 rounded-full transition-all duration-300"
                        style={{ width: `${evaluationProgress.total > 0 ? (evaluationProgress.completed / evaluationProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 font-semibold">
                      {evaluationProgress.completed} de {evaluationProgress.total} equipos han evaluado
                    </p>
                  </div>

                  <div className="text-center">
                    {shouldShowGoToResults ? (
                      // Si todas las evaluaciones están completadas y no hay más equipos por presentar
                      <Button
                        onClick={handleCompleteStageAndRedirect}
                        disabled={loading}
                        className="bg-yellow-500 hover:bg-yellow-600 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 disabled:opacity-50 shadow-lg"
                        size="lg"
                      >
                        <Trophy className="w-5 h-5 mr-2" />
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Completando...
                          </>
                        ) : (
                          'Ver Resultados de la Etapa'
                        )}
                      </Button>
                    ) : allEvaluationsCompletedForCurrentTeam && hasMorePresentations ? (
                      // Si todas las evaluaciones están completadas pero hay más equipos por presentar
                      <Button
                        onClick={handleNextPresentation}
                        disabled={isAdvancingTurn}
                        className="bg-green-600 hover:bg-green-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        size="lg"
                      >
                        {isAdvancingTurn ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Avanzando...
                          </>
                        ) : (
                          <>
                        <ArrowRight className="w-5 h-5 mr-2" />
                        Siguiente Turno
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-yellow-800 font-semibold text-sm sm:text-base">
                          Esperando a que todos los equipos completen su evaluación...
                          ({evaluationProgress.completed} de {evaluationProgress.total})
                        </p>
                        {isDevMode() && !allPresentationsCompleted && (
                          <Button
                            onClick={() => {
                              // Si es el último turno, ir a resultados finales
                              // Si no es el último turno, ir al siguiente turno
                              if (isLastTeam) {
                                handleCompleteStageAndRedirect();
                              } else {
                                handleNextPresentation();
                              }
                            }}
                            disabled={isAdvancingTurn || loading}
                            className="px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
                            title={isLastTeam ? "Modo Dev: Ir a Resultados Finales" : "Modo Dev: Avanzar sin esperar todas las evaluaciones"}
                          >
                            {(isAdvancingTurn || loading) ? (
                              <>
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                                {isLastTeam ? 'Completando...' : 'Avanzando...'}
                              </>
                            ) : (
                              <>
                                <Code className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                {isLastTeam ? 'Dev - Resultados Finales' : 'Dev - Siguiente Turno'}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Estado: Completado */}
              {allPresentationsCompleted && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 rounded-xl p-6 sm:p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/20 rounded-full -ml-16 -mb-16" />
                    <div className="relative z-10">
                      <div className="text-5xl sm:text-6xl mb-4">🎉</div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-3 sm:mb-4">
                        ¡Todas las Presentaciones Completadas!
                      </h2>
                      <p className="text-blue-700 text-base sm:text-lg mb-4 sm:mb-6">
                        Todos los equipos han presentado y sido evaluados
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                        <Button
                          onClick={() => {
                            if (!showEvaluations) {
                              loadAllEvaluations();
                            } else {
                              setShowEvaluations(false);
                            }
                          }}
                          className="bg-purple-500 hover:bg-purple-600 text-base sm:text-lg px-5 sm:px-6 py-3 shadow-lg"
                          size="lg"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          {showEvaluations ? 'Ocultar' : 'Ver'} Evaluaciones
                        </Button>
                        <Button
                          onClick={handleGoToReflection}
                          disabled={loading}
                          className="bg-yellow-500 hover:bg-yellow-600 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 disabled:opacity-50 shadow-lg"
                          size="lg"
                        >
                          <Trophy className="w-5 h-5 mr-2" />
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Iniciando...
                            </>
                          ) : (
                            'Ir a Reflexión'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Mostrar todas las evaluaciones */}
                  {showEvaluations && allEvaluations.length > 0 && (
                    <div className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-6 shadow-lg">
                      <h3 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-4 flex items-center gap-2">
                        <Users className="w-6 h-6" /> Todas las Evaluaciones
                      </h3>
                      <div className="space-y-3 sm:space-y-4 max-h-[500px] overflow-y-auto">
                        {allEvaluations.map((evaluation, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-2 sm:mb-3 gap-2">
                              <div className="flex-1">
                                <p className="font-semibold text-base sm:text-lg text-[#093c92]">
                                  {evaluation.evaluator_team_name} → {evaluation.evaluated_team_name}
                                </p>
                                <div className="flex flex-wrap gap-3 sm:gap-4 mt-1">
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    Puntuación Total: <span className="font-bold text-green-600">{evaluation.total_score}</span>
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    Tokens: <span className="font-bold text-yellow-600">{evaluation.tokens_awarded}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-3 pt-3 border-t border-gray-200">
                              <div className="text-center">
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Claridad</p>
                                <p className="font-semibold text-base sm:text-lg text-[#093c92]">{evaluation.criteria_scores?.clarity || 0}/10</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Solución</p>
                                <p className="font-semibold text-base sm:text-lg text-[#093c92]">{evaluation.criteria_scores?.solution || 0}/10</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Presentación</p>
                                <p className="font-semibold text-base sm:text-lg text-[#093c92]">{evaluation.criteria_scores?.presentation || 0}/10</p>
                              </div>
                            </div>
                            {evaluation.feedback && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-1">Feedback:</p>
                                <p className="text-gray-800 text-sm sm:text-base">{evaluation.feedback}</p>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
        </div>
      </div>

      {/* Modal de Introducción de Etapa */}
      <EtapaIntroModal
        etapaNumero={4}
        isOpen={showEtapaIntro}
        onClose={() => {
          setShowEtapaIntro(false);
          if (sessionId) {
            localStorage.setItem(`etapa_intro_${sessionId}_4`, 'true');
          }
        }}
      />
    </div>
  );
}

