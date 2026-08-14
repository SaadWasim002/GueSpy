package com.game.gueSpy.engine;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.game.gueSpy.enums.GameType;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.exception.GameException;

/**
 * Holds every {@link GameEngine} bean keyed by its {@link GameType}. Spring
 * injects all engines, so registering a new game is just adding a bean — no
 * change here. Adding a game becomes: new GameType value + new GameEngine bean.
 */
@Component
public class GameEngineRegistry {

    private final Map<GameType, GameEngine> enginesByType;

    public GameEngineRegistry(List<GameEngine> engines) {
        this.enginesByType = engines.stream()
                .collect(Collectors.toMap(GameEngine::type, Function.identity()));
    }

    public GameEngine forType(GameType type) {
        GameEngine engine = enginesByType.get(type);
        if (engine == null) {
            throw new GameException(ResponseEnum.UNSUPPORTED_GAME_TYPE);
        }
        return engine;
    }
}
