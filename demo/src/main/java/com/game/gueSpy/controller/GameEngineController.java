package com.game.gueSpy.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.GameOptionRequest;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.exception.GameException;
import com.game.gueSpy.service.GameEngineService;
import com.game.gueSpy.security.JwtUtil;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/game-engine")
public class GameEngineController {
    
    @Autowired
    private GameEngineService gameEngineService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping(
        path = "/game-option",
        name = "select game option",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> gameOption(@RequestHeader(value = "Authorization", required = true) String token, @RequestBody GameOptionRequest request){
        try {
            Long userId = jwtUtil.extractUserId(token.substring(7));
            if (userId == null) {
                return GenericUtility.buildResponse(ResponseEnum.USER_NOT_EXISTS);
            }
            return gameEngineService.gameOptionEngine(request, userId);
        } catch (Exception e) {
            log.error("Failed to select game options {}", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(
        path = "/reset",
        name = "reset game",
        produces = "application/json"
    )
    public ResponseEntity<?> reset(@RequestHeader(value = "Authorization", required = true) String token){
        try {
            Long userId = jwtUtil.extractUserId(token.substring(7));
            if (userId == null) {
                return GenericUtility.buildResponse(ResponseEnum.USER_NOT_EXISTS);
            }
            return gameEngineService.resetGame(userId);
        } catch (Exception e) {
            log.error("Failed to reset game{}", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping(
        path = "/role-reveal",
        name = "role reveal",
        produces = "application/json"
    )
    public ResponseEntity<?> reveal(@RequestHeader(value = "Authorization", required = true) String token){
        try {
            Long userId = jwtUtil.extractUserId(token.substring(7));
            if (userId == null) {
                return GenericUtility.buildResponse(ResponseEnum.USER_NOT_EXISTS);
            }
            return gameEngineService.roleReveal(userId);
        } catch (Exception e) {
            log.error("Failed to reveal role{}", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping(
        path = "/get-screen",
        name = "get the current game status",
        produces = "application/json"
    )
    public ResponseEntity<?> getScreen(@RequestHeader(value = "Authorization", required = true) String token){
        try {
            Long userId = jwtUtil.extractUserId(token.substring(7));
            if (userId == null) {
                return GenericUtility.buildResponse(ResponseEnum.USER_NOT_EXISTS);
            }
            return gameEngineService.getGameStatus(userId);
        } catch (Exception e) {
            log.error("Failed to get game status{}", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping(
        path = "/voting",
        name = "get the current voting Screen",
        produces = "application/json"
    )
    public ResponseEntity<?> votingScreen(@RequestHeader(value = "Authorization", required = true) String token){
        Long userId = jwtUtil.extractUserId(token.substring(7));

        if (userId == null) {
            throw new GameException(ResponseEnum.USER_NOT_EXISTS);
        }

        return gameEngineService.getVotingScreen(userId);
    }
}
