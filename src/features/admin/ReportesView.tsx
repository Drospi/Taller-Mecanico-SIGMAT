import { useState, type FormEvent } from 'react';
import { FileBarChart2 } from 'lucide-react';
import { useAdminStore, useInventoryStore } from '../../store';
import type { TipoReporte } from '../../types/models';
import { exportarReporteExcel } from '../../utils/exportExcel';
import { exportarReportePDF } from '../../utils/exportPdf';
import { formatDateTime } from '../../utils/formatters';
import {
  Badge,
  Card,
  EmptyState,
  ExportExcelButton,
  ExportPdfButton,
  FormSelect,
  PageHeader,
  PrimaryActionButton,
  RefreshButton,
  ViewDetailButton,
} from '../../components/ui';

const REPORT_TYPES: Array<{ value: TipoReporte; label: string; desc: string }> = [
  {
    value: 'INVENTARIO_GENERAL',
    label: 'Inventario General y Valorización',
    desc: 'Existencias actuales, niveles mínimos, precios unitarios y valorización total.',
  },
  {
    value: 'MOVIMIENTOS_INVENTARIO',
    label: 'Kardex — Movimientos de Inventario',
    desc: 'Detalle completo de entradas de compra, salidas por órdenes y responsables.',
  },
  {
    value: 'ORDENES_TRABAJO',
    label: 'Órdenes de Trabajo — Servicio Técnico',
    desc: 'Resumen de ingresos, vehículos, mecánicos, estados y total en repuestos.',
  },
  {
    value: 'ALERTAS_STOCK',
    label: 'Alertas de Stock Mínimo',
    desc: 'Productos por debajo del umbral de reposición, déficit y estado de atención.',
  },
];

