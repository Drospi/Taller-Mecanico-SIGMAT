import { getDatabase } from '../connection.ts';
import { hashPassword, verifyPassword } from '../password.ts';

export interface UsuarioRow {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: boolean;
  id_rol: number;
  nombre_rol: string;
}

interface UsuarioRawRow {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  password_hash?: string;
  estado: number;
  id_rol: number;
  nombre_rol: string;
}

function mapUsuario(row: UsuarioRawRow): UsuarioRow {
  return {
    id_usuario: Number(row.id_usuario),
    nombre: String(row.nombre),
    apellido: String(row.apellido),
    email: String(row.email),
    estado: Boolean(row.estado),
    id_rol: Number(row.id_rol),
    nombre_rol: String(row.nombre_rol),
  };
}

export const UsuarioTable = {
  listar(): UsuarioRow[] {
    const db = getDatabase();
    const rows = db
      .prepare(`
        SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.estado, u.id_rol, r.nombre_rol
        FROM usuarios u
        INNER JOIN roles r ON r.id_rol = u.id_rol
        ORDER BY u.id_usuario ASC
      `)
      .all() as unknown as UsuarioRawRow[];
    return rows.map(mapUsuario);
  },

  obtenerPorId(id_usuario: number): UsuarioRow | null {
    const db = getDatabase();
    const row = db
      .prepare(`
        SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.estado, u.id_rol, r.nombre_rol
        FROM usuarios u
        INNER JOIN roles r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = ?
      `)
      .get(id_usuario) as unknown as UsuarioRawRow | undefined;
    return row ? mapUsuario(row) : null;
  },

  iniciarSesion(email: string, password: string): UsuarioRow {
    const db = getDatabase();
    const normalizedEmail = email.trim().toLowerCase();
    const row = db
      .prepare(`
        SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.password_hash, u.estado, u.id_rol, r.nombre_rol
        FROM usuarios u
        INNER JOIN roles r ON r.id_rol = u.id_rol
        WHERE LOWER(u.email) = ?
      `)
      .get(normalizedEmail) as unknown as UsuarioRawRow | undefined;

    if (!row || !row.password_hash || !verifyPassword(password, row.password_hash)) {
      throw new Error('Credenciales inválidas. Verifique correo electrónico y contraseña.');
    }
    if (!row.estado) {
      throw new Error('La cuenta de usuario se encuentra inactiva. Contacte al Administrador.');
    }
    return mapUsuario(row);
  },

  cerrarSesion(): { ok: boolean } {
    return { ok: true };
  },

  registrar(data: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    id_rol: number;
    estado?: boolean;
  }): UsuarioRow {
    const db = getDatabase();
    const email = data.email.trim().toLowerCase();
    const existing = db.prepare('SELECT id_usuario FROM usuarios WHERE LOWER(email) = ?').get(email);
    if (existing) {
      throw new Error('Ya existe un usuario registrado con ese correo electrónico.');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }
    const info = db
      .prepare(`
        INSERT INTO usuarios (nombre, apellido, email, password_hash, estado, id_rol)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        data.nombre.trim(),
        data.apellido.trim(),
        email,
        hashPassword(data.password),
        data.estado === false ? 0 : 1,
        data.id_rol
      );

    const created = this.obtenerPorId(Number(info.lastInsertRowid));
    if (!created) throw new Error('Error al registrar el usuario.');
    return created;
  },

  editar(
    id_usuario: number,
    data: {
      nombre: string;
      apellido: string;
      email: string;
      id_rol: number;
      estado: boolean;
    }
  ): UsuarioRow {
    const db = getDatabase();
    const email = data.email.trim().toLowerCase();
    const conflict = db
      .prepare('SELECT id_usuario FROM usuarios WHERE LOWER(email) = ? AND id_usuario != ?')
      .get(email, id_usuario);
    if (conflict) {
      throw new Error('Otro usuario ya utiliza ese correo electrónico.');
    }
    db.prepare(`
      UPDATE usuarios
      SET nombre = ?, apellido = ?, email = ?, id_rol = ?, estado = ?
      WHERE id_usuario = ?
    `).run(
      data.nombre.trim(),
      data.apellido.trim(),
      email,
      data.id_rol,
      data.estado ? 1 : 0,
      id_usuario
    );
    const updated = this.obtenerPorId(id_usuario);
    if (!updated) throw new Error('Usuario no encontrado.');
    return updated;
  },

  cambiarEstado(id_usuario: number, estado: boolean): UsuarioRow {
    const db = getDatabase();
    db.prepare('UPDATE usuarios SET estado = ? WHERE id_usuario = ?').run(estado ? 1 : 0, id_usuario);
    const updated = this.obtenerPorId(id_usuario);
    if (!updated) throw new Error('Usuario no encontrado.');
    return updated;
  },

  cambiarPassword(id_usuario: number, nuevaPassword: string): { ok: boolean } {
    const db = getDatabase();
    if (!nuevaPassword || nuevaPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    const res = db
      .prepare('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?')
      .run(hashPassword(nuevaPassword), id_usuario);
    if (Number(res.changes) === 0) throw new Error('Usuario no encontrado.');
    return { ok: true };
  },
};
