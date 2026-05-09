import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Target, Layers, Zap, Sparkles, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stage {
  id: number | string;
  name: string;
  icon: any;
  gradient: string;
  description: string;
}

export function UpdateGame() {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const stages: Stage[] = [
    {
      id: 1,
      name: 'Etapa 1',
      icon: Target,
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Configurar primera etapa',
    },
    {
      id: 2,
      name: 'Etapa 2',
      icon: Layers,
      gradient: 'from-purple-500 to-violet-500',
      description: 'Configurar segunda etapa',
    },
    {
      id: 3,
      name: 'Etapa 3',
      icon: Zap,
      gradient: 'from-orange-500 to-red-500',
      description: 'Configurar tercera etapa',
    },
    {
      id: 4,
      name: 'Etapa 4',
      icon: Sparkles,
      gradient: 'from-pink-500 to-rose-500',
      description: 'Configurar cuarta etapa',
    },
    {
      id: 'otros',
      name: 'Otros',
      icon: MoreHorizontal,
      gradient: 'from-gray-500 to-slate-600',
      description: 'Otras configuraciones',
    },
  ];

  const handleStageClick = (stageId: number | string) => {
    if (typeof stageId === 'number') {
      navigate(`/admin/update-game/etapa${stageId}`);
      } else {
      // Para "otros" u otras opciones especiales
      navigate(`/admin/update-game/${stageId}`);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]" />

      <div className="max-w-6xl mx-auto w-full relative z-10 p-4 sm:p-5 font-sans flex-1 flex flex-col">
        {/* Botón Volver */}
        <Button
          onClick={() => navigate('/admin/panel')}
          className="bg-white text-blue-900 hover:bg-gray-100 flex items-center gap-2 px-3 py-2 mb-4 rounded-lg shadow-md text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Panel</span>
        </Button>

        {/* Contenido */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
        >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
                  Actualizar Juego
                </h1>
                <p className="text-gray-600">
                  Configuración y actualización del juego por etapas
                </p>
              </div>

              {/* Tarjetas de Etapas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {stages.map((stage, index) => {
                  const IconComponent = stage.icon;
                  return (
                    <motion.div
                      key={stage.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleStageClick(stage.id)}
                      className="group cursor-pointer overflow-hidden relative"
                    >
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 py-6 shadow-2xl border-0 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-purple-600 transition-all">
                        <div className="relative z-10">
                          <div className={`bg-gradient-to-br ${stage.gradient} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          
                          <h3 className="text-sm font-semibold text-blue-900 mb-1.5 group-hover:text-white">
                            {stage.name}
                          </h3>
                          
                          <p className="text-xs text-gray-600 mb-2.5 group-hover:text-white/90">
                            {stage.description}
                          </p>

                          <div className="mt-3 flex items-center text-pink-500 group-hover:text-white text-xs font-medium">
                            Configurar ✨
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                            </div>
                          </motion.div>
                                  </div>
                                  </div>
  );
}
