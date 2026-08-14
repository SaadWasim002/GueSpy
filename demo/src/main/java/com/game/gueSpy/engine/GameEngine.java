package com.game.gueSpy.engine;

import org.springframework.http.ResponseEntity;

import com.game.gueSpy.dto.request.GameOptionRequest;
import com.game.gueSpy.enums.GameType;

/**
 * A playable game plugged into the platform. Each game provides one
 * implementation; the {@code GameEngineRegistry} routes a session to the right
 * one by {@link #type()}.
 *
 * <p>The operations below currently mirror the GueSpy (spy) game's flow — they
 * are intentionally shaped by the only game we have. When a second game arrives
 * this contract will be generalised (e.g. a generic {@code handleAction}); until
 * then we avoid speculative generality. Methods still return
 * {@link ResponseEntity} for now; that will move to plain DTOs later.
 */
public interface GameEngine {

    /** The game this engine implements. */
    GameType type();

    ResponseEntity<?> gameOptionEngine(GameOptionRequest request, Long userId);

    ResponseEntity<?> resetGame(Long userId);

    ResponseEntity<?> roleReveal(Long userId);

    ResponseEntity<?> getGameStatus(Long userId);

    ResponseEntity<?> getVotingScreen(Long userId);

    ResponseEntity<?> vote(Long userId, Integer playerId);

    ResponseEntity<?> nextRound(Long userId);
}
