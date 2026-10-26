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
      className="flex flex-wrap justify-center gap-1.5 p-1.5 bg-stone-100/90 dark:bg-stone-800/90 rounded-2xl border border-stone-200/80 dark:border-stone-700 max-w-4xl shadow-inner transition-colors"
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
            className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 select-none cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-stone-700 text-teal-900 dark:text-teal-200 shadow-sm border border-stone-200 dark:border-stone-600 font-semibold scale-[1.02]'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/60 dark:hover:bg-stone-700/60'
            }`}
          >
            <Icon
              size={15}
              className={`shrink-0 transition-colors ${
                isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-stone-400 dark:text-stone-400'
              }`}
            />
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