export function ReportesView() {
  const reportes = useAdminStore((s) => s.reportes);
  const reporteActivo = useAdminStore((s) => s.reporteActivo);
  const loading = useAdminStore((s) => s.loading);
  const fetchAdminAll = useAdminStore((s) => s.fetchAdminAll);
  const generarReporte = useAdminStore((s) => s.generarReporte);
  const cargarReporteHistorico = useAdminStore((s) => s.cargarReporteHistorico);
  const categorias = useInventoryStore((s) => s.categorias);

  const [tipo, setTipo] = useState<TipoReporte>('INVENTARIO_GENERAL');
  const [filtroSecundario, setFiltroSecundario] = useState('TODOS');
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    const parametros: Record<string, unknown> = {};
    if (tipo === 'INVENTARIO_GENERAL') {
      if (filtroSecundario === 'BAJO') parametros.soloStockBajo = true;
      else if (filtroSecundario !== 'TODOS') parametros.id_categoria = Number(filtroSecundario);
    } else if (tipo === 'MOVIMIENTOS_INVENTARIO') {
      parametros.tipo = filtroSecundario;
    } else if (tipo === 'ORDENES_TRABAJO' || tipo === 'ALERTAS_STOCK') {
      parametros.estado = filtroSecundario;
    }

    await generarReporte(tipo, parametros);
  };

  const handleExportExcel = async () => {
    if (!reporteActivo) return;
    setExportingExcel(true);
    try {
      await exportarReporteExcel(reporteActivo);
    } finally {
      setExportingExcel(false);
    }
  };

  const secondaryOptions = () => {
    if (tipo === 'INVENTARIO_GENERAL') {
      return [
        { value: 'TODOS', label: 'Todo el catálogo' },
        { value: 'BAJO', label: 'Solo productos con stock bajo' },
        ...categorias.map((c) => ({ value: String(c.id_categoria), label: `Categoría: ${c.nombre}` })),
      ];
    }
    if (tipo === 'MOVIMIENTOS_INVENTARIO') {
      return [
        { value: 'TODOS', label: 'Entradas y Salidas' },
        { value: 'ENTRADA', label: 'Solo Entradas' },
        { value: 'SALIDA', label: 'Solo Salidas' },
      ];
    }
    if (tipo === 'ORDENES_TRABAJO') {
      return [
        { value: 'TODOS', label: 'Todos los estados' },
        { value: 'ABIERTA', label: 'Solo Abiertas' },
        { value: 'EN_PROCESO', label: 'Solo En Proceso' },
        { value: 'CERRADA', label: 'Solo Cerradas' },
      ];
    }
    return [
      { value: 'TODOS', label: 'Pendientes y Resueltas' },
      { value: 'PENDIENTE', label: 'Solo Pendientes' },
      { value: 'RESUELTA', label: 'Solo Resueltas' },
    ];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="09 / CU: GENERAR REPORTES · TABLA REPORTES"
        title="Centro de Reportes PDF y Excel"
        description="Genera reportes auditables persistidos en SQLite y expórtalos con formato profesional usando Reporte.exportarPDF() y Reporte.exportarExcel()."
        actions={<RefreshButton spinning={loading} onClick={() => void fetchAdminAll()} />}
      />

      {/* Generador */}
      <Card
        index="REPORTE.GENERAR()"
        dotColor="#F2491E"
        title="Configurar y Generar Nuevo Reporte"
      >
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <FormSelect
              label="Tipo de reporte *"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as TipoReporte);
                setFiltroSecundario('TODOS');
              }}
              options={REPORT_TYPES.map((rt) => ({ value: rt.value, label: rt.label }))}
            />
          </div>

          <div className="md:col-span-4">
            <FormSelect
              label="Parámetro de filtrado"
              value={filtroSecundario}
              onChange={(e) => setFiltroSecundario(e.target.value)}
              options={secondaryOptions()}
            />
          </div>

          <div className="md:col-span-3">
            <PrimaryActionButton
              type="submit"
              label="Generar Reporte"
              loading={loading}
              fullWidth
            />
          </div>
        </form>
      </Card>

      {/* Vista previa del reporte activo + botones PDF / Excel */}
      {reporteActivo && (
        <Card
          index={`REPORTE #${reporteActivo.reporte.id_reporte} · ${formatDateTime(reporteActivo.reporte.fecha_generacion)}`}
          dotColor="#8CE043"
          title={reporteActivo.titulo}
          subtitle={`Generado por ${reporteActivo.reporte.usuario_nombre ?? 'Usuario'} · Parámetros: ${reporteActivo.reporte.parametros}`}
          headerRight={
            <div className="flex flex-wrap items-center gap-2">
              <ExportPdfButton
                size="sm"
                onClick={() => exportarReportePDF(reporteActivo)}
              />
              <ExportExcelButton
                size="sm"
                loading={exportingExcel}
                onClick={() => void handleExportExcel()}
              />
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {reporteActivo.resumen.map((item) => (
              <div
                key={item.label}
                className="p-3.5 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
              >
                <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {item.label}
                </div>
                <div className="font-display text-xl font-bold text-[var(--text-primary)] mt-1">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {reporteActivo.filas.length === 0 ? (
            <EmptyState
              title="Reporte sin registros"
              description="No existen filas que cumplan los parámetros seleccionados."
            />
          ) : (
            <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-[4px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] font-mono-tech text-[10px] uppercase text-[var(--text-muted)]">
                    {reporteActivo.columnas.map((col) => (
                      <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {reporteActivo.filas.map((fila, i) => (
                    <tr key={i} className="hover:bg-[var(--bg-elevated)]/40">
                      {reporteActivo.columnas.map((col) => (
                        <td key={col} className="py-2.5 px-3 text-[var(--text-primary)] whitespace-nowrap">
                          {String(fila[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Historial de Reportes persistidos en SQLite */}
      <Card
        index={`HISTORIAL SQLITE · ${reportes.length} REPORTES`}
        title="Reportes Generados Anteriormente"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Tipo Reporte</th>
                <th className="py-3 px-4">Fecha Generación</th>
                <th className="py-3 px-4">Parámetros</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {reportes.map((r) => (
                <tr key={r.id_reporte} className="hover:bg-[var(--bg-elevated)]/40">
                  <td className="py-3 px-4 font-mono-tech text-[var(--text-muted)]">
                    REP-#{r.id_reporte}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileBarChart2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <Badge tone="accent" pill={false}>
                        {r.tipo_reporte}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono-tech text-[var(--text-secondary)]">
                    {formatDateTime(r.fecha_generacion)}
                  </td>
                  <td className="py-3 px-4 font-mono-tech text-[var(--text-muted)] max-w-xs truncate">
                    {r.parametros}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">{r.usuario_nombre}</td>
                  <td className="py-3 px-4 text-right">
                    <ViewDetailButton
                      label="Abrir y exportar"
                      onClick={() => void cargarReporteHistorico(r.id_reporte)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
