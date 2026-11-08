"use client";

import React from "react";
import { CheckCircle2, Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface AuditDashboardProps {
  auditData: any;
  onReset: () => void;
}

export default function AuditDashboard({ auditData, onReset }: AuditDashboardProps) {
  if (!auditData) return null;

  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById("audit-report-container");
    if (!reportElement) return;

    // 1. Ek temporary clean DOM element banayein taake html2canvas ko lab/lch color errors na aayein
    const printView = document.createElement("div");
    printView.style.width = "800px";
    printView.style.padding = "40px";
    printView.style.backgroundColor = "#ffffff";
    printView.style.color = "#000000";
    printView.style.fontFamily = "Arial, sans-serif";
    printView.innerHTML = reportElement.innerHTML;

    // 2. Element styles ko normalize karein
    const allElements = printView.querySelectorAll("*");
    allElements.forEach((el) => {
      const hEl = el as HTMLElement;
      hEl.style.backgroundColor = ""; 
      hEl.style.color = "";
      hEl.style.borderColor = "#cccccc";
    });

    document.body.appendChild(printView);

    try {
      const canvas = await html2canvas(printView, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      const cleanDomain = auditData.url ? auditData.url.replace(/[^a-zA-Z0-9]/g, "_") : "sitepulse_report";
      pdf.save(`${cleanDomain}_report.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("PDF export mein masla aaya hai. Baraye meharbani console check karein.");
    } finally {
      document.body.removeChild(printView);
    }
  };

  return (
    <div id="audit-report-container" className="space-y-8 animate-in fade-in duration-500 bg-[#05070f] p-6 text-slate-100">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">SITEPULSE ENTERPRISE REPORT</span>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Technical SEO & Diagnostic Report
          </h2>
          <p className="text-xs text-slate-400">
            Target Domain: <span className="text-cyan-400">{auditData.url}</span> | Scope: {auditData.scan_mode}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-cyan-500/25 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-500/50 text-xs font-bold rounded-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3 h-3" /> Export PDF
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            ← Reset
          </button>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#0e131f]/80 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-mono">Health Score</div>
          <div className="text-3xl font-extrabold text-white mt-1">{auditData.health_score}<span className="text-sm font-normal text-slate-500"> /100</span></div>
          <div className="text-[11px] text-rose-400 mt-1">{auditData.total_flaws_count} Issue(s)</div>
        </div>

        <div className="bg-[#0e131f]/80 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-mono">Google Authority</div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-1">{auditData.domain_authority}<span className="text-sm font-normal text-slate-500"> /100</span></div>
          <div className="text-[10px] text-cyan-300/80 truncate mt-1">{auditData.trust_label}</div>
        </div>

        <div className="bg-[#0e131f]/80 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-mono">Discovered Pages</div>
          <div className="text-3xl font-extrabold text-white mt-1">{auditData.total_discovered_pages}</div>
          <div className="text-[11px] text-emerald-400 mt-1">{auditData.total_pages_scanned} Pages Crawled</div>
        </div>

        <div className="bg-[#0e131f]/80 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-mono">Avg Latency</div>
          <div className="text-3xl font-extrabold text-white mt-1">{auditData.rt_sec}<span className="text-sm font-normal text-slate-500"> s</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Status: {auditData.status}</div>
        </div>

        <div className="bg-[#0e131f]/80 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-mono">Total Images</div>
          <div className="text-3xl font-extrabold text-white mt-1">{auditData.total_images_scanned}</div>
          <div className="text-[11px] text-amber-400 mt-1">{auditData.no_alt_images_scanned} Missing Alt</div>
        </div>

        <div className="bg-[#0e131f]/80 p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-mono">Links Scanned</div>
          <div className="text-3xl font-extrabold text-white mt-1">{auditData.total_links_found}</div>
          <div className="text-[11px] text-rose-400 mt-1">{auditData.unsafe_links.length} Unsafe Links</div>
        </div>
      </div>

      {/* Keyword Engine & Spam Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0e131f]/80 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="text-xs font-mono text-slate-400 uppercase">Keyword Expression Engine</div>
          <h3 className="text-sm font-bold text-white">High-Traffic Organic Keywords Extracted</h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {auditData.keywords_extracted.map(([kw, count]: [string, number], idx: number) => (
              <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                {kw} <span className="bg-cyan-500/20 text-cyan-400 px-1 rounded text-[10px]">{count}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-[#0e131f]/80 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="text-xs font-mono text-slate-400 uppercase">Outbound Spam & Untrusted Backlinks</div>
          <h3 className="text-sm font-bold text-white">Risk & Affiliate Link Audit</h3>
          <div className="space-y-2 pt-1 max-h-36 overflow-y-auto pr-1">
            {auditData.unsafe_links.length > 0 ? (
              auditData.unsafe_links.map((link: string, idx: number) => (
                <div key={idx} className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono truncate">
                  ⚠ {link}
                </div>
              ))
            ) : (
              <div className="text-xs text-emerald-400 flex items-center gap-2 pt-2">
                <CheckCircle2 className="w-4 h-4" /> Zero untrusted outbound or affiliate links detected.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Executive Report Section */}
      <div className="bg-[#0e131f]/90 p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
          <span>Diagnostic Executive Report</span>
        </h3>
        <div className="prose prose-invert max-w-none text-xs leading-relaxed font-sans text-slate-300 whitespace-pre-line">
          {auditData.report}
        </div>
      </div>
    </div>
  );
}