package com.game.gueSpy.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WordsAddedResponse {
    private List<String> added;    // words actually inserted
    private List<String> skipped;  // words ignored as duplicates
}
