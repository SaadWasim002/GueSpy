package com.game.gueSpy.enums;

import org.springframework.http.HttpStatus;

import com.game.gueSpy.constant.MessageConstants;

public enum ResponseEnum {
    
    USER_REGISTRATION_SUCCESS(MessageConstants.userRegistrationSuccess, HttpStatus.CREATED),
    USER_REGISTRATION_FAILURE(MessageConstants.userRegistrationFailure, HttpStatus.BAD_REQUEST),
    USER_ALREADY_EXIST(MessageConstants.userAlreadyExist, HttpStatus.CONFLICT),
    VALUES_MISSING(MessageConstants.valueMissing, HttpStatus.BAD_REQUEST),
    INTERNAL_SERVER_ERROR(MessageConstants.internalServerError, HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(MessageConstants.unauthorized, HttpStatus.UNAUTHORIZED);

    private String message;
    private HttpStatus status;

    ResponseEnum(String message, HttpStatus status){
        this.message = message;
        this.status = status;
    }

    public String getMessage(){
        return message;
    }

    public HttpStatus getStatus(){
        return status;
    }
}
