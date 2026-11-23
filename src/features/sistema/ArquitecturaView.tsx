import { Database, FolderCode, GitBranch, Layers, ShieldCheck } from 'lucide-react';
import { DB_SCHEMA_METADATA } from '../../config/db.config';
import { TEST_ACTOR_ACCOUNTS } from '../../config/roles.config';
import { useInventoryStore } from '../../store';
import { Badge, Card, PageHeader, RefreshButton } from '../../components/ui';

export function ArquitecturaView() {
  const dashboard = useInventoryStore((s) => s.dashboard);
  const loading = useInventoryStore((s) => s.loading);
  const fetchInventoryAll = useInventoryStore((s) => s.fetchInventoryAll);

  const countByTable = new Map(
    (dashboard?.tablasConteo ?? []).map((t) => [t.tabla, t.registros])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="10 / ARQUITECTURA DEL SISTEMA · TRAZABILIDAD UML Y SQLITE"
        title="Base de Datos SQLite y Diagramas UML"
        description="Inspección en vivo de las 10 tablas relacionales en db/sigmat.sqlite, sus archivos dedicados en db/tables/, los 3 actores del Diagrama de Casos de Uso y el flujo BCE."
        actions={<RefreshButton spinning={loading} onClick={() => void fetchInventoryAll()} />}
      />

      {/* Resumen de carpetas solicitadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            idx: 'DIR 01',
            path: 'db/',
            desc: 'config.ts, connection.ts, schema.ts, seed.ts, sigmat.sqlite, tables/ (10 archivos) y controllers/ BCE.',
            dot: '#F2491E',
          },
          {
            idx: 'DIR 02',
            path: 'src/config/',
            desc: 'app.config.ts, theme.config.ts (Claro/Negro), roles.config.ts y db.config.ts.',
            dot: '#CFD4DD',
          },
          {
            idx: 'DIR 03',
            path: 'src/utils/',
            desc: 'apiClient.ts, formatters.ts, validators.ts, exportPdf.ts, exportExcel.ts y cn.ts.',
            dot: '#8CE043',
          },
          {
            idx: 'DIR 04',
            path: 'src/store/',
            desc: '7 stores Zustand: theme, auth, navigation, inventory, service, admin y toast.',
            dot: '#3B82F6',
          },
        ].map((item) => (
          <Card key={item.idx} index={item.idx} dotColor={item.dot} title={item.path}>
            <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
              <FolderCode className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <p className="leading-relaxed">{item.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* 10 tablas SQLite del Diagrama de Clases */}
      <Card
        index="DIAGRAMA DE CLASES · 10 TABLAS SQLITE EN VIVO"
        dotColor="#F2491E"
        title="Entidades, Archivos de Tabla y Registros Reales"
        subtitle="Archivo físico: db/sigmat.sqlite (PRAGMA foreign_keys = ON, modo WAL)"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 px-4">Clase UML / Tabla</th>
                <th className="py-3 px-4">Archivo SQLite</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Columnas & Claves</th>
                <th className="py-3 px-4">Métodos Implementados</th>
                <th className="py-3 px-4 text-right">Filas en Vivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {DB_SCHEMA_METADATA.map((tbl) => (
                <tr key={tbl.tableName} className="hover:bg-[var(--bg-elevated)]/40 align-top">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                      <Database className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span>{tbl.className}</span>
                    </div>
                    <div className="font-mono-tech text-[11px] text-[var(--text-muted)] mt-0.5">
                      {tbl.tableName}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono-tech text-[11px] text-[var(--text-secondary)]">
                    {tbl.fileName}
                  </td>
                  <td className="py-3 px-4">
                    <Badge tone="neutral" pill={false}>
                      {tbl.module}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-mono-tech text-[11px] text-[var(--text-primary)] leading-relaxed">
                      {tbl.columns.join(', ')}
                    </div>
                    {tbl.foreignKeys.length > 0 && (
                      <div className="font-mono-tech text-[10px] text-[var(--accent)] mt-1">
                        FK: {tbl.foreignKeys.join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono-tech text-[11px] text-[var(--text-secondary)] max-w-xs">
                    {tbl.methods.join(', ')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge tone="ok" dot>
                      {countByTable.get(tbl.tableName) ?? 0}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Matriz de Actores (Casos de Uso) y Flujo Robustez */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card
          index="DIAGRAMA DE CASOS DE USO"
          dotColor="#3B82F6"
          title="Actores y Credenciales de Prueba"
        >
          <div className="space-y-3">
            {TEST_ACTOR_ACCOUNTS.map((acc) => (
              <div
                key={acc.email}
                className="p-3.5 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-sm text-[var(--text-primary)]">
                    <ShieldCheck className="w-4 h-4" style={{ color: acc.dotColor }} />
                    <span>{acc.rol}</span>
                  </div>
                  <span className="font-mono-tech text-[11px] text-[var(--text-muted)]">
                    {acc.email} / {acc.password}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {acc.casosDeUso.map((cu) => (
                    <Badge key={cu} tone="neutral" pill={false}>
                      {cu}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          index="DIAGRAMA DE ROBUSTEZ (BCE)"
          dotColor="#8CE043"
          title="Flujo Transaccional: Asignar Repuesto a Orden"
        >
          <div className="space-y-2.5 text-xs">
            {[
              {
                layer: 'BOUNDARY',
                name: 'Interfaz Asignar Repuesto',
                detail: 'src/features/servicio/AsignarRepuestoView.tsx',
              },
              {
                layer: 'CONTROL',
                name: 'ControladorAsignacionRepuesto',
                detail: 'db/controllers/asignacionRepuesto.controller.ts (Transacción SQLite)',
              },
              {
                layer: 'ENTITY 1-4',
                name: 'OrdenTrabajo → Producto → DetalleOrdenRepuesto → MovimientoInventario',
                detail: 'Valida stock_actual >= cantidad, inserta detalle, registra SALIDA y descuenta stock.',
              },
              {
                layer: 'CONTROL 2',
                name: 'ControladorAlertaStock → AlertaStock',
                detail: 'Evalúa stock_actual <= nivel_minimo y genera alerta PENDIENTE automáticamente.',
              },
            ].map((item, idx) => (
              <div
                key={item.name}
                className="p-3 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-[3px] bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent)] font-mono-tech font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tech text-[10px] text-[var(--accent)] uppercase">
                      {item.layer}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">{item.name}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
            <div className="pt-2 flex items-center gap-4 text-[11px] font-mono-tech text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--accent)]" /> Atomicidad SQLite
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[var(--status-ok)]" /> Sincronización Zustand
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
