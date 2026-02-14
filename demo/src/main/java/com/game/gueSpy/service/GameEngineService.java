package com.game.gueSpy.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.GameOptionRequest;
import com.game.gueSpy.entity.UserGameDetail;
import com.game.gueSpy.enums.GameStatus;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.model.GameData;
import com.game.gueSpy.model.UsedWords;
import com.game.gueSpy.repository.CategoryRepository;
import com.game.gueSpy.repository.GroupRepository;
import com.game.gueSpy.repository.UserGameDetailsRepository;
import com.game.gueSpy.repository.WordRepository;
import com.game.gueSpy.utility.GenericUtility;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class GameEngineService {
    @Autowired
    private UserGameDetailsRepository userGameDetailsRepository;

    @Autowired
    private WordRepository wordRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public ResponseEntity<?> gameOptionEngine(GameOptionRequest request, Long userId){
        log.info("User has started the game option engine with this request body : {}", request);
        if(request.getNumberOfSpy() == null){
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING, response);
        }

        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if(userGameDetailsOptional.isEmpty()){
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);
            return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS, response);
        }

        UserGameDetail userGameDetail = userGameDetailsOptional.get();

        if(!GenericUtility.isValidGameStatus(userGameDetail.getGameStatus(), GameStatus.GAME_OPTION_SELECTION)){
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INVALID_GAME_STATUS);
            return GenericUtility.buildResponse(ResponseEnum.INVALID_GAME_STATUS, response);
        }

        GameData gameData = userGameDetail.getGameData();

        if(categoryRepository.findById(gameData.getSelectedCategoryId()).isEmpty()){

            gameData.setSelectedCategoryId(null)
                    .setSelectedGroupId(null);

            userGameDetail.setGameStatus(GameStatus.CATEGORY_SELECTION);
            userGameDetailsRepository.save(userGameDetail);

            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CATEGORY_NOT_EXISTS);
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_NOT_EXISTS, response);
        }

        Long wordId = getRandomWordId(gameData.getSelectedCategoryId(), userGameDetail.getUsedWords());
        List<Integer> listOfSpy = getRandomSpy(gameData.getSelectedGroupId(), request.getNumberOfSpy());
        
        gameData.setCurrentSpy(listOfSpy)
                .setSelectedWordId(wordId)
                .setNumberOfSpy(request.getNumberOfSpy());

        userGameDetail.setGameData(gameData);
        List<UsedWords> usedWords = userGameDetail.getUsedWords();
        addUsedWord(usedWords, gameData.getSelectedCategoryId(), wordId);

        userGameDetail.setUsedWords(usedWords);
        userGameDetail.setGameStatus(GameStatus.WORD_AND_SPY_REVEAL);
        userGameDetailsRepository.save(userGameDetail);

        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.GAME_ENGINE_SUCCESS);
        return GenericUtility.buildResponse(ResponseEnum.GAME_ENGINE_SUCCESS, response);

    }

    public ResponseEntity<?> resetGame(Long userId){
        log.info("User has started the reset game data flow");
        if(userId == null){
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING, response);
        }
        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if(userGameDetailsOptional.isEmpty()){
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);
            return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS, response);
        }

        UserGameDetail userGameDetail = userGameDetailsOptional.get();

        userGameDetail.setGameStatus(GameStatus.NOT_STARTED);
        GameData gameData = userGameDetail.getGameData();

        gameData.setSelectedCategoryId(null)
                .setCurrentSpy(null)
                .setNumberOfSpy(null)
                .setSelectedGroupId(null)
                .setSelectedWordId(null);

        userGameDetail.setGameData(gameData);

        userGameDetailsRepository.save(userGameDetail);

        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.GAME_RESET_SUCCESS);
        return GenericUtility.buildResponse(ResponseEnum.GAME_RESET_SUCCESS, response);

    }

    private Long getRandomWordId(Long categoryId, List<UsedWords> usedWords){
        List<Long> usedWordsForCategory = usedWords.stream()    
                .filter(used -> used.getCategoryId().equals(categoryId))
                .map(UsedWords::getWordId)
                .findFirst()
                .orElse(Collections.emptyList());
        List<Long> wordList = wordRepository.findWordIdByCategoryId(categoryId);

        if(usedWordsForCategory.size() == wordList.size()){
            usedWordsForCategory = Collections.emptyList();
            resetUsedWordForTheCategory(categoryId, usedWords);
        }

        Set<Long> usedSet = new HashSet<>(usedWordsForCategory);
        List<Long> availableWords = wordList.stream()
                .filter(word -> !usedSet.contains(word))
                .collect(Collectors.toList());

        log.info("Used Words : {}", usedWordsForCategory);
        log.info("Word List : {}", wordList);
        log.info("Available Words : {}", availableWords);

        if (availableWords.isEmpty()) {
            throw new IllegalStateException("No available words for category " + categoryId);
        }

        Long randomWord = availableWords.get(ThreadLocalRandom.current().nextInt(availableWords.size()));
        return randomWord;
    }

    private List<Integer> getRandomSpy(Long groupId, Integer numberOfSpy){

        Set<Integer> spy = new HashSet<>();
        List<String> players = groupRepository.findById(groupId).get().getPlayers().getPlayerNames();
        int totalPlayers = players.size();
        while(spy.size() < numberOfSpy){
            spy.add(ThreadLocalRandom.current().nextInt(1, totalPlayers + 1));
        }

        return new ArrayList<>(spy);
    }

    private void addUsedWord(List<UsedWords> usedWords, Long categoryId, Long wordId){
        for(UsedWords word : usedWords){
            if(word.getCategoryId() == categoryId){
                word.getWordId().add(wordId);
                return;
            }
        }

        UsedWords newWord = UsedWords.builder()
                .categoryId(categoryId)
                .wordId(new ArrayList<>(List.of(wordId)))
                .build();
        
        usedWords.add(newWord);
    }

    private void resetUsedWordForTheCategory(Long categoryId, List<UsedWords> usedWords){
        for(UsedWords word : usedWords){
            if(word.getCategoryId() == categoryId){
                word.setWordId(new ArrayList<>(Collections.emptyList()));
            }
        }
    }
}