import React from 'react';
import { ReviewItem, StockItem, StockFormat } from '../types';
import { FileText, List, Table, Sparkles, CheckCircle2 } from 'lucide-react';

interface FormattedContentViewProps {
  item: ReviewItem | StockItem;
  format: StockFormat;
}

export const FormattedContentView: React.FC<FormattedContentViewProps> = ({ item, format }) => {
  const tableData = item.tableData || {
    headers: ['ソース項目', '概要・要点'],
    rows: item.sources.slice(0, 4).map((s) => [s.title, s.snippet]),
  };

  switch (format) {
    case 'summary':
      return (
        <div className="p-4 rounded-xl bg-[#0f111a] border border-amber-500/20 text-slate-200 text-sm leading-relaxed space-y-2 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <FileText className="w-3.5 h-3.5" />
            <span>要約短文</span>
          </div>
          <p className="font-medium text-slate-200 leading-relaxed">
            {item.summary}
          </p>
        </div>
      );

    case 'bullet':
      return (
        <div className="p-4 rounded-xl bg-[#0f111a] border border-indigo-500/20 space-y-3 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
            <List className="w-3.5 h-3.5" />
            <span>箇条書き・重要ポイント</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-200">
            {(item.keyTakeaways && item.keyTakeaways.length > 0
              ? item.keyTakeaways
              : [item.summary]
            ).map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-[#141726] p-2.5 rounded-lg border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'table':
      return (
        <div className="p-4 rounded-xl bg-[#0f111a] border border-cyan-500/20 space-y-3 shadow-inner overflow-hidden">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
            <Table className="w-3.5 h-3.5" />
            <span>データ・対比・スペック表</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#181c2e] border-b border-slate-800 text-slate-300 font-bold">
                  {tableData.headers.map((h, idx) => (
                    <th key={idx} className="px-3.5 py-2.5 border-r border-slate-800/60 last:border-r-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#121522]">
                {tableData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2.5 text-slate-300 border-r border-slate-800/40 last:border-r-0 font-sans">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'full':
    default:
      return (
        <div className="p-4 rounded-xl bg-[#0f111a] border border-slate-800 text-slate-200 text-sm leading-relaxed space-y-4 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>全統合ビュー (概要 + ポイント + 表)</span>
          </div>
          <p className="font-medium text-slate-200">{item.summary}</p>

          {/* Key Takeaways */}
          {item.keyTakeaways && item.keyTakeaways.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                💡 重要なポイント:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {item.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Table Data if available */}
          {tableData.rows.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                📊 構造化・比較表:
              </span>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#181c2e] border-b border-slate-800 text-slate-300 font-bold">
                      {tableData.headers.map((h, idx) => (
                        <th key={idx} className="px-3 py-2 border-r border-slate-800/60 last:border-r-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-[#121522]">
                    {tableData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/40">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-slate-300 border-r border-slate-800/40 last:border-r-0">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
  }
};
