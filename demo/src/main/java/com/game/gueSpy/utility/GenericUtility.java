package com.game.gueSpy.utility;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.entity.Group;
import com.game.gueSpy.entity.UserGameDetail;
import com.game.gueSpy.enums.GameStatus;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.repository.GroupRepository;

@Component
public class GenericUtility {

    @Autowired
    private GroupRepository groupRepository;
    
    public static ResponseEntity<?> buildResponse(ResponseEnum responseEnum, Object response){
        return ResponseEntity.status(responseEnum.getStatus())
                .body(response);
    }

    public static GenericResponse buildGenericResponse(ResponseEnum responseEnum) {
        return GenericResponse.builder()
                .status(responseEnum.getStatus())
                .message(responseEnum.getMessage())
                .build();
    }

    public static boolean isValidGameStatus(GameStatus currentGameStatus, GameStatus expectedGameStatus){
        return currentGameStatus == expectedGameStatus;
    }

    public List<String> getPlayerNames(UserGameDetail userGameDetail){
        Long groupId = userGameDetail.getGameData().getSelectedGroupId();
        var groupOptional = groupRepository.findById(groupId);
        Group group = groupOptional.get();
        return group.getPlayers().getPlayerNames();
    }
}
