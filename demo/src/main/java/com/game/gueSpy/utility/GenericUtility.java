package com.game.gueSpy.utility;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class GenericUtility {
    
    public static ResponseEntity<?> buildResponse(HttpStatus status, Object response){
        return ResponseEntity.status(status)
                .body(response);
    }
}
