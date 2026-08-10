package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import com.game.gueSpy.dto.AuthRequest;
import com.game.gueSpy.service.AuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping(
        path = "/register",
        name = "Register",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> register(@RequestBody AuthRequest request){
        return authService.userRegister(request);
    }

    @PostMapping(
        path = "/login",
        name = "Login",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> login(@RequestBody AuthRequest request){
        return authService.userLogin(request);
    }
}
