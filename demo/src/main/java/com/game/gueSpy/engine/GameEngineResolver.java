package com.game.gueSpy.engine;

import org.springframework.stereotype.Component;

import com.game.gueSpy.enums.GameType;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.exception.GameException;
import com.game.gueSpy.repository.UserGameDetailsRepository;

import lombok.RequiredArgsConstructor;

/**
 * Resolves which {@link GameEngine} should handle a given user's request by
 * looking up the game type recorded on their session, then asking the registry.
 * Keeps the controller free of any per-game knowledge.
 */
@Component
@RequiredArgsConstructor
public class GameEngineResolver {

    private final UserGameDetailsRepository userGameDetailsRepository;
    private final GameEngineRegistry registry;

    public GameEngine resolveForUser(Long userId) {
        GameType type = userGameDetailsRepository.findGameTypeByUserId(userId)
                .orElseThrow(() -> new GameException(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS));
        return registry.forType(type);
    }
}
