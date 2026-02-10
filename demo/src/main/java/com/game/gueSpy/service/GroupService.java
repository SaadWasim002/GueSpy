package com.game.gueSpy.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.game.gueSpy.dto.GenericResponse;
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
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.GROUP_ALREADY_EXISTS);
                return GenericUtility.buildResponse(ResponseEnum.GROUP_ALREADY_EXISTS, response);
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
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.GROUP_CREATED);
            return GenericUtility.buildResponse(ResponseEnum.GROUP_CREATED, response);
        }
        log.info("request body : {}", request);
        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING, response);
    }

    public ResponseEntity<?> getAllGroupForTheUser(Long userId, Long groupId){
        log.info("User has started get all group flow for the userId: {}", userId);
        if(groupId != null){
            Group group = groupRepository.findById(groupId).get();
            if(group == null){
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.NO_GROUP_FOUND);
                return GenericUtility.buildResponse(ResponseEnum.NO_GROUP_FOUND, response);
            }
            DisplayGroupResponse response = buildDisplayGroupResponse(ResponseEnum.GROUP_RETRIEVED, group);
            return GenericUtility.buildResponse(ResponseEnum.GROUP_RETRIEVED, response);   
        }
        else{
            List<Group> groups = groupRepository.findAllGroupForUser(userId);
        
            if(groups.isEmpty()){
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.NO_GROUP_FOUND);
                return GenericUtility.buildResponse(ResponseEnum.NO_GROUP_FOUND, response);
            }
            log.info("Group retrieved successfully");
            
            DisplayAllGroupResponse response = buildDisplayAllGroupResponse(ResponseEnum.GROUP_RETRIEVED, groups);
            return GenericUtility.buildResponse(ResponseEnum.GROUP_RETRIEVED, response);
        }
       
    }

    @Transactional
    public ResponseEntity<?> selectGroup(Long userId, Long groupId){
        log.info("User has started select group flow");
        if(groupId == null){
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING, response);
        }

        if(groupRepository.findById(groupId).isEmpty()){
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.NO_GROUP_FOUND);
            return GenericUtility.buildResponse(ResponseEnum.NO_GROUP_FOUND, response);
        }

        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if(userGameDetailsOptional.isPresent()){
            UserGameDetail userGameDetail = userGameDetailsOptional.get();
            GameStatus gameStatus = userGameDetail.getGameStatus();
            if(gameStatus == GameStatus.GROUP_SELECTION){
                updateUserGameDetails(userGameDetail, groupId);
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.GROUP_SELECTED);
                return GenericUtility.buildResponse(ResponseEnum.GROUP_SELECTED, response);// category selected
            }
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INVALID_GAME_STATUS);
            return GenericUtility.buildResponse(ResponseEnum.INVALID_GAME_STATUS, response);// Game status not valid to update
        }
        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);
        return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS, response);// User game details doesnt exist for the user

    }

     private DisplayAllGroupResponse buildDisplayAllGroupResponse(ResponseEnum responseEnum, List<Group> groups) {
        return DisplayAllGroupResponse.builder()
                .status(responseEnum.getStatus())
                .message(responseEnum.getMessage())
                .groups(groups)
                .build();
    }

    private DisplayGroupResponse buildDisplayGroupResponse(ResponseEnum responseEnum, Group group) {
        return DisplayGroupResponse.builder()
                .status(responseEnum.getStatus())
                .message(responseEnum.getMessage())
                .group(group)
                .build();
    }

    private void updateUserGameDetails(UserGameDetail userGameDetail, Long groupId){
        GameData gameData = userGameDetail.getGameData();
        gameData.setSelectedGroupId(groupId);
        userGameDetail.setGameData(gameData);
        userGameDetail.setGameStatus(GameStatus.GAME_OPTION_SELECTION);
    }
}
