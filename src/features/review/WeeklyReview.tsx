import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Chip,
  Snackbar,
  Grid,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useDatabase } from '../../db/hooks';
import { getCurrentWeek, getScoreColor } from '../../lib/utils';

export default function WeeklyReview() {
  const { queries, refresh } = useDatabase();
  const [searchParams, setSearchParams] = useSearchParams();
  const cycle = queries.getActiveCycle();

  const defaultWeek = cycle ? Math.max(1, Math.min(getCurrentWeek(cycle.start_date), 12)) : 1;
  const weekParam = searchParams.get('week');
  const [selectedWeek, setSelectedWeek] = useState(weekParam ? Number(weekParam) : defaultWeek);
  const [wins, setWins] = useState('');
  const [improvements, setImprovements] = useState('');
  const [insights, setInsights] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!cycle) return;
    const review = queries.getWeeklyReview(cycle.id, selectedWeek);
    if (review) {
      setWins(review.wins);
      setImprovements(review.improvements);
      setInsights(review.insights);
    } else {
      setWins('');
      setImprovements('');
      setInsights('');
    }
  }, [cycle, selectedWeek, queries]);

  if (!cycle) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Weekly Review</Typography>
        <Alert severity="info">No active cycle. Create or activate a cycle first.</Alert>
      </Box>
    );
  }

  const weekScore = queries.getWeekScore(cycle.id, selectedWeek);

  const handleSave = async () => {
    await queries.saveWeeklyReview(cycle.id, selectedWeek, { wins, improvements, insights });
    setSaved(true);
    refresh();
  };

  const handleWeekChange = (_: unknown, value: number | null) => {
    if (value !== null) {
      setSelectedWeek(value);
      setSearchParams({ week: String(value) });
    }
  };

  // Get all reviews for the history panel
  const allReviews = queries.getAllWeeklyReviews(cycle.id);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4">Weekly Review</Typography>
          <Typography variant="body2" color="text.secondary">{cycle.title}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" color={weekScore.total_tactics > 0 ? `${getScoreColor(weekScore.score)}.main` : 'text.disabled'}>
            Week {selectedWeek}: {weekScore.total_tactics > 0 ? `${weekScore.score}%` : '—'}
          </Typography>
        </Box>
      </Box>

      {/* Week Selector */}
      <Box sx={{ mb: 3, overflowX: 'auto' }}>
        <ToggleButtonGroup value={selectedWeek} exclusive onChange={handleWeekChange} size="small">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
            const review = allReviews.find((r) => r.week_number === week);
            return (
              <ToggleButton key={week} value={week} sx={{ minWidth: 48, flexDirection: 'column', py: 0.5 }}>
                <Typography variant="caption" fontWeight={600}>W{week}</Typography>
                {review && <Chip label="✓" size="small" color="success" sx={{ height: 16, fontSize: '0.6rem' }} />}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {/* Review Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Week {selectedWeek} Review</Typography>

              <TextField
                label="🏆 Wins — What went well?"
                placeholder="List your accomplishments and what worked this week..."
                fullWidth
                multiline
                rows={4}
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                sx={{ mb: 3 }}
              />

              <TextField
                label="🔧 Improvements — What could be better?"
                placeholder="What didn't go as planned? What would you do differently?"
                fullWidth
                multiline
                rows={4}
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                sx={{ mb: 3 }}
              />

              <TextField
                label="💡 Insights — Key learnings"
                placeholder="What did you learn? What adjustments will you make?"
                fullWidth
                multiline
                rows={4}
                value={insights}
                onChange={(e) => setInsights(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} size="large">
                Save Review
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Review History */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Review History</Typography>
              {allReviews.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No reviews written yet.
                </Typography>
              ) : (
                allReviews.map((review) => {
                  const ws = queries.getWeekScore(cycle.id, review.week_number);
                  return (
                    <Box key={review.id} sx={{ mb: 2 }}>
                      <Box
                        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedWeek(review.week_number);
                          setSearchParams({ week: String(review.week_number) });
                        }}
                      >
                        <Typography variant="subtitle2">Week {review.week_number}</Typography>
                        <Chip
                          label={ws.total_tactics > 0 ? `${ws.score}%` : '—'}
                          size="small"
                          color={ws.total_tactics > 0 ? getScoreColor(ws.score) : 'default'}
                        />
                      </Box>
                      {review.wins && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          🏆 {review.wins.split('\n')[0]}
                        </Typography>
                      )}
                      <Divider sx={{ mt: 1 }} />
                    </Box>
                  );
                })
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        message="Review saved!"
      />
    </Box>
  );
}
