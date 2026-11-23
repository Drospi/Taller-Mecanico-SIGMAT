import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReporteGeneradoResponse } from '../types/models';
import { formatDateTime } from './formatters';

/**
 * Implementación del método Reporte.exportarPDF() del Diagrama de Clases.
 * Genera un documento PDF con identidad industrial SIGMAT (Obsidiana + Naranja Señal #F2491E).
 */
export function exportarReportePDF(payload: ReporteGeneradoResponse): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Encabezado industrial oscuro
  doc.setFillColor(14, 16, 20);
  doc.rect(0, 0, pageWidth, 86, 'F');

  // Franja lateral Naranja Señal (#F2491E)
  doc.setFillColor(242, 73, 30);
  doc.rect(0, 0, 10, 86, 'F');
  doc.rect(0, 84, pageWidth, 3, 'F');

  doc.setTextColor(247, 248, 250);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SIGMAT // TALLER MECÁNICO', 28, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(242, 73, 30);
  doc.text(payload.titulo.toUpperCase(), 28, 54);

  doc.setFontSize(9);
  doc.setTextColor(170, 175, 186);
  doc.text(
    `Reporte #${payload.reporte.id_reporte}  |  Generado: ${formatDateTime(payload.reporte.fecha_generacion)}  |  Autor: ${payload.reporte.usuario_nombre ?? 'Sistema'}`,
    28,
    72
  );

  // Tarjetas de resumen
  let startY = 104;
  if (payload.resumen.length > 0) {
    const boxWidth = (pageWidth - 56 - (payload.resumen.length - 1) * 12) / payload.resumen.length;
    payload.resumen.forEach((item, idx) => {
      const x = 28 + idx * (boxWidth + 12);
      doc.setFillColor(244, 244, 242);
      doc.setDrawColor(216, 219, 224);
      doc.roundedRect(x, startY, boxWidth, 42, 3, 3, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 106, 118);
      doc.text(item.label.toUpperCase(), x + 12, startY + 16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 17, 21);
      doc.text(item.value, x + 12, startY + 33);
    });
    startY += 56;
  }

  // Tabla de datos
  const bodyRows = payload.filas.map((fila) =>
    payload.columnas.map((col) => String(fila[col] ?? ''))
  );

  autoTable(doc, {
    startY,
    head: [payload.columnas],
    body: bodyRows,
    margin: { left: 28, right: 28 },
    styles: {
      fontSize: 8.5,
      cellPadding: 6,
      textColor: [24, 27, 34],
      lineColor: [224, 226, 230],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [20, 22, 27],
      textColor: [247, 248, 250],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 248, 247],
    },
  });

  const safeType = payload.reporte.tipo_reporte.toLowerCase();
  doc.save(`SIGMAT_${safeType}_R${payload.reporte.id_reporte}.pdf`);
}
