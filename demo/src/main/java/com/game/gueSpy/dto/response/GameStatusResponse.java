package com.game.gueSpy.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.enums.GameStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper=true)
@AllArgsConstructor
public class GameStatusResponse extends GenericResponse{
    private GameStatus gameStatus;

    @JsonProperty("data")
    private DataResponse data;
}
