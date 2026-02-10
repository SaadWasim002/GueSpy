package com.game.gueSpy.converter;

import com.game.gueSpy.model.UsedWords;

import jakarta.persistence.Converter;

@Converter
public class UsedWordsConverter extends JsonConverter<UsedWords> {
    public UsedWordsConverter() {
        super(UsedWords.class);
    }
}
