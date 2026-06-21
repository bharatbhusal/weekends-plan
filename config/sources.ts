import { SourceConfig } from '@/types/event';

export const sourceConfigs: SourceConfig[] = [
  {
    id: 'luma',
    name: 'Luma',
    type: 'API',
    enabled: true,
    config: {
      cities: [
        'bengaluru',
        'mumbai',
        'new-delhi',
        'hyderabad',
        'pune',
        'chennai',
        'kolkata',
        'ahmedabad',
        'jaipur',
        'lucknow',
      ],
      maxEventsPerCity: 40,
    },
  },
  {
    id: 'foss_united_ics',
    name: 'FOSS United (Calendar)',
    type: 'ICS',
    enabled: true,
    config: {
      url: 'https://fossunited.org/api/method/fossunited.api.chapter.upcoming_events_ics',
    },
  },
  {
    id: 'foss_united_rss',
    name: 'FOSS United (RSS)',
    type: 'RSS',
    enabled: true,
    config: {
      url: 'https://fossunited.org/events/timeline/rss.xml',
    },
  },
  {
    id: 'meetup',
    name: 'Meetup',
    type: 'API',
    enabled: true,
    config: {
      cities: [
        'bengaluru',
        'mumbai',
        'new-delhi',
        'hyderabad',
        'pune',
        'chennai',
        'kolkata',
        'ahmedabad',
        'jaipur',
        'lucknow',
      ],
    },
  },
  {
    id: 'eventbrite',
    name: 'Eventbrite',
    type: 'API',
    enabled: true,
    config: {
      cities: [
        'bengaluru',
        'mumbai',
        'new-delhi',
        'hyderabad',
        'pune',
        'chennai',
        'kolkata',
        'ahmedabad',
        'jaipur',
        'lucknow',
      ],
    },
  },
];
