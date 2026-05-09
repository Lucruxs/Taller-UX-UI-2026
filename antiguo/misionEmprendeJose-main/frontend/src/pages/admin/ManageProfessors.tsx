import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  GraduationCap,
  Plus,
  Mail,
  Key,
  Loader2,
  X,
  User,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/services/auth';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface Professor {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  access_code: string;
  full_name: string;
  created_at: string;
}

interface AccessCode {
  id: number;
  email: string;
  access_code: string;
  is_used: boolean;
  created_at: string;
  used_at: string | null;
}

export function ManageProfessors() {
  const navigate = useNavigate();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{html: string; plain: string; subject: string; email: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'professors' | 'codes'>('professors');
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadProfessors(), loadAccessCodes()]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfessors = async () => {
    try {
      const response = await api.get('/auth/professors/');
      setProfessors(response.data.results || response.data);
    } catch (error: any) {
      console.error('Error al cargar profesores:', error);
      toast.error('Error al cargar la lista de profesores');
      throw error;
    }
  };

  const loadAccessCodes = async () => {
    try {
      const response = await api.get('/auth/professors/access_codes/');
      setAccessCodes(response.data.results || response.data);
    } catch (error: any) {
      console.error('Error al cargar códigos de acceso:', error);
      // Si el endpoint no existe aún o hay error, simplemente no cargar códigos
      setAccessCodes([]);
    }
  };

  const handleCreateAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('El correo electrónico es requerido');
      return;
    }

    if (!formData.email.endsWith('@udd.cl')) {
      toast.error('El correo debe ser de la universidad (@udd.cl)');
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/auth/professors/create_with_code/', {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });

      // Usar el mailto_link que viene del backend (ya incluye el cuerpo formateado)
      const mailtoLink = response.data.mailto_link;
      
      // Abrir el cliente de correo
      window.location.href = mailtoLink;
      
      toast.success('Código generado. Se abrió tu cliente de correo con el mensaje formateado.');
      
      setShowForm(false);
      setFormData({ email: '', first_name: '', last_name: '' });
      await loadAccessCodes();
    } catch (error: any) {
      console.error('Error al generar código:', error);
      const errorMessage = error.response?.data?.error || 'Error al generar el código de acceso';
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#093c92] via-blue-600 to-[#f757ac]" />
      
      <div className="max-w-6xl mx-auto w-full relative z-10 p-4 sm:p-5 font-sans flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/admin/panel')}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Gestión de Profesores
              </h1>
              <p className="text-sm text-white/85">Administra los profesores con acceso al sistema</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-white text-blue-900 hover:bg-gray-100 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Generar Código</span>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setActiveTab('professors')}
            variant={activeTab === 'professors' ? 'default' : 'outline'}
            className={activeTab === 'professors' ? 'bg-white text-blue-900' : 'bg-white/50 text-white border-white/30'}
          >
            Profesores Registrados
          </Button>
          <Button
            onClick={() => setActiveTab('codes')}
            variant={activeTab === 'codes' ? 'default' : 'outline'}
            className={activeTab === 'codes' ? 'bg-white text-blue-900' : 'bg-white/50 text-white border-white/30'}
          >
            Códigos de Acceso
          </Button>
        </div>

        {/* Formulario de creación */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-blue-900">Agregar Nuevo Profesor</h2>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setFormData({ email: '', first_name: '', last_name: '' });
                }}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateAccessCode} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-sm text-gray-700 mb-2 block">
                    Correo UDD <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nombre.apellido@udd.cl"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                      disabled={creating}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Debe ser un correo @udd.cl</p>
                </div>
                <div>
                  <Label htmlFor="first_name" className="text-sm text-gray-700 mb-2 block">
                    Nombre
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="first_name"
                      type="text"
                      placeholder="Nombre"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="pl-10"
                      disabled={creating}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-sm text-gray-700 mb-2 block">
                    Apellido
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="last_name"
                      type="text"
                      placeholder="Apellido"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="pl-10"
                      disabled={creating}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Generar Código
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ email: '', first_name: '', last_name: '' });
                  }}
                  disabled={creating}
                >
                  Cancelar
                </Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-semibold mb-1">Información:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Se generará automáticamente un código de acceso de 6 dígitos</li>
                      <li>Se enviará un email al profesor con el código de acceso</li>
                      <li>El profesor deberá usar este código para registrarse</li>
                      <li>El correo debe ser de la universidad (@udd.cl)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* Contenido según tab activo */}
        {activeTab === 'professors' ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-2xl flex-1">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Profesores Registrados</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : professors.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay profesores registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nombre</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Correo</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Código de Acceso</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha de Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {professors.map((professor) => (
                      <tr key={professor.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {professor.full_name || professor.user.username}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{professor.user.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                              {professor.access_code || 'Sin código'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {formatDate(professor.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-2xl flex-1">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Códigos de Acceso</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : accessCodes.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay códigos de acceso generados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Correo</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Código</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha de Creación</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha de Uso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessCodes.map((code) => {
                      // Verificar si el profesor ya está registrado
                      const professorRegistered = professors.some(
                        (p) => p.user.email.toLowerCase() === code.email.toLowerCase()
                      );
                      
                      return (
                        <tr key={code.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{code.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Key className="w-4 h-4 text-gray-400" />
                              <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                {code.access_code}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {code.is_used && professorRegistered ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Registrado
                              </span>
                            ) : code.is_used ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Usado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm">
                            {formatDate(code.created_at)}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm">
                            {code.used_at ? formatDate(code.used_at) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

