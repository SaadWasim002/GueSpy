package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.GameOptionRequest;
import com.game.gueSpy.dto.request.GameStateRequest;
import com.game.gueSpy.dto.request.SpyGuessRequest;
import com.game.gueSpy.dto.request.VoteRequest;
import com.game.gueSpy.engine.GameEngineResolver;
import com.game.gueSpy.security.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/game")
@RequiredArgsConstructor
public class GameEngineController {

    private final GameEngineResolver gameEngineResolver;

    /** GET /api/v1/game/state — current game status and state-specific fields. */
    @GetMapping(
        path = "/state",
        name = "get the current game state",
        produces = "application/json"
    )
    public ResponseEntity<?> getGameState(@AuthenticationPrincipal UserPrincipal principal){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).getGameStatus(userId);
    }

    /** POST /api/v1/game/state — navigate back or forward (action: back | forward). */
    @PostMapping(
        path = "/state",
        name = "navigate the game state (back / forward)",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> navigateGameState(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody GameStateRequest request){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).navigateGameState(userId, request.getAction());
    }

    /** POST /api/v1/game/reset — wipe progress and return to category selection. */
    @PostMapping(
        path = "/reset",
        name = "reset game",
        produces = "application/json"
    )
    public ResponseEntity<?> reset(@AuthenticationPrincipal UserPrincipal principal){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).resetGame(userId);
    }

    /** POST /api/v1/game/options — set the number of spies and deal the round. */
    @PostMapping(
        path = "/options",
        name = "select game option",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> gameOption(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody GameOptionRequest request){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).gameOptionEngine(request, userId);
    }

    /** GET /api/v1/game/role-reveal — advances the role-reveal cursor for the next player. */
    @GetMapping(
        path = "/role-reveal",
        name = "role reveal",
        produces = "application/json"
    )
    public ResponseEntity<?> reveal(@AuthenticationPrincipal UserPrincipal principal){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).roleReveal(userId);
    }

    /** GET /api/v1/game/voting — current voter's screen data. */
    @GetMapping(
        path = "/voting",
        name = "get the current voting screen",
        produces = "application/json"
    )
    public ResponseEntity<?> votingScreen(@AuthenticationPrincipal UserPrincipal principal){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).getVotingScreen(userId);
    }

    /** POST /api/v1/game/votes — cast a vote. Body: { "player_id": N } */
    @PostMapping(
        path = "/votes",
        name = "cast a vote",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> vote(@AuthenticationPrincipal UserPrincipal principal,
                                  @Valid @RequestBody VoteRequest request){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).vote(userId, request.getPlayerId());
    }

    /** POST /api/v1/game/rounds/next — advance from ROUND_END into the next round. */
    @PostMapping(
        path = "/rounds/next",
        name = "advance to the next round",
        produces = "application/json"
    )
    public ResponseEntity<?> nextRound(@AuthenticationPrincipal UserPrincipal principal){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).nextRound(userId);
    }

    /** POST /api/v1/game/spy/guess — caught spy guesses the secret word. */
    @PostMapping(
        path = "/spy/guess",
        name = "spy guesses the word",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> spyGuess(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody SpyGuessRequest request){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).spyGuess(userId, request.getWord());
    }

    /** POST /api/v1/game/spy/decline — caught spy declines to guess. */
    @PostMapping(
        path = "/spy/decline",
        name = "spy declines to guess",
        produces = "application/json"
    )
    public ResponseEntity<?> spyDecline(@AuthenticationPrincipal UserPrincipal principal){
        Long userId = principal.userId();
        return gameEngineResolver.resolveForUser(userId).spyDecline(userId);
    }
}
