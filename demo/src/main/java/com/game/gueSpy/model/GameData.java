package com.game.gueSpy.model;

import java.util.List;
import java.util.Map;

import com.game.gueSpy.enums.ScreenType;
import com.game.gueSpy.enums.Winner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class GameData {
    private Long selectedCategoryId;
    private Long selectedWordId;
    private Long selectedGroupId;
    private Integer numberOfSpy;
    private List<Integer> currentSpy;
    private Integer currentPlayerNumber;
    private ScreenType currentScreenType;
    private Long discussionStartTime;
    private VotingData votingData;
    private Integer caughtSpy;            // spy voted out, awaiting their guess decision (SPY_GUESS)
    private Integer lastEliminatedPlayer; // most recent player voted out (ROUND_END screen)
    private Integer roundNumber;          // 1-based voting round counter
    private Winner winner;                // set when the game ends (SCORING)
    private Map<Integer, Integer> currentScore; // playerNumber -> cumulative score
}
