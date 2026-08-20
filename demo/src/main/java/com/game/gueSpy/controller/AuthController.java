package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.game.gueSpy.dto.AuthRequest;
import com.game.gueSpy.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping(
        path = "/register",
        name = "Register",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> register(@Valid @RequestBody AuthRequest request){
        return authService.userRegister(request);
    }

    @PostMapping(
        path = "/login",
        name = "Login",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request){
        return authService.userLogin(request);
    }
}
