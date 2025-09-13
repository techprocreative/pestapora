import React from 'react';
import { useStore } from '../../store/useStore';
import { BrutalInput } from '../Common/BrutalInput';
import { Search, Filter } from 'lucide-react';

const categories: { value: string; label: string }[] = [
  { value: '', label: 'ALL CATEGORIES' },
  { value: 'TECHNOLOGY', label: 'TECHNOLOGY' },
  { value: 'MUSIC', label: 'MUSIC' },
  { value: 'BUSINESS', label: 'HARSH BUSINESS' },
  { value: 'GAMING', label: 'HARDCORE GAMING' },
  { value: 'ART', label: 'RAW ART' },
  { value: 'SPORTS', label: 'EXTREME SPORTS' },
  { value: 'FOOD', label: 'FOOD & DRINKS' },
];

export const EventFilters: React.FC = () => {
  const { searchQuery, selectedCategory, filterEvents } = useStore();

  const handleSearchChange = (query: string) => {
    filterEvents(query, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    filterEvents(searchQuery, category);
  };

  return (
    <div className="bg-white border-6 border-black shadow-[8px_8px_0px_#000000] p-6 mb-8">
      <div className="flex items-center gap-4 mb-6">
        <Filter className="h-6 w-6 text-black" />
        <h2 className="font-black text-xl text-black uppercase">EVENT FILTERS</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <BrutalInput
            placeholder="SEARCH EVENTS..."
            value={searchQuery}
            onChange={handleSearchChange}
            icon={Search}
          />
        </div>

        {/* Category Filter */}
        <div className="lg:col-span-2">
          <label className="block text-black font-black text-sm uppercase tracking-tight mb-2">
            CATEGORY
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-4 py-3 border-4 border-black shadow-[4px_4px_0px_#000000] font-black text-black bg-white uppercase tracking-tight focus:outline-none focus:shadow-[2px_2px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px] focus:bg-[#F5F5F5] transition-all duration-100"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};