package com.game.gueSpy.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * The tunable scoring rules, stored as a single JSON row in app_config
 * (key {@code scoring_config}) and deserialised into this object.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoringConfig {
    /** X: minimum active players required to start another round. */
    private int minPlayersToContinue;
    /** Points each spy gains for every round they survive (an innocent is out). */
    private int spyPointsPerRound;
    /** Points each innocent loses for every surviving round. */
    private int innocentPointsPerRound;
    /** Bonus to each spy when the spy team wins. */
    private int spyWinBonus;
    /** Bonus to each innocent when the innocents win. */
    private int innocentWinBonus;
}
