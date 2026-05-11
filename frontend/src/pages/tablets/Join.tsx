import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { tabletConnectionsAPI } from '@/services';
import { StarfieldBackground } from '@/components/StarfieldBackground';
import { toast } from 'sonner';

// ─── PIN-style character boxes for room code ──────────────────────────────────
function PinInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const slots = Array.from({ length: 6 });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    onChange(raw);
  };

  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        maxLength={6}
        autoCapitalize="characters"
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        autoFocus
        aria-label="Código de sesión"
      />
      <div className="flex gap-2 sm:gap-3 justify-center">
        {slots.map((_, i) => {
          const char = value[i] ?? '';
          const isActive = value.length === i;
          return (
            <motion.div
              key={i}
              animate={isActive ? { scale: [1, 1.06, 1], borderColor: '#f472b6' } : {}}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: "'Exo 2', sans-serif",
                borderColor: char ? '#093c92' : isActive ? '#f472b6' : '#cbd5e1',
              }}
              className={`
                w-11 h-13 sm:w-13 sm:h-15 rounded-xl border-2 flex items-center justify-center
                text-xl sm:text-2xl font-black text-[#093c92] bg-white/90
                transition-all duration-200 shadow-sm select-none
                ${char ? 'shadow-md' : ''}
              `}
            >
              {char ? (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                >
                  {char}
                </motion.span>
              ) : isActive ? (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="w-0.5 h-6 bg-[#f472b6] rounded-full inline-block"
                />
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Team color palette ───────────────────────────────────────────────────────
const TEAM_COLORS = [
  { hex: '#3B82F6', name: 'Azul' },
  { hex: '#EF4444', name: 'Rojo' },
  { hex: '#10B981', name: 'Verde' },
  { hex: '#F59E0B', name: 'Amarillo' },
  { hex: '#8B5CF6', name: 'Morado' },
  { hex: '#F97316', name: 'Naranja' },
] as const;

// ─── Main component ───────────────────────────────────────────────────────────
export function TabletJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'tablet'>('code');

  useEffect(() => {
    const savedToken = localStorage.getItem('team_session_token');
    if (savedToken) {
      tabletConnectionsAPI
        .reconnect(savedToken)
        .then((data) => {
          localStorage.setItem('tabletConnectionId', String(data.connection.id));
          localStorage.setItem('teamId', String(data.team.id));
          localStorage.setItem('gameSessionId', String(data.game_session.id));
          localStorage.setItem('roomCode', String(data.game_session.room_code));
          navigate(`/tablet/lobby?connection_id=${data.connection.id}`);
        })
        .catch(() => {
          localStorage.removeItem('team_session_token');
        });
    }

    const fromUrl = searchParams.get('room_code');
    if (fromUrl) {
      setRoomCode(fromUrl.toUpperCase());
      setStep('tablet');
    }
    const parts = window.location.pathname.split('/');
    const idx = parts.indexOf('join');
    if (idx !== -1 && parts[idx + 1]?.length === 6) {
      setRoomCode(parts[idx + 1].toUpperCase());
      setStep('tablet');
    }
  }, [searchParams]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRoom = roomCode.trim().toUpperCase();
    const trimmedName = teamName.trim();

    if (!trimmedRoom || !trimmedName || !teamColor) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const data = await tabletConnectionsAPI.connect(trimmedRoom, trimmedName, teamColor);
      localStorage.setItem('team_session_token', String(data.team_session_token));
      localStorage.setItem('tabletConnectionId', String(data.connection.id));
      localStorage.setItem('teamId', String(data.team.id));
      localStorage.setItem('gameSessionId', String(data.game_session.id));
      localStorage.setItem('roomCode', String(data.game_session.room_code));

      toast.success(data.message || '¡Conectado exitosamente!', {
        description: 'Redirigiendo al lobby…',
      });
      setTimeout(() => navigate(`/tablet/lobby?connection_id=${data.connection.id}`), 1000);
    } catch (error: any) {
      toast.error('No pudimos conectar', {
        description:
          error.response?.data?.error ||
          error.message ||
          'Verifica los datos e intenta nuevamente',
      });
      setLoading(false);
    }
  };

  const advanceStep = () => {
    if (roomCode.length === 6) setStep('tablet');
    else toast.error('El código tiene 6 caracteres', { description: 'Complétalo para continuar' });
  };

  return (
    <StarfieldBackground nebTarget={[20, 10, 55]}>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">

        {/* ── Badge top-left ── */}
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 24 }}
          className="fixed top-5 left-5 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 z-10"
        >
          <img src="/images/logoudd.png" alt="UDD" className="h-6 object-contain" />
          <span className="text-xs font-semibold text-white/70 tracking-wide uppercase"
            style={{ fontFamily: "'Exo 2', sans-serif" }}>
            Emprendimiento
          </span>
        </motion.div>

        {/* ── Main card ── */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 160, damping: 22 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">

            {/* Header stripe */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#093c92] via-blue-500 to-[#f472b6]" />

            <div className="p-7 sm:p-9">

              {/* Logo + title */}
              <div className="flex items-center gap-4 mb-8">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex-shrink-0"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#093c92]/10 to-[#f472b6]/10 flex items-center justify-center shadow-inner">
                    <img
                      src="/images/mascotaprueba.svg"
                      alt="Mascota"
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md"
                    />
                  </div>
                </motion.div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-500 mb-1"
                    style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    ¡Bienvenido!
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#093c92] leading-tight"
                    style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    Misión<br />Emprende
                  </h1>
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-7">
                {['Sesión', 'Equipo'].map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                        (i === 0 && step === 'code') || (i === 1 && step === 'tablet')
                          ? 'bg-gradient-to-r from-[#093c92] to-blue-600 text-white shadow-md'
                          : i === 0 && step === 'tablet'
                          ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      style={{ fontFamily: "'Exo 2', sans-serif" }}
                    >
                      <span>{i + 1}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </div>
                    {i < 1 && (
                      <div
                        className={`flex-1 h-0.5 w-8 rounded transition-all duration-500 ${
                          step === 'tablet' ? 'bg-gradient-to-r from-pink-500 to-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* ── Form ── */}
              <form onSubmit={handleConnect} className="space-y-6">
                <AnimatePresence mode="wait">
                  {step === 'code' ? (
                    <motion.div
                      key="step-code"
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -30, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 mb-3"
                          style={{ fontFamily: "'Exo 2', sans-serif" }}>
                          Código de Sesión
                        </label>
                        <PinInput value={roomCode} onChange={setRoomCode} disabled={loading} />
                        <p className="text-center text-xs text-gray-400 mt-3">
                          Tu profesor te dará este código
                        </p>
                      </div>

                      <motion.button
                        type="button"
                        onClick={advanceStep}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.02 }}
                        disabled={roomCode.length !== 6}
                        className={`
                          w-full h-14 sm:h-16 rounded-2xl font-bold text-base sm:text-lg
                          transition-all duration-200 shadow-lg flex items-center justify-center gap-3
                          ${
                            roomCode.length === 6
                              ? 'bg-gradient-to-r from-[#093c92] to-blue-600 text-white hover:shadow-xl cursor-pointer'
                              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          }
                        `}
                        style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: '0.05em' }}
                      >
                        Continuar
                        <motion.span
                          animate={roomCode.length === 6 ? { x: [0, 4, 0] } : {}}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          →
                        </motion.span>
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step-tablet"
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -30, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                      className="space-y-5"
                    >
                      {/* Confirmed session code chip */}
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#093c92] animate-pulse" />
                        <span className="text-xs text-gray-500 font-medium">Sesión</span>
                        <span
                          className="text-sm font-black text-[#093c92] tracking-widest ml-auto"
                          style={{ fontFamily: "'Exo 2', sans-serif" }}
                        >
                          {roomCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => setStep('code')}
                          className="text-pink-500 text-xs font-bold ml-2 hover:underline"
                        >
                          cambiar
                        </button>
                      </div>

                      {/* Team name */}
                      <div>
                        <label
                          htmlFor="teamName"
                          className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 mb-3"
                          style={{ fontFamily: "'Exo 2', sans-serif" }}
                        >
                          Nombre del Equipo
                        </label>
                        <input
                          id="teamName"
                          type="text"
                          placeholder="Ej: Los Innovadores"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          disabled={loading}
                          autoFocus
                          maxLength={50}
                          className="
                            w-full h-14 sm:h-16 px-5 rounded-2xl border-2 border-gray-200
                            text-lg font-bold text-[#093c92]
                            bg-white focus:outline-none focus:border-[#093c92] focus:ring-4
                            focus:ring-[#093c92]/10 transition-all placeholder:text-gray-300
                            placeholder:font-normal placeholder:text-sm
                          "
                          style={{ fontFamily: "'Exo 2', sans-serif" }}
                        />
                      </div>

                      {/* Color picker */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500 mb-3"
                          style={{ fontFamily: "'Exo 2', sans-serif" }}>
                          Color del Equipo
                        </label>
                        <div className="flex gap-3 flex-wrap">
                          {TEAM_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setTeamColor(c.name)}
                              disabled={loading}
                              title={c.name}
                              className="relative w-10 h-10 rounded-full transition-transform hover:scale-110 focus:outline-none flex-shrink-0"
                              style={{ backgroundColor: c.hex }}
                            >
                              {teamColor === c.name && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute inset-0 rounded-full flex items-center justify-center"
                                  style={{ boxShadow: `0 0 0 3px white, 0 0 0 5px ${c.hex}` }}
                                >
                                  <svg className="w-4 h-4 text-white drop-shadow" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </motion.div>
                              )}
                            </button>
                          ))}
                        </div>
                        {teamColor && (
                          <p className="text-xs text-gray-400 mt-2 ml-1">
                            Color seleccionado: {teamColor}
                          </p>
                        )}
                      </div>

                      {/* CTA */}
                      <motion.button
                        type="submit"
                        disabled={loading || teamName.trim().length < 2 || !teamColor}
                        whileTap={{ scale: 0.96 }}
                        className={`
                          w-full h-16 sm:h-20 rounded-2xl font-bold text-lg sm:text-xl
                          transition-all duration-200 relative overflow-hidden
                          flex items-center justify-center gap-3 shadow-xl
                          ${
                            !loading && teamName.trim().length >= 2 && teamColor
                              ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:shadow-2xl cursor-pointer'
                              : 'bg-pink-100 text-pink-300 cursor-not-allowed'
                          }
                        `}
                        style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: '0.03em' }}
                      >
                        {!loading && teamName.trim().length >= 2 && teamColor && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
                          />
                        )}

                        {loading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              className="w-6 h-6 rounded-full"
                              style={{
                                borderWidth: '3px',
                                borderStyle: 'solid',
                                borderColor: 'rgba(255,255,255,0.3)',
                                borderTopColor: 'white',
                              }}
                            />
                            <span>Conectando…</span>
                          </>
                        ) : (
                          <>
                            <span>Entrar a la Misión</span>
                            <Rocket className="w-5 h-5" />
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Card footer */}
            <div className="px-7 sm:px-9 pb-6 pt-0">
              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium">
                  ¿Necesitas ayuda? Consulta al profesor
                </p>
                <div className="flex gap-1">
                  {['#093c92', '#f472b6', '#3b82f6'].map((c, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Floating tags ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex gap-3 justify-center mt-5"
          >
            {['Creatividad', 'Emprendimiento', 'Innovación'].map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="text-[10px] font-bold uppercase tracking-wider text-white/60 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>

          {/* ── Professor access ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex justify-center mt-4"
          >
            <a
              href="/profesor/login"
              className="
                inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl
                border border-white/20 bg-white/10 backdrop-blur-sm
                text-xs font-semibold text-white/60 tracking-wide
                hover:bg-white/20 hover:border-white/40 hover:text-white/90
                transition-all duration-200 shadow-sm
              "
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              Acceso profesores →
            </a>
          </motion.div>
        </motion.div>
      </div>
    </StarfieldBackground>
  );
}
