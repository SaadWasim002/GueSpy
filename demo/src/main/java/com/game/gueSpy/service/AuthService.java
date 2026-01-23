package com.game.gueSpy.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import com.game.gueSpy.dto.AuthRequest;
import com.game.gueSpy.dto.AuthResponse;
import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.entity.User;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.enums.Role;
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

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    
    public ResponseEntity<?> userRegister(AuthRequest request){
        log.info("User has started register flow with this request body : {}", request);
        if(request.getUsername() != null && request.getEmail() != null && request.getPassword() != null && 
        !request.getUsername().isEmpty() && !request.getEmail().isEmpty() && !request.getPassword().isEmpty()){

            if(userRepository.findByEmail(request.getEmail()).isPresent()){
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.USER_ALREADY_EXIST);
                return GenericUtility.buildResponse(ResponseEnum.USER_ALREADY_EXIST, response);
            }

            User user = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.USER)
                    .build();
            
            String token = jwtUtil.generateToken(user);

            userRepository.save(user);
            AuthResponse response = buildAuthResponse(ResponseEnum.USER_REGISTRATION_SUCCESS, token);
            return GenericUtility.buildResponse(ResponseEnum.USER_REGISTRATION_SUCCESS, response);
        }
        log.info("request body : {}", request);
        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING, response);
    }

    public ResponseEntity<?> userLogin(AuthRequest request){
        log.info("User has started login flow with this request body : {}", request);
        if(request.getEmail() != null && request.getPassword() != null && 
        !request.getEmail().isEmpty() && !request.getPassword().isEmpty()){

            var user = userRepository.findByEmail(request.getEmail());

            if(user.isPresent()){
                User foundUser = user.get();
                String password = foundUser.getPassword();

                if(passwordEncoder.matches(request.getPassword(), password)){
                    String token = jwtUtil.generateToken(foundUser);
                    AuthResponse response = buildAuthResponse(ResponseEnum.LOGIN_SUCCESS, token);
                    return GenericUtility.buildResponse(ResponseEnum.LOGIN_SUCCESS, response);
                }
                else{
                    GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.LOGIN_FAILURE);
                    return GenericUtility.buildResponse(ResponseEnum.LOGIN_FAILURE, response);
                }
            }
            else{
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.USER_NOT_EXISTS);
                    return GenericUtility.buildResponse(ResponseEnum.USER_NOT_EXISTS, response);
            }
        }
        log.info("request body : {}", request);
        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING, response);
    }

    private AuthResponse buildAuthResponse(ResponseEnum responseEnum, String token) {
        return AuthResponse.builder()
                .status(responseEnum.getStatus())
                .message(responseEnum.getMessage())
                .token(token)
                .build();
    }
}
