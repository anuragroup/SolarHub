import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";

import AppLayout from "./components/layout/AppLayout";
import { useAuth } from "./context/AuthContext";


function App() {
  const { user, loading, login, logout } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoginLoading(true);

      await login(username, password);
    } catch (error: any) {
      console.error("LOGIN ERROR:", error);
      console.error("SERVER RESPONSE:", error.response?.data);

      setError(
        error.response?.data?.detail ||
          error.response?.data?.username?.[0] ||
          error.response?.data?.password?.[0] ||
          "Login failed. Please check your username and password."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (user) {
    return <AppLayout onLogout={logout} />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        px: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              component="h1"
              variant="h4"
              color="primary"
              fontWeight={700}
              gutterBottom
            >
              SolarHub
            </Typography>

            <Typography
              component="p"
              variant="body2"
              color="text.secondary"
            >
              Solar Asset & Maintenance Management System
            </Typography>
          </Box>

          <Typography
            component="h2"
            variant="h5"
            sx={{ mb: 3 }}
          >
            Sign in
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Username"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            margin="normal"
            autoComplete="username"
            fullWidth
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            margin="normal"
            autoComplete="current-password"
            fullWidth
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 3 }}
            onClick={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? (
              <CircularProgress
                size={24}
                color="inherit"
              />
            ) : (
              "Sign In"
            )}
          </Button>

          <Typography
            component="p"
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 3,
              textAlign: "center",
            }}
          >
            SolarHub Management Platform
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default App;