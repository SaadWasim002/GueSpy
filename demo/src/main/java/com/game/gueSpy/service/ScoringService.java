package com.game.gueSpy.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.game.gueSpy.constant.ConfigName;
import com.game.gueSpy.entity.UserGameDetail;
import com.game.gueSpy.enums.Winner;
import com.game.gueSpy.model.GameData;
import com.game.gueSpy.model.ScoringConfig;
import com.game.gueSpy.utility.GenericUtility;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Computes the cumulative {@code currentScore} (playerNumber -> points) using the
 * tunable {@link ScoringConfig}. Two events change scores:
 * <ul>
 *   <li>a round the spies survive (an innocent is voted out): each spy gains,
 *       each innocent loses;</li>
 *   <li>the game ends: the winning side gets its bonus.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScoringService {

    private final ConfigService configService;
    private final GenericUtility genericUtility;

    /** Apply the per-round drift: every spy gains, every innocent loses. */
    public void applyRoundSurvivalDrift(UserGameDetail userGameDetail){
        ScoringConfig config = configService.getJson(ConfigName.scoringConfig, ScoringConfig.class);
        GameData gameData = userGameDetail.getGameData();
        Map<Integer, Integer> scores = ensureScores(userGameDetail);
        List<Integer> spies = gameData.getCurrentSpy();
        int totalPlayers = genericUtility.getPlayerNames(userGameDetail).size();

        for(int playerNumber = 1; playerNumber <= totalPlayers; playerNumber++){
            int delta = spies.contains(playerNumber) ? config.getSpyPointsPerRound()
                                                     : -config.getInnocentPointsPerRound();
            scores.merge(playerNumber, delta, Integer::sum);
        }
        gameData.setCurrentScore(scores);
    }

    /** Apply the end-of-game bonus to the winning side. */
    public void applyWinBonus(UserGameDetail userGameDetail, Winner winner){
        ScoringConfig config = configService.getJson(ConfigName.scoringConfig, ScoringConfig.class);
        GameData gameData = userGameDetail.getGameData();
        Map<Integer, Integer> scores = ensureScores(userGameDetail);
        List<Integer> spies = gameData.getCurrentSpy();
        int totalPlayers = genericUtility.getPlayerNames(userGameDetail).size();

        for(int playerNumber = 1; playerNumber <= totalPlayers; playerNumber++){
            boolean isSpy = spies.contains(playerNumber);
            if(winner == Winner.SPY && isSpy){
                scores.merge(playerNumber, config.getSpyWinBonus(), Integer::sum);
            } else if(winner == Winner.INNOCENT && !isSpy){
                scores.merge(playerNumber, config.getInnocentWinBonus(), Integer::sum);
            }
        }
        gameData.setCurrentScore(scores);
    }

    private Map<Integer, Integer> ensureScores(UserGameDetail userGameDetail){
        GameData gameData = userGameDetail.getGameData();
        Map<Integer, Integer> scores = gameData.getCurrentScore();
        if(scores == null){
            scores = new HashMap<>();
            int totalPlayers = genericUtility.getPlayerNames(userGameDetail).size();
            for(int playerNumber = 1; playerNumber <= totalPlayers; playerNumber++){
                scores.put(playerNumber, 0);
            }
        }
        return scores;
    }
}
