package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.CategoryRequest;
import com.game.gueSpy.security.UserPrincipal;
import com.game.gueSpy.service.CategoryService;
import com.game.gueSpy.service.WordService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.Objects;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;
    private final WordService wordService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(
        name = "create category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> create(@Valid @RequestBody CategoryRequest request){
        return categoryService.createNewCategory(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping(
        path = "/{id}",
        name = "delete category",
        produces = "application/json"
    )
    public ResponseEntity<?> delete(@PathVariable Long id){
        return categoryService.deleteCategory(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(
        path = "/{id}",
        name = "update category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request){
        request.setCategoryId(id);
        return categoryService.updateCategory(request);
    }

    @GetMapping(
        name = "Get all Categories",
        produces = "application/json"
    )
    public ResponseEntity<?> get(@AuthenticationPrincipal UserPrincipal principal,
                              Authentication auth){
        Boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> Objects.equals(a.getAuthority(), "ROLE_ADMIN"));
        return categoryService.getAllCategory(isAdmin);
    }

    @PostMapping(
        path = "/{id}/select",
        name = "select category",
        produces = "application/json"
    )
    public ResponseEntity<?> select(@AuthenticationPrincipal UserPrincipal principal,
                                    @PathVariable Long id){
        return categoryService.selectCategory(principal.userId(), id);
    }

    /** GET /api/v1/categories/{id}/words — list all words for a category. */
    @GetMapping(
        path = "/{id}/words",
        name = "Get words for a category",
        produces = "application/json"
    )
    public ResponseEntity<?> getWords(@PathVariable Long id){
        return wordService.getAllWords(id);
    }
}
