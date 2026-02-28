import { useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Snackbar,
  Divider,
  Link,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import InfoIcon from '@mui/icons-material/Info';
import { useDatabase } from '../../db/hooks';

export default function Settings() {
  const { exportDb, importDb } = useDatabase();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; severity: 'success' | 'error' } | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importDb(file);
      setMessage({ text: 'Database imported successfully! Page will reload.', severity: 'success' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setMessage({ text: `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`, severity: 'error' });
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>

      {/* Data Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Data Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your data is stored locally in your browser using SQLite. Export a backup to keep your data safe, 
            or import a previous backup to restore.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportDb}>
              Export Database (.db)
            </Button>
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
              Import Database (.db)
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".db,.sqlite,.sqlite3"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </Box>

          <Alert severity="warning" sx={{ mt: 2 }}>
            Importing a database will replace ALL current data. Make sure to export a backup first!
          </Alert>
        </CardContent>
      </Card>

      {/* Local Usage */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Use Locally (Offline)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Want to run this app on your own computer without internet? Follow these steps:
          </Typography>
          <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
            <li>
              <Typography variant="body2">
                Clone the repository: <code>git clone https://github.com/Kheng2023/12-week-year.git</code>
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Install dependencies: <code>cd 12-week-year && npm install</code>
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Build the app: <code>npm run build</code>
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Serve locally: <code>npx serve dist</code>
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Open <code>http://localhost:3000/12-week-year/</code> in your browser.
              </Typography>
            </li>
          </Box>
          <Alert severity="info" sx={{ mt: 1 }} icon={<InfoIcon />}>
            As a PWA, this app also works offline after the first visit — just keep the browser tab bookmarked!
          </Alert>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>About</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>12 Week Year Tracker</strong> is based on the book{' '}
            <em>The 12 Week Year</em> by Brian P. Moran and Michael Lennington.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            The core idea: instead of annual goals, set goals for 12-week cycles. Define a clear vision, 
            set measurable goals, break them into weekly tactics, and track your execution score weekly. 
            Aim for <strong>85%+ execution</strong> to stay on track.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This is a free, open-source tool. Your data never leaves your browser — there is no server, 
            no account, no tracking.
          </Typography>
          <Link
            href="https://github.com/Kheng2023/12-week-year"
            target="_blank"
            rel="noopener"
          >
            View on GitHub
          </Link>
        </CardContent>
      </Card>

      <Snackbar
        open={message !== null}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        message={message?.text}
      />
    </Box>
  );
}
