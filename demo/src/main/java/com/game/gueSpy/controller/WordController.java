package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.WordRequest;
import com.game.gueSpy.service.WordService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/word")
@RequiredArgsConstructor
public class WordController {
    private final WordService wordService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(
        path = "/add",
        name = "Add word",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> add(@RequestBody WordRequest request){
        return wordService.addNewWord(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping(
        path = "/delete",
        name = "Delete word",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> delete(@RequestParam Long wordId){
        return wordService.deleteWord(wordId);
    }

    @GetMapping(
        path = "/get",
        name = "Get all the words of a particular category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> get(@RequestParam Long categoryId){
        return wordService.getAllWords(categoryId);
    }
}
