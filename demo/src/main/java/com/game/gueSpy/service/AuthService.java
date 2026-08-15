package com.game.gueSpy.service;

import java.util.ArrayList;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import com.game.gueSpy.dto.AuthRequest;
import com.game.gueSpy.dto.AuthResponse;
import com.game.gueSpy.entity.User;
import com.game.gueSpy.entity.UserGameDetail;
import com.game.gueSpy.enums.GameStatus;
import com.game.gueSpy.enums.GameType;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.enums.Role;
import com.game.gueSpy.model.GameData;
import com.game.gueSpy.repository.UserGameDetailsRepository;
import com.game.gueSpy.repository.UserRepository;
import com.game.gueSpy.security.JwtUtil;
import com.game.gueSpy.utility.GenericUtility;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthService {

    private final JwtUtil jwtUtil;

    private final UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder;

    private final UserGameDetailsRepository userGameDetailsRepository;
    
    public ResponseEntity<?> userRegister(AuthRequest request){
        log.info("User has started register flow with this request body : {}", request);
        if(request.getUsername() != null && request.getEmail() != null && request.getPassword() != null && 
        !request.getUsername().isEmpty() && !request.getEmail().isEmpty() && !request.getPassword().isEmpty()){

            if(userRepository.findByEmail(request.getEmail()).isPresent()){
                return GenericUtility.buildResponse(ResponseEnum.USER_ALREADY_EXIST);
            }

            User user = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.USER)
                    .build();
            
            // save first so the generated id is present in the token's userId claim
            userRepository.save(user);
            String token = jwtUtil.generateToken(user);
            createUserGameDetailsEntry(user.getId());
            AuthResponse Authdata = AuthResponse.builder().token(token).build();
            return GenericUtility.buildResponse(ResponseEnum.USER_REGISTRATION_SUCCESS, Authdata);
        }
        log.info("request body : {}", request);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
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
                    AuthResponse Authdata = AuthResponse.builder().token(token).build();
                    return GenericUtility.buildResponse(ResponseEnum.LOGIN_SUCCESS, Authdata);
                }
                else{
                    return GenericUtility.buildResponse(ResponseEnum.LOGIN_FAILURE);
                }
            }
            else{
                return GenericUtility.buildResponse(ResponseEnum.USER_NOT_EXISTS);
            }
        }
        log.info("request body : {}", request);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
    }

    private void createUserGameDetailsEntry(Long userId){

        GameData gameData = GameData.builder()
                    .selectedCategoryId(null)
                    .selectedGroupId(null)
                    .selectedWordId(null)
                    .currentSpy(null)
                    .numberOfSpy(null)
                    .currentPlayerNumber(null)
                    .currentScreenType(null)
                    .discussionStartTime(null)
                    .build();
        
        UserGameDetail userGameDetail = UserGameDetail.builder()
                    .userId(userId)
                    .gameData(gameData)
                    .usedWords(new ArrayList<>())
                    .gameStatus(GameStatus.NOT_STARTED)
                    .gameType(GameType.GUESPY)
                    .build();
        userGameDetailsRepository.save(userGameDetail);
    }
}
