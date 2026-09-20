export interface CityOption { city: string; state: string }

/** Cities offered in filters and forms. Job seekers and employers can still type any other city. */
export const CITIES: CityOption[] = [
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Gurugram', state: 'Haryana' },
  { city: 'Chandigarh', state: 'Chandigarh' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Bhubaneswar', state: 'Odisha' },
  { city: 'Patna', state: 'Bihar' },
];

export const STATES: string[] = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export const stateForCity = (city: string): string | undefined =>
  CITIES.find((c) => c.city.toLowerCase() === city.trim().toLowerCase())?.state;

export const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'APPRENTICE'] as const;

export const SHOW_DEMO_LOGINS = (import.meta.env.VITE_SHOW_DEMO_LOGINS as string | undefined) === 'true';

export const DEMO_ACCOUNTS = [
  { label: 'Job seeker', email: 'ravi.meena@example.com', password: 'Demo@1234' },
  { label: 'Employer', email: 'hr@rajasthanelectricals.in', password: 'Demo@1234' },
  { label: 'Admin', email: 'admin@skillbharat.in', password: 'Admin@1234' },
];
