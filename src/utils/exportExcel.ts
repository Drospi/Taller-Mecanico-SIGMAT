import writeXlsxFile, { type Row } from 'write-excel-file/browser';
import type { ReporteGeneradoResponse } from '../types/models';

/**
 * Implementación del método Reporte.exportarExcel() del Diagrama de Clases.
 * Exporta un archivo .xlsx real compatible con Microsoft Excel y LibreOffice Calc.
 */
export async function exportarReporteExcel(payload: ReporteGeneradoResponse): Promise<void> {
  const headerRow: Row = payload.columnas.map((col) => ({
    value: col,
    type: String,
    fontWeight: 'bold',
    backgroundColor: '#14161B',
    color: '#F7F8FA',
  }));

  const dataRows: Row[] = payload.filas.map((fila) =>
    payload.columnas.map((col) => {
      const raw = fila[col];
      if (typeof raw === 'number') {
        return { value: raw, type: Number };
      }
      return { value: String(raw ?? ''), type: String };
    })
  );

  const columns = payload.columnas.map((col) => ({
    width: Math.max(col.length + 6, 16),
  }));

  const safeType = payload.reporte.tipo_reporte.toLowerCase();
  const fileName = `SIGMAT_${safeType}_R${payload.reporte.id_reporte}.xlsx`;

  await writeXlsxFile([headerRow, ...dataRows], {
    columns,
    sheet: 'Reporte SIGMAT',
  }).toFile(fileName);
}
