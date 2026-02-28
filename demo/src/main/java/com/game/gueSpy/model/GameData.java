package com.game.gueSpy.model;

import java.util.List;

import com.game.gueSpy.enums.ScreenType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class GameData {
    private Long selectedCategoryId;
    private Long selectedWordId;
    private Long selectedGroupId;
    private Integer numberOfSpy;
    private List<Integer> currentSpy;
    private Integer currentPlayerNumber;
    private ScreenType currentScreenType;
}
