import React from 'react';
import { useStore } from '../../store/useStore';
import { EventCard } from './EventCard';

export const EventGrid: React.FC = () => {
  const { filteredEvents } = useStore();

  if (filteredEvents.length === 0) {
    return (
      <div className="bg-[#FF0000] text-white p-12 border-6 border-black shadow-[8px_8px_0px_#000000] text-center">
        <h3 className="font-black text-2xl uppercase mb-4">NO BRUTAL EVENTS FOUND</h3>
        <p className="font-bold text-lg uppercase">TRY DIFFERENT SEARCH TERMS OR FILTERS</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};