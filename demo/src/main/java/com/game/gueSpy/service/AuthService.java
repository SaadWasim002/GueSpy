package com.game.gueSpy.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import com.game.gueSpy.dto.AuthRequest;
import com.game.gueSpy.dto.AuthResponse;
import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.entity.User;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.repository.UserRepository;
import com.game.gueSpy.security.JwtUtil;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;
@Slf4j
@Component
public class AuthService {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    public ResponseEntity<?> userRegister(AuthRequest request){
        log.info("User has started register flow with this request body : {}", request);
        if(request.getUsername() != null && request.getEmail() != null && request.getPassword() != null && 
        !request.getUsername().isEmpty() && !request.getEmail().isEmpty() && !request.getPassword().isEmpty()){
            User user = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .password(request.getPassword())
                    .build();
            
            String token = jwtUtil.generateToken(request.getUsername());

            userRepository.save(user);
            AuthResponse response = buildAuthResponse(ResponseEnum.USER_REGISTRATION_SUCCESS, token);
            return GenericUtility.buildResponse(ResponseEnum.USER_REGISTRATION_SUCCESS.getStatus(), response);
        }
        log.info("request body : {}", request);
        GenericResponse response = buildGenericResponse(ResponseEnum.VALUES_MISSING);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING.getStatus(), response);

    }

    private AuthResponse buildAuthResponse(ResponseEnum responseEnum, String token) {
        return AuthResponse.builder()
                .status(responseEnum.getStatus())
                .message(responseEnum.getMessage())
                .token(token)
                .build();
    }

    private GenericResponse buildGenericResponse(ResponseEnum responseEnum) {
        return GenericResponse.builder()
                .status(responseEnum.getStatus())
                .message(responseEnum.getMessage())
                .build();
    }
}
