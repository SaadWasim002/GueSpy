package com.game.gueSpy.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.game.gueSpy.dto.AuthRequest;
import com.game.gueSpy.dto.AuthResponse;
import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.entity.User;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.repository.UserRepository;
import com.game.gueSpy.security.JwtUtil;
import com.game.gueSpy.service.AuthService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;

    @PostMapping(
        path = "/register",
        name = "Register",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> register(@RequestBody AuthRequest request){
        try {
            return authService.userRegister(request);
        } catch (Exception e) {
            log.error("Registration failed", e);
            return ResponseEntity.status(ResponseEnum.INTERNAL_SERVER_ERROR.getStatus())
                .body(GenericResponse.builder()
                    .status(ResponseEnum.INTERNAL_SERVER_ERROR.getStatus())
                    .message(ResponseEnum.INTERNAL_SERVER_ERROR.getMessage())
                    .build()
                );
        }
    }
}
