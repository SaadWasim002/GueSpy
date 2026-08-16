package com.game.gueSpy.dto.request;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WordRequest {
    @NotNull
    @JsonProperty("category_id")
    private Long categoryId;

    // one or more words to add in a single call; blank entries are ignored and
    // duplicates (already in the category, or repeated in the list) are skipped
    @NotEmpty
    @JsonProperty("words")
    private List<String> words;
}
