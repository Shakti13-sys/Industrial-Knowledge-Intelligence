import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, TrendingUp, Boxes, ShieldAlert,
  FileText, AlertTriangle, Cpu, Layers, Factory, MapPin, ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge, RiskBadge } from '@/components/shared/badges';
import { useData } from '@/lib/data-context';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

const defaultIngestionTrend = [
  { month: 'W1', documents: 12 },
  { month: 'W2', documents: 18 },
  { month: 'W3', documents: 25 },
  { month: 'W4', documents: 32 },
  { month: 'W5', documents: 28 },
  { month: 'W6', documents: 40 },
  { month: 'W7', documents: 45 },
  { month: 'W8', documents: 52 },
  { month: 'W9', documents: 60 },
  { month: 'W10', documents: 75 },
  { month: 'W11', documents: 88 },
  { month: 'W12', documents: 102 },
];

const defaultCoverageByPlant = [
  { plant: 'Plant A (Jamnagar)', coverage: 92 },
  { plant: 'Plant B (Hazira)', coverage: 78 },
  { plant: 'Plant C (Dahej)', coverage: 85 },
  { plant: 'Plant D (Nagothane)', coverage: 64 },
];

const defaultTopEquipment = [
  { name: 'Centrifugal Pump CP-200', queries: 142 },
  { name: 'Pressure Relief Valve PRV-104', queries: 98 },
  { name: 'Heat Exchanger HX-301', queries: 76 },
  { name: 'Turbine Generator TG-12', queries: 54 },
  { name: 'Storage Tank T-502', queries: 32 },
];

const recentIncidents = [
  { id: 'INC-2026-01', title: 'CP-200 Seal Leakage & High Vibration', plant: 'Plant A', date: '2 hours ago', severity: 'high' as const },
  { id: 'INC-2026-02', title: 'OISD-118 Pressure Threshold Warning', plant: 'Plant B', date: '5 hours ago', severity: 'medium' as const },
  { id: 'INC-2026-03', title: 'PRV-104 Calibration Delay Observed', plant: 'Plant C', date: '1 day ago', severity: 'low' as const },
];

const recentDocumentsFallback = [
  { id: '1', name: 'maintenance_log_pump_cp200.txt', type: 'TXT', sizeKb: 120, status: 'ingested' as const },
  { id: '2', name: 'oisd_118_safety_standard.pdf', type: 'PDF', sizeKb: 2400, status: 'ingested' as const },
  { id: '3', name: 'sop_boiler_maintenance_v2.pdf', type: 'PDF', sizeKb: 1800, status: 'ingested' as const },
];

const docTypeIconMap: Record<string, string> = {
  PDF: 'FileText',
  TXT: 'FileText',
  LOG: 'Layers',
  SOP: 'Boxes',
};

