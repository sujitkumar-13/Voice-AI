import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 p-1 rounded-full">
            <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-full transition-colors ${theme === 'light'
                    ? 'bg-white dark:bg-stone-800 text-amber-500 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'}`}
                title="Light Mode"
            >
                <Sun size={14} />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-full transition-colors ${theme === 'dark'
                    ? 'bg-white dark:bg-stone-800 text-amber-500 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'}`}
                title="Dark Mode"
            >
                <Moon size={14} />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-full transition-colors ${theme === 'system'
                    ? 'bg-white dark:bg-stone-800 text-amber-500 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'}`}
                title="System Default"
            >
                <Laptop size={14} />
            </button>
        </div>
    );
};
