import {
  CheckCircle2,
  Sparkles,
  RefreshCw,
  FileDown,
  Briefcase,
  Coffee,
  Scissors,
} from 'lucide-react';

const TOOL_ICONS = {
  grammar: CheckCircle2,
  improve: Sparkles,
  replace: RefreshCw,
  simplify: FileDown,
  professional: Briefcase,
  casual: Coffee,
  shorten: Scissors,
};

export default function ToolSelector({ tools, selectedTool, onSelect }) {
  return (
    <div
      className="flex flex-wrap justify-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-[#14171f] rounded-2xl border border-slate-200/80 dark:border-[#222734] max-w-4xl shadow-inner transition-colors"
      role="radiogroup"
      aria-label="Writing tool selection"
    >
      {tools.map((tool) => {
        const isSelected = tool.id === selectedTool;
        const Icon = TOOL_ICONS[tool.id] || Sparkles;

        return (
          <button
            key={tool.id}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(tool.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38858a] focus-visible:ring-offset-1 select-none cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-[#1e2430] text-[#1c4b4f] dark:text-[#a0dfe4] shadow-xs border border-slate-200 dark:border-[#2e3748] font-semibold scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-[#1a1e27]'
            }`}
          >
            <Icon
              size={15}
              className={`shrink-0 transition-colors ${
                isSelected ? 'text-[#38858a] dark:text-[#4fa3a8]' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
