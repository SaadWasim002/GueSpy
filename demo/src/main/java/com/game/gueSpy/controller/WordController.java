package com.game.gueSpy.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.WordRequest;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.service.WordService;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/word")
public class WordController {
    @Autowired
    private WordService wordService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(
        path = "/add",
        name = "Add word",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> add(@RequestBody WordRequest request){
        try {
            return wordService.addNewWord(request);
        } catch (Exception e) {
            log.error("Failed to add new word", e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR.getStatus(), response);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping(
        path = "/delete",
        name = "Delete word",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> delete(@RequestParam Long wordId){
        try {
            return wordService.deleteWord(wordId);
        } catch (Exception e) {
            log.error("Failed to delete word", e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR.getStatus(), response);
        }
    }

    @GetMapping(
        path = "/get",
        name = "Get all the words of a particular category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> get(@RequestParam Long categoryId){
        try {
            return wordService.getAllWords(categoryId);
        } catch (Exception e) {
            log.error("Failed to retrieved words for the category id {}", categoryId, e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR.getStatus(), response);
        }
    }
}
