import React from 'react';
import { 
  Check, 
  Sparkles, 
  Eye, 
  Sun, 
  Moon, 
  Coffee, 
  Leaf, 
  X, 
  Heart,
  Palette
} from 'lucide-react';
import { SoftThemeId } from '../types';
import { SOFT_THEMES } from '../data/themes';

interface ThemeSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: SoftThemeId;
  onSelectTheme: (theme: SoftThemeId) => void;
}

export const ThemeSwitcherModal: React.FC<ThemeSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const getThemeIcon = (id: SoftThemeId) => {
    switch (id) {
      case 'soft-sage':
        return <Leaf className="w-4 h-4 text-emerald-600" />;
      case 'soft-warm':
        return <Sun className="w-4 h-4 text-amber-600" />;
      case 'soft-sepia':
        return <Coffee className="w-4 h-4 text-amber-800" />;
      case 'soft-dusk':
        return <Sparkles className="w-4 h-4 text-violet-600" />;
      case 'soft-dark':
        return <Moon className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div 
      id="theme-switcher-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="theme-switcher-modal"
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden transition-all transform animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                Soft Mode Themes
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-medium">
                  Eye Comfort
                </span>
              </h3>
              <p className="text-xs text-slate-500">Soothing color palettes designed to minimize eye fatigue</p>
            </div>
          </div>
          <button 
            id="close-theme-modal-btn"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme List */}
        <div className="p-4 overflow-y-auto space-y-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-2">
            <Eye className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Soft mode softens high-contrast glares and optimizes color balance for prolonged outdoor and cabin driving visibility.
            </p>
          </div>

          <div className="space-y-2.5">
            {SOFT_THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  id={`theme-option-${theme.id}`}
                  onClick={() => {
                    onSelectTheme(theme.id);
                  }}
                  className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'border-emerald-600 bg-slate-50/90 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Visual Color Swatch */}
                    <div 
                      className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner relative overflow-hidden shrink-0"
                      style={{ 
                        backgroundColor: theme.bgHex,
                        borderColor: isSelected ? theme.accentHex : '#e2e8f0' 
                      }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: theme.cardHex }}
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: theme.accentHex }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        {getThemeIcon(theme.id)}
                        <span className="font-bold text-sm text-slate-900">{theme.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200/60">
                          {theme.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{theme.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center pl-2">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-slate-300 group-hover:border-slate-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            Active across all sensor & map screens
          </span>
          <button
            id="apply-theme-done-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-all text-xs shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
