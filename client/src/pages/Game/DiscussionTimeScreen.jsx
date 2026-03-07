import React, { useState, useEffect } from 'react';
import { useGame } from '../../hooks/useGame';
import { useCountdown } from '../../hooks/useCountdown';
import { getConfigs } from '../../services/configService';
import { getScreen } from '../../services/gameService';
import './DiscussionTimeScreen.css';

// Assuming a reusable LoadingSpinner component exists
// import LoadingSpinner from '../../components/common/LoadingSpinner';
const DiscussionTimeScreen = () => {
    // Get game state and update function from the Game context
    const { screenData, group, fetchScreen } = useGame();

    const discussionStartTime = screenData?.discussionStartTime;
    console.log("Discussion: " + discussionStartTime);
    const players = screenData?.players || [];

    // Local state for the component
    const [duration, setDuration] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [polling, setPolling] = useState(false);

    // Effect to fetch discussion duration from config API
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await getConfigs();
                const configs = response.data.data.configs || [];
                const durationConfig = configs.find(c => c.key === 'discussion_duration');
                if (durationConfig && durationConfig.value) {
                    const value = Number(durationConfig.value);
                    console.log("DiscussionDuration from API:", value);
                    setDuration(value);
                } else {
                    console.warn('discussion_duration config not found, using fallback.');
                    setDuration(300); // Fallback: 300 seconds = 5 minutes
                }
            } catch (error) {
                console.error("Failed to fetch discussion duration", error);
                // A global error handler/toast should inform the user
                setDuration(300); // Use fallback on error
            }
        };

        fetchConfig();
    }, []);

    // Effect to calculate the timer's end time
    useEffect(() => {
        if (discussionStartTime && duration !== null) {
            const end = Number(discussionStartTime) + (duration * 1000);
            setEndTime(end);
        }
    }, [discussionStartTime, duration]);

    const { minutes, seconds, isFinished } = useCountdown(endTime);

    // Effect to start polling when the countdown finishes
    useEffect(() => {
        if (isFinished && endTime !== null) {
            setPolling(true);
        }
    }, [isFinished, endTime]);

    // Effect for polling the game status
    useEffect(() => {
        if (!polling) return;

        const poll = async () => {
            try {
                const response = await getScreen();
                // When status changes, update state and stop polling
                if (response.data.data.gameStatus !== 'DISCUSSION_TIME') {
                    // fetchScreen will update the global game state via context,
                    // causing GamePage to render the correct new screen.
                    await fetchScreen();
                    return true; // Signal to stop
                }
            } catch (error) {
                console.error("Polling for game status failed", error);
            }
            return false; // Signal to continue
        };

        const intervalId = setInterval(async () => {
            const shouldStop = await poll();
            if (shouldStop) {
                clearInterval(intervalId);
            }
        }, 1000); // Poll every 1 second as per PRD

        return () => clearInterval(intervalId);
    }, [polling, fetchScreen]);

    return (
        <div className="discussion-container">
            <h1 className="discussion-title">Discussion Time</h1>
            <div className={polling ? "timer-display waiting" : "timer-display"}>
                {polling ? (
                    <p>Time's up! Waiting for voting to start...</p>
                ) : (
                    <p>
                        <span>{String(minutes).padStart(2, '0')}</span>:
                        <span>{String(seconds).padStart(2, '0')}</span>
                    </p>
                )}
            </div>
            <div className="players-section">
                <h2 className="players-title">Players</h2>
                <ul className="players-list">
                    {players.map((player, index) => (
                        <li key={index} className="player-item">{player}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DiscussionTimeScreen;