import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScanResult, SecurityFinding } from '../types/security';

export function generateSecurityPdfReport(scan: ScanResult, filename?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper colors
  const darkNavy = [15, 23, 42]; // #0f172a
  const cyanAccent = [6, 182, 212]; // #06b6d4
  const crimson = [239, 68, 68]; // #ef4444
  const amber = [245, 158, 11]; // #f59e0b
  const emerald = [16, 185, 129]; // #10b981
  const slateMuted = [100, 116, 139]; // #64748b

  // --- HEADER SECTION ---
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Decorative cyan accent line
  doc.setFillColor(cyanAccent[0], cyanAccent[1], cyanAccent[2]);
  doc.rect(0, 40, pageWidth, 2, 'F');

  // Brand title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('CLOUDGUARD', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(cyanAccent[0], cyanAccent[1], cyanAccent[2]);
  doc.text('Intelligent Cloud Security Assessment Platform', 14, 25);

  // Report metadata on right
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  const scanDate = new Date(scan.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated: ${scanDate}`, pageWidth - 14, 16, { align: 'right' });
  doc.text(`Scan ID: ${scan.id}`, pageWidth - 14, 22, { align: 'right' });
  doc.text(`Assessment Target: ${scan.name}`, pageWidth - 14, 28, { align: 'right' });

  // --- EXECUTIVE SUMMARY SECTION ---
  let currentY = 52;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('Executive Posture Summary', 14, currentY);

  currentY += 8;

  // 4 Metric Summary Boxes
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 24;

  const metrics = [
    { label: 'Security Score', value: `${scan.score}/100`, color: scan.score >= 80 ? emerald : scan.score >= 60 ? amber : crimson },
    { label: 'Resources Scanned', value: `${scan.totalResources}`, color: cyanAccent },
    { label: 'Critical Findings', value: `${scan.criticalFindings}`, color: crimson },
    { label: 'High Findings', value: `${scan.highFindings}`, color: amber }
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'FD');

    // Colored left border strip
    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.rect(x, currentY, 2.5, boxHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, x + 6, currentY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(m.label, x + 6, currentY + 18);
  });

  currentY += boxHeight + 10;

  // Disclaimer text
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(185, 28, 28);
  const disclaimerText = doc.splitTextToSize(
    "Relative Rule-Based Security Indicator: This security evaluation is calculated using deterministic CIS/NIST baselines across IAM, Storage, Network, Encryption, and Logging. AI-assisted remediation suggestions are informational.",
    pageWidth - 36
  );
  doc.text(disclaimerText, 18, currentY + 5.5);

  currentY += 20;

  // --- SECURITY CATEGORIES BREAKDOWN TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('Security Categories Assessment', 14, currentY);

  currentY += 4;

  const categories = ['IAM', 'STORAGE', 'NETWORK', 'ENCRYPTION', 'LOGGING'];
  const categoryRows = categories.map(cat => {
    const catFindings = scan.findings.filter(f => f.category === cat);
    const crit = catFindings.filter(f => f.severity === 'CRITICAL').length;
    const high = catFindings.filter(f => f.severity === 'HIGH').length;
    const med = catFindings.filter(f => f.severity === 'MEDIUM').length;
    const low = catFindings.filter(f => f.severity === 'LOW').length;
    const status = crit > 0 ? 'CRITICAL RISK' : high > 0 ? 'NEEDS ATTENTION' : med > 0 ? 'MODERATE RISK' : 'HEALTHY';
    return [cat, `${catFindings.length}`, `${crit}`, `${high}`, `${med}`, `${low}`, status];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Category', 'Total Findings', 'Critical', 'High', 'Medium', 'Low', 'Status']],
    body: categoryRows,
    theme: 'grid',
    headStyles: {
      fillColor: darkNavy as any,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      6: { fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.column.index === 6 && data.section === 'body') {
        const val = data.cell.raw;
        if (val === 'CRITICAL RISK') data.cell.styles.textColor = crimson as any;
        else if (val === 'NEEDS ATTENTION') data.cell.styles.textColor = amber as any;
        else if (val === 'HEALTHY') data.cell.styles.textColor = emerald as any;
      }
    }
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 12;

  // --- DETAILED FINDINGS SECTION ---
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('Detailed Security Findings & Remediation Steps', 14, currentY);

  currentY += 6;

  const findingRows = scan.findings.map((f: SecurityFinding, idx) => {
    return [
      `${idx + 1}. [${f.severity}] ${f.title}`,
      f.category,
      f.resourceName,
      f.evidence,
      f.impact,
      f.remediationSteps.slice(0, 3).join('\n• ')
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Finding & Severity', 'Category', 'Resource', 'Evidence', 'Impact', 'Remediation Steps']],
    body: findingRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59] as any,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 20 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28, fontStyle: 'italic' },
      4: { cellWidth: 32 },
      5: { cellWidth: 36 }
    },
    didParseCell: (data) => {
      if (data.column.index === 0 && data.section === 'body') {
        const text = String(data.cell.raw);
        if (text.includes('[CRITICAL]')) data.cell.styles.textColor = crimson as any;
        else if (text.includes('[HIGH]')) data.cell.styles.textColor = amber as any;
      }
    }
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      `CloudGuard Audit Report | Scan: ${scan.id} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Trigger download
  const defaultName = filename || `CloudGuard-Security-Report-${scan.id}.pdf`;
  doc.save(defaultName);
}
