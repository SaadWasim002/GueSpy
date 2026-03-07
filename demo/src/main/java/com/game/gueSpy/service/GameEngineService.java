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
import org.springframework.transaction.annotation.Transactional;

import com.game.gueSpy.constant.ConfigName;
import com.game.gueSpy.constant.UITexts;
import com.game.gueSpy.dto.request.GameOptionRequest;
import com.game.gueSpy.dto.response.GameStatusData;
import com.game.gueSpy.dto.response.PlayerDetails;
import com.game.gueSpy.dto.response.ScreenData;
import com.game.gueSpy.dto.response.VotingPlayer;
import com.game.gueSpy.dto.response.VotingScreenResponse;
import com.game.gueSpy.entity.Group;
import com.game.gueSpy.entity.UserGameDetail;
import com.game.gueSpy.enums.GameStatus;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.enums.ScreenType;
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

    @Autowired
    private ConfigService configService;

    @Autowired
    private GenericUtility genericUtility;

    public ResponseEntity<?> gameOptionEngine(GameOptionRequest request, Long userId){
        log.info("User has started the game option engine with this request body : {}", request);
        if(request.getNumberOfSpy() == null){
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }

        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if(userGameDetailsOptional.isEmpty()){
            return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);
        }

        UserGameDetail userGameDetail = userGameDetailsOptional.get();

        if(!GenericUtility.isValidGameStatus(userGameDetail.getGameStatus(), GameStatus.GAME_OPTION_SELECTION)){
            return GenericUtility.buildResponse(ResponseEnum.INVALID_GAME_STATUS);
        }

        GameData gameData = userGameDetail.getGameData();

        if(categoryRepository.findById(gameData.getSelectedCategoryId()).isEmpty()){

            gameData.setSelectedCategoryId(null)
                    .setSelectedGroupId(null);

            userGameDetail.setGameStatus(GameStatus.CATEGORY_SELECTION);
            userGameDetailsRepository.save(userGameDetail);

            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_NOT_EXISTS);
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

        return GenericUtility.buildResponse(ResponseEnum.GAME_ENGINE_SUCCESS);

    }

    public ResponseEntity<?> resetGame(Long userId){
        log.info("User has started the reset game data flow");
        if(userId == null){
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }
        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if(userGameDetailsOptional.isEmpty()){
            return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);
        }

        UserGameDetail userGameDetail = userGameDetailsOptional.get();

        userGameDetail.setGameStatus(GameStatus.NOT_STARTED);
        GameData gameData = userGameDetail.getGameData();

        gameData.setSelectedCategoryId(null)
                .setCurrentSpy(null)
                .setNumberOfSpy(null)
                .setSelectedGroupId(null)
                .setSelectedWordId(null)
                .setCurrentPlayerNumber(null)
                .setCurrentScreenType(null)
                .setDiscussionStartTime(null);

        userGameDetail.setGameData(gameData);

        userGameDetailsRepository.save(userGameDetail);

        return GenericUtility.buildResponse(ResponseEnum.GAME_RESET_SUCCESS);

    }

    @Transactional
    public ResponseEntity<?> roleReveal(Long userId){
        log.info("User has started the role revealflow");
        if(userId == null){
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }

        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if(userGameDetailsOptional.isEmpty()){
            return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);
        }

        UserGameDetail userGameDetail = userGameDetailsOptional.get();

        if(!GenericUtility.isValidGameStatus(userGameDetail.getGameStatus(), GameStatus.WORD_AND_SPY_REVEAL)){
            return GenericUtility.buildResponse(ResponseEnum.INVALID_GAME_STATUS);
        }
        GameData gameData = userGameDetail.getGameData();
        setCurrentPlayerAndScreenType(userGameDetail, gameData);
        
        try {
            PlayerDetails playerDetails = buildPlayerDetails(userGameDetail, gameData);
            ScreenData screenData = buildScreenData(userGameDetail, gameData, playerDetails);
            userGameDetailsRepository.save(userGameDetail);
            return GenericUtility.buildResponse(ResponseEnum.ROLE_REVEAL_SCREEN_SUCCESS, screenData);
        } catch (IllegalStateException e) {
            log.error("Error during role reveal for userId {}: {}", userId, e.getMessage());
            // Reset the game and return an internal server error or a more specific error
            resetGame(userId);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> getGameStatus(Long userId){
        log.info("User has started the get game status");
        if(userId == null){
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }

        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if(userGameDetailsOptional.isEmpty()){
            return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);
        }

        UserGameDetail userGameDetail = userGameDetailsOptional.get();
        GameStatusData data = GameStatusData.builder().build();

        if(userGameDetail.getGameStatus().equals(GameStatus.DISCUSSION_TIME)){
            Long discussionStartTime = userGameDetail.getGameData().getDiscussionStartTime();
            long endTime = discussionStartTime + configService.getLong(ConfigName.discussionDuration) * 1000;
            List<String> players = genericUtility.getPlayerNames(userGameDetail);
            data.setDiscussionStartTime(discussionStartTime);
            data.setPlayers(players);
            if(System.currentTimeMillis() > endTime){
                userGameDetail.setGameStatus(GameStatus.VOTING);
                userGameDetailsRepository.save(userGameDetail);
                data.setDiscussionStartTime(null);
                data.setPlayers(null);
            }
        }
        data.setGameStatus(userGameDetail.getGameStatus());
        return GenericUtility.buildResponse(ResponseEnum.GAME_STATUS_SUCCESS, data);
    }

    private void setCurrentPlayerAndScreenType(UserGameDetail userGameDetail, GameData gameData){
         if(gameData.getCurrentPlayerNumber() == null){
            // Initialize currentPlayerNumber to 1 if it's null, indicating the start of the player turns.
            // The first screen shown will be "PASS_DEVICE" to the first player.
            // This ensures that the game flow starts correctly.
            gameData.setCurrentPlayerNumber(1);
            gameData.setCurrentScreenType(ScreenType.PASS_DEVICE);
        }
        else if(gameData.getCurrentScreenType() == ScreenType.PASS_DEVICE){
            gameData.setCurrentScreenType(ScreenType.ROLE_REVEAL);
        }
        else{
            Integer currentPlayerNumber = gameData.getCurrentPlayerNumber();
            gameData.setCurrentPlayerNumber(currentPlayerNumber + 1);
            gameData.setCurrentScreenType(ScreenType.PASS_DEVICE);
        }
        userGameDetail.setGameData(gameData);
    }

    public ResponseEntity<?> getVotingScreen(Long userId){
        log.info("User has started the voting screen flow");
        GenericUtility.validate(userId == null, ResponseEnum.VALUES_MISSING);
        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        GenericUtility.validate(userGameDetailsOptional.isEmpty(), ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);

        UserGameDetail userGameDetail = userGameDetailsOptional.get();
        GenericUtility.validate(!GenericUtility.isValidGameStatus(userGameDetail.getGameStatus(), GameStatus.VOTING), ResponseEnum.INVALID_GAME_STATUS);

        return GenericUtility.buildResponse(ResponseEnum.VOTING_SCREEN_SUCCESS , buildVotingScreenData(userGameDetail));
    }

    private PlayerDetails buildPlayerDetails(UserGameDetail userGameDetail, GameData gameData){
        var groupOptional = groupRepository.findById(userGameDetail.getGameData().getSelectedGroupId());
        if(groupOptional.isEmpty()){
            throw new IllegalStateException("Group not found for selectedGroupId: " + userGameDetail.getGameData().getSelectedGroupId());
        }
        Group group = groupOptional.get();
        Integer currentPlayerNumber = gameData.getCurrentPlayerNumber();
        List<String> playerNames = group.getPlayers().getPlayerNames();

        // Validate currentPlayerNumber to prevent IndexOutOfBoundsException
        if (currentPlayerNumber == null || currentPlayerNumber <= 0 || currentPlayerNumber > playerNames.size()) {
             throw new IllegalStateException("Invalid currentPlayerNumber: " + currentPlayerNumber + " for group with " + playerNames.size() + " players.");
        }

        return PlayerDetails.builder()
                .playerName(playerNames.get(currentPlayerNumber - 1))
                .playerNumber(currentPlayerNumber)
                .isSpy((gameData.getCurrentScreenType() == ScreenType.PASS_DEVICE) ? null : gameData.getCurrentSpy().contains(currentPlayerNumber))
                .build();
    }

    private ScreenData buildScreenData(UserGameDetail userGameDetail, GameData gameData, PlayerDetails playerDetails){
        // Retrieve necessary entities, throwing exceptions if not found
        var categoryOptional = categoryRepository.findById(gameData.getSelectedCategoryId());
        var wordOptional = wordRepository.findById(gameData.getSelectedWordId());
        var groupOptional = groupRepository.findById(userGameDetail.getGameData().getSelectedGroupId()); 
        
        if(categoryOptional.isEmpty()) throw new IllegalStateException("Category not found for selectedCategoryId: " + gameData.getSelectedCategoryId());
        if(wordOptional.isEmpty()) throw new IllegalStateException("Word not found for selectedWordId: " + gameData.getSelectedWordId());
        if(groupOptional.isEmpty()) throw new IllegalStateException("Group not found for selectedGroupId: " + userGameDetail.getGameData().getSelectedGroupId());

        Boolean isLast = false;
        Integer totalPlayer = groupOptional.get().getPlayers().getPlayerNames().size();
        if(totalPlayer == gameData.getCurrentPlayerNumber() && gameData.getCurrentScreenType() == ScreenType.ROLE_REVEAL){
            isLast = true;
            userGameDetail.setGameStatus(GameStatus.DISCUSSION_TIME);
            gameData.setDiscussionStartTime(System.currentTimeMillis());
            gameData.setCurrentPlayerNumber(1);
        }
        String displayText;
        if(gameData.getCurrentScreenType() == ScreenType.PASS_DEVICE){
            displayText = UITexts.getPassDeviceText(playerDetails.getPlayerName());
        }
        else{
            displayText = (playerDetails.getIsSpy()) ? UITexts.SPY_TEXT : UITexts.NON_SPY_TEXT;
        }

        return ScreenData.builder()
                .categoryName(categoryOptional.get().getCategoryName())
                .wordName(wordOptional.get().getWordName())
                .playerDetails(playerDetails)
                .screenType(gameData.getCurrentScreenType())
                .isLast(isLast)
                .roleDescriptionText(null)
                .displayText(displayText)
                .build();
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

    private VotingScreenResponse buildVotingScreenData(UserGameDetail userGameDetail){
        List<String> players = genericUtility.getPlayerNames(userGameDetail);
        Integer currentPlayerNumber = userGameDetail.getGameData().getCurrentPlayerNumber();
        String currentPlayerName = players.get(currentPlayerNumber - 1);
        List<VotingPlayer> votingList = new ArrayList<>(Collections.emptyList());
        for(String player : players){
            if(!player.equals(currentPlayerName)){
                VotingPlayer votingPlayer = VotingPlayer.builder().playerId(players.indexOf(player) + 1).playerName(player).build();
                votingList.add(votingPlayer);
            }
        }
        Boolean isLast = false;
        if(currentPlayerNumber == players.size()){
            isLast = true;
        }

        return VotingScreenResponse.builder()
                    .currentPlayerName(currentPlayerName)
                    .votingList(votingList)
                    .isLast(isLast)
                    .displayText(UITexts.VOTING_TEXT)
                    .displayTextHeader(UITexts.VOTING_HEADER)
                    .build();

    }
}