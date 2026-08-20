package com.game.gueSpy.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.game.gueSpy.constant.ConfigName;
import com.game.gueSpy.constant.UITexts;
import com.game.gueSpy.dto.request.GameOptionRequest;
import com.game.gueSpy.dto.response.GameStatusData;
import com.game.gueSpy.dto.response.PlayerDetails;
import com.game.gueSpy.dto.response.PlayerScore;
import com.game.gueSpy.dto.response.ScreenData;
import com.game.gueSpy.dto.response.VotingPlayer;
import com.game.gueSpy.dto.response.VotingScreenResponse;
import com.game.gueSpy.engine.GameEngine;
import com.game.gueSpy.entity.Group;
import com.game.gueSpy.entity.UserGameDetail;
import com.game.gueSpy.enums.GameStatus;
import com.game.gueSpy.enums.GameType;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.enums.ScreenType;
import com.game.gueSpy.enums.Winner;
import com.game.gueSpy.model.GameData;
import com.game.gueSpy.model.ScoringConfig;
import com.game.gueSpy.model.UsedWords;
import com.game.gueSpy.model.VotingData;
import com.game.gueSpy.repository.CategoryRepository;
import com.game.gueSpy.repository.GroupRepository;
import com.game.gueSpy.repository.UserGameDetailsRepository;
import com.game.gueSpy.repository.WordRepository;
import com.game.gueSpy.utility.GenericUtility;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import static com.game.gueSpy.utility.GenericUtility.getRandomNumber;

@Slf4j
@Component
@RequiredArgsConstructor
public class GameEngineService implements GameEngine {
    private final UserGameDetailsRepository userGameDetailsRepository;

    private final WordRepository wordRepository;

    private final GroupRepository groupRepository;

    private final CategoryRepository categoryRepository;

    private final ConfigService configService;

    private final GenericUtility genericUtility;

    private final ScoringService scoringService;

    @Override
    public GameType type() {
        return GameType.GUESPY;
    }

    @Override
    public ResponseEntity<?> gameOptionEngine(GameOptionRequest request, Long userId) {
        log.info("User has started the game option engine with this request body : {}", request);
        if (request.getNumberOfSpy() == null) {
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }

        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if (userGameDetailsOptional.isEmpty()) {
            return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);
        }

        UserGameDetail userGameDetail = userGameDetailsOptional.get();

        if (!GenericUtility.isValidGameStatus(userGameDetail.getGameStatus(), GameStatus.GAME_OPTION_SELECTION)) {
            return GenericUtility.buildResponse(ResponseEnum.INVALID_GAME_STATUS);
        }

        GameData gameData = userGameDetail.getGameData();

