package com.game.gueSpy.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.GroupRequest;
import com.game.gueSpy.dto.response.DisplayAllGroupResponse;
import com.game.gueSpy.dto.response.DisplayGroupResponse;
import com.game.gueSpy.entity.Group;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.model.Player;
import com.game.gueSpy.repository.GroupRepository;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class GroupService {
    @Autowired
    private GroupRepository groupRepository;

    public ResponseEntity<?> createNewGroup(GroupRequest request, Long userId){
        log.info("User has started group creation flow with this request body : {}", request);

        if(request.getGroupName() != null && !request.getGroupName().isEmpty() && request.getPlayers() != null && !request.getPlayers().isEmpty()){
            if(groupRepository.findByGroupNameIgnoreCase(request.getGroupName()).isPresent()){
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CATEGORY_ALREADY_EXISTS);
                return GenericUtility.buildResponse(ResponseEnum.CATEGORY_ALREADY_EXISTS, response);
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
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CATEGORY_CREATE_SUCCESS);
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_CREATE_SUCCESS, response);
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
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.NO_CATEGORY_FOUND);
                return GenericUtility.buildResponse(ResponseEnum.NO_CATEGORY_FOUND, response);
            }
            DisplayGroupResponse response = buildDisplayGroupResponse(ResponseEnum.CATEGORY_RETRIEVED, group);
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_RETRIEVED, response);   
        }
        else{
            List<Group> groups = groupRepository.findAllGroupForUser(userId);
        
            if(groups.isEmpty()){
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.NO_CATEGORY_FOUND);
                return GenericUtility.buildResponse(ResponseEnum.NO_CATEGORY_FOUND, response);
            }
            log.info("Group retrieved successfully");
            
            DisplayAllGroupResponse response = buildDisplayAllGroupResponse(ResponseEnum.CATEGORY_RETRIEVED, groups);
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_RETRIEVED, response);
        }
       
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
}
