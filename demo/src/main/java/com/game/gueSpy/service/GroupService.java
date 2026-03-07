package com.game.gueSpy.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.game.gueSpy.dto.request.GroupRequest;
import com.game.gueSpy.dto.response.DisplayAllGroupResponse;
import com.game.gueSpy.dto.response.DisplayGroupResponse;
import com.game.gueSpy.entity.Group;
import com.game.gueSpy.entity.UserGameDetail;
import com.game.gueSpy.enums.GameStatus;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.model.GameData;
import com.game.gueSpy.model.Player;
import com.game.gueSpy.repository.GroupRepository;
import com.game.gueSpy.repository.UserGameDetailsRepository;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class GroupService {
    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserGameDetailsRepository userGameDetailsRepository;

    public ResponseEntity<?> createNewGroup(GroupRequest request, Long userId){
        log.info("User has started group creation flow with this request body : {}", request);

        if(request.getGroupName() != null && !request.getGroupName().isEmpty() && request.getPlayers() != null && !request.getPlayers().isEmpty()){
            if(groupRepository.findByGroupNameIgnoreCaseForTheUserId(request.getGroupName(), userId).isPresent()){
                return GenericUtility.buildResponse(ResponseEnum.GROUP_ALREADY_EXISTS);
            }
            Player players = Player.builder()
                    .playerNames(request.getPlayers())
                    .build();

            Group group = Group.builder()
                    .groupName(request.getGroupName())
                    .userId(userId)
                    .players(players)
                    .build();
            groupRepository.save(group);           
            log.info("Group created Successfully");
            return GenericUtility.buildResponse(ResponseEnum.GROUP_CREATED);
        }
        
        log.info("request body : {}", request);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
    }

    public ResponseEntity<?> getAllGroupForTheUser(Long userId, Long groupId){
        log.info("User has started get all group flow for the userId: {}", userId);
        if(groupId != null){
            var groupOptional = groupRepository.findById(groupId);
            if(groupOptional.isEmpty()){
                return GenericUtility.buildResponse(ResponseEnum.NO_GROUP_FOUND);
            }
            Group group = groupOptional.get();
            DisplayGroupResponse groupData = DisplayGroupResponse.builder().group(group).build();
            return GenericUtility.buildResponse(ResponseEnum.GROUP_RETRIEVED, groupData);   
        }
        else{
            List<Group> groups = groupRepository.findAllGroupForUser(userId);
        
            if(groups.isEmpty()){
                return GenericUtility.buildResponse(ResponseEnum.NO_GROUP_FOUND);
            }
            log.info("Group retrieved successfully");
            
            DisplayAllGroupResponse groupData = DisplayAllGroupResponse.builder().groups(groups).build();
            return GenericUtility.buildResponse(ResponseEnum.GROUP_RETRIEVED, groupData);
        }
       
    }

    @Transactional
    public ResponseEntity<?> selectGroup(Long userId, Long groupId){
        log.info("User has started select group flow");
        if(groupId == null){
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }

        if(groupRepository.findById(groupId).isEmpty()){
            return GenericUtility.buildResponse(ResponseEnum.NO_GROUP_FOUND);
        }

        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if(userGameDetailsOptional.isPresent()){
            UserGameDetail userGameDetail = userGameDetailsOptional.get();
            GameStatus gameStatus = userGameDetail.getGameStatus();
            if(gameStatus == GameStatus.GROUP_SELECTION){
                updateUserGameDetails(userGameDetail, groupId);
                return GenericUtility.buildResponse(ResponseEnum.GROUP_SELECTED);// category selected
            }
            return GenericUtility.buildResponse(ResponseEnum.INVALID_GAME_STATUS);// Game status not valid to update
        }
        return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);// User game details doesnt exist for the user

    }

    private void updateUserGameDetails(UserGameDetail userGameDetail, Long groupId){
        GameData gameData = userGameDetail.getGameData();
        gameData.setSelectedGroupId(groupId);
        userGameDetail.setGameData(gameData);
        userGameDetail.setGameStatus(GameStatus.GAME_OPTION_SELECTION);
        userGameDetailsRepository.save(userGameDetail);
    }
}
