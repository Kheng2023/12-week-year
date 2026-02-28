import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import ChecklistIcon from '@mui/icons-material/Checklist';
import RateReviewIcon from '@mui/icons-material/RateReview';
import TodayIcon from '@mui/icons-material/Today';
import { useDatabase } from '../../db/hooks';
import { getCurrentWeek, formatDate, getScoreColor } from '../../lib/utils';
import { useCountUp } from '../../lib/useCountUp';
import { updateAppBadge } from '../../lib/badge';
import { DAY_KEYS, DAY_LABELS, type DayKey } from '../../types';

function getTodayKey(): DayKey {
  return DAY_KEYS[new Date().getDay()];
}

/** Small trend arrow component */
function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const diff = current - previous;
  if (diff > 2) return <TrendingUpIcon sx={{ fontSize: 18, color: 'success.main', ml: 0.5 }} />;
  if (diff < -2) return <TrendingDownIcon sx={{ fontSize: 18, color: 'error.main', ml: 0.5 }} />;
  return <TrendingFlatIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 0.5 }} />;
}

/** Stat card with animated counter */
function StatCard({ label, value, suffix, color, subtitle, trend }: {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  subtitle: string;
  trend?: { current: number; previous: number };
}) {
  const animated = useCountUp(value);
  return (
    <Card>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h3" color={color} sx={{ fontWeight: 700 }}>
            {value > 0 ? `${animated}${suffix || ''}` : '—'}
          </Typography>
          {trend && <TrendArrow current={trend.current} previous={trend.previous} />}
        </Box>
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
      </CardContent>
    </Card>
  );
}

