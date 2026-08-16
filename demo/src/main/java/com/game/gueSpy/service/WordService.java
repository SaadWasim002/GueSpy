package com.game.gueSpy.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.game.gueSpy.dto.request.WordRequest;
import com.game.gueSpy.dto.response.WordsAddedResponse;
import com.game.gueSpy.dto.response.WordsResponse;
import com.game.gueSpy.entity.Category;
import com.game.gueSpy.entity.Word;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.repository.CategoryRepository;
import com.game.gueSpy.repository.WordRepository;
import com.game.gueSpy.utility.GenericUtility;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class WordService {
    private final WordRepository wordRepository;

    private final CategoryRepository categoryRepository;

    @Transactional
    public ResponseEntity<?> addNewWord(WordRequest request){
        log.info("User has started add word flow with this request body : {}", request);

        var categoryOptional = categoryRepository.findById(request.getCategoryId());
        if(categoryOptional.isEmpty()){
            log.info("Category not found with the id {}", request.getCategoryId());
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_NOT_EXISTS);
        }

        Category category = categoryOptional.get();
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        List<String> added = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        for(String rawName : request.getWords()){
            if(rawName == null || rawName.isBlank()){
                continue;   // ignore blank entries
            }
            String wordName = rawName.trim();
            boolean duplicate = wordRepository.findByWordNameIgnoreCase(wordName, category.getId()).isPresent()
                    || added.stream().anyMatch(existing -> existing.equalsIgnoreCase(wordName));
            if(duplicate){
                skipped.add(wordName);
                continue;
            }
            wordRepository.save(Word.builder()
                    .wordName(wordName)
                    .categoryId(category.getId())
                    .createdBy(username)
                    .build());
            added.add(wordName);
        }

        Integer currentTotal = category.getTotalWords();
        category.setTotalWords((currentTotal != null ? currentTotal : 0) + added.size());
        categoryRepository.save(category);

        log.info("Added {} words, skipped {} duplicates for category {}", added.size(), skipped.size(), category.getId());
        WordsAddedResponse data = WordsAddedResponse.builder().added(added).skipped(skipped).build();
        return GenericUtility.buildResponse(ResponseEnum.WORD_ADDED, data);
    }

    @Transactional
    public ResponseEntity<?> updateWord(Long wordId, String wordName){
        log.info("User has started update word flow for wordId {}", wordId);
        if(wordId == null || wordName == null || wordName.isBlank()){
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }

        var wordOptional = wordRepository.findById(wordId);
        if(wordOptional.isEmpty()){
            return GenericUtility.buildResponse(ResponseEnum.WORD_ID_NOT_EXISTS);
        }

        Word word = wordOptional.get();
        String trimmed = wordName.trim();
        var existing = wordRepository.findByWordNameIgnoreCase(trimmed, word.getCategoryId());
        if(existing.isPresent() && !existing.get().getId().equals(wordId)){
            return GenericUtility.buildResponse(ResponseEnum.WORD_ALREADY_EXISTS);
        }

        word.setWordName(trimmed);
        wordRepository.save(word);
        log.info("Word {} updated successfully", wordId);
        return GenericUtility.buildResponse(ResponseEnum.WORD_UPDATED);
    }

    @Transactional
    public ResponseEntity<?> deleteWord(Long wordId){
        log.info("User has started delete word flow with this word id : {}", wordId);

        if(wordId != null){
            var wordOptional = wordRepository.findById(wordId);

            if(wordOptional.isEmpty()){
                return GenericUtility.buildResponse(ResponseEnum.WORD_ID_NOT_EXISTS);
            }
        
            Word word = wordOptional.get();
            wordRepository.deleteById(wordId);
            
            Category category = categoryRepository.findById(word.getCategoryId()).get();
            Integer currentTotal = category.getTotalWords();
            category.setTotalWords(currentTotal != null ? currentTotal - 1 : 1);

            log.info("Word deleted Successfully");
            return GenericUtility.buildResponse(ResponseEnum.WORD_DELETED);
        }
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
    }

    public ResponseEntity<?> getAllWords(Long categoryId){
        log.info("User has started get all word flow");
        List<Word> words = wordRepository.findWordByCategoryId(categoryId);
        
        if(words.isEmpty()){
            return GenericUtility.buildResponse(ResponseEnum.NO_WORD_FOUND);
        }
        log.info("Words retrieved successfully");
        Category category = categoryRepository.findById(categoryId).get();
        WordsResponse wordData = buildWOrdsResponse(ResponseEnum.WORD_RETRIEVED, words, category);
        return GenericUtility.buildResponse(ResponseEnum.WORD_RETRIEVED, wordData);
    }

    private WordsResponse buildWOrdsResponse(ResponseEnum responseEnum, List<Word> words, Category category) {
        return WordsResponse.builder()
                .words(words)
                .totalWords(category.getTotalWords())
                .categoryName(category.getCategoryName())
                .build();
    }
}
