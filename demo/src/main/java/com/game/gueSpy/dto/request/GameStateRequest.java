package com.game.gueSpy.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GameStateRequest {
    // "back" (to the previous state) or "forward" (only the discussion -> voting skip). Case-insensitive.
    @NotBlank
    @JsonProperty("action")
    private String action;
}