/** Today's Tactics quick checklist */
function TodayTactics({ cycleId, weekNumber, queries, refresh }: {
  cycleId: number;
  weekNumber: number;
  queries: ReturnType<typeof useDatabase>['queries'];
  refresh: () => void;
}) {
  const today = getTodayKey();
  const scorecard = queries.getWeekScorecard(cycleId, weekNumber);

  if (scorecard.length === 0) return null;

  const doneTodayCount = scorecard.filter((t) => t[today] === 1).length;
  const progress = Math.round((doneTodayCount / scorecard.length) * 100);

  const handleToggle = async (tacticId: number, currentValue: number) => {
    await queries.setDayCompletion(cycleId, weekNumber, tacticId, today, currentValue === 0);
    refresh();
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 380 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TodayIcon color="primary" />
            <Typography variant="h6">Today — {DAY_LABELS[today]}</Typography>
          </Box>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" value={progress} size={48} thickness={5} color={progress === 100 ? 'success' : 'primary'} />
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                {doneTodayCount}/{scorecard.length}
              </Typography>
            </Box>
          </Box>
        </Box>
        {scorecard.map((t) => {
          const checked = t[today] === 1;
          return (
            <Box
              key={t.tactic_id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 0.75,
                px: 1,
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => handleToggle(t.tactic_id, t[today])}
            >
              <Checkbox
                checked={checked}
                size="small"
                sx={{ p: 0.5, mr: 1 }}
                tabIndex={-1}
              />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: checked ? 'line-through' : 'none',
                    color: checked ? 'text.secondary' : 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.tactic_title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t.goal_title}
                </Typography>
              </Box>
              <Chip
                label={`${t.sun + t.mon + t.tue + t.wed + t.thu + t.fri + t.sat}/${t.weekly_target}`}
                size="small"
                variant="outlined"
                sx={{ ml: 1, fontSize: '0.7rem' }}
              />
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { queries, refresh } = useDatabase();
  const navigate = useNavigate();

  const cycle = queries.getActiveCycle();

  if (!cycle) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          No active cycle found. Create a new 12-week cycle to get started!
        </Alert>
        <Button variant="contained" size="large" onClick={() => navigate('/cycles')}>
          Create Your First Cycle
        </Button>
      </Box>
    );
  }

  const currentWeek = getCurrentWeek(cycle.start_date);
  const weekScores = queries.getAllWeekScores(cycle.id);
  const goalProgress = queries.getGoalProgress(cycle.id);
  const currentScore = currentWeek >= 1 && currentWeek <= 12 ? weekScores[currentWeek - 1] : null;
  
  // Overall cycle score (average of all completed weeks)
  const completedWeeks = weekScores.filter((w) => w.total_tactics > 0 && w.score > 0);
  const overallScore = completedWeeks.length > 0
    ? Math.round(completedWeeks.reduce((acc, w) => acc + w.score, 0) / completedWeeks.length)
    : 0;

  const chartData = weekScores.map((w) => ({
    week: `W${w.week_number}`,
    score: w.total_tactics > 0 ? w.score : null,
    target: 85,
  }));

  // Update PWA badge with uncompleted tactics for current week
  const uncompleted = currentScore
    ? currentScore.total_tactics - currentScore.completed_tactics
    : 0;
  updateAppBadge(uncompleted);



  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4">{cycle.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(cycle.start_date)} — {formatDate(cycle.end_date)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {currentWeek >= 1 && currentWeek <= 12 ? (
            <Chip label={`Week ${currentWeek} of 12`} color="primary" variant="outlined" />
          ) : currentWeek === 0 ? (
            <Chip label="Not started yet" color="default" />
          ) : (
            <Chip label="Cycle complete" color="success" />
          )}
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Current Week"
            value={currentWeek >= 1 && currentWeek <= 12 ? currentWeek : 0}
            color="primary"
            subtitle="of 12"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="This Week's Score"
            value={currentScore && currentScore.total_tactics > 0 ? currentScore.score : 0}
            suffix="%"
            color={currentScore ? `${getScoreColor(currentScore.score)}.main` : 'text.disabled'}
            subtitle="execution rate"
            trend={currentWeek >= 2 ? {
              current: currentScore?.score ?? 0,
              previous: weekScores[currentWeek - 2]?.score ?? 0,
            } : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Overall Score"
            value={overallScore}
            suffix="%"
            color={overallScore > 0 ? `${getScoreColor(overallScore)}.main` : 'text.disabled'}
            subtitle="cycle average"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Goals"
            value={goalProgress.length}
            color="primary"
            subtitle="active goals"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      {currentWeek >= 1 && currentWeek <= 12 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<ChecklistIcon />}
            onClick={() => navigate(`/scorecard?week=${currentWeek}`)}
          >
            Fill Week {currentWeek} Scorecard
          </Button>
          <Button
            variant="outlined"
            startIcon={<RateReviewIcon />}
            onClick={() => navigate(`/review?week=${currentWeek}`)}
          >
            Write Week {currentWeek} Review
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Execution Trend Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Execution Score Trend</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <ReferenceLine y={85} stroke="#4caf50" strokeDasharray="5 5" label={{ value: '85% Target', position: 'right' }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1976d2"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#1976d2' }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Tactics */}
        <Grid size={{ xs: 12, md: 4 }}>
          {currentWeek >= 1 && currentWeek <= 12 ? (
            <TodayTactics cycleId={cycle.id} weekNumber={currentWeek} queries={queries} refresh={refresh} />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No active week</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Weekly Progress Bars */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Weekly Breakdown</Typography>
              <Grid container spacing={1}>
                {weekScores.map((w) => (
                  <Grid size={{ xs: 6, sm: 4, md: 2 }} key={w.week_number}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: w.week_number === currentWeek ? '2px solid' : '1px solid',
                        borderColor: w.week_number === currentWeek ? 'primary.main' : 'divider',
                        bgcolor: w.week_number === currentWeek ? 'primary.50' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                      }}
                      onClick={() => navigate(`/scorecard?week=${w.week_number}`)}
                    >
                      <Typography variant="caption" fontWeight={600}>
                        Week {w.week_number}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={w.total_tactics > 0 ? w.score : 0}
                        color={w.total_tactics > 0 ? getScoreColor(w.score) : 'inherit'}
                        sx={{ height: 8, borderRadius: 4, my: 0.5 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {w.total_tactics > 0 ? `${w.score}%` : '—'}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Vision */}
        {cycle.vision && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Vision</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {cycle.vision}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
