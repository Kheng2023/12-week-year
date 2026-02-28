import { Routes, Route, useLocation } from 'react-router-dom';
import { Fade } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './features/dashboard/Dashboard';
import CycleList from './features/cycles/CycleList';
import GoalList from './features/goals/GoalList';
import WeeklyScorecard from './features/scorecard/WeeklyScorecard';
import WeeklyReview from './features/review/WeeklyReview';
import Settings from './features/settings/Settings';

export default function App() {
  const location = useLocation();

  return (
    <Layout>
      <Fade in key={location.pathname} timeout={300}>
        <div>
          <Routes location={location}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cycles" element={<CycleList />} />
            <Route path="/goals" element={<GoalList />} />
            <Route path="/scorecard" element={<WeeklyScorecard />} />
            <Route path="/review" element={<WeeklyReview />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </Fade>
    </Layout>
  );
}
