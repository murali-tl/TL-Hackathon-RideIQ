/** Static copy from RideSmart_App.html smart tips + speed zones. */

export const speedZones = [
  { range: '20–40', unit: 'kmph', tone: 'accent' as const, hint: 'Slow stop-go', highlight: false },
  { range: '45–60', unit: 'kmph', tone: 'green' as const, hint: '✓ Best mileage', highlight: true },
  { range: '60–80', unit: 'kmph', tone: 'amber' as const, hint: 'Moderate loss', highlight: false },
  { range: '80+', unit: 'kmph', tone: 'red' as const, hint: 'Avoid', highlight: false },
]

export const staticSmartTips = [
  {
    emoji: '🔵',
    title: 'Maintain Tyre Pressure Weekly',
    body: 'Front 28 psi · Rear 32 psi. Low pressure reduces mileage by 3–5 km/L and wears tyres unevenly.',
  },
  {
    emoji: '🚀',
    title: 'Avoid Aggressive Acceleration',
    body: 'Sudden throttle uses 20–30% more fuel. Smoothly open throttle from each stop signal.',
  },
  {
    emoji: '⚙️',
    title: 'Use Engine Braking',
    body: 'Release throttle well before stops. Engine resistance slows you naturally, saving fuel and brake pads.',
  },
  {
    emoji: '🌡️',
    title: 'Warm-Up Only 60 Seconds',
    body: 'Modern fuel-injected bikes need just 30–60 seconds warm-up. Longer idle wastes fuel.',
  },
  {
    emoji: '🔧',
    title: 'Replace Air Filter Every 5,000 km',
    body: 'Clogged filter chokes combustion efficiency. DIY filter costs ₹120–180 at any spare shop.',
  },
  {
    emoji: '⛽',
    title: 'Choose Trusted Petrol Bunks',
    body: 'Adulterated fuel cuts mileage significantly. Check the Bunk ratings screen for community-verified pumps.',
  },
  {
    emoji: '🏍️',
    title: 'Maintain Correct Chain Tension',
    body: 'Loose chain causes power loss; tight chain strains engine. Check every 700 km and lubricate monthly.',
  },
]
