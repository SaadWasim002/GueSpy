package com.game.gueSpy.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.game.gueSpy.enums.GameStatus;
import com.game.gueSpy.enums.Winner;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GameStatusData {
    private GameStatus gameStatus;
    private Long discussionStartTime;
    private List<String> players;
    private Integer roundNumber;

    // ROUND_END
    private String eliminatedPlayerName;

    // SPY_GUESS (the spy knows the category but not the word)
    private String caughtSpyName;
    private String categoryName;

    // SCORING (game over — reveal everything)
    private Winner winner;
    private String word;
    private List<String> spies;
    private List<PlayerScore> scores;
}