import type { BunkPlace } from '../types'

/** Seed data inspired by RideSmart_App.html (Hyderabad community ratings). */
export const BUNK_PLACES: BunkPlace[] = [
  {
    id: 'b1',
    rank: 1,
    name: 'HP Petrol Pump',
    location: 'Madhapur, near Cyber Towers',
    stars: 5,
    trust: '4.9/5',
    boost: '+3.2 km/L',
    reviews: 247,
    accentRank: 'accent',
  },
  {
    id: 'b2',
    rank: 2,
    name: 'Indian Oil — Kondapur',
    location: 'Kondapur Main Road, near DLF',
    stars: 4,
    trust: '4.4/5',
    boost: '+1.8 km/L',
    reviews: 182,
    accentRank: 'muted',
  },
  {
    id: 'b3',
    rank: 3,
    name: 'BPCL Speed — Gachibowli',
    location: 'Gachibowli flyover, near Inorbit Mall',
    stars: 4,
    trust: '4.1/5',
    boost: '+1.1 km/L',
    reviews: 98,
    accentRank: 'outline',
  },
]
