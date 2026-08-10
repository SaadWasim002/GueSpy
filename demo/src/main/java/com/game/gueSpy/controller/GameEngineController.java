package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.GameOptionRequest;
import com.game.gueSpy.security.UserPrincipal;
import com.game.gueSpy.service.GameEngineService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/game-engine")
@RequiredArgsConstructor
public class GameEngineController {

    private final GameEngineService gameEngineService;

    @PostMapping(
        path = "/game-option",
        name = "select game option",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> gameOption(@AuthenticationPrincipal UserPrincipal principal, @RequestBody GameOptionRequest request){
        return gameEngineService.gameOptionEngine(request, principal.userId());
    }

    @PostMapping(
        path = "/reset",
        name = "reset game",
        produces = "application/json"
    )
    public ResponseEntity<?> reset(@AuthenticationPrincipal UserPrincipal principal){
        return gameEngineService.resetGame(principal.userId());
    }

    @GetMapping(
        path = "/role-reveal",
        name = "role reveal",
        produces = "application/json"
    )
    public ResponseEntity<?> reveal(@AuthenticationPrincipal UserPrincipal principal){
        return gameEngineService.roleReveal(principal.userId());
    }

    @GetMapping(
        path = "/get-screen",
        name = "get the current game status",
        produces = "application/json"
    )
    public ResponseEntity<?> getScreen(@AuthenticationPrincipal UserPrincipal principal){
        return gameEngineService.getGameStatus(principal.userId());
    }

    @GetMapping(
        path = "/voting",
        name = "get the current voting Screen",
        produces = "application/json"
    )
    public ResponseEntity<?> votingScreen(@AuthenticationPrincipal UserPrincipal principal){
        return gameEngineService.getVotingScreen(principal.userId());
    }

    @PostMapping(
        path = "/vote",
        name = "voting",
        produces = "application/json"
    )
    public ResponseEntity<?> vote(@AuthenticationPrincipal UserPrincipal principal, @RequestParam(value = "player_id", required = true) Integer playerId){
        return gameEngineService.vote(principal.userId(), playerId);
    }
}
