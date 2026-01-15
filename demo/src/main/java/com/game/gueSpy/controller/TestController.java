package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
public class TestController {
     @GetMapping(
        path = "/test",
        name = "TEST"
    )
    public ResponseEntity<?> testing(){
        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.TESTING);
        return GenericUtility.buildResponse(ResponseEnum.TESTING.getStatus(), response);
    }
}
