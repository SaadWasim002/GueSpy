package com.game.gueSpy.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.CategoryRequest;
import com.game.gueSpy.dto.request.WordRequest;
import com.game.gueSpy.dto.response.CategoryResponse;
import com.game.gueSpy.dto.response.WordsResponse;
import com.game.gueSpy.entity.Category;
import com.game.gueSpy.entity.Word;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.repository.CategoryRepository;
import com.game.gueSpy.repository.WordRepository;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class WordService {
    @Autowired
    private WordRepository wordRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Transactional
    public ResponseEntity<?> addNewWord(WordRequest request){
        log.info("User has started add word flow with this request body : {}", request);

        if(request.getCategoryId() != null && request.getWordName() != null && !request.getWordName().isEmpty()){
            var categoryOptional = categoryRepository.findById(request.getCategoryId());
            if(categoryOptional.isPresent()){
                Category category = categoryOptional.get();
                if(wordRepository.findByWordNameIgnoreCase(request.getWordName(), category.getId()).isPresent()){
                    GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.WORD_ALREADY_EXISTS);
                    return GenericUtility.buildResponse(ResponseEnum.WORD_ALREADY_EXISTS.getStatus(), response);
                }

                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String username = authentication.getName();
                Word word = Word.builder()
                        .wordName(request.getWordName())
                        .categoryId(request.getCategoryId())
                        .createdBy(username)
                        .build();
                wordRepository.save(word);
                Integer currentTotal = category.getTotalWords();
                category.setTotalWords(currentTotal != null ? currentTotal + 1 : 1);
                categoryRepository.save(category);
                log.info("Category created Successfully");
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.WORD_ADDED);
                return GenericUtility.buildResponse(ResponseEnum.WORD_ADDED.getStatus(), response);
            }

            log.info("Category not found with the id {}", request.getCategoryId());
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CATEGORY_NOT_EXISTS);
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_NOT_EXISTS.getStatus(), response);
        }
        log.info("request body : {}", request);
        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING.getStatus(), response);
    }

    @Transactional
    public ResponseEntity<?> deleteWord(Long wordId){
        log.info("User has started delete word flow with this word id : {}", wordId);

        if(wordId != null){
            var wordOptional = wordRepository.findById(wordId);

            if(wordOptional.isEmpty()){
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.WORD_ID_NOT_EXISTS);
                return GenericUtility.buildResponse(ResponseEnum.WORD_ID_NOT_EXISTS.getStatus(), response);
            }
        
            Word word = wordOptional.get();
            wordRepository.deleteById(wordId);
            
            Category category = categoryRepository.findById(word.getCategoryId()).get();
            Integer currentTotal = category.getTotalWords();
            category.setTotalWords(currentTotal != null ? currentTotal - 1 : 1);

            log.info("Word deleted Successfully");
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.WORD_DELETED);
            return GenericUtility.buildResponse(ResponseEnum.WORD_DELETED.getStatus(), response);
        }
        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING.getStatus(), response);
    }

    public ResponseEntity<?> getAllWords(Long categoryId){
        log.info("User has started get all word flow");
        List<Word> words = wordRepository.findWordByCategoryId(categoryId);
        
        if(words.isEmpty()){
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.NO_WORD_FOUND);
            return GenericUtility.buildResponse(ResponseEnum.NO_WORD_FOUND.getStatus(), response);
        }
        log.info("Words retrieved successfully");
        Category category = categoryRepository.findById(categoryId).get();
        WordsResponse response = buildWOrdsResponse(ResponseEnum.WORD_RETRIEVED, words, category);
        return GenericUtility.buildResponse(ResponseEnum.WORD_RETRIEVED.getStatus(), response);
    }

    private WordsResponse buildWOrdsResponse(ResponseEnum responseEnum, List<Word> words, Category category) {
        return WordsResponse.builder()
                .status(responseEnum.getStatus())
                .message(responseEnum.getMessage())
                .words(words)
                .totalWords(category.getTotalWords())
                .categoryName(category.getCategoryName())
                .build();
    }
}
