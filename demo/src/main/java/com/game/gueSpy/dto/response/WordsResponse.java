package com.game.gueSpy.dto.response;

import java.util.List;

import com.game.gueSpy.entity.Word;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class WordsResponse{

    private List<Word> words;
    private Integer totalWords;
    private String categoryName;
}
