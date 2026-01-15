package com.game.gueSpy.utility;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.enums.ResponseEnum;

public class GenericUtility {
    
    public static ResponseEntity<?> buildResponse(HttpStatus status, Object response){
        return ResponseEntity.status(status)
                .body(response);
    }

    public static GenericResponse buildGenericResponse(ResponseEnum responseEnum) {
        return GenericResponse.builder()
                .status(responseEnum.getStatus())
                .message(responseEnum.getMessage())
                .build();
    }
}
