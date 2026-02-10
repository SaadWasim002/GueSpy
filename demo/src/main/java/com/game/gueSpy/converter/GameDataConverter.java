package com.game.gueSpy.converter;

import com.game.gueSpy.model.GameData;

import jakarta.persistence.Converter;

@Converter
public class GameDataConverter extends JsonConverter<GameData> {
    public GameDataConverter() {
        super(GameData.class);
    }
}
