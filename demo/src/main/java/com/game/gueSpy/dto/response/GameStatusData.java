package com.game.gueSpy.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.game.gueSpy.enums.GameStatus;

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
}