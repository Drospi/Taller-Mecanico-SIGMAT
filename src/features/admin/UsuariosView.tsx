import { useState, type FormEvent } from 'react';
import { KeyRound, Shield, UserCheck, UserX } from 'lucide-react';
import { useAdminStore } from '../../store';
import type { Usuario } from '../../types/models';
import {
  Badge,
  BaseButton,
  CancelButton,
  Card,
  CreateButton,
  EditButton,
  FormInput,
  FormSelect,
  Modal,
  PageHeader,
  RefreshButton,
  SaveButton,
} from '../../components/ui';

export function UsuariosView() {
  const roles = useAdminStore((s) => s.roles);
  const usuarios = useAdminStore((s) => s.usuarios);
  const loading = useAdminStore((s) => s.loading);
  const fetchAdminAll = useAdminStore((s) => s.fetchAdminAll);
  const createUsuario = useAdminStore((s) => s.createUsuario);
  const updateUsuario = useAdminStore((s) => s.updateUsuario);
  const toggleEstadoUsuario = useAdminStore((s) => s.toggleEstadoUsuario);
  const resetPasswordUsuario = useAdminStore((s) => s.resetPasswordUsuario);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    id_rol: '2',
    estado: true,
  });
  const [saving, setSaving] = useState(false);

  const [passwordModalUser, setPasswordModalUser] = useState<Usuario | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      id_rol: roles[1] ? String(roles[1].id_rol) : '2',
      estado: true,
    });
    setModalOpen(true);
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setForm({
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      password: '',
      id_rol: String(u.id_rol),
      estado: u.estado,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = editing
      ? await updateUsuario(editing.id_usuario, {
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          id_rol: Number(form.id_rol),
          estado: form.estado,
        })
      : await createUsuario({
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          password: form.password,
          id_rol: Number(form.id_rol),
          estado: form.estado,
        });
    setSaving(false);
    if (ok) setModalOpen(false);
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    setSaving(true);
    const ok = await resetPasswordUsuario(passwordModalUser.id_usuario, newPassword);
    setSaving(false);
    if (ok) {
      setPasswordModalUser(null);
      setNewPassword('');
    }
  };

  const roleTone = (nombreRol?: string): 'info' | 'accent' | 'ok' | 'neutral' => {
    if (nombreRol === 'Administrador') return 'info';
    if (nombreRol === 'Mecánico') return 'accent';
    if (nombreRol === 'Encargado de Almacén') return 'ok';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="08 / CU: GESTIONAR USUARIOS · TABLAS ROLES Y USUARIOS"
        title="Gestión de Usuarios y Roles"
        description="Administra los actores del taller (Administrador, Mecánico, Encargado de Almacén), su estado activo y sus credenciales seguras en SQLite."
        actions={
          <>
            <RefreshButton spinning={loading} onClick={() => void fetchAdminAll()} />
            <CreateButton size="sm" label="Registrar Usuario" onClick={openCreate} />
          </>
        }
      />

      {/* Resumen de Roles (Rol.listarUsuarios) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((r, idx) => (
          <Card
            key={r.id_rol}
            index={`ROL ${String(idx + 1).padStart(2, '0')}`}
            dotColor={idx === 0 ? '#3B82F6' : idx === 1 ? '#F2491E' : '#8CE043'}
            title={r.nombre_rol}
            headerRight={
              <Badge tone={roleTone(r.nombre_rol)} dot>
                {r.total_usuarios ?? 0} USUARIOS
              </Badge>
            }
          >
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Shield className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>
                {r.nombre_rol === 'Administrador' &&
                  'Gestionar Usuarios, Gestionar Categorías y Generar Reportes.'}
                {r.nombre_rol === 'Mecánico' &&
                  'Órdenes de Trabajo, Asignar Repuestos, Historial y Consultar Stock.'}
                {r.nombre_rol === 'Encargado de Almacén' &&
                  'CRUD Productos, Entradas/Salidas de Inventario y Alertas de Stock.'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabla de Usuarios */}
      <Card
        index={`PERSONAL REGISTRADO · ${usuarios.length}`}
        title="Cuentas de Acceso en SQLite"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Nombre completo</th>
                <th className="py-3 px-4">Correo electrónico</th>
                <th className="py-3 px-4">Rol asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
              {usuarios.map((u) => (
                <tr key={u.id_usuario} className="hover:bg-[var(--bg-elevated)]/40">
                  <td className="py-3.5 px-4 font-mono-tech text-xs text-[var(--text-muted)]">
                    USR-#{u.id_usuario}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">
                    {u.nombre} {u.apellido}
                  </td>
                  <td className="py-3.5 px-4 font-mono-tech text-xs text-[var(--text-secondary)]">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge tone={roleTone(u.nombre_rol)} dot>
                      {u.nombre_rol}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge tone={u.estado ? 'ok' : 'danger'} dot>
                      {u.estado ? 'ACTIVO' : 'INACTIVO'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <EditButton iconOnly onClick={() => openEdit(u)} />
                      <BaseButton
                        size="xs"
                        variant="secondary"
                        title="Cambiar contraseña"
                        leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setPasswordModalUser(u);
                          setNewPassword('');
                        }}
                      >
                        Clave
                      </BaseButton>
                      <BaseButton
                        size="xs"
                        variant={u.estado ? 'danger' : 'success'}
                        leftIcon={
                          u.estado ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )
                        }
                        onClick={() => void toggleEstadoUsuario(u.id_usuario, !u.estado)}
                      >
                        {u.estado ? 'Desactivar' : 'Activar'}
                      </BaseButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Crear / Editar Usuario */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow={editing ? 'USUARIO.EDITAR()' : 'USUARIO.REGISTRAR()'}
        title={editing ? `Editar: ${editing.nombre} ${editing.apellido}` : 'Registrar Nuevo Usuario'}
        footer={
          <>
            <CancelButton onClick={() => setModalOpen(false)} disabled={saving} />
            <SaveButton form="user-form" loading={saving} />
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Nombre *"
              required
              maxLength={60}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <FormInput
              label="Apellido *"
              required
              maxLength={60}
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            />
          </div>

          <FormInput
            label="Correo electrónico *"
            type="email"
            required
            maxLength={80}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          {!editing && (
            <FormInput
              label="Contraseña inicial *"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              hint="Se almacenará con hash scrypt en la columna password_hash."
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Rol asignado *"
              value={form.id_rol}
              onChange={(e) => setForm({ ...form, id_rol: e.target.value })}
              options={roles.map((r) => ({ value: String(r.id_rol), label: r.nombre_rol }))}
            />
            <FormSelect
              label="Estado de cuenta *"
              value={form.estado ? '1' : '0'}
              onChange={(e) => setForm({ ...form, estado: e.target.value === '1' })}
              options={[
                { value: '1', label: 'Activo (puede iniciar sesión)' },
                { value: '0', label: 'Inactivo (acceso bloqueado)' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* Modal Cambiar Contraseña */}
      <Modal
        open={Boolean(passwordModalUser)}
        onClose={() => setPasswordModalUser(null)}
        eyebrow="USUARIO.CAMBIARPASSWORD(NUEVA)"
        title={`Restablecer Clave — ${passwordModalUser?.nombre ?? ''} ${passwordModalUser?.apellido ?? ''}`}
        size="sm"
        footer={
          <>
            <CancelButton onClick={() => setPasswordModalUser(null)} disabled={saving} />
            <SaveButton form="pass-form" loading={saving} label="Actualizar Contraseña" />
          </>
        }
      >
        <form id="pass-form" onSubmit={handlePasswordReset} className="space-y-4">
          <FormInput
            label="Nueva contraseña *"
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </form>
      </Modal>
    </div>
  );
}
