import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Alert,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useDatabase } from '../../db/hooks';
import { getCurrentWeek, getScoreColor } from '../../lib/utils';
import { DAY_KEYS, DAY_LABELS, type DayKey, type TacticWithScore } from '../../types';

/** Count how many days are checked for a tactic row */
function daysDone(t: TacticWithScore): number {
  return t.sun + t.mon + t.tue + t.wed + t.thu + t.fri + t.sat;
}

export default function WeeklyScorecard() {
  const { queries, refresh } = useDatabase();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const cycle = queries.getActiveCycle();

  const defaultWeek = cycle ? Math.max(1, Math.min(getCurrentWeek(cycle.start_date), 12)) : 1;
  const weekParam = searchParams.get('week');
  const [selectedWeek, setSelectedWeek] = useState(weekParam ? Number(weekParam) : defaultWeek);

  if (!cycle) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Weekly Scorecard</Typography>
        <Alert severity="info">No active cycle. Create or activate a cycle first.</Alert>
      </Box>
    );
  }

  const scorecard = queries.getWeekScorecard(cycle.id, selectedWeek);
  const weekScore = queries.getWeekScore(cycle.id, selectedWeek);

  // Group by goal
  const grouped = useMemo(() => {
    const map = new Map<number, { goalTitle: string; tactics: typeof scorecard }>();
    for (const item of scorecard) {
      if (!map.has(item.goal_id)) {
        map.set(item.goal_id, { goalTitle: item.goal_title, tactics: [] });
      }
      map.get(item.goal_id)!.tactics.push(item);
    }
    return Array.from(map.entries());
  }, [scorecard]);

  const handleDayToggle = async (tacticId: number, day: DayKey, currentValue: number) => {
    await queries.setDayCompletion(cycle.id, selectedWeek, tacticId, day, currentValue === 0);
    refresh();
  };

  const handleWeekChange = (_: unknown, value: number | null) => {
    if (value !== null) {
      setSelectedWeek(value);
      setSearchParams({ week: String(value) });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4">Weekly Scorecard</Typography>
          <Typography variant="body2" color="text.secondary">{cycle.title}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h3"
            color={weekScore.total_tactics > 0 ? `${getScoreColor(weekScore.score)}.main` : 'text.disabled'}
            fontWeight={700}
          >
            {weekScore.total_tactics > 0 ? `${weekScore.score}%` : '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {weekScore.completed_tactics}/{weekScore.total_tactics} tactics on target
          </Typography>
        </Box>
      </Box>

      {/* Week Selector */}
      <Box sx={{ mb: 3, overflowX: 'auto' }}>
        <ToggleButtonGroup value={selectedWeek} exclusive onChange={handleWeekChange} size="small">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
            const ws = queries.getWeekScore(cycle.id, week);
            const currentWeek = getCurrentWeek(cycle.start_date);
            return (
              <ToggleButton
                key={week}
                value={week}
                sx={{
                  minWidth: 48,
                  flexDirection: 'column',
                  py: 0.5,
                  border: week === currentWeek ? '2px solid' : undefined,
                  borderColor: week === currentWeek ? 'primary.main' : undefined,
                }}
              >
                <Typography variant="caption" fontWeight={600}>W{week}</Typography>
                {ws.total_tactics > 0 && (
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: getScoreColor(ws.score) === 'success' ? 'success.main' : getScoreColor(ws.score) === 'warning' ? 'warning.main' : 'error.main' }}>
                    {ws.score}%
                  </Typography>
                )}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
      </Box>

      {/* Score Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>Week {selectedWeek} Execution</Typography>
            <Chip
              label={weekScore.score >= 85 ? 'On Track' : weekScore.score >= 65 ? 'Needs Improvement' : weekScore.total_tactics > 0 ? 'Critical' : 'No Data'}
              color={weekScore.total_tactics > 0 ? getScoreColor(weekScore.score) : 'default'}
              size="small"
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={weekScore.total_tactics > 0 ? weekScore.score : 0}
            color={weekScore.total_tactics > 0 ? getScoreColor(weekScore.score) : 'inherit'}
            sx={{ height: 12, borderRadius: 6 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">0%</Typography>
            <Typography variant="caption" color="success.main" fontWeight={600}>85% target</Typography>
            <Typography variant="caption" color="text.secondary">100%</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Tactic Daily Checklist */}
      {grouped.length === 0 ? (
        <Alert severity="info">
          No tactics to track. Add goals and tactics in the Goals & Tactics page.
        </Alert>
      ) : (
        grouped.map(([goalId, { goalTitle, tactics }]) => (
          <Card key={goalId} sx={{ mb: 2 }}>
            <CardContent sx={{ p: isSmall ? 1.5 : 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {goalTitle}
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <TableContainer>
                <Table size="small" sx={{ '& th, & td': { px: isSmall ? 0.5 : 1, py: 0.5, textAlign: 'center' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ textAlign: 'left !important', minWidth: isSmall ? 100 : 180 }}>Tactic</TableCell>
                      {DAY_KEYS.map((d) => (
                        <TableCell key={d} sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                          {isSmall ? DAY_LABELS[d][0] : DAY_LABELS[d]}
                        </TableCell>
                      ))}
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Done</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tactics.map((tactic) => {
                      const done = daysDone(tactic);
                      const met = done >= tactic.weekly_target;
                      return (
                        <TableRow key={tactic.tactic_id} sx={{ bgcolor: met ? 'success.50' : undefined }}>
                          <TableCell sx={{ textAlign: 'left !important' }}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: isSmall ? 100 : 220, fontWeight: 500 }}>
                              {tactic.tactic_title}
                            </Typography>
                          </TableCell>
                          {DAY_KEYS.map((day) => (
                            <TableCell key={day} padding="none">
                              <Checkbox
                                size="small"
                                checked={tactic[day] === 1}
                                onChange={() => handleDayToggle(tactic.tactic_id, day, tactic[day])}
                                color="success"
                                sx={{ p: isSmall ? 0.25 : 0.5 }}
                              />
                            </TableCell>
                          ))}
                          <TableCell>
                            <Chip
                              label={`${done}/${tactic.weekly_target}`}
                              size="small"
                              color={met ? 'success' : done > 0 ? 'warning' : 'default'}
                              variant={met ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 600, fontSize: '0.75rem', minWidth: 48 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
