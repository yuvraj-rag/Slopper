import { useState } from 'react';
import { TopNav, MealSummaryBar, type View } from './components/Layout';
import { SearchBar, ResultsList, ErrorBanner } from './components/Search';
import { MealList, MealTotalsPanel } from './components/Meal';
import { CompareView } from './components/Compare';

function App() {
  const [currentView, setCurrentView] = useState<View>('search');

  return (
    <div className="layout-container">
      <TopNav currentView={currentView} onViewChange={setCurrentView} />
      <MealSummaryBar onOpenMeal={() => setCurrentView('meal')} />

      <main className="app-main">
        {currentView === 'search' && (
          <>
            <SearchBar />
            <ErrorBanner />
            <ResultsList />
          </>
        )}

        {currentView === 'meal' && (
          <div className="meal-layout">
            <div className="meal-layout__list">
              <MealList setView={setCurrentView} />
            </div>
            <div className="meal-layout__sidebar">
              <div className="sticky" style={{ top: 'var(--sp-24)' }}>
                <MealTotalsPanel />
              </div>
            </div>
          </div>
        )}

        {currentView === 'compare' && (
          <CompareView setView={setCurrentView} />
        )}
      </main>
    </div>
  );
}

export default App;
