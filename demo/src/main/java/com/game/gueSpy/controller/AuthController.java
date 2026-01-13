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
import com.game.gueSpy.entity.User;
import com.game.gueSpy.repository.UserRepository;
import com.game.gueSpy.security.JwtUtil;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/auth")
public class AuthController {
    
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request){
        log.info("User has started register flow with this request body : {}", request);
        if(request.getUsername() != null && request.getEmail() != null && request.getPassword() != null){
            User user = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .password(request.getPassword())
                    .build();
            
            String token = jwtUtil.generateToken(request.getUsername());

            userRepository.save(user);
            return ResponseEntity.ok(new AuthResponse(token, "User registered Successfully"));
        }
        log.info("request body : {}", request);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
