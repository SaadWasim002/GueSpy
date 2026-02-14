package com.game.gueSpy.dto.response;

import com.game.gueSpy.enums.ScreenType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenData{
    private PlayerDetails playerDetails;
    private ScreenType screenType;
    private String displayText;
    private String roleDescriptionText;
}
