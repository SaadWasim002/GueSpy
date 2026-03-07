package com.game.gueSpy.dto.response;

import java.util.List;
import com.game.gueSpy.entity.AppConfig;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class AppConfigResponse{ 
    private List<AppConfig> configs;
}