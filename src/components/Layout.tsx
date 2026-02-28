import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FlagIcon from '@mui/icons-material/Flag';
import ChecklistIcon from '@mui/icons-material/Checklist';
import RateReviewIcon from '@mui/icons-material/RateReview';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useColorMode } from '../lib/ColorModeContext';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Goals & Tactics', path: '/goals', icon: <FlagIcon /> },
  { label: 'Weekly Scorecard', path: '/scorecard', icon: <ChecklistIcon /> },
  { label: 'Weekly Review', path: '/review', icon: <RateReviewIcon /> },
  { label: 'Cycle History', path: '/cycles', icon: <HistoryIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleColorMode } = useColorMode();

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FlagIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" noWrap sx={{ fontSize: '1.1rem', flexGrow: 1 }}>
          12 Week Year
        </Typography>
        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <IconButton onClick={toggleColorMode} size="small">
            {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <List sx={{ px: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <FlagIcon sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap component="div">
              12 Week Year
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH } }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                borderRight: '1px solid',
                borderColor: 'divider',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: 8, md: 0 },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
