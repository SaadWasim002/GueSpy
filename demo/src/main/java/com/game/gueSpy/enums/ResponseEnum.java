package com.game.gueSpy.enums;

import org.springframework.http.HttpStatus;

import com.game.gueSpy.constant.MessageConstants;

public enum ResponseEnum {

    //registration
    USER_REGISTRATION_SUCCESS(MessageConstants.userRegistrationSuccess, HttpStatus.CREATED),
    USER_REGISTRATION_FAILURE(MessageConstants.userRegistrationFailure, HttpStatus.BAD_REQUEST),
    USER_ALREADY_EXIST(MessageConstants.userAlreadyExist, HttpStatus.CONFLICT),

    //login
    LOGIN_SUCCESS(MessageConstants.loginSuccess, HttpStatus.OK),
    LOGIN_FAILURE(MessageConstants.loginFailure, HttpStatus.UNAUTHORIZED),
    USER_NOT_EXISTS(MessageConstants.userNotExists, HttpStatus.NOT_FOUND),

    //Category
    CATEGORY_CREATE_SUCCESS(MessageConstants.categoryCreationSuccess, HttpStatus.CREATED),
    CATEGORY_ALREADY_EXISTS(MessageConstants.categoryAlreadyExist, HttpStatus.CONFLICT),
    CATEGORY_DELETED(MessageConstants.categoryDeleted, HttpStatus.OK),
    CATEGORY_NOT_EXISTS(MessageConstants.categoryNotExists, HttpStatus.NOT_FOUND),
    CATEGORY_UPDATED(MessageConstants.categoryUpdated, HttpStatus.OK),
    CATEGORY_RETRIEVED(MessageConstants.categoriesRetrieved, HttpStatus.OK),
    NO_CATEGORY_FOUND(MessageConstants.noCategoryFound, HttpStatus.NOT_FOUND),
    CATEGORY_SELECTED(MessageConstants.categorySelected, HttpStatus.OK),

    //Word
    WORD_ADDED(MessageConstants.wordAdded, HttpStatus.CREATED),
    WORD_DELETED(MessageConstants.wordDeleted, HttpStatus.OK),
    WORD_ID_NOT_EXISTS(MessageConstants.wordIdNotExists, HttpStatus.NOT_FOUND),
    WORD_RETRIEVED(MessageConstants.wordRetrieved, HttpStatus.OK),
    NO_WORD_FOUND(MessageConstants.noWordFound, HttpStatus.NOT_FOUND),
    WORD_ALREADY_EXISTS(MessageConstants.wordAlreadyExist, HttpStatus.CONFLICT),

    //Group
    GROUP_CREATED(MessageConstants.groupCreationSuccess, HttpStatus.CREATED),
    GROUP_ALREADY_EXISTS(MessageConstants.groupAlreadyExist, HttpStatus.CONFLICT),
    GROUP_RETRIEVED(MessageConstants.groupRetrieved, HttpStatus.OK),
    NO_GROUP_FOUND(MessageConstants.noGroupFound, HttpStatus.NOT_FOUND),
    GROUP_SELECTED(MessageConstants.groupSelected, HttpStatus.OK),

    //Config
    CONFIG_CREATED(MessageConstants.configCreated, HttpStatus.CREATED),
    CONFIG_REFRESHED(MessageConstants.configRefreshed, HttpStatus.OK),
    CONFIG_ALREADY_EXISTS(MessageConstants.configAlreadyExists, HttpStatus.CONFLICT),
    CONFIG_UPDATED(MessageConstants.configUpdated, HttpStatus.OK),
    CONFIG_NOT_EXISTS(MessageConstants.configNotExists, HttpStatus.NOT_FOUND),
    CONFIG_RETRIEVED(MessageConstants.configRetrieved, HttpStatus.OK),
    NO_CONFIG_FOUND(MessageConstants.noConfigFound, HttpStatus.NOT_FOUND),

    //USER_GAME_DETAILS
    INVALID_GAME_STATUS(MessageConstants.invalidGameStatus, HttpStatus.BAD_REQUEST),
    USER_GAME_DETAILS_NOT_EXISTS(MessageConstants.userGameDetailNotExists, HttpStatus.NOT_FOUND),

    //GAME_ENGINE
    GAME_ENGINE_SUCCESS(MessageConstants.gameEngineSuccess, HttpStatus.OK),
    GAME_RESET_SUCCESS(MessageConstants.gameResetSuccess, HttpStatus.OK),
    ROLE_REVEAL_SCREEN_SUCCESS(MessageConstants.roleRevealScreenSuccess, HttpStatus.OK),
    GAME_STATUS_SUCCESS(MessageConstants.gameStatusSuccess, HttpStatus.OK),
    VOTING_SCREEN_SUCCESS(MessageConstants.votingScreenSuccess , HttpStatus.OK),
    VOTING_SUCCESS(MessageConstants.votingSuccess , HttpStatus.OK),

    VALUES_MISSING(MessageConstants.valueMissing, HttpStatus.BAD_REQUEST),
    INTERNAL_SERVER_ERROR(MessageConstants.internalServerError, HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(MessageConstants.unauthorized, HttpStatus.UNAUTHORIZED),
    INVALID_DATA(MessageConstants.invalidData, HttpStatus.OK),
    TESTING(MessageConstants.testing, HttpStatus.OK);
    
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
