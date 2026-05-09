import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Tutorial() {
  const navigate = useNavigate();

  // URL del video tutorial - Puede ser un video de YouTube
  // Para cambiar el video, reemplaza el ID después de /embed/
  // Ejemplo: https://www.youtube.com/watch?v=VIDEO_ID se convierte en:
  // https://www.youtube.com/embed/VIDEO_ID
  const tutorialVideoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ?controls=1&rel=0&modestbranding=1';

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

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-6xl">
          <Button
            onClick={() => navigate('/profesor/panel')}
            variant="ghost"
            className="mb-4 text-white hover:bg-white/20 self-start text-sm sm:text-base"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Volver al Panel
          </Button>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-200 w-full"
          >
            <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#093c92] to-[#f757ac] rounded-full flex items-center justify-center shadow-lg">
                <Film className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-[#093c92] text-xl sm:text-2xl font-bold">
                Video Instructivo
              </h2>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.005 }}
              className="rounded-lg shadow-xl overflow-hidden relative bg-black"
              style={{ aspectRatio: '16/9' }}
            >
              <iframe
                src={tutorialVideoUrl}
                title="Tutorial - Cómo Jugar Misión Emprende"
                className="w-full h-full absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

