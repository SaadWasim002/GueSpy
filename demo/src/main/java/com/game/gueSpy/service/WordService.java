package com.game.gueSpy.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.CategoryRequest;
import com.game.gueSpy.dto.request.WordRequest;
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
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String username = authentication.getName();
                Word word = Word.builder()
                        .wordName(request.getWordName())
                        .categoryId(request.getCategoryId())
                        .createdBy(username)
                        .build();
                wordRepository.save(word);
                Category category = categoryOptional.get();
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
}
