package com.game.gueSpy.converter;

import com.game.gueSpy.model.Player;
import jakarta.persistence.Converter;

@Converter
public class PlayerConverter extends JsonConverter<Player> {
    public PlayerConverter() {
        super(Player.class);
    }
}
