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
import com.game.gueSpy.engine.GameEngineResolver;
import com.game.gueSpy.security.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/game-engine")
@RequiredArgsConstructor
public class GameEngineController {

    private final GameEngineResolver gameEngineResolver;

    @PostMapping(
        path = "/game-option",
        name = "select game option",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> gameOption(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody GameOptionRequest request){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).gameOptionEngine(request, userId);
    }

    @PostMapping(
        path = "/reset",
        name = "reset game",
        produces = "application/json"
    )
    public ResponseEntity<?> reset(@AuthenticationPrincipal UserPrincipal principal){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).resetGame(userId);
    }

    @GetMapping(
        path = "/role-reveal",
        name = "role reveal",
        produces = "application/json"
    )
    public ResponseEntity<?> reveal(@AuthenticationPrincipal UserPrincipal principal){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).roleReveal(userId);
    }

    @GetMapping(
        path = "/get-screen",
        name = "get the current game status",
        produces = "application/json"
    )
    public ResponseEntity<?> getScreen(@AuthenticationPrincipal UserPrincipal principal){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).getGameStatus(userId);
    }

    @GetMapping(
        path = "/voting",
        name = "get the current voting Screen",
        produces = "application/json"
    )
    public ResponseEntity<?> votingScreen(@AuthenticationPrincipal UserPrincipal principal){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).getVotingScreen(userId);
    }

    @PostMapping(
        path = "/vote",
        name = "voting",
        produces = "application/json"
    )
    public ResponseEntity<?> vote(@AuthenticationPrincipal UserPrincipal principal, @RequestParam(value = "player_id", required = true) Integer playerId){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).vote(userId, playerId);
    }

    @PostMapping(
        path = "/next-round",
        name = "advance to the next round",
        produces = "application/json"
    )
    public ResponseEntity<?> nextRound(@AuthenticationPrincipal UserPrincipal principal){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).nextRound(userId);
    }
}
