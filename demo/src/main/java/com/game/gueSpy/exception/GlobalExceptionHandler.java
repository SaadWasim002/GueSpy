package com.game.gueSpy.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(GameException.class)
    public ResponseEntity<?> handleGameException(GameException ex) {

        ResponseEnum responseEnum = ex.getResponseEnum();

        return GenericUtility.buildResponse(responseEnum);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex){
        log.error("Unexpected error", ex);

        return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
    }
}