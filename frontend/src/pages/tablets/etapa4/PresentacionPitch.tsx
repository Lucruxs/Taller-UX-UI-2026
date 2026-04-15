import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Clock, Mic, Star, FileText, Target, Lightbulb, CheckCircle2, Image as ImageIcon, Eye, Coins, Users, Bot, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UBotPresentacionPitchModal } from '@/components/UBotPresentacionPitchModal';
import { 
  sessionsAPI, 
  sessionStagesAPI, 
  peerEvaluationsAPI, 
  tabletConnectionsAPI,
  teamPersonalizationsAPI
} from '@/services';
import { toast } from 'sonner';

interface Team {
  id: number;
  name: string;
  color: string;
  tokens?: number;
  tokens_total?: number;
}

interface PresentationStatus {
  presentation_order: number[];
  current_presentation_team_id: number | null;
  teams: Team[];
  order_confirmed: boolean;
  completed_team_ids: number[];
  presentation_state: string;
  current_team_prototype: string | null;
  current_team_pitch: {
    intro_problem: string;
    solution: string;
    value: string;
    impact: string;
    closing: string;
  } | null;
}

interface GameSession {
  id: number;
  current_stage_number?: number;
}

export function TabletPresentacionPitch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [personalization, setPersonalization] = useState<{ team_name?: string } | null>(null);
  const [gameSessionId, setGameSessionId] = useState<number | null>(null);
  const [sessionStageId, setSessionStageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [showUBotModal, setShowUBotModal] = useState(false);
  const [presentationStatus, setPresentationStatus] = useState<PresentationStatus | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<string>('01:30');
  const [evaluationSubmitted, setEvaluationSubmitted] = useState(false);
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);
  const [isCheckingEvaluation, setIsCheckingEvaluation] = useState(false);
  const [evaluationScores, setEvaluationScores] = useState({
    clarity: 5,
    solution: 5,
    presentation: 5,
    feedback: '',
  });
  const [receivedEvaluations, setReceivedEvaluations] = useState<any[]>([]);
  const [evaluationProgress, setEvaluationProgress] = useState<{
    completed: number;
    total: number;
  }>({ completed: 0, total: 0 });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousPresentationStateRef = useRef<string | null>(null);
  const previousPresentationTeamIdRef = useRef<number | null>(null);
  const localTimerSecondsRef = useRef<number>(90);
  const syncCounterRef = useRef<number>(0);
  const previousEvaluatedTeamIdRef = useRef<number | null>(null);
  const evalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkingEvaluationRef = useRef<boolean>(false);
  const lastCheckedTeamIdRef = useRef<number | null>(null);

  useEffect(() => {
    const connId = searchParams.get('connection_id') || localStorage.getItem('tabletConnectionId');
    if (!connId) {
      navigate('/tablet/join');
      return;
    }
    setConnectionId(connId);
    
    // Cargar estado inicial
    loadGameState(connId);
    
    // Polling optimizado: más frecuente durante presentación/evaluación
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      loadGameState(connId);
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (evalIntervalRef.current) clearInterval(evalIntervalRef.current);
    };
  }, [searchParams, navigate]);

  // CRÍTICO: Verificar evaluación existente cuando estamos evaluando a otro equipo
  useEffect(() => {
    if (!team || !gameSessionId || !presentationStatus) {
      return;
    }
    
    const currentState = presentationStatus.presentation_state || 'not_started';
    const currentEvaluatedTeamId = presentationStatus.current_presentation_team_id;
    const isEvaluatingOtherTeam = currentState === 'evaluating' && 
                                   currentEvaluatedTeamId && 
                                   currentEvaluatedTeamId !== team.id;
    
    if (isEvaluatingOtherTeam) {
      // Solo verificar si cambió el equipo evaluado o si no se ha verificado aún
      if (previousEvaluatedTeamIdRef.current !== currentEvaluatedTeamId || 
          lastCheckedTeamIdRef.current !== currentEvaluatedTeamId) {
        checkExistingEvaluation(currentEvaluatedTeamId).catch(() => {
          // Silently fail
        });
      }
    } else if (currentState !== 'evaluating') {
      // Si no estamos evaluando, resetear estado y referencias
      setEvaluationSubmitted(false);
      lastCheckedTeamIdRef.current = null;
      checkingEvaluationRef.current = false;
    }
  }, [team?.id, gameSessionId, presentationStatus?.presentation_state, presentationStatus?.current_presentation_team_id]);

  // Mostrar modal de U-Bot solo cuando el equipo está preparándose
  useEffect(() => {
    if (!team || !presentationStatus) return;
    
    const isMyTurn = presentationStatus.current_presentation_team_id === team.id;
    const presentationState = presentationStatus.presentation_state || 'not_started';
    const isPreparing = presentationState === 'preparing' && isMyTurn;
    
    if (isPreparing && gameSessionId && team) {
      const ubotKey = `ubot_presentacion_pitch_${gameSessionId}_${team.id}`;
      const hasSeenUBot = localStorage.getItem(ubotKey);
      if (!hasSeenUBot) {
        setTimeout(() => {
          setShowUBotModal(true);
          localStorage.setItem(ubotKey, 'true');
        }, 500);
      }
    }
  }, [presentationStatus, gameSessionId, team]);

  // Cargar evaluaciones automáticamente cuando el equipo está esperando evaluaciones
  useEffect(() => {
    if (!team || !gameSessionId || !presentationStatus) {
      // Limpiar intervalo si no hay datos necesarios
      if (evalIntervalRef.current) {
        clearInterval(evalIntervalRef.current);
        evalIntervalRef.current = null;
      }
      return;
    }
    
    const currentState = presentationStatus.presentation_state || 'not_started';
    const currentIsMyTurn = presentationStatus.current_presentation_team_id === team.id;
    
    if (currentState === 'evaluating' && currentIsMyTurn) {
      // Cargar evaluaciones inmediatamente
      loadMyEvaluations();
      
      // Limpiar intervalo anterior si existe
      if (evalIntervalRef.current) {
        clearInterval(evalIntervalRef.current);
      }
      
      // Polling cada 2 segundos para actualizar evaluaciones
      evalIntervalRef.current = setInterval(() => {
        loadMyEvaluations();
      }, 2000);
      
      return () => {
        if (evalIntervalRef.current) {
          clearInterval(evalIntervalRef.current);
          evalIntervalRef.current = null;
        }
      };
    } else {
      // Limpiar intervalo si no estamos en el estado correcto
      if (evalIntervalRef.current) {
        clearInterval(evalIntervalRef.current);
        evalIntervalRef.current = null;
      }
    }
  }, [team?.id, gameSessionId, presentationStatus?.presentation_state, presentationStatus?.current_presentation_team_id]);

  const loadGameState = async (connId: string) => {
    try {
      let statusData;
      try {
        statusData = await tabletConnectionsAPI.getStatus(connId);
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error('Conexión no encontrada. Por favor reconecta.');
          setTimeout(() => {
            navigate('/tablet/join');
          }, 2000);
          return;
        }
        throw error;
      }
      const teamData: Team = statusData.team;
      setTeam(teamData);
      setGameSessionId(statusData.game_session.id);

      // Cargar personalización del equipo
      try {
        const persList = await teamPersonalizationsAPI.list({ team: teamData.id });
        const persArray = Array.isArray(persList) ? persList : (Array.isArray(persList.results) ? persList.results : []);
        if (persArray.length > 0) {
          setPersonalization(persArray[0]);
        }
      } catch (error) {
        console.error('Error cargando personalización:', error);
      }

      // Usar lobby en lugar de getById para evitar problemas de autenticación
      const lobbyData = await sessionsAPI.getLobby(statusData.game_session.id);
      const gameData: GameSession = lobbyData.game_session;
      const sessionId = statusData.game_session.id;


      // Si la sesión finaliza, redirigir al join (excepto en reflexión)
      if (gameData.status === 'finished' || gameData.status === 'completed') {
        toast.info('La sesión ha finalizado. Redirigiendo...');
        setTimeout(() => navigate('/tablet/join'), 2000);
        return;
      }

      const currentStageNumber = gameData.current_stage_number || 1;
      const currentActivityName = gameData.current_activity_name?.toLowerCase() || '';
      const currentActivityId = gameData.current_activity;


      // Si no estamos en etapa 4, redirigir según la etapa actual
      if (currentStageNumber !== 4) {
        if (currentStageNumber === 3) {
          const normalizedName = currentActivityName;
          if (normalizedName.includes('prototipo') || normalizedName.includes('lego')) {
            window.location.href = `/tablet/etapa3/prototipo/?connection_id=${connId}`;
          } else {
            window.location.href = `/tablet/etapa3/resultados/?connection_id=${connId}`;
          }
        } else if (currentStageNumber > 4 || (!currentActivityName && currentStageNumber === 4)) {
          window.location.href = `/tablet/resultados/?connection_id=${connId}&stage_id=4`;
          return;
        } else {
          window.location.href = `/tablet/lobby?connection_id=${connId}`;
        }
        return;
      }

      // Si estamos en etapa 4 pero no hay actividad actual, la etapa fue completada
      if (currentStageNumber === 4 && (!currentActivityName || !currentActivityId)) {
        window.location.href = `/tablet/resultados/?connection_id=${connId}&stage_id=4`;
        return;
      }

      const stagesData = await sessionsAPI.getSessionStages(statusData.game_session.id);
      const stagesList = Array.isArray(stagesData) ? stagesData : [stagesData];
      const stage4 = stagesList.find((s: any) => s.stage_number === 4) || null;

      // Si la etapa 4 está marcada como completada, redirigir a resultados
      if (stage4 && stage4.status === 'completed') {
        window.location.href = `/tablet/resultados/?connection_id=${connId}&stage_id=4`;
        return;
      }

      if (stage4) {
        // Verificar si todas las presentaciones están completadas (no hay current_presentation_team_id y el estado no es 'not_started')
        const allPresentationsCompleted = 
          !stage4.current_presentation_team_id && 
          stage4.presentation_state !== 'not_started' &&
          stage4.presentation_order &&
          stage4.presentation_order.length > 0;
        
        // Verificar si no hay actividad actual (significa que el profesor completó la etapa)
        const noCurrentActivity = !currentActivityName || currentActivityName.trim() === '';
        
        // Si todas las presentaciones están completadas o no hay actividad actual, redirigir a resultados
        if (allPresentationsCompleted || noCurrentActivity) {
          window.location.href = `/tablet/resultados/?connection_id=${connId}&stage_id=4`;
          return;
        }
        
        setSessionStageId(stage4.id);
        
        // Si estamos en estado evaluating para otro equipo al cargar la página, inicializar la referencia
        if (stage4.presentation_state === 'evaluating' && 
            stage4.current_presentation_team_id && 
            stage4.current_presentation_team_id !== teamData.id) {
          previousEvaluatedTeamIdRef.current = stage4.current_presentation_team_id;
        }
        
        // Cargar estado de presentación INMEDIATAMENTE (no esperar)
        // La verificación de evaluación se hace en loadPresentationStatus y useEffect
        loadPresentationStatus(stage4.id, connId).catch(() => {
          // Silently fail, el polling lo reintentará
        });
      } else {
        // Si no hay stage4 pero estamos en etapa 4 y no hay actividad, redirigir a resultados
        if (currentStageNumber === 4 && (!currentActivityName || !currentActivityId)) {
          window.location.href = `/tablet/resultados/?connection_id=${connId}&stage_id=4`;
          return;
        }
      }

      setLoading(false);
      
      // El polling se ajusta automáticamente en loadPresentationStatus según el estado
    } catch (error: any) {
      console.error('Error loading game state:', error);
      toast.error('Error de conexión: ' + (error.response?.data?.error || error.message || 'Error desconocido'));
      setLoading(false);
    }
  };

  const loadPresentationStatus = async (stageId: number, connId?: string) => {
    try {
      const status: PresentationStatus = await sessionStagesAPI.getPresentationStatus(stageId);
      
      // Detectar cambios de estado ANTES de actualizar las referencias
      const stateChanged = previousPresentationStateRef.current !== status.presentation_state;
      const teamChanged = previousPresentationTeamIdRef.current !== status.current_presentation_team_id;
      const wasPreparing = previousPresentationStateRef.current === 'preparing';
      const isNowPresenting = status.presentation_state === 'presenting';
      const wasNotPresenting = previousPresentationStateRef.current !== 'presenting';
      
      setPresentationStatus(status);
      
      // Actualizar referencias DESPUÉS de verificar cambios
      previousPresentationStateRef.current = status.presentation_state;
      previousPresentationTeamIdRef.current = status.current_presentation_team_id || null;
      
      // La verificación de evaluación se hace en el useEffect para evitar duplicados

      // Ajustar polling según el estado actual (solo si no existe)
      if (!intervalRef.current) {
        const currentConnId = connId || connectionId;
        if (currentConnId) {
          const pollInterval = status.presentation_state === 'preparing' ? 2000 : 
                              status.presentation_state === 'evaluating' ? 3000 : 3000;
          intervalRef.current = setInterval(() => {
            loadGameState(currentConnId);
          }, pollInterval);
        }
      }

      // Verificar si cambió el equipo que se está evaluando
      // IMPORTANTE: Esto debe verificarse ANTES de actualizar las referencias
      const evaluatedTeamChanged = 
        status.presentation_state === 'evaluating' &&
        status.current_presentation_team_id &&
        previousEvaluatedTeamIdRef.current !== null &&
        previousEvaluatedTeamIdRef.current !== status.current_presentation_team_id;

      // Si cambió el equipo que se está evaluando, resetear el estado de evaluación
      if (evaluatedTeamChanged) {
        setEvaluationSubmitted(false);
        setEvaluationScores({
          clarity: 5,
          solution: 5,
          presentation: 5,
          feedback: '',
        });
        previousEvaluatedTeamIdRef.current = status.current_presentation_team_id;
        lastCheckedTeamIdRef.current = null; // Resetear para forzar verificación
        checkingEvaluationRef.current = false;
        // Verificar evaluación sin await (no bloquear)
        checkExistingEvaluation(status.current_presentation_team_id).catch(() => {});
      } else if (status.presentation_state === 'evaluating' && 
          status.current_presentation_team_id && 
          status.current_presentation_team_id !== team?.id) {
        // Actualizar referencia si cambió
        if (previousEvaluatedTeamIdRef.current !== status.current_presentation_team_id) {
          previousEvaluatedTeamIdRef.current = status.current_presentation_team_id;
          lastCheckedTeamIdRef.current = null; // Resetear para forzar verificación
        }
        // La verificación se hace en el useEffect, no aquí para evitar duplicados
      } else if (status.presentation_state !== 'evaluating') {
        // Resetear si no estamos en evaluating
        if (previousEvaluatedTeamIdRef.current !== null) {
          previousEvaluatedTeamIdRef.current = null;
          lastCheckedTeamIdRef.current = null;
          checkingEvaluationRef.current = false;
          setEvaluationSubmitted(false);
        }
      } else if (status.presentation_state === 'evaluating' && !previousEvaluatedTeamIdRef.current && status.current_presentation_team_id) {
        // Primera vez que entramos a evaluating - inicializar referencia
        previousEvaluatedTeamIdRef.current = status.current_presentation_team_id;
        // La verificación se hace en el useEffect
      }
      
      // CRÍTICO: Si estamos en evaluating y es nuestro turno, cargar evaluaciones recibidas
      if (status.presentation_state === 'evaluating' && status.current_presentation_team_id === team?.id) {
        // Cargar evaluaciones recibidas para el equipo que presentó
        if (team && gameSessionId) {
          loadMyEvaluations();
        }
      }

      // Iniciar timer si hay un equipo presentando (todos los equipos ven el timer)
      if (isNowPresenting && status.current_presentation_team_id) {
        // Iniciar timer inmediatamente si no hay uno activo, si el estado cambió, o si acabamos de entrar a presenting
        if (!timerIntervalRef.current || stateChanged || wasPreparing || (isNowPresenting && wasNotPresenting)) {
          // Iniciar timer inmediatamente (optimización: no esperar verificación del servidor)
          startPresentationTimer(stageId).catch(() => {
            // Silently fail, el timer seguirá funcionando con el valor por defecto
          });
        }
      } else {
        // Detener timer si ya no está presentando
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        // Resetear a valor inicial solo si no estamos en ningún estado relacionado con presentación
        if (status.presentation_state !== 'presenting' && status.presentation_state !== 'preparing') {
          setTimerRemaining('01:30');
          localTimerSecondsRef.current = 90;
        }
      }
    } catch (error) {
      // Silently fail, el polling lo reintentará
    }
  };

  const checkExistingEvaluation = async (evaluatedTeamId: number) => {
    const currentTeam = team;
    const currentGameSessionId = gameSessionId;
    
    if (!currentTeam || !currentGameSessionId) {
      return;
    }

    // Evitar verificaciones duplicadas para el mismo equipo
    if (checkingEvaluationRef.current && lastCheckedTeamIdRef.current === evaluatedTeamId) {
      return;
    }

    checkingEvaluationRef.current = true;
    lastCheckedTeamIdRef.current = evaluatedTeamId;
    setIsCheckingEvaluation(true);
    
    try {
      const evaluations = await peerEvaluationsAPI.list({
        evaluator_team: currentTeam.id,
        evaluated_team: evaluatedTeamId,
        game_session: currentGameSessionId
      });
      const evaluationsList = Array.isArray(evaluations) ? evaluations : [evaluations];
      
      if (evaluationsList.length > 0) {
        const evaluation = evaluationsList[0];
        setEvaluationSubmitted(true);
        setEvaluationScores({
          clarity: evaluation.criteria_scores?.clarity || 5,
          solution: evaluation.criteria_scores?.solution || 5,
          presentation: evaluation.criteria_scores?.presentation || 5,
          feedback: evaluation.feedback || '',
        });
      } else {
        setEvaluationSubmitted(false);
      }
    } catch (error: any) {
      // En caso de error, asumir que no hay evaluación y mostrar el formulario
      setEvaluationSubmitted(false);
    } finally {
      setIsCheckingEvaluation(false);
      checkingEvaluationRef.current = false;
    }
  };

  const startPresentationTimer = async (stageId: number) => {
    // Limpiar intervalo anterior si existe
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

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

    // Actualizar cada segundo
    timerIntervalRef.current = setInterval(() => {
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

      // Sincronizar con el servidor cada 5 segundos (igual que el profesor para mejor sincronización)
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

  const loadMyEvaluations = async () => {
    if (!team || !gameSessionId) return;

    try {
      const evaluations = await peerEvaluationsAPI.forTeam(team.id, gameSessionId);
      const evaluationsList = Array.isArray(evaluations) ? evaluations : [evaluations];
      
      setReceivedEvaluations(evaluationsList);

      // Calcular progreso de evaluaciones
      setPresentationStatus((prevStatus) => {
        if (prevStatus) {
          const otherTeams = prevStatus.teams.filter(t => t.id !== team.id);
          const evaluatorTeamIds = new Set(evaluationsList.map((e: any) => e.evaluator_team || e.evaluator_team_id));
          const completed = evaluatorTeamIds.size;
          const total = otherTeams.length;

          setEvaluationProgress({ completed, total });
        }
        return prevStatus;
      });
    } catch (error: any) {
      // Silently fail
    }
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !gameSessionId || !presentationStatus?.current_presentation_team_id || isSubmittingEvaluation) return;

    const evaluatedTeamId = presentationStatus.current_presentation_team_id;
    
    // Mostrar feedback inmediato
    setIsSubmittingEvaluation(true);
    
    // Verificar si ya existe (rápido, sin bloquear)
    const checkExisting = peerEvaluationsAPI.list({
      evaluator_team: team.id,
      evaluated_team: evaluatedTeamId,
      game_session: gameSessionId
    }).catch(() => null);

    try {
      // Crear evaluación (operación principal)
      const response = await peerEvaluationsAPI.create({
        evaluator_team_id: team.id,
        evaluated_team_id: evaluatedTeamId,
        game_session_id: gameSessionId,
        criteria_scores: {
          clarity: evaluationScores.clarity,
          solution: evaluationScores.solution,
          presentation: evaluationScores.presentation,
        },
        feedback: evaluationScores.feedback,
      });

      // Mostrar éxito INMEDIATAMENTE
      setEvaluationSubmitted(true);
      setIsSubmittingEvaluation(false);
      toast.success('✓ Evaluación enviada exitosamente');

      // Verificar resultado de checkExisting (ya estaba en paralelo)
      const existingEvaluations = await checkExisting;
      if (existingEvaluations) {
        const existingList = Array.isArray(existingEvaluations) ? existingEvaluations : [existingEvaluations];
        if (existingList.length > 0) {
          // Ya existe, actualizar estado
          const evaluation = existingList[0];
          setEvaluationScores({
            clarity: evaluation.criteria_scores?.clarity || 5,
            solution: evaluation.criteria_scores?.solution || 5,
            presentation: evaluation.criteria_scores?.presentation || 5,
            feedback: evaluation.feedback || '',
          });
        }
      }

      // Actualizar tokens en background (no bloquea)
      if (connectionId) {
        tabletConnectionsAPI.getStatus(connectionId)
          .then((statusData) => {
            if (statusData.team) {
              setTeam(statusData.team);
            }
          })
          .catch(() => {
            // Silently fail
          });
      }
    } catch (error: any) {
      setIsSubmittingEvaluation(false);
      
      // Si el error es que ya existe
      if (error.response?.status === 400 || error.response?.data?.error?.includes('ya existe')) {
        setEvaluationSubmitted(true);
        await checkExistingEvaluation(evaluatedTeamId);
        toast.warning('Ya habías enviado esta evaluación');
      } else {
        toast.error('Error al enviar evaluación: ' + (error.response?.data?.error || error.message));
      }
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

  const getEvaluatedTeamName = () => {
    if (!presentationStatus?.current_presentation_team_id) return '';
    const evaluatedTeam = presentationStatus.teams.find(
      t => t.id === presentationStatus.current_presentation_team_id
    );
    return getTeamName(evaluatedTeam);
  };

  const getMyPosition = () => {
    if (!team || !presentationStatus?.presentation_order) return null;
    const position = presentationStatus.presentation_order.findIndex(teamId => teamId === team.id);
    return position >= 0 ? position + 1 : null; // +1 porque es 1-indexado
  };

  const getCurrentPresentingPosition = () => {
    if (!presentationStatus?.current_presentation_team_id || !presentationStatus?.presentation_order) return null;
    const position = presentationStatus.presentation_order.findIndex(
      teamId => teamId === presentationStatus.current_presentation_team_id
    );
    return position >= 0 ? position + 1 : null;
  };

  const getPositionText = (position: number) => {
    const positionMap: Record<number, string> = {
      1: 'primero',
      2: 'segundo',
      3: 'tercero',
      4: 'cuarto',
      5: 'quinto',
      6: 'sexto',
      7: 'séptimo',
      8: 'octavo',
      9: 'noveno',
      10: 'décimo',
    };
    return positionMap[position] || `${position}°`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!team || !presentationStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Cargando información de presentación...</p>
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const isMyTurn = presentationStatus.current_presentation_team_id === team.id;
  const presentationState = presentationStatus.presentation_state || 'not_started';

  // Función helper para obtener el nombre del equipo (con personalización si existe)
  const getTeamDisplayName = (): string => {
    if (!team) return '';
    if (personalization?.team_name) {
      return personalization.team_name;
    }
    // Si el nombre del equipo es "Equipo [Color]", devolver solo el color
    const match = team.name?.match(/^Equipo\s+(.+)$/i);
    return match ? match[1] : (team.name || team.color);
  };

  // Función helper para obtener el nombre de cualquier equipo
  const getTeamName = (teamData: Team | null | undefined): string => {
    if (!teamData) return '';
    // Si el nombre del equipo es "Equipo [Color]", devolver solo el color
    const match = teamData.name?.match(/^Equipo\s+(.+)$/i);
    return match ? match[1] : (teamData.name || teamData.color);
  };

  const isEvaluating = presentationState === 'evaluating' && !isMyTurn;
  const isPresenting = presentationState === 'presenting' && isMyTurn;
  const isPreparing = presentationState === 'preparing' && isMyTurn;
  const isWaiting = !isMyTurn && presentationState !== 'evaluating';
  const isWaitingForEvaluations = presentationState === 'evaluating' && isMyTurn;

  // Construir URL de prototipo si existe
  let prototypeUrl = presentationStatus.current_team_prototype;
  if (prototypeUrl && prototypeUrl.startsWith('/')) {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    prototypeUrl = `${baseUrl}${prototypeUrl}`;
  }

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
          className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6 flex items-center justify-between flex-wrap gap-4"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg"
              style={{ backgroundColor: getTeamColorHex(team.color) }}
            >
              {team.color.charAt(0).toUpperCase()}
            </motion.div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {personalization?.team_name 
                  ? `Start-up ${personalization.team_name}` 
                  : (team.name?.replace(/^Equipo\s+/i, 'Start-up ') || `Start-up ${team.color}`)
                }
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">Equipo {team.color}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {team && isPreparing && (
              <motion.button
                onClick={() => setShowUBotModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm sm:text-base flex items-center gap-2 shadow-lg"
              >
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>U-Bot</span>
              </motion.button>
            )}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#093c92] to-blue-700 text-white px-5 py-2.5 rounded-full font-semibold text-sm sm:text-base flex items-center gap-2 shadow-lg"
            >
              <Award className="w-4 h-4 sm:w-5 sm:h-5" /> {team.tokens_total || team.tokens || 0} Tokens
            </motion.div>
          </div>
        </motion.div>

        {/* Estado: Esperando Orden */}
        {presentationState === 'not_started' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 sm:p-8 text-center"
          >
            <div className="text-5xl sm:text-6xl mb-4">⏳</div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-3 sm:mb-4">
              Esperando Orden de Presentación
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              El profesor está configurando el orden de presentación. Espera a que se inicien las presentaciones.
            </p>
          </motion.div>
        )}

        {/* Estado: Preparación */}
        {isPreparing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-[#093c92] via-[#764ba2] to-[#093c92] rounded-xl shadow-xl p-8 sm:p-12 md:p-16 text-center text-white relative overflow-hidden min-h-[400px] sm:min-h-[500px] flex items-center justify-center"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
            <div className="relative z-10 w-full">
              <div className="text-6xl sm:text-7xl md:text-8xl mb-6 sm:mb-8">🎤</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">⚠️ LLAMADO A ESCENARIO</h2>
              <p className="text-base sm:text-lg md:text-xl mb-3 sm:mb-4 opacity-90 font-semibold">
              Start-up <span className="font-bold text-white">{getTeamDisplayName().toUpperCase()}</span> requerida en el Centro de Comando.
            </p>
              <p className="text-sm sm:text-base md:text-lg opacity-80 max-w-2xl mx-auto">
              El momento ha llegado. Diríjanse al frente de la sala inmediatamente. El Profesor iniciará el cronómetro apenas tomen posición.
            </p>
            </div>
          </motion.div>
        )}

        {/* Estado: Presentando */}
        {isPresenting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-4 sm:p-6"
          >
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-4xl sm:text-5xl mb-3">🎤</div>
              <h2 className="text-xl sm:text-2xl font-bold text-green-600 mb-2">Presentación en Curso</h2>
            </div>

            {/* Timer */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-4 sm:p-6 text-center mb-4 sm:mb-6">
              <p className="text-yellow-800 font-semibold text-base sm:text-lg mb-2 flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" /> Tiempo Restante
              </p>
              <p className={`text-4xl sm:text-5xl font-bold text-yellow-900 font-mono ${
                parseInt(timerRemaining.split(':')[0]) < 1 ? 'text-red-600 animate-pulse' : ''
              }`}>
                {timerRemaining}
              </p>
            </div>

            {/* Prototipo y Guion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Prototipo (visible para todos) */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-base sm:text-lg text-[#093c92] mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" /> Prototipo del Equipo
                </h3>
                {prototypeUrl ? (
                  <img
                    src={prototypeUrl}
                    alt="Prototipo"
                    className="w-full rounded-lg shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <p className="text-gray-400 italic text-center py-6 sm:py-8 text-xs sm:text-sm">No hay prototipo disponible</p>
                )}
              </div>

              {/* Guion (solo para el equipo que presenta) */}
              {presentationStatus.current_team_pitch && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-base sm:text-lg text-[#093c92] mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Tu Guion de Pitch
                  </h3>
                  <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm max-h-[400px] overflow-y-auto">
                    {presentationStatus.current_team_pitch.intro_problem && (
                      <div>
                        <h4 className="font-semibold text-[#093c92] mb-1.5 flex items-center gap-1.5">
                          <Target className="w-4 h-4" /> Problema
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">{presentationStatus.current_team_pitch.intro_problem}</p>
                      </div>
                    )}
                    {presentationStatus.current_team_pitch.solution && (
                      <div>
                        <h4 className="font-semibold text-[#093c92] mb-1.5 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4" /> Solución
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">{presentationStatus.current_team_pitch.solution}</p>
                      </div>
                    )}
                    {presentationStatus.current_team_pitch.value && (
                      <div>
                        <h4 className="font-semibold text-[#093c92] mb-1.5 flex items-center gap-1.5">
                          <Coins className="w-4 h-4" /> Valor
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">{presentationStatus.current_team_pitch.value}</p>
                      </div>
                    )}
                    {presentationStatus.current_team_pitch.impact && (
                      <div>
                        <h4 className="font-semibold text-[#093c92] mb-1.5 flex items-center gap-1.5">
                          <Target className="w-4 h-4" /> Impacto
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">{presentationStatus.current_team_pitch.impact}</p>
                      </div>
                    )}
                    {presentationStatus.current_team_pitch.closing && (
                      <div>
                        <h4 className="font-semibold text-[#093c92] mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Cierre
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">{presentationStatus.current_team_pitch.closing}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-gray-600 text-xs sm:text-sm">
              El equipo tiene 1:30 minutos para presentar su pitch
            </p>
          </motion.div>
        )}

        {/* Estado: Esperando Turno */}
        {isWaiting && presentationState === 'presenting' && (() => {
          const myPosition = getMyPosition();
          const currentPosition = getCurrentPresentingPosition();
          
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-4 sm:p-6 text-center"
            >
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">👀</div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-3 sm:mb-4">
                Observando Presentación
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mb-2">
                La Start-up <span className="font-bold text-[#093c92]">{getEvaluatedTeamName().toUpperCase()}</span> está presentando su pitch
              </p>
              
              {myPosition && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 mt-3 sm:mt-4">
                  <p className="text-blue-800 font-semibold text-base sm:text-lg">
                    📋 Tu Start-up presenta {myPosition === 1 ? 'primero' : getPositionText(myPosition)}
                  </p>
                  {currentPosition && myPosition > currentPosition && (
                    <p className="text-blue-600 text-xs sm:text-sm mt-2">
                      {myPosition - currentPosition === 1 
                        ? 'Tu turno es el siguiente'
                        : `Faltan ${myPosition - currentPosition} presentaciones antes de tu turno`
                      }
                    </p>
                  )}
                </div>
              )}

              {/* Timer visible para todos */}
              {timerRemaining !== '01:30' && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-yellow-800 font-semibold text-sm sm:text-base mb-2 flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" /> Tiempo Restante
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold text-yellow-900 font-mono">{timerRemaining}</p>
                </div>
              )}

              {/* Prototipo del equipo que presenta */}
              {prototypeUrl && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 max-w-md mx-auto border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-base sm:text-lg text-[#093c92] mb-3 flex items-center gap-2 justify-center">
                    <ImageIcon className="w-5 h-5" /> Prototipo del Equipo
                  </h3>
                  <img
                    src={prototypeUrl}
                    alt="Prototipo"
                    className="w-full rounded-lg shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* Estado: Evaluación */}
        {isEvaluating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-4 sm:p-6"
          >
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-4xl sm:text-5xl mb-3">⭐</div>
              <h2 className="text-xl sm:text-2xl font-bold text-yellow-600 mb-2">Análisis de Competencia</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                ¿Invertirías en la Start-up {getEvaluatedTeamName().toUpperCase()}? Valora su potencial.
              </p>
            </div>

            {isCheckingEvaluation ? (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 sm:p-6 text-center">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-3 animate-spin" />
                <p className="text-blue-800 font-semibold text-base sm:text-lg">
                  Verificando evaluación...
                </p>
                <p className="text-blue-700 text-xs sm:text-sm mt-2">
                  Por favor espera un momento
                </p>
              </div>
            ) : evaluationSubmitted ? (
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-400 rounded-xl p-4 sm:p-6 text-center">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-3" />
                <p className="text-green-800 font-semibold text-base sm:text-lg">
                  ✅ Evaluación enviada exitosamente
                </p>
                <p className="text-green-700 text-xs sm:text-sm mt-2">
                  Espera a que el profesor avance al siguiente turno
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitEvaluation} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#093c92] mb-2">
                    Relevancia del Dolor (El Problema) (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={evaluationScores.clarity}
                    onChange={(e) => setEvaluationScores({ ...evaluationScores, clarity: parseInt(e.target.value) })}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093c92] focus:border-transparent text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#093c92] mb-2">
                    Potencial de la Solución (El MVP) (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={evaluationScores.solution}
                    onChange={(e) => setEvaluationScores({ ...evaluationScores, solution: parseInt(e.target.value) })}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093c92] focus:border-transparent text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#093c92] mb-2">
                    Poder de Convicción (El Pitch) (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={evaluationScores.presentation}
                    onChange={(e) => setEvaluationScores({ ...evaluationScores, presentation: parseInt(e.target.value) })}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093c92] focus:border-transparent text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#093c92] mb-2">
                    Consejo Estratégico (Opcional)
                  </label>
                  <textarea
                    value={evaluationScores.feedback}
                    onChange={(e) => setEvaluationScores({ ...evaluationScores, feedback: e.target.value })}
                    rows={4}
                    placeholder="Escribe tu consejo estratégico aquí..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093c92] focus:border-transparent text-sm sm:text-base resize-y"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingEvaluation}
                  className="w-full bg-gradient-to-r from-[#093c92] to-[#f757ac] hover:from-[#072e73] hover:to-[#e6498a] text-white text-sm sm:text-base py-3 sm:py-4 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isSubmittingEvaluation ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      [ REGISTRAR VALORACIÓN ]
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        )}

        {/* Estado: Equipo que presentó esperando */}
        {presentationState === 'evaluating' && isMyTurn && (() => {
          // Obtener otros equipos
          const otherTeams = presentationStatus?.teams.filter(t => t.id !== team.id) || [];
          // CRÍTICO: El serializer devuelve evaluator_team (ID), no evaluator_team_id
          const evaluatedTeamIds = new Set(receivedEvaluations.map((e: any) => e.evaluator_team || e.evaluator_team_id));
          
          // Calcular estadísticas agregadas
          const totalClarity = receivedEvaluations.reduce((sum: number, e: any) => sum + (e.criteria_scores?.clarity || 0), 0);
          const totalSolution = receivedEvaluations.reduce((sum: number, e: any) => sum + (e.criteria_scores?.solution || 0), 0);
          const totalPresentation = receivedEvaluations.reduce((sum: number, e: any) => sum + (e.criteria_scores?.presentation || 0), 0);
          const totalScore = receivedEvaluations.reduce((sum: number, e: any) => sum + (e.total_score || 0), 0);
          const totalTokens = receivedEvaluations.reduce((sum: number, e: any) => sum + (e.tokens_awarded || 0), 0);
          const count = receivedEvaluations.length;

          return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-4 sm:p-6"
          >
              <div className="text-center mb-4 sm:mb-6">
                <div className="text-4xl sm:text-5xl mb-3">⏳</div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-2">
              Esperando Evaluaciones
            </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  La competencia está decidiendo el valor de su propuesta.
                </p>
              </div>

              {/* Estado de la Ronda de Inversión */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="font-semibold text-base sm:text-lg text-[#093c92] mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Estado de la Ronda de Inversión
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 mb-2">
                  <div
                    className="bg-green-500 h-3 sm:h-4 rounded-full transition-all duration-300"
                    style={{ width: `${evaluationProgress.total > 0 ? (evaluationProgress.completed / evaluationProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs sm:text-sm text-gray-700 font-semibold">
                  {evaluationProgress.completed} de {evaluationProgress.total} Start-ups han emitido su voto
                </p>
              </div>

              {/* Estadísticas Totales por Criterio */}
              {count > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-3 sm:p-4 text-center shadow-lg"
                  >
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-blue-700 mb-1">
                      {totalClarity}
                      </div>
                    <div className="text-xs sm:text-sm text-blue-800 font-semibold">Total Claridad</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Promedio: {(totalClarity / count).toFixed(1)}/10
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-3 sm:p-4 text-center shadow-lg"
                  >
                    <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-green-700 mb-1">
                      {totalSolution}
                    </div>
                    <div className="text-xs sm:text-sm text-green-800 font-semibold">Total Solución</div>
                    <div className="text-xs text-green-600 mt-1">
                      Promedio: {(totalSolution / count).toFixed(1)}/10
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-3 sm:p-4 text-center shadow-lg"
                  >
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-purple-700 mb-1">
                      {totalPresentation}
                    </div>
                    <div className="text-xs sm:text-sm text-purple-800 font-semibold">Total Presentación</div>
                    <div className="text-xs text-purple-600 mt-1">
                      Promedio: {(totalPresentation / count).toFixed(1)}/10
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Resumen Total */}
              {count > 0 && (
                <div className="bg-gradient-to-r from-[#093c92] to-[#f757ac] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-white text-center shadow-lg">
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                        <div>
                      <p className="text-xs sm:text-sm opacity-90">Puntuación Total</p>
                      <p className="text-2xl sm:text-3xl font-bold">{totalScore}</p>
                        </div>
                        <div>
                      <p className="text-xs sm:text-sm opacity-90">Tokens Recibidos</p>
                      <p className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-1">
                        <Coins className="w-5 h-5 sm:w-6 sm:h-6" /> {totalTokens}
                      </p>
                        </div>
                        <div>
                      <p className="text-xs sm:text-sm opacity-90">Promedio General</p>
                      <p className="text-2xl sm:text-3xl font-bold">{(totalScore / count).toFixed(1)}/30</p>
                        </div>
                      </div>
                        </div>
                      )}

              {/* Panel de Inversionistas */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-base sm:text-lg text-[#093c92] mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Panel de Inversionistas
                </h3>
                {otherTeams.map((otherTeam) => {
                  // Buscar evaluación por evaluator_team o evaluator_team_id
                  const evaluation = receivedEvaluations.find((e: any) => 
                    (e.evaluator_team === otherTeam.id) || (e.evaluator_team_id === otherTeam.id)
                  );
                  const hasEvaluated = !!evaluation;

                  return (
                    <motion.div
                      key={otherTeam.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`border-2 rounded-lg p-3 sm:p-4 ${
                        hasEvaluated
                          ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'
                          : 'bg-gray-50 border-gray-300'
                      } transition-all`}
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md flex-shrink-0"
                            style={{ backgroundColor: getTeamColorHex(otherTeam.color) }}
                          >
                            {otherTeam.color.charAt(0).toUpperCase()}
                    </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-base text-[#093c92] truncate">
                              {(() => {
                                const match = otherTeam.name?.match(/^Equipo\s+(.+)$/i);
                                const teamDisplayName = match ? match[1] : (otherTeam.name || otherTeam.color);
                                return `Start-up ${teamDisplayName}`;
                              })()}
                            </p>
                </div>
                        </div>
                        <div className="flex-shrink-0">
                          {hasEvaluated ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                              <span className="text-xs sm:text-sm font-semibold text-green-700">Votado</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                              <span className="text-xs sm:text-sm font-semibold text-yellow-700">Deliberando...</span>
              </div>
            )}
                        </div>
                      </div>

                      {hasEvaluated && evaluation && (
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-green-200">
                          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2">
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-0.5">Claridad</p>
                              <p className="font-bold text-sm sm:text-base text-blue-600">{evaluation.criteria_scores?.clarity || 0}/10</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-0.5">Solución</p>
                              <p className="font-bold text-sm sm:text-base text-green-600">{evaluation.criteria_scores?.solution || 0}/10</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-0.5">Presentación</p>
                              <p className="font-bold text-sm sm:text-base text-purple-600">{evaluation.criteria_scores?.presentation || 0}/10</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap justify-between items-center gap-2 mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm text-gray-700 font-semibold">Total:</span>
                              <span className="text-sm sm:text-base font-bold text-green-700">{evaluation.total_score}/30</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Coins className="w-4 h-4 text-yellow-600" />
                              <span className="text-xs sm:text-sm font-bold text-yellow-700">{evaluation.tokens_awarded} tokens</span>
                            </div>
                          </div>
                          {evaluation.feedback && (
                            <div className="mt-2 pt-2 border-t border-green-200">
                              <p className="text-xs text-gray-600 font-semibold mb-1">Feedback:</p>
                              <p className="text-xs sm:text-sm text-gray-800">{evaluation.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-center text-gray-500 text-xs sm:text-sm mt-4 sm:mt-6">
                Espera a que el profesor avance al siguiente turno
              </p>
            </motion.div>
          );
        })()}

        {/* Estado: Esperando turno (cuando otro equipo se está preparando) */}
        {presentationState === 'preparing' && !isMyTurn && (() => {
          const myPosition = getMyPosition();
          const currentPosition = getCurrentPresentingPosition();
          const preparingTeam = presentationStatus?.teams.find(
            t => t.id === presentationStatus.current_presentation_team_id
          );
          
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-4 sm:p-6 text-center"
            >
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">⏳</div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#093c92] mb-3 sm:mb-4">
                Esperando Tu Turno
              </h2>
              
              {preparingTeam && (
                <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">
                  La Startup <span className="font-bold text-[#093c92]">{getTeamName(preparingTeam).toUpperCase()}</span> está tomando posición en el escenario.
                </p>
              )}
              
              {myPosition && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                  <p className="text-blue-800 font-semibold text-base sm:text-lg">
                    📋 Tu Start-up presenta {getPositionText(myPosition)}
                  </p>
                  {currentPosition && myPosition > currentPosition && (
                    <p className="text-blue-600 text-xs sm:text-sm mt-2">
                      {myPosition - currentPosition === 1 
                        ? 'Tu turno es el siguiente'
                        : `Faltan ${myPosition - currentPosition} presentaciones antes de tu turno`
                      }
                    </p>
                  )}
                </div>
              )}
              
              <p className="text-gray-500 text-xs sm:text-sm mt-3 sm:mt-4">
                Prepárense para cuando sea su turno.
              </p>
            </motion.div>
          );
        })()}
        </div>
      </div>

      {/* Modal de U-Bot */}
      {team && (
        <UBotPresentacionPitchModal
          isOpen={showUBotModal}
          onClose={() => setShowUBotModal(false)}
          onContinuar={() => setShowUBotModal(false)}
          teamColor={team.color}
        />
      )}
    </div>
  );
}

