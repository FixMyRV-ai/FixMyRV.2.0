import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const INACTIVITY_TIMEOUT = 25 * 60 * 1000; // 25 minutes
const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before expiry

export const useSessionManager = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setShowWarning(false);
    navigate("/login");
  }, [navigate]);

  const keepLoggedIn = useCallback(() => {
    resetTimer();
    setShowWarning(false);
  }, [resetTimer]);

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimerOnActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimerOnActivity, true);
    });

    return () => {
      // Cleanup event listeners
      events.forEach(event => {
        document.removeEventListener(event, resetTimerOnActivity, true);
      });
    };
  }, [resetTimer]);

  // Check for session expiration
  useEffect(() => {
    const checkSession = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      // Show warning 2 minutes before expiry
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT - WARNING_TIME && !showWarning) {
        setShowWarning(true);
      }
      
      // Auto logout after inactivity timeout
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        logout();
      }
    };

    const interval = setInterval(checkSession, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, [lastActivity, showWarning, logout]);

  return {
    showWarning,
    keepLoggedIn,
    logout,
    resetTimer
  };
};
