import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
} from '@mui/material';
import Slider from '@mui/material/Slider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useDatabase } from '../../db/hooks';
import type { Goal, Tactic } from '../../types';

export default function GoalList() {
  const { queries, refresh } = useDatabase();
  const [searchParams] = useSearchParams();
  const cycleIdParam = searchParams.get('cycle');

  const cycle = cycleIdParam
    ? queries.getCycleById(Number(cycleIdParam))
    : queries.getActiveCycle();

  const [goalDialog, setGoalDialog] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [tacticDialog, setTacticDialog] = useState<number | null>(null);
  const [tacticTitle, setTacticTitle] = useState('');
  const [tacticTarget, setTacticTarget] = useState(7);
  const [editTactic, setEditTactic] = useState<Tactic | null>(null);

  if (!cycle) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Goals & Tactics</Typography>
        <Alert severity="info">
          No active cycle. Go to Cycle History to create or activate a cycle.
        </Alert>
      </Box>
    );
  }

  const goals = queries.getGoalsByCycle(cycle.id);

  const handleCreateGoal = async () => {
    if (!goalTitle.trim()) return;
    await queries.createGoal(cycle.id, goalTitle.trim(), goalDescription.trim());
    setGoalDialog(false);
    setGoalTitle('');
    setGoalDescription('');
    refresh();
  };

  const handleUpdateGoal = async () => {
    if (!editGoal || !goalTitle.trim()) return;
    await queries.updateGoal(editGoal.id, { title: goalTitle.trim(), description: goalDescription.trim() });
    setEditGoal(null);
    setGoalTitle('');
    setGoalDescription('');
    refresh();
  };

  const handleDeleteGoal = async (id: number) => {
    await queries.deleteGoal(id);
    refresh();
  };

  const handleCreateTactic = async () => {
    if (!tacticTitle.trim() || tacticDialog === null) return;
    await queries.createTactic(tacticDialog, tacticTitle.trim(), tacticTarget);
    setTacticDialog(null);
    setTacticTitle('');
    setTacticTarget(7);
    refresh();
  };

  const handleUpdateTactic = async () => {
    if (!editTactic || !tacticTitle.trim()) return;
    await queries.updateTactic(editTactic.id, { title: tacticTitle.trim(), weekly_target: tacticTarget });
    setEditTactic(null);
    setTacticTitle('');
    setTacticTarget(7);
    refresh();
  };

  const handleDeleteTactic = async (id: number) => {
    await queries.deleteTactic(id);
    refresh();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4">Goals & Tactics</Typography>
          <Typography variant="body2" color="text.secondary">{cycle.title}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setGoalTitle(''); setGoalDescription(''); setGoalDialog(true); }}>
          Add Goal
        </Button>
      </Box>

      {goals.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No goals yet. Add your first goal — what do you want to achieve in these 12 weeks?
        </Alert>
      )}

      {goals.map((goal, index) => {
        const tactics = queries.getTacticsByGoal(goal.id);

        return (
          <Accordion key={goal.id} defaultExpanded sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, mr: 1 }}>
                <Chip label={`#${index + 1}`} size="small" color="primary" variant="outlined" />
                <Typography variant="subtitle1" fontWeight={600}>{goal.title}</Typography>
                <Chip label={`${tactics.length} tactics`} size="small" variant="outlined" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {goal.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {goal.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    setEditGoal(goal);
                    setGoalTitle(goal.title);
                    setGoalDescription(goal.description);
                  }}
                >
                  Edit Goal
                </Button>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteGoal(goal.id)}>
                  Delete Goal
                </Button>
              </Box>

              <Card variant="outlined">
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Weekly Tactics</Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={() => { setTacticTitle(''); setTacticTarget(7); setTacticDialog(goal.id); }}>
                      Add Tactic
                    </Button>
                  </Box>
                  {tactics.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                      No tactics defined. Add recurring weekly actions that drive this goal.
                    </Typography>
                  ) : (
                    <List dense disablePadding>
                      {tactics.map((tactic) => (
                        <ListItem key={tactic.id} divider sx={{ px: 0 }}>
                          <ListItemText
                            primary={tactic.title}
                            secondary={`${tactic.weekly_target} days / week`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditTactic(tactic);
                                setTacticTitle(tactic.title);
                                setTacticTarget(tactic.weekly_target);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteTactic(tactic.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Create Goal Dialog */}
      <Dialog open={goalDialog} onClose={() => setGoalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Goal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Goal Title"
            placeholder="e.g., Launch MVP by week 8"
            fullWidth
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            placeholder="What does achieving this goal look like?"
            fullWidth
            multiline
            rows={3}
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateGoal} disabled={!goalTitle.trim()}>Add Goal</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={editGoal !== null} onClose={() => setEditGoal(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Goal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Goal Title"
            fullWidth
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGoal(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateGoal} disabled={!goalTitle.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Create Tactic Dialog */}
      <Dialog open={tacticDialog !== null} onClose={() => setTacticDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Tactic</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tactic"
            placeholder="e.g., Write 500 words daily"
            fullWidth
            value={tacticTitle}
            onChange={(e) => setTacticTitle(e.target.value)}
            helperText="A specific, recurring action you'll do weekly to drive your goal."
            sx={{ mb: 3 }}
          />
          <Typography variant="subtitle2" gutterBottom>Weekly Target: {tacticTarget} day{tacticTarget !== 1 ? 's' : ''} / week</Typography>
          <Slider
            value={tacticTarget}
            onChange={(_, v) => setTacticTarget(v as number)}
            min={1}
            max={7}
            step={1}
            marks={[{value:1,label:'1'},{value:2,label:'2'},{value:3,label:'3'},{value:4,label:'4'},{value:5,label:'5'},{value:6,label:'6'},{value:7,label:'7'}]}
            valueLabelDisplay="auto"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTacticDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTactic} disabled={!tacticTitle.trim()}>Add Tactic</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Tactic Dialog */}
      <Dialog open={editTactic !== null} onClose={() => setEditTactic(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Tactic</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tactic"
            fullWidth
            value={tacticTitle}
            onChange={(e) => setTacticTitle(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Typography variant="subtitle2" gutterBottom>Weekly Target: {tacticTarget} day{tacticTarget !== 1 ? 's' : ''} / week</Typography>
          <Slider
            value={tacticTarget}
            onChange={(_, v) => setTacticTarget(v as number)}
            min={1}
            max={7}
            step={1}
            marks={[{value:1,label:'1'},{value:2,label:'2'},{value:3,label:'3'},{value:4,label:'4'},{value:5,label:'5'},{value:6,label:'6'},{value:7,label:'7'}]}
            valueLabelDisplay="auto"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTactic(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateTactic} disabled={!tacticTitle.trim()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
