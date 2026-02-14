package com.game.gueSpy.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.GameOptionRequest;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.service.GameEngineService;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/game-engine")
public class GameEngineController {
    
    @Autowired
    private GameEngineService gameEngineService;

    @PostMapping(
        path = "/game-option",
        name = "select game option",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> gameOption(@RequestHeader(value = "X-User-Id", required = true) Long userId, @RequestBody GameOptionRequest request){
        try {
            return gameEngineService.gameOptionEngine(request, userId);
        } catch (Exception e) {
            log.error("Failed to select game options {}", e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR, response);
        }
    }

     @PostMapping(
        path = "/reset",
        name = "reset game",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> reset(@RequestHeader(value = "X-User-Id", required = true) Long userId){
        try {
            return gameEngineService.resetGame(userId);
        } catch (Exception e) {
            log.error("Failed to reset game{}", e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR, response);
        }
    }
}
