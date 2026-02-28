import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import { useDatabase } from '../../db/hooks';
import { formatDate, calcEndDate, getCurrentWeek, getScoreColor } from '../../lib/utils';

export default function CycleList() {
  const { queries, refresh } = useDatabase();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [vision, setVision] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const cycles = queries.getCycles();

  const handleCreate = async () => {
    if (!title.trim()) return;
    const endDate = calcEndDate(startDate);
    const id = await queries.createCycle(title.trim(), startDate, endDate, vision.trim());
    setOpen(false);
    setTitle('');
    setVision('');
    refresh();
    navigate(`/goals?cycle=${id}`);
  };

  const handleActivate = async (id: number) => {
    await queries.setActiveCycle(id);
    refresh();
  };

  const handleDelete = async (id: number) => {
    await queries.deleteCycle(id);
    setDeleteConfirm(null);
    refresh();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Cycles</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          New Cycle
        </Button>
      </Box>

      {cycles.length === 0 && (
        <Alert severity="info">
          No cycles yet. Create your first 12-week cycle to begin tracking your goals!
        </Alert>
      )}

      <Grid container spacing={2}>
        {cycles.map((cycle) => {
          const currentWeek = getCurrentWeek(cycle.start_date);
          const scores = queries.getAllWeekScores(cycle.id);
          const completed = scores.filter((s) => s.total_tactics > 0 && s.completed_tactics > 0);
          const avg = completed.length > 0
            ? Math.round(completed.reduce((a, s) => a + s.score, 0) / completed.length)
            : 0;
          const goals = queries.getGoalsByCycle(cycle.id);

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cycle.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: cycle.is_active ? '2px solid' : undefined,
                  borderColor: cycle.is_active ? 'primary.main' : undefined,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{cycle.title}</Typography>
                    {cycle.is_active ? (
                      <Chip label="Active" color="primary" size="small" />
                    ) : null}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {formatDate(cycle.start_date)} — {formatDate(cycle.end_date)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Week</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {currentWeek >= 1 && currentWeek <= 12 ? `${currentWeek}/12` : currentWeek === 0 ? 'Not started' : 'Done'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Avg Score</Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={avg > 0 ? `${getScoreColor(avg)}.main` : 'text.secondary'}
                      >
                        {avg > 0 ? `${avg}%` : '—'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Goals</Typography>
                      <Typography variant="body2" fontWeight={600}>{goals.length}</Typography>
                    </Box>
                  </Box>
                  {cycle.vision && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }} noWrap>
                      {cycle.vision}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    {!cycle.is_active && (
                      <Button size="small" startIcon={<PlayArrowIcon />} onClick={() => handleActivate(cycle.id)}>
                        Set Active
                      </Button>
                    )}
                    <Button size="small" onClick={() => navigate(`/goals?cycle=${cycle.id}`)}>
                      View
                    </Button>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteConfirm(cycle.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New 12-Week Cycle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Cycle Title"
            placeholder="e.g., 2026 Q1 Sprint"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Start Date"
            type="date"
            fullWidth
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText={`End date: ${formatDate(calcEndDate(startDate))} (12 weeks)`}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Vision Statement"
            placeholder="What does success look like at the end of these 12 weeks?"
            fullWidth
            multiline
            rows={4}
            value={vision}
            onChange={(e) => setVision(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!title.trim()}>
            Create Cycle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Cycle?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete this cycle and all its goals, tactics, scores, and reviews. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
