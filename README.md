# Slopper

Slopper is a nutrition search app for finding foods by name and nutrient profile. It combines data from USDA FoodData Central and Open Food Facts, then lets users filter, compare, and build meals.

## Features

- Food search by name
- Nutrient-based filters for calories, protein, fat, carbs, and fiber
- Search result sorting and pagination
- Product comparison side by side
- Meal builder for adding foods and adjusting serving size
- Backend API integration with error handling and retries
- React frontend with TypeScript

## Project structure

- `client/` - frontend app
- `server/` - Express backend API

## Requirements

- Node.js
- npm

## Setup

1. Open the server folder and install dependencies:
   npm install
2. Create a `.env` file in `server/` with the required environment variables:
   - USDA_API_KEY
   - OFF_USER_AGENT
   - ALLOWED_ORIGIN
3. Open the client folder and install dependencies:
   npm install
4. Create a `.env` file in `client/` with:
   VITE_BACKEND_URL=
    and paste your backend url with correct port.
## Run

Server:

npm start

Client:

npm run dev

