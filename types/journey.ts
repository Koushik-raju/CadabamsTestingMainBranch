export interface Journey {
  id: string | number;
  name?: string;
  description?: string;
  days?: JourneyDay[];
  [key: string]: unknown;
}

export interface JourneyDay {
  day: number;
  completed?: boolean;
  activities?: JourneyActivity[];
}

export interface JourneyActivity {
  id: string | number;
  title: string;
  type?: string;
  completed?: boolean;
}

export interface MoodCheckIn {
  mood: string;
  timestamp?: string;
  note?: string;
}

export interface JourneyProgress {
  journeyId: string | number;
  currentDay: number;
  completedDays: number[];
}
