package com.game.gueSpy.exception;

import com.game.gueSpy.enums.ResponseEnum;

public class GameException extends RuntimeException {

    private final ResponseEnum responseEnum;

    public GameException(ResponseEnum responseEnum) {
        super(responseEnum.getMessage());
        this.responseEnum = responseEnum;
    }

    public ResponseEnum getResponseEnum() {
        return responseEnum;
    }
}