const chartTooltip = {
  contentStyle: {
    backgroundColor: '#232323',
    border: '1px solid #2F2F2F',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#E8E8E8',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  itemStyle: { color: '#E8E8E8' },
  labelStyle: { color: '#8A8A8A', marginBottom: '4px' },
  cursor: { fill: 'rgba(184,115,51,0.06)' },
};

export default function KnowledgePage() {
  const { documents, entities, crossReferencedCount } = useData();
  const [hoveredRing, setHoveredRing] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const realDocCount = documents?.length ?? 0;
  const realEntityCount = entities?.length ?? 0;

  const documentRingsData = useMemo(() => {
    const ringColors = ['#D08A4E', '#E0A875', '#F3C59A', '#6B7280', '#4B5563', '#B87333', '#E09F67'];
    const ringRadii = [86, 75, 64, 53, 42, 31, 20];

    if (documents && documents.length > 0) {
      const topDocs = documents.slice(0, 7);
      const maxChunks = Math.max(...topDocs.map((d) => d.chunk_count || 10), 10);

      return topDocs.map((d, i) => ({
        indexLabel: String(i + 1),
        fullName: d.filename,
        label: d.filename.length > 18 ? `${d.filename.substring(0, 15)}...` : d.filename,
        value: d.chunk_count || 1,
        max: maxChunks * 1.15,
        color: ringColors[i % ringColors.length],
        r: ringRadii[i % ringRadii.length],
      }));
    }

    return [
      { indexLabel: '1', fullName: 'maintenance_log_cp200.txt', label: 'Maintenance Log', value: 312, max: 400, color: '#D08A4E', r: 86 },
      { indexLabel: '2', fullName: 'oisd_118_safety_standard.pdf', label: 'SOP Standard', value: 248, max: 400, color: '#E0A875', r: 75 },
      { indexLabel: '3', fullName: 'sop_boiler_maintenance.pdf', label: 'OEM Manual', value: 196, max: 400, color: '#F3C59A', r: 64 },
      { indexLabel: '4', fullName: 'incident_report_july.log', label: 'Incident Log', value: 168, max: 400, color: '#6B7280', r: 53 },
      { indexLabel: '5', fullName: 'inspection_checklist.docx', label: 'Inspection Log', value: 124, max: 400, color: '#4B5563', r: 42 },
      { indexLabel: '6', fullName: 'regulatory_rules_2026.pdf', label: 'Regulatory Docs', value: 96, max: 400, color: '#B87333', r: 31 },
      { indexLabel: '7', fullName: 'plant_layout_diagram.dwg', label: 'Drawings & Schematics', value: 140, max: 400, color: '#E09F67', r: 20 },
    ];
  }, [documents]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const topEquipment = useMemo(() => {
    if (!entities || entities.length === 0) return defaultTopEquipment;

    return [...entities]
      .sort((a, b) => b.mention_count - a.mention_count)
      .slice(0, 5)
      .map((e) => ({
        name: e.name,
        queries: e.mention_count,
      }));
  }, [entities]);

  const displayDocuments = useMemo(() => {
    if (!documents || documents.length === 0) return recentDocumentsFallback;
    return documents.slice(0, 5).map((d) => ({
      id: d.id,
      name: d.filename,
      type: d.filename.split('.').pop()?.toUpperCase() || 'TXT',
      sizeKb: (d.chunk_count || 1) * 250,
      status: d.status as any,
    }));
  }, [documents]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Knowledge Dashboard"
        description="Coverage, ingestion velocity, and intelligence density across your industrial knowledge base — by plant, document type, and equipment."
        icon={LayoutGrid}
        meta={[
          { label: 'Plants', value: '4' },
          { label: 'Sources', value: String(realDocCount > 0 ? realDocCount : '1,284') },
          { label: 'Updated', value: '2m ago' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Knowledge Base Size"
          value={realDocCount > 0 ? realDocCount : 1284}
          suffix=" docs"
          icon={FileText}
          accent="copper"
          delta="+42 this week"
          trend="up"
        />
        <StatCard
          label="Entities Extracted"
          value={realEntityCount > 0 ? realEntityCount : 1284}
          icon={Boxes}
          accent="info"
          delta={`+${crossReferencedCount || 128} cross-ref`}
          trend="up"
        />
        <StatCard
          label="Coverage Score"
          value={94}
          suffix="%"
          icon={Cpu}
          accent="success"
          delta="+2.1%"
          trend="up"
        />
        <StatCard
          label="Open Alerts"
          value={7}
          icon={ShieldAlert}
          accent="danger"
          delta="3 critical"
          trend="up"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ingestion Trend Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 rounded-lg border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-copper" strokeWidth={1.75} />
                Document Ingestion Trend
              </p>
              <p className="text-[11px] text-muted mt-0.5">Last 12 weeks · PDF + TXT sources</p>
            </div>
            <span className="text-[10px] font-medium text-success bg-success/10 px-2 py-1 rounded">
              +12.4% WoW
            </span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={defaultIngestionTrend} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ingestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B87333" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#B87333" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#8A8A8A', fontSize: 10 }} axisLine={{ stroke: '#2F2F2F' }} tickLine={false} />
                <YAxis tick={{ fill: '#8A8A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} />
                <Area
                  type="monotone"
                  dataKey="documents"
                  stroke="#B87333"
                  strokeWidth={2}
                  fill="url(#ingestGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#B87333', stroke: '#141414', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* RADIAL RINGS WITH MOVABLE CURSOR-TRACKING TOOLTIP */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-lg border border-border bg-surface p-5 flex flex-col justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-copper" strokeWidth={1.75} /> Document Vector Density
            </p>
            <p className="text-[11px] text-muted mb-4">
              Indexed chunks density across top {documentRingsData.length} uploaded files
            </p>

            {/* SVG Concentric Rings Container */}
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              className="relative h-[210px] w-full flex items-center justify-center overflow-hidden"
            >
              <svg className="h-[200px] w-[200px] transform -rotate-90" viewBox="0 0 200 200">
                {documentRingsData.map((ring, idx) => {
                  const circumference = 2 * Math.PI * ring.r;
                  const strokeDashoffset = circumference - (ring.value / ring.max) * circumference;
                  const isHovered = hoveredRing === idx;

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredRing(idx)}
                      onMouseLeave={() => setHoveredRing(null)}
                    >
                      {/* Dark Background Track */}
                      <circle
                        cx="100"
                        cy="100"
                        r={ring.r}
                        stroke="#2B2B2B"
                        strokeWidth="7.5"
                        fill="none"
                      />

                      {/* WHITE INDICATOR ARC LINE ON HOVER */}
                      {isHovered && (
                        <circle
                          cx="100"
                          cy="100"
                          r={ring.r}
                          stroke="#FFFFFF"
                          strokeWidth="1.2"
                          fill="none"
                          className="opacity-90 pointer-events-none transition-opacity duration-200"
                        />
                      )}

                      {/* Active Colored Ring */}
                      <circle
                        cx="100"
                        cy="100"
                        r={ring.r}
                        stroke={ring.color}
                        strokeWidth="7.5"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-opacity duration-200 ease-out"
                        style={{
                          opacity: hoveredRing === null || isHovered ? 1 : 0.35,
                        }}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* REAL-TIME MOVABLE CURSOR-TRACKING TOOLTIP CARD */}
              <AnimatePresence>
                {hoveredRing !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: Math.min(Math.max(mousePos.x - 55, -80), 80),
                      y: Math.min(Math.max(mousePos.y - 120, -70), 50),
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      x: { type: 'spring', damping: 25, stiffness: 350 },
                      y: { type: 'spring', damping: 25, stiffness: 350 },
                      opacity: { duration: 0.1 },
                    }}
                    className="absolute pointer-events-none z-30 rounded-lg bg-[#222222] border border-[#333333] px-3 py-2 shadow-2xl min-w-[100px]"
                  >
                    <p className="text-[10px] text-[#888888] font-medium leading-none mb-1">
                      {documentRingsData[hoveredRing].indexLabel}
                    </p>
                    <p className="text-xs font-semibold text-[#EEEEEE] leading-none">
                      value : {documentRingsData[hoveredRing].value}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Legend List */}
          <div className="mt-4 space-y-2">
            {documentRingsData.map((item, idx) => (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredRing(idx)}
                onMouseLeave={() => setHoveredRing(null)}
                className={cn(
                  'flex items-center justify-between text-xs p-1 rounded-md cursor-pointer transition-colors',
                  hoveredRing === idx ? 'bg-surface-2' : 'hover:bg-surface-2/50'
                )}
              >
                <span className="flex items-center gap-2.5 text-muted min-w-0 pr-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 transition-transform"
                    style={{
                      backgroundColor: item.color,
                      transform: hoveredRing === idx ? 'scale(1.3)' : 'scale(1)',
                    }}
                  />
                  <span className="font-medium text-foreground-2 truncate" title={item.fullName}>
                    {item.label}
                  </span>
                </span>
                <span className="font-bold text-foreground tabular-nums shrink-0">
                  {item.value} <span className="text-[10px] font-normal text-muted">chunks</span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 rounded-lg border border-border bg-surface p-5"
        >
          <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-copper" strokeWidth={1.75} />
            Coverage by Plant
          </p>
          <p className="text-[11px] text-muted mb-4">Document density and entity coverage across facilities</p>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defaultCoverageByPlant} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" vertical={false} />
                <XAxis dataKey="plant" tick={{ fill: '#8A8A8A', fontSize: 10 }} axisLine={{ stroke: '#2F2F2F' }} tickLine={false} />
                <YAxis tick={{ fill: '#8A8A8A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="coverage" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {defaultCoverageByPlant.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#B87333' : '#5A5A5A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-lg border border-border bg-surface p-5"
        >
          <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Factory className="h-4 w-4 text-copper" strokeWidth={1.75} />
            Top Equipment by Mentions
          </p>
          <div className="space-y-3">
            {topEquipment.map((e, i) => (
              <motion.div
                key={e.name}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-foreground truncate">{e.name}</span>
                  <span className="text-muted tabular-nums">{e.queries}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(e.queries / Math.max(1, topEquipment[0].queries)) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className={cn('h-full rounded-full', i === 0 ? 'bg-copper' : 'bg-muted')}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-lg border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={1.75} />
              Recent Incidents
            </p>
            <button className="text-[11px] text-copper hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentIncidents.map((inc, i) => (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 rounded-md border border-border bg-surface-2 p-3 hover:border-copper/20 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-danger/10 border border-danger/20 text-danger">
                  <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-foreground">{inc.title}</p>
                  <p className="text-[10px] text-muted mt-0.5">{inc.plant} · {inc.date}</p>
                </div>
                <RiskBadge risk={inc.severity} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-lg border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-copper" strokeWidth={1.75} />
              Recent Uploads
            </p>
            <button className="text-[11px] text-copper hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {displayDocuments.map((doc, i) => {
              const IconName = docTypeIconMap[doc.type] || 'FileText';
              const Icon = (Icons as any)[IconName] ?? FileText;
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface-2 p-3 hover:border-copper/20 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface border border-border text-copper">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-foreground">{doc.name}</p>
                    <p className="text-[10px] text-muted mt-0.5">{doc.type} · {(doc.sizeKb / 1024).toFixed(1)} MB</p>
                  </div>
                  <StatusBadge status={doc.status} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}