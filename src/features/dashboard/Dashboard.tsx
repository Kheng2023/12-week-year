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
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import ChecklistIcon from '@mui/icons-material/Checklist';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { useDatabase } from '../../db/hooks';
import { getCurrentWeek, formatDate, getScoreColor, getScoreHex } from '../../lib/utils';
import { useCountUp } from '../../lib/useCountUp';
import { updateAppBadge } from '../../lib/badge';

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

export default function Dashboard() {
  const { queries } = useDatabase();
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

  const goalChartData = goalProgress.map((g) => ({
    name: g.goal_title.length > 20 ? g.goal_title.slice(0, 20) + '…' : g.goal_title,
    score: g.score,
    fullName: g.goal_title,
  }));

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

        {/* Goal Completion */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Goal Completion</Typography>
              {goalChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={goalChartData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Completion']}
                      labelFormatter={(_label, payload) => {
                        const item = payload?.[0]?.payload as { fullName?: string } | undefined;
                        return item?.fullName ?? String(_label);
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {goalChartData.map((entry, index) => (
                        <Cell key={index} fill={getScoreHex(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  Add goals to see progress
                </Typography>
              )}
            </CardContent>
          </Card>
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
