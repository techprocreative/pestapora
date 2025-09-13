import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Event } from '../../types';
import { Calendar, MapPin, User } from 'lucide-react';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const lowestPrice = Math.min(...event.ticketTypes.map(t => t.price));

  return (
    <div className="bg-white border-6 border-black shadow-[12px_12px_0px_#000000] hover:shadow-[8px_8px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-150">
      {/* Image */}
      <div className="relative overflow-hidden h-48">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        {event.isFeatured && (
          <div className="absolute top-4 right-4 bg-[#FFD700] text-black px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000000] font-black text-xs uppercase">
            FEATURED
          </div>
        )}
        <div className="absolute bottom-4 left-4 bg-[#FF0080] text-white px-3 py-1 border-4 border-black shadow-[4px_4px_0px_#000000] font-black text-xs uppercase">
          {event.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <h3 className="font-black text-xl text-black uppercase leading-tight">
          {event.title}
        </h3>

        <p className="text-black font-bold text-sm uppercase line-clamp-2">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-black" />
            <span className="font-bold text-sm text-black uppercase">
              {format(event.date, 'MMM dd, yyyy')} AT {event.time}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-black" />
            <span className="font-bold text-sm text-black uppercase">
              {event.venue}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-black" />
            <span className="font-bold text-sm text-black uppercase">
              {event.organizer}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {event.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-[#00FFFF] text-black px-2 py-1 border-2 border-black font-black text-xs uppercase"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t-4 border-black">
          <div>
            <span className="text-black font-black text-2xl">
              Rp {lowestPrice.toLocaleString('id-ID')}
            </span>
            <span className="text-black font-bold text-sm uppercase ml-2">
              FROM
            </span>
          </div>

          <Link
            to={`/events/${event.id}`}
            className="bg-[#00FF00] text-black px-6 py-3 border-4 border-black shadow-[6px_6px_0px_#000000] hover:bg-black hover:text-[#00FF00] hover:shadow-[3px_3px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all font-black text-sm uppercase"
          >
            GET TICKETS
          </Link>
        </div>
      </div>
    </div>
  );
};