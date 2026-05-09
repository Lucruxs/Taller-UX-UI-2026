import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, ChevronDown, Target, Users, Heart, Lightbulb, MessageSquare, Trophy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { challengesAPI } from '@/services';
import { toast } from 'sonner';

interface LearningObjective {
  id: number;
  title: string;
  description?: string;
  evaluation_criteria?: string;
  pedagogical_recommendations?: string;
  estimated_time?: number;
  stage_name?: string;
  stage_number?: number;
}

export function Objetivos() {
  const navigate = useNavigate();
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([]);
  const [loadingObjectives, setLoadingObjectives] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['checklist']));

  useEffect(() => {
    loadLearningObjectives();
  }, []);

  const loadLearningObjectives = async () => {
    setLoadingObjectives(true);
    try {
      const data = await challengesAPI.getLearningObjectives();
      const objectivesArray = Array.isArray(data) ? data : [data];
      setLearningObjectives(objectivesArray);
    } catch (error) {
      console.error('Error loading objectives:', error);
      toast.error('Error al cargar objetivos');
    } finally {
      setLoadingObjectives(false);
    }
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
      'General': '📖 Objetivos Generales'
    };
    return stageMap[stageName] || stageName;
  };

  const getStageOrder = (stageName: string, objective?: LearningObjective): number => {
    // Si el objetivo tiene stage_number, usar ese para ordenar (más preciso)
    if (objective?.stage_number) {
      return objective.stage_number;
    }
    
    // Si no, usar un mapeo basado en el nombre
    const orderMap: Record<string, number> = {
      'Etapa 1': 1,
      'Etapa 2': 2,
      'Etapa 3': 3,
      'Etapa 4': 4,
      'Trabajo en equipo': 1,
      'Empatía': 2,
      'Creatividad': 3,
      'Comunicación': 4,
      'General': 5
    };
    return orderMap[stageName] || 99;
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
      
      <div className="max-w-6xl mx-auto relative z-10 p-4 sm:p-6 font-sans">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Button
            onClick={() => navigate('/profesor/panel')}
            className="bg-white/90 hover:bg-white text-blue-900 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel</span>
          </Button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-4 drop-shadow-md">
            Objetivos de Aprendizaje
          </h1>
          <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto drop-shadow-sm">
            Este juego está diseñado para desarrollar competencias clave en emprendimiento e innovación
          </p>
        </motion.div>

        {/* Main objectives - Las 4 Etapas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Etapa 1: Trabajo en Equipo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-4 rounded-2xl shrink-0 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">
                  Etapa 1: Trabajo en Equipo
                </h3>
                <p className="text-gray-700 text-sm">
                  Fomentar la colaboración efectiva, comunicación y liderazgo dentro de grupos diversos
                </p>
              </div>
            </div>
            <div className="space-y-2 mt-6">
              {['Comunicación efectiva', 'Liderazgo colaborativo', 'Resolución de conflictos', 'Delegación de tareas'].map((habilidad, i) => (
                <motion.div
                  key={habilidad}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"
                >
                  <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-1 rounded-md">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">{habilidad}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Etapa 2: Empatía */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-4 rounded-2xl shrink-0 shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">
                  Etapa 2: Empatía
                </h3>
                <p className="text-gray-700 text-sm">
                  Desarrollar la capacidad de entender y relacionarse con las necesidades y problemas de otros
                </p>
              </div>
            </div>
            <div className="space-y-2 mt-6">
              {['Comprensión de problemas', 'Identificación de necesidades', 'Perspectiva del usuario', 'Análisis de contextos'].map((habilidad, i) => (
                <motion.div
                  key={habilidad}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"
                >
                  <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-1 rounded-md">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">{habilidad}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Etapa 3: Creatividad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-2xl shrink-0 shadow-lg">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">
                  Etapa 3: Creatividad
                </h3>
                <p className="text-gray-700 text-sm">
                  Desarrollar la capacidad de generar ideas innovadoras y soluciones creativas a problemas reales
                </p>
              </div>
            </div>
            <div className="space-y-2 mt-6">
              {['Generación de ideas originales', 'Pensamiento lateral', 'Resolución creativa de problemas', 'Innovación aplicada'].map((habilidad, i) => (
                <motion.div
                  key={habilidad}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"
                >
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-1 rounded-md">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">{habilidad}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Etapa 4: Comunicación */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-2xl shrink-0 shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">
                  Etapa 4: Comunicación
                </h3>
                <p className="text-gray-700 text-sm">
                  Presentar ideas de manera efectiva y desarrollar habilidades de comunicación y presentación
                </p>
              </div>
            </div>
            <div className="space-y-2 mt-6">
              {['Presentación de pitch', 'Comunicación clara', 'Estructura de mensajes', 'Persuasión efectiva'].map((habilidad, i) => (
                <motion.div
                  key={habilidad}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"
                >
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-1 rounded-md">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">{habilidad}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Competencias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8"
        >
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-blue-900 mb-2">
              Competencias Desarrolladas
            </h2>
            <p className="text-gray-700 text-sm">
              Al finalizar el juego, los estudiantes habrán trabajado estas competencias
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {['Creatividad e innovación', 'Trabajo colaborativo', 'Comunicación efectiva', 'Liderazgo', 'Emprendimiento', 'Resolución de problemas', 'Pensamiento crítico', 'Presentación en público'].map((competencia, i) => (
              <motion.div
                key={competencia}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl text-center border border-blue-100"
              >
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs sm:text-sm text-gray-700 font-medium">{competencia}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Objetivos por Etapa (desde API) */}
        {learningObjectives.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-blue-900 mb-4 sm:mb-6">Objetivos por Etapa</h2>
            {loadingObjectives ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  learningObjectives.reduce((acc, obj) => {
                    const stageName = obj.stage_name || 'General';
                    if (!acc[stageName]) acc[stageName] = [];
                    acc[stageName].push(obj);
                    return acc;
                  }, {} as Record<string, LearningObjective[]>)
                )
                .sort(([stageA, objsA], [stageB, objsB]) => {
                  // Usar el primer objetivo del grupo para obtener el stage.number si está disponible
                  const firstObjA = objsA[0];
                  const firstObjB = objsB[0];
                  const orderA = getStageOrder(stageA, firstObjA);
                  const orderB = getStageOrder(stageB, firstObjB);
                  return orderA - orderB;
                })
                .map(([stageName, objs]) => (
                  <div
                    key={stageName}
                    className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200"
                  >
                    <button
                      onClick={() => toggleAccordion(stageName)}
                      className="w-full px-4 py-3 bg-white hover:bg-gray-50 flex justify-between items-center font-semibold text-left transition-colors rounded-xl"
                    >
                      <span className="text-blue-900">{getStageName(stageName)}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-blue-900 transition-transform ${
                          openAccordions.has(stageName) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openAccordions.has(stageName) && (
                      <div className="p-4 space-y-4">
                        {objs.map((obj) => (
                          <div
                            key={obj.id}
                            className="bg-white p-4 rounded-lg border border-gray-200"
                          >
                            <h4 className="font-semibold text-blue-900 mb-2">{obj.title}</h4>
                            {obj.description && (
                              <p className="text-gray-700 text-sm mb-2">{obj.description}</p>
                            )}
                            {obj.evaluation_criteria && (
                              <p className="text-sm text-gray-700">
                                <strong>Criterios de Evaluación:</strong> {obj.evaluation_criteria}
                              </p>
                            )}
                            {obj.pedagogical_recommendations && (
                              <p className="text-sm text-gray-700">
                                <strong>Recomendaciones:</strong> {obj.pedagogical_recommendations}
                              </p>
                            )}
                            {obj.estimated_time && (
                              <p className="text-sm text-gray-700">
                                <strong>Tiempo Estimado:</strong> {obj.estimated_time} minutos
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

