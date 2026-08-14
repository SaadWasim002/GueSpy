package com.game.gueSpy.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GameOptionRequest {
    @NotNull
    @Min(1)
    @JsonProperty("number_of_spy")
    private Integer numberOfSpy;
}