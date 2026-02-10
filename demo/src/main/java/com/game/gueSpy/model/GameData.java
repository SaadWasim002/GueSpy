package com.game.gueSpy.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameData {
    private Long selectedCategoryId;
    private Long selectedWordId;
    private Long selectedGroupId;
    private Integer numberOfSpy;
    private List<Long> currentSpy;
}
