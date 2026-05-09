import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Loader2, FileSpreadsheet, ArrowLeft, GraduationCap, BookOpen, Users, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { academicAPI, sessionsAPI } from '@/services';
import { toast } from 'sonner';

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

export function CrearSala() {
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [processingExcel, setProcessingExcel] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{
    total_students: number;
    number_of_sessions: number;
    students_per_session: number;
    course_name: string;
  } | null>(null);

  useEffect(() => {
    loadFaculties();
  }, []);

  const loadFaculties = async () => {
    try {
      const data = await academicAPI.getFaculties();
      const facultiesArray = Array.isArray(data) ? data : [data];
      setFaculties(facultiesArray);
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
      const careersArray = Array.isArray(data) ? data : [data];
      setCareers(careersArray);
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
      const coursesArray = Array.isArray(data) ? data : [data];
      setCourses(coursesArray);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Error al cargar cursos');
    }
  };

  const handleProcessExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      toast.error('Por favor selecciona un archivo Excel');
      return;
    }

    if (!selectedCourse) {
      toast.error('Por favor selecciona un curso');
      return;
    }

    setProcessingExcel(true);
    try {
      const formData = new FormData();
      formData.append('course_id', selectedCourse);
      formData.append('file', excelFile);

      const response = await sessionsAPI.processExcel(formData);

      setSessionInfo({
        total_students: response.total_students,
        number_of_sessions: response.number_of_sessions,
        students_per_session: response.students_per_session,
        course_name: response.course_name,
      });
    } catch (error: any) {
      console.error('Error processing Excel:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al procesar el archivo Excel';
      toast.error(errorMessage);
    } finally {
      setProcessingExcel(false);
    }
  };

  const handleConfirmCreateSessions = async (numberOfSessions: number) => {
    if (!excelFile || !selectedCourse) {
      toast.error('Faltan datos necesarios');
      return;
    }

    setCreatingSession(true);
    try {
      const formData = new FormData();
      formData.append('course_id', selectedCourse);
      formData.append('file', excelFile);
      formData.append('number_of_sessions', numberOfSessions.toString());
      formData.append('min_team_size', '3');
      formData.append('max_team_size', '8');

      const response = await sessionsAPI.createWithExcel(formData);

      toast.success(response.message || 'Sesiones creadas exitosamente');
      
      // Si es una sola sesión, redirigir al lobby
      if (numberOfSessions === 1) {
        const gameSessionId = response.game_session?.id || response.id;
        navigate(`/profesor/lobby/${gameSessionId}`);
      } else {
        // Si son múltiples sesiones, abrir cada lobby en una nueva pestaña
        const gameSessions = response.game_sessions || [];
        
        // Abrir la primera sesión en la pestaña actual
        if (gameSessions.length > 0) {
          navigate(`/profesor/lobby/${gameSessions[0].id}`);
        }
        
        // Abrir las demás sesiones en nuevas pestañas
        for (let i = 1; i < gameSessions.length; i++) {
          const sessionId = gameSessions[i].id;
          const lobbyUrl = `${window.location.origin}/profesor/lobby/${sessionId}`;
          window.open(lobbyUrl, '_blank');
        }
        
        toast.success(`${gameSessions.length} salas creadas. Se abrieron ${gameSessions.length} pestañas con los lobbies.`);
      }
    } catch (error: any) {
      console.error('Error creating sessions:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al crear las sesiones';
      toast.error(errorMessage);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleBackToForm = () => {
    setSessionInfo(null);
  };

  return (
    <div className="relative min-h-screen overflow-y-auto flex flex-col py-4 sm:py-6">
      {/* Fondo animado igual que Panel */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac] -z-10">
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
      
      <div className="relative z-10 max-w-5xl mx-auto w-full px-3 sm:px-4 font-sans">
        {/* Botón Volver - Compacto */}
        <div className="mb-3 sm:mb-4">
          <Button
            onClick={() => navigate('/profesor/panel')}
            className="bg-white/90 hover:bg-white text-blue-900 flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel</span>
          </Button>
        </div>

        {/* Contenedor del formulario - Se ajusta al contenido */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6"
        >
          {/* Header Compacto */}
          <div className="text-center mb-4 sm:mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl mb-2">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-blue-900 mb-1 tracking-tight">
              Crear Nueva Sesión
            </h1>
            <p className="text-xs text-gray-600">
              Configura tu sesión de juego y comienza la aventura
            </p>
          </div>

          {!sessionInfo ? (
            <form onSubmit={handleProcessExcel} className="space-y-4 sm:space-y-5">
            {/* Información Académica */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">Información Académica</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <Label htmlFor="faculty" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-pink-500" />
                    Facultad
                  </Label>
                  <select
                    id="faculty"
                    value={selectedFaculty}
                    onChange={(e) => {
                      setSelectedFaculty(e.target.value);
                      if (e.target.value) {
                        loadCareers(e.target.value);
                      } else {
                        setCareers([]);
                        setCourses([]);
                      }
                    }}
                    className="w-full h-10 px-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all text-sm bg-white hover:border-gray-300"
                    required
                  >
                    <option value="">Seleccionar Facultad...</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="career" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-blue-500" />
                    Carrera
                  </Label>
                  <select
                    id="career"
                    value={selectedCareer}
                    onChange={(e) => {
                      setSelectedCareer(e.target.value);
                      if (e.target.value) {
                        loadCourses(e.target.value);
                      } else {
                        setCourses([]);
                      }
                    }}
                    disabled={!selectedFaculty}
                    className="w-full h-10 px-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all text-sm bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">
                      {selectedFaculty ? 'Seleccionar Carrera...' : 'Primero selecciona una Facultad'}
                    </option>
                    {careers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="course" className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <Users className="w-3 h-3 text-purple-500" />
                    Curso
                  </Label>
                  <select
                    id="course"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    disabled={!selectedCareer}
                    className="w-full h-10 px-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all text-sm bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">
                      {selectedCareer ? 'Seleccionar Curso...' : 'Primero selecciona una Carrera'}
                    </option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Archivo Excel - Compacto */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">Estudiantes</h3>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-5 hover:border-pink-500 hover:bg-pink-50/50 transition-all group bg-gray-50">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-md">
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  </div>
                  <Label htmlFor="excelFile" className="text-xs font-medium text-gray-700 mb-1 cursor-pointer">
                    Archivo Excel con Estudiantes (XLSX)
                  </Label>
                  <Input
                    id="excelFile"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    className="mt-1 text-xs cursor-pointer bg-white h-8"
                    required
                  />
                  {excelFile && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✓ {excelFile.name}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500 mt-2 max-w-md">
                    Columnas requeridas: <span className="font-semibold">Nombre completo</span>, <span className="font-semibold">Correo UDD</span>, <span className="font-semibold">RUT</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Botón Crear */}
            <div className="pt-2">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type="submit"
                  disabled={processingExcel}
                  className="w-full h-11 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingExcel ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      <span>Continuar</span>
                      <Sparkles className="w-3 h-3 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </form>
          ) : (
            <div className="space-y-4">
              {/* Información de confirmación */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="text-base font-semibold text-blue-900 mb-3">
                  Confirmación de Sesiones
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-semibold">Total de estudiantes:</span> {sessionInfo.total_students}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Curso:</span> {sessionInfo.course_name}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Salas necesarias:</span> {sessionInfo.number_of_sessions}
                  </p>
                  <p className="text-gray-600 text-xs mt-3">
                    Se crearán {sessionInfo.number_of_sessions} {sessionInfo.number_of_sessions === 1 ? 'sala' : 'salas'} con aproximadamente {sessionInfo.students_per_session} estudiantes cada una.
                  </p>
                </div>
              </div>

              {/* Botones de confirmación */}
              <div className="space-y-2">
                <Button
                  onClick={() => handleConfirmCreateSessions(sessionInfo.number_of_sessions)}
                  disabled={creatingSession}
                  className="w-full h-11 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingSession ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando Sesiones...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      <span>Confirmar y Crear {sessionInfo.number_of_sessions} {sessionInfo.number_of_sessions === 1 ? 'Sala' : 'Salas'}</span>
                      <Sparkles className="w-3 h-3 ml-2" />
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleBackToForm}
                  disabled={creatingSession}
                  variant="outline"
                  className="w-full h-10 text-sm"
                >
                  Volver
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

