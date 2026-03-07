import React, { useState, useEffect, useCallback } from 'react';
import { getGroups, selectGroup, deleteGroup } from '../../services/groupService';
import { getConfigs } from '../../services/configService';
import { useGame } from '../../hooks/useGame';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import GroupFormModal from '../../components/game/GroupFormModal';
import './GroupSelectionScreen.css';

const GroupSelectionScreen = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { fetchScreen } = useGame();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState(null);
  const [maxGroups, setMaxGroups] = useState(10);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsResponse, configResponse] = await Promise.all([getGroups(), getConfigs()]);
      // API response wraps the array in a `groups` or `configs` property.
      setGroups(groupsResponse.data.data.groups || []);
      const max = (configResponse.data.data.configs || []).find(c => c.key === 'max_group_allowed')?.value || 10;
      setMaxGroups(parseInt(max, 10));
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setGroups([]); // No groups found is not an error state
        setError('No groups found. Start by creating one!');
      } else {
        setError('Failed to load groups.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleSelectGroup = (id) => {
    setSelectedGroupId(id);
  };

  const handleOpenCreateModal = () => {
    setGroupToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (group) => {
    setGroupToEdit(group);
    setIsModalOpen(true);
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await deleteGroup(groupId);
        loadGroups(); // Refresh list
      } catch (err) {
        setError('Failed to delete group.');
        console.error(err);
      }
    }
  };

  const handleFormSave = () => {
    setIsModalOpen(false);
    loadGroups();
  };

  const handleSubmit = async () => {
    if (!selectedGroupId) {
      setError('Please select a group to continue.');
      return;
    }
    setLoading(true);
    try {
      await selectGroup(selectedGroupId);
      await fetchScreen(); // Fetch next game state
    } catch (err) {
      setError('Failed to select group. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  if (loading && groups.length === 0) return <LoadingSpinner />;

  return (
    <div className="group-selection-container">
      <h2>Select or Create a Group</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="group-list">
        {groups.map((group) => (
          <div key={group.id} className={`group-card ${selectedGroupId === group.id ? 'selected' : ''}`} onClick={() => handleSelectGroup(group.id)}>
            <span className="group-name">{group.groupName}</span>
            <div className="group-actions">
              <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(group); }}>Edit</button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="page-actions">
        <Button onClick={handleOpenCreateModal} disabled={groups.length >= maxGroups}>+ Add New Group</Button>
        <Button onClick={handleSubmit} disabled={!selectedGroupId || loading}>{loading ? 'Continuing...' : 'Continue'}</Button>
      </div>

      <GroupFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleFormSave} groupToEdit={groupToEdit} />
    </div>
  );
};

export default GroupSelectionScreen;