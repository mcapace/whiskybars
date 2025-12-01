# America's Top Whisky Bars 2025

An interactive microsite showcasing America's best whisky bars, built with Next.js, TypeScript, Tailwind CSS, and Mapbox GL.

## Features

- **Interactive Map**: Mapbox GL-powered map with numbered markers for each bar
- **Dynamic Data**: Bar data loaded from Google Sheets for easy updates
- **State Filtering**: Filter bars by state with fly-to animations
- **Search**: Full-text search across bar names, cities, and descriptions
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Cocktail Section**: "Elevating the Classics" featuring 6 iconic cocktails with recipes and shop links
- **Modern UI**: Clean, elegant design matching Whisky Advocate branding

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS
- **Data**: Google Sheets (CSV export)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mcapace/whiskybars.git
cd whiskybars
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your environment variables:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_SHEETS_URL=https://docs.google.com/spreadsheets/d/your_sheet_id/gviz/tq?tqx=out:csv
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
whiskybars/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main page
│   ├── components/
│   │   ├── Header.tsx       # Site header
│   │   ├── Map.tsx          # Mapbox map component
│   │   ├── BarList.tsx      # Scrollable bar list
│   │   ├── StateFilter.tsx  # State filter buttons
│   │   ├── CocktailSection.tsx
│   │   ├── CocktailModal.tsx
│   │   ├── OdeSection.tsx
│   │   ├── SponsorsSection.tsx
│   │   └── Footer.tsx
│   ├── data/
│   │   └── cocktails.ts     # Cocktail data with shop links
│   ├── hooks/
│   │   └── useBars.ts       # Data fetching hook
│   └── types/
│       └── index.ts         # TypeScript types
├── public/                   # Static assets
├── .env.local               # Environment variables (not committed)
├── .env.example             # Example env file
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json              # Vercel deployment config
```

## Google Sheets Data Format

The Google Sheet should have these columns:
1. **Name** - Bar name
2. **Address** - Full address
3. **Coordinates** - Latitude,Longitude (e.g., "40.7128,-74.0060")
4. **State** - State name or abbreviation
5. **Website** - Bar website URL (without https://)
6. **Description** - Bar description
7. **Whisky List** - Optional URL to whisky menu

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - `NEXT_PUBLIC_SHEETS_URL`
4. Deploy!

### Manual Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Your Mapbox access token |
| `NEXT_PUBLIC_SHEETS_URL` | Google Sheets CSV export URL |

## Customization

### Updating Cocktails

Edit `src/data/cocktails.ts` to modify cocktail recipes and shop links.

### Styling

The site uses Tailwind CSS with custom colors defined in `tailwind.config.ts`:
- `whisky-red`: #c41230
- `whisky-cream`: #fdf9f1
- `whisky-brown`: #9e380d
- `whisky-gold`: #f9bd13

### Adding Sponsors

Update `src/components/SponsorsSection.tsx` to add or modify sponsor logos.

## License

Copyright 2025 Whisky Advocate. All rights reserved.
