import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import InputField from '../common/InputField';
import Button from '../common/Button';
import { createGroup, updateGroup } from '../../services/groupService';
import { getConfigs } from '../../services/configService';
import './GroupFormModal.css';

const GroupFormModal = ({ isOpen, onClose, onSave, groupToEdit }) => {
  const [groupName, setGroupName] = useState('');
  const [players, setPlayers] = useState(['']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ min: 2, max: 10 }); // Default values

  const isEditMode = !!groupToEdit;

  useEffect(() => {
    // Fetch player limits from config
    getConfigs()
      .then(response => {
        const configData = response.data.configs || [];
        const min = configData.find(c => c.key === 'min_player_allowed_in_group')?.value || 2;
        const max = configData.find(c => c.key === 'max_player_allowed_in_group')?.value || 10;
        setConfig({ min: parseInt(min, 10), max: parseInt(max, 10) });
      })
      .catch(() => {
        console.warn("Could not fetch group player limits. Using defaults.");
      });

    if (isEditMode) {
      setGroupName(groupToEdit.groupName);
      setPlayers(groupToEdit.players.playerNames);
    } else {
      // Reset form for create mode
      setGroupName('');
      setPlayers(['']);
    }
    setError('');
  }, [isOpen, groupToEdit, isEditMode]);

  const handlePlayerChange = (index, value) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    if (players.length < config.max) {
      setPlayers([...players, '']);
    } else {
      setError(`You can have a maximum of ${config.max} players.`);
    }
  };

  const removePlayer = (index) => {
    if (players.length > 1) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }

    const filledPlayers = players.filter(p => p.trim() !== '');
    if (filledPlayers.length < config.min) {
      setError(`You need at least ${config.min} players.`);
      return;
    }
    if (filledPlayers.length > config.max) {
      setError(`You can have a maximum of ${config.max} players.`);
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        // PRD specifies a nested structure for update
        const payload = {
          group: {
            id: groupToEdit.id,
            userId: groupToEdit.userId, // Assuming this is available
            groupName: groupName,
            players: {
              playerNames: filledPlayers
            }
          }
        };
        await updateGroup(groupToEdit.id, payload);
      } else {
        const payload = {
          group_name: groupName,
          players: filledPlayers
        };
        await createGroup(payload);
      }
      onSave(); // Callback to refresh parent component
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError('A group with this name already exists.');
      else if (status === 400) setError('Invalid data. Please check player limits.');
      else setError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filledPlayerCount = players.filter((p) => p.trim() !== "").length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Group' : 'Create New Group'}>
      <form onSubmit={handleSubmit} className="group-form">
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <InputField
            name="groupName"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <label className="players-label">Players</label>
        {players.map((player, index) => (
          <div key={index} className="player-input-row">
            <InputField
              name={`player-${index}`}
              placeholder={`Player ${index + 1} Name`}
              value={player}
              onChange={(e) => handlePlayerChange(index, e.target.value)}
            />
            {players.length > 1 && (
              <button type="button" onClick={() => removePlayer(index)} className="remove-player-btn">-</button>
            )}
          </div>
        ))}

        <button type="button" onClick={addPlayer} className="add-player-btn" disabled={players.length >= config.max}>
          + Add Player
        </button>

        <div className="form-actions">
          <Button
            type="submit"
            disabled={
              loading ||
              !groupName.trim() ||
              filledPlayerCount < config.min ||
              filledPlayerCount > config.max
            }
          >
            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Group')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GroupFormModal;