import React, { useState, FormEvent } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (word: string) => void;
  isLoading: boolean;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, autoFocus }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-rivstart-green animate-spin" />
          ) : (
            <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-rivstart-green transition-colors duration-200" />
          )}
        </div>
        <input
          type="text"
          autoFocus={autoFocus}
          className="block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white border-2 border-gray-200 rounded-2xl text-base sm:text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-rivstart-green focus:ring-4 focus:ring-rivstart-lightGreen/50 transition-all duration-200 shadow-sm hover:shadow-md"
          placeholder="Search for a Swedish word..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute inset-y-1.5 sm:inset-y-2 right-1.5 sm:right-2 px-4 sm:px-6 bg-rivstart-green text-white text-sm sm:text-base font-medium rounded-xl hover:bg-rivstart-darkGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rivstart-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          Translate
        </button>
      </form>
    </div>
  );
};

export default SearchBar;