import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../hooks/useGame';
import { getVotingScreen, castVote } from '../../services/votingService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './VotingScreen.css';

const VotingScreen = () => {
    const { fetchScreen } = useGame();
    const [votingData, setVotingData] = useState(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchVotingData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await getVotingScreen();
            setVotingData(response.data.data);
        } catch (err) {
            console.error("Failed to fetch voting data:", err);
            setError('Failed to load voting screen. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial fetch when component mounts
        fetchVotingData();
    }, [fetchVotingData]);

    const handlePlayerSelect = (playerId) => {
        setSelectedPlayerId(playerId);
    };

    const handleSubmitVote = async () => {
        if (!selectedPlayerId || isSubmitting) return;

        setIsSubmitting(true);
        setError('');
        try {
            await castVote(selectedPlayerId);
            setSelectedPlayerId(null); // Reset selection for the next voter

            if (votingData?.isLast) {
                // This was the last vote, transition to the next game phase
                await fetchScreen();
            } else {
                // Fetch data for the next voter
                await fetchVotingData();
            }
        } catch (err) {
            console.error("Failed to cast vote:", err);
            setError(err.response?.data?.message || 'Failed to submit vote. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        // A simple error display. In a real app, this might be a toast notification.
        return <div className="voting-container"><p style={{ color: 'red' }}>{error}</p></div>;
    }

    if (!votingData) {
        return <div className="voting-container">No voting data available.</div>;
    }

    return (
        <div className="voting-container">
            <h1 className="voting-header">{votingData.displayTextHeader}</h1>
            <p className="voting-instruction">
                <strong>{votingData.currentPlayerName}</strong>, {votingData.displayText}.
            </p>
            <div className="player-grid">
                {votingData.votingList.map((player) => (
                    <div key={player.playerId} className={`player-vote-card ${selectedPlayerId === player.playerId ? 'selected' : ''}`} onClick={() => handlePlayerSelect(player.playerId)}>
                        {player.playerName}
                    </div>
                ))}
            </div>
            <Button onClick={handleSubmitVote} disabled={!selectedPlayerId || isSubmitting} className="submit-vote-button">
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
            </Button>
        </div>
    );
};

export default VotingScreen;