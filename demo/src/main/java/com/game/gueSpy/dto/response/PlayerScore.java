package com.game.gueSpy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerScore {
    private Integer playerNumber;
    private String playerName;
    private Integer score;
}
