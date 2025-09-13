import React from 'react';
import { useStore } from '../store/useStore';
import { EventFilters } from '../components/Events/EventFilters';
import { EventGrid } from '../components/Events/EventGrid';

export const EventsPage: React.FC = () => {
  const { filteredEvents } = useStore();

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-black text-4xl md:text-6xl uppercase mb-4 text-black">
            PESTAPORA <span className="text-[#FF0080]">EVENTS</span>
          </h1>
          <p className="font-bold text-lg uppercase text-black max-w-2xl mx-auto">
            DISCOVER THE MOST AGGRESSIVE EVENTS. NO SOFT CONTENT. ONLY HARDCORE EXPERIENCES.
          </p>
        </div>

        {/* Filters */}
        <EventFilters />

        {/* Results Count */}
        <div className="mb-8">
          <div className="bg-black text-white px-6 py-3 border-4 border-white shadow-[4px_4px_0px_#FFFFFF] inline-block">
            <span className="font-black text-sm uppercase">
              {filteredEvents.length} EVENTS FOUND
            </span>
          </div>
        </div>

        {/* Events Grid */}
        <EventGrid />
      </div>
    </div>
  );
};