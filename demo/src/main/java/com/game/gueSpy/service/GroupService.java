package com.game.gueSpy.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.GroupRequest;
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


}
