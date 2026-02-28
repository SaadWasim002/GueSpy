package com.game.gueSpy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerDetails{
    private Integer playerNumber;
    private String playerName;
    private Boolean isSpy;
}