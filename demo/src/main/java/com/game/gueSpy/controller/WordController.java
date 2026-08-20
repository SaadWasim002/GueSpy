package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.WordRequest;
import com.game.gueSpy.dto.request.WordUpdateRequest;
import com.game.gueSpy.service.WordService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/words")
@RequiredArgsConstructor
public class WordController {
    private final WordService wordService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(
        name = "Add word(s)",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> add(@Valid @RequestBody WordRequest request){
        return wordService.addNewWord(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping(
        path = "/{id}",
        name = "Delete word",
        produces = "application/json"
    )
    public ResponseEntity<?> delete(@PathVariable Long id){
        return wordService.deleteWord(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(
        path = "/{id}",
        name = "Update a word",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody WordUpdateRequest request){
        return wordService.updateWord(id, request.getWordName());
    }
}