        if (categoryRepository.findById(gameData.getSelectedCategoryId()).isEmpty()) {

            gameData.setSelectedCategoryId(null)
                    .setSelectedGroupId(null);

            userGameDetail.setGameStatus(GameStatus.CATEGORY_SELECTION);
            userGameDetailsRepository.save(userGameDetail);

            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_NOT_EXISTS);
        }

        // spies must be at least 1, at most 2, and leave at least one innocent.
        // Without this an over-count would spin getRandomSpy forever (a Set of
        // player numbers can never grow past the player count).
        int totalPlayers = genericUtility.getPlayerNames(userGameDetail).size();
        int maxSpies = Math.min(2, totalPlayers - 1);
        if (request.getNumberOfSpy() > maxSpies) {
            return GenericUtility.buildResponse(ResponseEnum.INVALID_NUMBER_OF_SPY);
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

    @Override
    public ResponseEntity<?> resetGame(Long userId) {
        log.info("User has started the reset game data flow");
        if (userId == null) {
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }
        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if (userGameDetailsOptional.isEmpty()) {
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
                .setDiscussionStartTime(null)
                .setVotingData(null)
                .setCaughtSpy(null)
                .setLastEliminatedPlayer(null)
                .setRoundNumber(null)
                .setWinner(null);

        userGameDetail.setGameData(gameData);

        userGameDetailsRepository.save(userGameDetail);

        return GenericUtility.buildResponse(ResponseEnum.GAME_RESET_SUCCESS);

    }

    @Transactional
    @Override
    public ResponseEntity<?> roleReveal(Long userId) {
        log.info("User has started the role revealflow");
        if (userId == null) {
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }

        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if (userGameDetailsOptional.isEmpty()) {
            return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);
        }

        UserGameDetail userGameDetail = userGameDetailsOptional.get();

        if (!GenericUtility.isValidGameStatus(userGameDetail.getGameStatus(), GameStatus.WORD_AND_SPY_REVEAL)) {
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

    @Override
    public ResponseEntity<?> getGameStatus(Long userId) {
        log.info("User has started the get game status");
        if (userId == null) {
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }

        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        if (userGameDetailsOptional.isEmpty()) {
            return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);
        }

        UserGameDetail userGameDetail = userGameDetailsOptional.get();
        return GenericUtility.buildResponse(ResponseEnum.GAME_STATUS_SUCCESS, buildGameStatusData(userGameDetail));
    }

    private GameStatusData buildGameStatusData(UserGameDetail userGameDetail) {
        GameStatusData data = GameStatusData.builder().build();
        GameStatus status = userGameDetail.getGameStatus();
        if (status.equals(GameStatus.DISCUSSION_TIME)) {
            populateDiscussionTimeData(userGameDetail, data);
        } else if (status == GameStatus.ROUND_END) {
            populateRoundEndData(userGameDetail, data);
        } else if (status == GameStatus.SPY_GUESS) {
            populateSpyGuessData(userGameDetail, data);
        } else if (status == GameStatus.SCORING) {
            populateScoringData(userGameDetail, data);
        }
        data.setGameStatus(userGameDetail.getGameStatus());
        return data;
    }

    @Transactional
    @Override
    public ResponseEntity<?> navigateGameState(Long userId, String action) {
        log.info("User has started the game-state navigation flow with action {}", action);
        GenericUtility.validate(userId == null || action == null || action.isBlank(), ResponseEnum.VALUES_MISSING);
        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        GenericUtility.validate(userGameDetailsOptional.isEmpty(), ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);

        UserGameDetail userGameDetail = userGameDetailsOptional.get();
        GameStatus status = userGameDetail.getGameStatus();

        if (action.equalsIgnoreCase("back")) {
            if (!isBackAllowed(status)) {
                return GenericUtility.buildResponse(ResponseEnum.INVALID_GAME_STATUS);
            }
            moveBack(userGameDetail);
        } else if (action.equalsIgnoreCase("forward")) {
            // forward is only the discussion -> voting skip
            if (status != GameStatus.DISCUSSION_TIME) {
                return GenericUtility.buildResponse(ResponseEnum.INVALID_GAME_STATUS);
            }
            userGameDetail.setGameStatus(GameStatus.VOTING);
        } else {
            return GenericUtility.buildResponse(ResponseEnum.INVALID_DATA);
        }

        userGameDetailsRepository.save(userGameDetail);
        return GenericUtility.buildResponse(ResponseEnum.GAME_STATUS_SUCCESS, buildGameStatusData(userGameDetail));
    }

    private boolean isBackAllowed(GameStatus status) {
        return status == GameStatus.CATEGORY_SELECTION
                || status == GameStatus.GROUP_SELECTION
                || status == GameStatus.GAME_OPTION_SELECTION
                || status == GameStatus.WORD_AND_SPY_REVEAL
                || status == GameStatus.DISCUSSION_TIME;
    }

    // step one state back, clearing the data owned by the state(s) being left
    private void moveBack(UserGameDetail userGameDetail) {
        GameData gameData = userGameDetail.getGameData();
        switch (userGameDetail.getGameStatus()) {
            case CATEGORY_SELECTION:
                gameData.setSelectedCategoryId(null);
                userGameDetail.setGameStatus(GameStatus.NOT_STARTED);
                break;
            case GROUP_SELECTION:
                gameData.setSelectedCategoryId(null);
                userGameDetail.setGameStatus(GameStatus.CATEGORY_SELECTION);
                break;
            case GAME_OPTION_SELECTION:
                gameData.setSelectedGroupId(null);
                userGameDetail.setGameStatus(GameStatus.GROUP_SELECTION);
                break;
            case WORD_AND_SPY_REVEAL:
                gameData.setNumberOfSpy(null)
                        .setCurrentSpy(null)
                        .setSelectedWordId(null)
                        .setCurrentPlayerNumber(null)
                        .setCurrentScreenType(null);
                userGameDetail.setGameStatus(GameStatus.GAME_OPTION_SELECTION);
                break;
            case DISCUSSION_TIME:
                // WORD_AND_SPY_REVEAL redoes the reveal for every player, so this is a
                // full do-over of the round sequence, not just the current round -- clear
                // eliminations and votes along with the round counter, or a round-three
                // "back" would restart at round 1 while still carrying rounds 1-2's
                // eliminated players and stale votes.
                gameData.setCurrentPlayerNumber(null)
                        .setCurrentScreenType(null)
                        .setDiscussionStartTime(null)
                        .setRoundNumber(null)
                        .setVotingData(null)
                        .setCaughtSpy(null)
                        .setLastEliminatedPlayer(null);
                userGameDetail.setGameStatus(GameStatus.WORD_AND_SPY_REVEAL);
                break;
            default:
                break;
        }
    }

    private void populateRoundEndData(UserGameDetail userGameDetail, GameStatusData data) {
        GameData gameData = userGameDetail.getGameData();
        data.setRoundNumber(gameData.getRoundNumber());
        Integer eliminated = gameData.getLastEliminatedPlayer();
        if (eliminated != null) {
            data.setEliminatedPlayerName(genericUtility.getPlayerNames(userGameDetail).get(eliminated - 1));
        }
    }

    private void populateSpyGuessData(UserGameDetail userGameDetail, GameStatusData data) {
        GameData gameData = userGameDetail.getGameData();
        data.setRoundNumber(gameData.getRoundNumber());
        Integer caughtSpy = gameData.getCaughtSpy();
        if (caughtSpy != null) {
            data.setCaughtSpyName(genericUtility.getPlayerNames(userGameDetail).get(caughtSpy - 1));
        }
        categoryRepository.findById(gameData.getSelectedCategoryId())
                .ifPresent(category -> data.setCategoryName(category.getCategoryName()));
    }

    private void populateScoringData(UserGameDetail userGameDetail, GameStatusData data) {
        GameData gameData = userGameDetail.getGameData();
        List<String> players = genericUtility.getPlayerNames(userGameDetail);
        data.setRoundNumber(gameData.getRoundNumber());
        data.setWinner(gameData.getWinner());
        wordRepository.findById(gameData.getSelectedWordId())
                .ifPresent(word -> data.setWord(word.getWordName()));

        List<String> spyNames = new ArrayList<>();
        for (Integer spy : gameData.getCurrentSpy()) {
            spyNames.add(players.get(spy - 1));
        }
        data.setSpies(spyNames);

        Map<Integer, Integer> currentScore = gameData.getCurrentScore();
        List<PlayerScore> scores = new ArrayList<>();
        for (int playerNumber = 1; playerNumber <= players.size(); playerNumber++) {
            int value = (currentScore != null) ? currentScore.getOrDefault(playerNumber, 0) : 0;
            scores.add(PlayerScore.builder()
                    .playerNumber(playerNumber)
                    .playerName(players.get(playerNumber - 1))
                    .score(value)
                    .build());
        }
        data.setScores(scores);
    }

    private void populateDiscussionTimeData(UserGameDetail userGameDetail, GameStatusData data) {
        Long discussionStartTime = userGameDetail.getGameData().getDiscussionStartTime();
        Long discussionDuration = configService.getLong(ConfigName.discussionDuration);
        long endTime = discussionStartTime + discussionDuration * 1000;
        List<String> players = genericUtility.getPlayerNames(userGameDetail);
        String randomPlayer = players.get(getRandomNumber(0, players.size() - 1));
        data.setDiscussionStartTime(discussionStartTime);
        data.setPlayers(players);
        data.setStartingPlayer(randomPlayer);
        data.setDiscussionDuration(discussionDuration);
        data.setRoundNumber(userGameDetail.getGameData().getRoundNumber());
        if (System.currentTimeMillis() > endTime) {
            userGameDetail.setGameStatus(GameStatus.VOTING);
            userGameDetailsRepository.save(userGameDetail);
            data.setDiscussionStartTime(null);
            data.setPlayers(null);
            data.setStartingPlayer(null);
            data.setDiscussionDuration(null);
        }
    }

    private void setCurrentPlayerAndScreenType(UserGameDetail userGameDetail, GameData gameData) {
        if (gameData.getCurrentPlayerNumber() == null) {
            // Initialize currentPlayerNumber to 1 if it's null, indicating the start of the player turns.
            // The first screen shown will be "PASS_DEVICE" to the first player.
            // This ensures that the game flow starts correctly.
            gameData.setCurrentPlayerNumber(1);
            gameData.setCurrentScreenType(ScreenType.PASS_DEVICE);
        } else if (gameData.getCurrentScreenType() == ScreenType.PASS_DEVICE) {
            gameData.setCurrentScreenType(ScreenType.ROLE_REVEAL);
        } else {
            Integer currentPlayerNumber = gameData.getCurrentPlayerNumber();
            gameData.setCurrentPlayerNumber(currentPlayerNumber + 1);
            gameData.setCurrentScreenType(ScreenType.PASS_DEVICE);
        }
        userGameDetail.setGameData(gameData);
    }

    @Override
    public ResponseEntity<?> getVotingScreen(Long userId) {
        log.info("User has started the voting screen flow");
        GenericUtility.validate(userId == null, ResponseEnum.VALUES_MISSING);
        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        GenericUtility.validate(userGameDetailsOptional.isEmpty(), ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);

        UserGameDetail userGameDetail = userGameDetailsOptional.get();
        GenericUtility.validate(!isVotingPhase(userGameDetail.getGameStatus()), ResponseEnum.INVALID_GAME_STATUS);

        return GenericUtility.buildResponse(ResponseEnum.VOTING_SCREEN_SUCCESS, buildVotingScreenData(userGameDetail));
    }

    @Transactional
    @Override
    public ResponseEntity<?> vote(Long userId, Integer playerId) {
        log.info("User has started the voting screen flow");
        GenericUtility.validate(userId == null || playerId == null, ResponseEnum.VALUES_MISSING);
        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        GenericUtility.validate(userGameDetailsOptional.isEmpty(), ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);

        UserGameDetail userGameDetail = userGameDetailsOptional.get();
        GenericUtility.validate(!isVotingPhase(userGameDetail.getGameStatus()), ResponseEnum.INVALID_GAME_STATUS);

        updateUserGameDetailWithNewVote(userGameDetail, playerId);

        return GenericUtility.buildResponse(ResponseEnum.VOTING_SUCCESS);
    }

    @Transactional
    @Override
    public ResponseEntity<?> nextRound(Long userId) {
        log.info("User has started the next round flow");
        GenericUtility.validate(userId == null, ResponseEnum.VALUES_MISSING);
        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        GenericUtility.validate(userGameDetailsOptional.isEmpty(), ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);

        UserGameDetail userGameDetail = userGameDetailsOptional.get();
        GenericUtility.validate(!GenericUtility.isValidGameStatus(userGameDetail.getGameStatus(), GameStatus.ROUND_END), ResponseEnum.INVALID_GAME_STATUS);

        GameData gameData = userGameDetail.getGameData();
        int totalPlayers = genericUtility.getPlayerNames(userGameDetail).size();
        List<Integer> eliminated = getEliminatedPlayers(gameData);

        gameData.getVotingData().setVotes(new HashMap<>());
        gameData.setCurrentPlayerNumber(firstActivePlayer(totalPlayers, eliminated));
        gameData.setRoundNumber((gameData.getRoundNumber() == null ? 1 : gameData.getRoundNumber()) + 1);
        gameData.setDiscussionStartTime(System.currentTimeMillis());
        gameData.setLastEliminatedPlayer(null);
        userGameDetail.setGameStatus(GameStatus.DISCUSSION_TIME);

        userGameDetailsRepository.save(userGameDetail);
        return GenericUtility.buildResponse(ResponseEnum.GAME_STATUS_SUCCESS);
    }

    @Transactional
    @Override
    public ResponseEntity<?> spyGuess(Long userId, String word) {
        log.info("User has started the spy guess flow");
        GenericUtility.validate(userId == null, ResponseEnum.VALUES_MISSING);
        GenericUtility.validate(word == null || word.isBlank(), ResponseEnum.VALUES_MISSING);
        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        GenericUtility.validate(userGameDetailsOptional.isEmpty(), ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);

        UserGameDetail userGameDetail = userGameDetailsOptional.get();
        // allowed when a caught spy must decide (SPY_GUESS) or a spy volunteers to guess mid-game
        GameStatus status = userGameDetail.getGameStatus();
        boolean allowed = status == GameStatus.SPY_GUESS || status == GameStatus.DISCUSSION_TIME
                || status == GameStatus.VOTING || status == GameStatus.REVOTE;
        GenericUtility.validate(!allowed, ResponseEnum.INVALID_GAME_STATUS);

        GameData gameData = userGameDetail.getGameData();
        var wordOptional = wordRepository.findById(gameData.getSelectedWordId());
        GenericUtility.validate(wordOptional.isEmpty(), ResponseEnum.INTERNAL_SERVER_ERROR);
        boolean correct = wordOptional.get().getWordName().trim().equalsIgnoreCase(word.trim());

        Winner winner = correct ? Winner.SPY : Winner.INNOCENT;
        gameData.setWinner(winner);
        gameData.setCaughtSpy(null);
        scoringService.applyWinBonus(userGameDetail, winner);
        userGameDetail.setGameStatus(GameStatus.SCORING);
        userGameDetailsRepository.save(userGameDetail);

        return GenericUtility.buildResponse(ResponseEnum.GAME_STATUS_SUCCESS);
    }

    @Transactional
    @Override
    public ResponseEntity<?> spyDecline(Long userId) {
        log.info("User has started the spy decline flow");
        GenericUtility.validate(userId == null, ResponseEnum.VALUES_MISSING);
        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        GenericUtility.validate(userGameDetailsOptional.isEmpty(), ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);

        UserGameDetail userGameDetail = userGameDetailsOptional.get();
        GenericUtility.validate(!GenericUtility.isValidGameStatus(userGameDetail.getGameStatus(), GameStatus.SPY_GUESS), ResponseEnum.INVALID_GAME_STATUS);

        GameData gameData = userGameDetail.getGameData();
        int totalPlayers = genericUtility.getPlayerNames(userGameDetail).size();
        Integer caughtSpy = gameData.getCaughtSpy();

        // the caught spy declined -> they are eliminated
        List<Integer> eliminated = new ArrayList<>(getEliminatedPlayers(gameData));
        if (caughtSpy != null && !eliminated.contains(caughtSpy)) {
            eliminated.add(caughtSpy);
        }
        gameData.getVotingData().setPlayersVotedOut(eliminated);
        gameData.setLastEliminatedPlayer(caughtSpy);
        gameData.setCaughtSpy(null);

        long activeSpies = gameData.getCurrentSpy().stream().filter(spy -> !eliminated.contains(spy)).count();
        if (activeSpies == 0) {
            // every spy has now been voted out -> innocents win
            gameData.setWinner(Winner.INNOCENT);
            scoringService.applyWinBonus(userGameDetail, Winner.INNOCENT);
            userGameDetail.setGameStatus(GameStatus.SCORING);
        } else {
            int activePlayers = totalPlayers - eliminated.size();
            ScoringConfig scoringConfig = configService.getJson(ConfigName.scoringConfig, ScoringConfig.class);
            if (activePlayers <= scoringConfig.getMinPlayersToContinue()) {
                // players ran out while a spy is still hidden -> spies win
                gameData.setWinner(Winner.SPY);
                scoringService.applyWinBonus(userGameDetail, Winner.SPY);
                userGameDetail.setGameStatus(GameStatus.SCORING);
            } else {
                userGameDetail.setGameStatus(GameStatus.ROUND_END);
            }
        }
        userGameDetailsRepository.save(userGameDetail);

        return GenericUtility.buildResponse(ResponseEnum.GAME_STATUS_SUCCESS);
    }

    private PlayerDetails buildPlayerDetails(UserGameDetail userGameDetail, GameData gameData) {
        var groupOptional = groupRepository.findById(userGameDetail.getGameData().getSelectedGroupId());
        if (groupOptional.isEmpty()) {
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
                .isSpy(gameData.getCurrentScreenType() != ScreenType.PASS_DEVICE && gameData.getCurrentSpy().contains(currentPlayerNumber))
                .build();
    }

    private ScreenData buildScreenData(UserGameDetail userGameDetail, GameData gameData, PlayerDetails playerDetails) {
        // Retrieve necessary entities, throwing exceptions if not found
        var categoryOptional = categoryRepository.findById(gameData.getSelectedCategoryId());
        var wordOptional = wordRepository.findById(gameData.getSelectedWordId());
        var groupOptional = groupRepository.findById(userGameDetail.getGameData().getSelectedGroupId());

        if (categoryOptional.isEmpty())
            throw new IllegalStateException("Category not found for selectedCategoryId: " + gameData.getSelectedCategoryId());
        if (wordOptional.isEmpty())
            throw new IllegalStateException("Word not found for selectedWordId: " + gameData.getSelectedWordId());
        if (groupOptional.isEmpty())
            throw new IllegalStateException("Group not found for selectedGroupId: " + userGameDetail.getGameData().getSelectedGroupId());

        boolean isLast = false;
        Integer totalPlayer = groupOptional.get().getPlayers().getPlayerNames().size();
        if (totalPlayer.equals(gameData.getCurrentPlayerNumber()) && gameData.getCurrentScreenType() == ScreenType.ROLE_REVEAL) {
            isLast = true;
            userGameDetail.setGameStatus(GameStatus.DISCUSSION_TIME);
            gameData.setDiscussionStartTime(System.currentTimeMillis());
            gameData.setCurrentPlayerNumber(1);
            gameData.setRoundNumber(1);
        }
        String displayText;
        if (gameData.getCurrentScreenType() == ScreenType.PASS_DEVICE) {
            displayText = UITexts.getPassDeviceText(playerDetails.getPlayerName());
        } else {
            displayText = (playerDetails.getIsSpy()) ? UITexts.SPY_TEXT : UITexts.NON_SPY_TEXT;
        }

        boolean currentPlayerIsSpy = playerDetails.getIsSpy();

        return ScreenData.builder()
                .categoryName(categoryOptional.get().getCategoryName())
                .wordName(currentPlayerIsSpy ? null : wordOptional.get().getWordName())
                .playerDetails(playerDetails)
                .screenType(gameData.getCurrentScreenType())
                .isLast(isLast)
                .roleDescriptionText(null)
                .displayText(displayText)
                .build();
    }

    private Long getRandomWordId(Long categoryId, List<UsedWords> usedWords) {
        List<Long> usedWordsForCategory = usedWords.stream()
                .filter(used -> used.getCategoryId().equals(categoryId))
                .map(UsedWords::getWordId)
                .findFirst()
                .orElse(Collections.emptyList());
        List<Long> wordList = wordRepository.findWordIdByCategoryId(categoryId);

        if (usedWordsForCategory.size() == wordList.size()) {
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

    private List<Integer> getRandomSpy(Long groupId, Integer numberOfSpy) {

        Set<Integer> spy = new HashSet<>();
        List<String> players = groupRepository.findById(groupId).get().getPlayers().getPlayerNames();
        int totalPlayers = players.size();
        while (spy.size() < numberOfSpy) {
            spy.add(getRandomNumber(1, totalPlayers));
        }

        return new ArrayList<>(spy);
    }

    private void addUsedWord(List<UsedWords> usedWords, Long categoryId, Long wordId) {
        for (UsedWords word : usedWords) {
            if (word.getCategoryId().equals(categoryId)) {
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

    private void resetUsedWordForTheCategory(Long categoryId, List<UsedWords> usedWords) {
        for (UsedWords word : usedWords) {
            if (word.getCategoryId().equals(categoryId)) {
                word.setWordId(new ArrayList<>(Collections.emptyList()));
            }
        }
    }

    private VotingScreenResponse buildVotingScreenData(UserGameDetail userGameDetail) {
        GameData gameData = userGameDetail.getGameData();
        List<String> players = genericUtility.getPlayerNames(userGameDetail);
        List<Integer> eliminated = getEliminatedPlayers(gameData);
        Integer currentPlayerNumber = gameData.getCurrentPlayerNumber();
        String currentPlayerName = players.get(currentPlayerNumber - 1);

        List<VotingPlayer> votingList = new ArrayList<>();
        for (int playerNumber = 1; playerNumber <= players.size(); playerNumber++) {
            if (playerNumber == currentPlayerNumber || eliminated.contains(playerNumber)) {
                continue;   // skip the current voter and anyone already voted out
            }
            votingList.add(VotingPlayer.builder()
                    .playerId(playerNumber)
                    .playerName(players.get(playerNumber - 1))
                    .build());
        }

        boolean isLast = nextActivePlayer(currentPlayerNumber, players.size(), eliminated) == null;

        return VotingScreenResponse.builder()
                .currentPlayerName(currentPlayerName)
                .votingList(votingList)
                .isLast(isLast)
                .displayText(UITexts.VOTING_TEXT)
                .displayTextHeader(UITexts.VOTING_HEADER)
                .build();
    }

    private void updateUserGameDetailWithNewVote(UserGameDetail userGameDetail, Integer playerId) {
        GameData gameData = userGameDetail.getGameData();
        int totalPlayers = genericUtility.getPlayerNames(userGameDetail).size();
        Integer currentPlayerNumber = gameData.getCurrentPlayerNumber();
        List<Integer> eliminated = getEliminatedPlayers(gameData);

        // vote target must be in range, still active, and not the current voter (no self-vote)
        GenericUtility.validate(playerId <= 0 || playerId > totalPlayers, ResponseEnum.INVALID_DATA);
        GenericUtility.validate(eliminated.contains(playerId), ResponseEnum.INVALID_DATA);
        GenericUtility.validate(playerId.equals(currentPlayerNumber), ResponseEnum.INVALID_DATA);

        VotingData votingData = gameData.getVotingData();
        if (votingData == null) {
            votingData = VotingData.builder().votes(new HashMap<>()).playersVotedOut(new ArrayList<>()).build();
            gameData.setVotingData(votingData);
        }
        if (votingData.getVotes() == null) {
            votingData.setVotes(new HashMap<>());
        }
        Map<Integer, Integer> votes = votingData.getVotes();
        votes.put(playerId, votes.getOrDefault(playerId, 0) + 1);

        Integer nextVoter = nextActivePlayer(currentPlayerNumber, totalPlayers, eliminated);
        if (nextVoter != null) {
            gameData.setCurrentPlayerNumber(nextVoter);   // more active players still to vote this round
        } else {
            resolveRound(userGameDetail);                 // everyone active has voted -> decide the outcome
        }
        userGameDetailsRepository.save(userGameDetail);
    }

    /**
     * Decide a round once every active player has voted: tie -> REVOTE; a spy
     * accused -> SPY_GUESS (they decide whether to guess); an innocent accused
     * -> eliminate them and either continue (ROUND_END) or, if too few players
     * remain, the spies win (SCORING).
     */
    private void resolveRound(UserGameDetail userGameDetail) {
        GameData gameData = userGameDetail.getGameData();
        int totalPlayers = genericUtility.getPlayerNames(userGameDetail).size();
        List<Integer> eliminated = getEliminatedPlayers(gameData);
        List<Integer> highestVoted = getHighestVotedPlayers(gameData.getVotingData().getVotes());

        if (highestVoted.size() != 1) {
            // tie -> revote among the same active players
            gameData.getVotingData().setVotes(new HashMap<>());
            gameData.setCurrentPlayerNumber(firstActivePlayer(totalPlayers, eliminated));
            userGameDetail.setGameStatus(GameStatus.REVOTE);
            return;
        }

        int accused = highestVoted.get(0);
        if (gameData.getCurrentSpy().contains(accused)) {
            // a spy was voted out -> they get to decide whether to guess the word
            gameData.setCaughtSpy(accused);
            userGameDetail.setGameStatus(GameStatus.SPY_GUESS);
            return;
        }

        // an innocent was voted out -> eliminate them
        List<Integer> updatedEliminated = new ArrayList<>(eliminated);
        updatedEliminated.add(accused);
        gameData.getVotingData().setPlayersVotedOut(updatedEliminated);
        gameData.setLastEliminatedPlayer(accused);

        // the spies survived this round -> per-round score drift
        scoringService.applyRoundSurvivalDrift(userGameDetail);

        int activePlayers = totalPlayers - updatedEliminated.size();
        ScoringConfig scoringConfig = configService.getJson(ConfigName.scoringConfig, ScoringConfig.class);
        if (activePlayers <= scoringConfig.getMinPlayersToContinue()) {
            // players ran out while a spy is still hidden -> spies win
            gameData.setWinner(Winner.SPY);
            scoringService.applyWinBonus(userGameDetail, Winner.SPY);
            userGameDetail.setGameStatus(GameStatus.SCORING);
        } else {
            userGameDetail.setGameStatus(GameStatus.ROUND_END);
        }
    }

    private List<Integer> getEliminatedPlayers(GameData gameData) {
        if (gameData.getVotingData() == null || gameData.getVotingData().getPlayersVotedOut() == null) {
            return Collections.emptyList();
        }
        return gameData.getVotingData().getPlayersVotedOut();
    }

    private int firstActivePlayer(int totalPlayers, List<Integer> eliminated) {
        for (int playerNumber = 1; playerNumber <= totalPlayers; playerNumber++) {
            if (!eliminated.contains(playerNumber)) {
                return playerNumber;
            }
        }
        throw new IllegalStateException("No active players remain");
    }

    private Integer nextActivePlayer(int current, int totalPlayers, List<Integer> eliminated) {
        for (int playerNumber = current + 1; playerNumber <= totalPlayers; playerNumber++) {
            if (!eliminated.contains(playerNumber)) {
                return playerNumber;
            }
        }
        return null;
    }

    private List<Integer> getHighestVotedPlayers(Map<Integer, Integer> votes) {
        List<Integer> highestVoted = new ArrayList<>();
        if (votes == null || votes.isEmpty()) {
            return highestVoted;
        }
        int maxVote = Collections.max(votes.values());
        for (Map.Entry<Integer, Integer> entry : votes.entrySet()) {
            if (entry.getValue() == maxVote) {
                highestVoted.add(entry.getKey());
            }
        }
        return highestVoted;
    }

    private boolean isVotingPhase(GameStatus gameStatus) {
        return gameStatus == GameStatus.VOTING || gameStatus == GameStatus.REVOTE;
    }
}