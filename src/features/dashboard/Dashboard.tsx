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
import ChecklistIcon from '@mui/icons-material/Checklist';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { useDatabase } from '../../db/hooks';
import { getCurrentWeek, formatDate, getScoreColor, getScoreHex } from '../../lib/utils';

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
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">Current Week</Typography>
              <Typography variant="h3" color="primary">
                {currentWeek >= 1 && currentWeek <= 12 ? currentWeek : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">of 12</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">This Week&apos;s Score</Typography>
              <Typography
                variant="h3"
                color={currentScore ? `${getScoreColor(currentScore.score)}.main` : 'text.disabled'}
              >
                {currentScore && currentScore.total_tactics > 0 ? `${currentScore.score}%` : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">execution rate</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">Overall Score</Typography>
              <Typography
                variant="h3"
                color={overallScore > 0 ? `${getScoreColor(overallScore)}.main` : 'text.disabled'}
              >
                {overallScore > 0 ? `${overallScore}%` : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">cycle average</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">Goals</Typography>
              <Typography variant="h3" color="primary">{goalProgress.length}</Typography>
              <Typography variant="body2" color="text.secondary">active goals</Typography>
            </CardContent>
          </Card>
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
                        '&:hover': { bgcolor: 'action.hover' },
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
