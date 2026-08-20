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
public class WordUpdateRequest {
    // the word's id comes from the path (PUT /words/{id}), not the body
    @NotBlank
    @JsonProperty("word_name")
    private String wordName;
}
