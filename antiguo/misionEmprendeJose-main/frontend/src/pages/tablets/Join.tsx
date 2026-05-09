import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tablet, Loader2, QrCode, Gamepad2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { tabletConnectionsAPI } from '@/services';
import { toast } from 'sonner';

export function TabletJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();
  const [roomCode, setRoomCode] = useState('');
  const [tabletCode, setTabletCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar si hay código de sala en la URL (desde QR o parámetro)
  useEffect(() => {
    // Desde query params: ?room_code=ABC123
    const roomCodeFromUrl = searchParams.get('room_code');
    if (roomCodeFromUrl) {
      setRoomCode(roomCodeFromUrl.toUpperCase());
    }

    // Desde path: /tablet/join/ABC123
    const pathParts = window.location.pathname.split('/');
    const joinIndex = pathParts.indexOf('join');
    if (joinIndex !== -1 && pathParts.length > joinIndex + 1) {
      const roomCodeFromPath = pathParts[joinIndex + 1];
      if (roomCodeFromPath && roomCodeFromPath.length === 6) {
        setRoomCode(roomCodeFromPath.toUpperCase());
      }
    }
  }, [searchParams]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedRoomCode = roomCode.trim().toUpperCase();
    const trimmedTabletCode = tabletCode.trim().toUpperCase();

    if (!trimmedRoomCode || !trimmedTabletCode) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const data = await tabletConnectionsAPI.connect(trimmedRoomCode, trimmedTabletCode);

      // Guardar información de conexión en localStorage (igual que en join.html - líneas 293-297)
      // Asegurar que todos los IDs se guarden como strings
      localStorage.setItem('tabletConnectionId', String(data.connection.id));
      localStorage.setItem('teamId', String(data.team.id));
      localStorage.setItem('gameSessionId', String(data.game_session.id));
      localStorage.setItem('roomCode', String(data.game_session.room_code));

      toast.success(data.message || '¡Conectado exitosamente!', {
        description: 'Redirigiendo al lobby...',
      });

      // Redirigir al lobby después de 1 segundo (igual que en join.html - línea 302-304)
      setTimeout(() => {
        navigate(`/tablet/lobby?connection_id=${data.connection.id}`);
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Error al conectar';
      toast.error('Error', {
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden flex items-center justify-center p-3 sm:p-4">
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

      {/* Contenido Compacto */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full"
      >
        {/* Logo/Header Compacto */}
        <div className="text-center mb-6 sm:mb-7">
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              rotate: {
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "easeInOut"
              }
            }}
            className="inline-flex items-center justify-center mb-4"
          >
            <img
              src="/images/mascotaprueba.svg"
              alt="Mascota Misión Emprende"
              className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-lg"
              style={{
                objectFit: 'contain',
              }}
            />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#093c92] to-[#f757ac] bg-clip-text text-transparent mb-2 tracking-tight drop-shadow-sm">
            Misión Emprende
          </h1>
          <p className="text-gray-600 text-sm sm:text-base font-medium">Conectar Tablet a la Sala</p>
        </div>

        {/* Formulario Compacto */}
        <form onSubmit={handleConnect} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="roomCode" className="text-[#093c92] font-semibold text-sm sm:text-base flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Código de Sala
            </Label>
            <Input
              id="roomCode"
              type="text"
              placeholder="Ej: ABC123"
              value={roomCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (value.length <= 6) {
                  setRoomCode(value);
                }
              }}
              maxLength={6}
              className="h-14 sm:h-16 text-center text-xl sm:text-2xl font-bold tracking-widest uppercase border-2 border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 rounded-xl transition-all"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tabletCode" className="text-[#093c92] font-semibold flex items-center gap-2 text-sm sm:text-base">
              <Tablet className="w-4 h-4" />
              Código de Tablet
            </Label>
            <Input
              id="tabletCode"
              type="text"
              placeholder="Ej: TAB1, TAB2, TAB3..."
              value={tabletCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setTabletCode(value);
              }}
              className="h-12 sm:h-14 text-base sm:text-lg uppercase border-2 border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 rounded-xl transition-all"
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 sm:h-16 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Tablet className="w-5 h-5 mr-2" />
                Conectar
              </>
            )}
          </Button>
        </form>

        {/* Info adicional Compacta */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-xs sm:text-sm flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-400" />
            ¿Necesitas ayuda? Contacta al profesor
          </p>
        </div>
      </motion.div>
    </div>
  );
}

