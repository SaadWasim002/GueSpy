package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.CategoryRequest;
import com.game.gueSpy.dto.request.SelectionRequest;
import com.game.gueSpy.security.UserPrincipal;
import com.game.gueSpy.service.CategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/category")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(
        path = "/create",
        name = "create category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> create(@Valid @RequestBody CategoryRequest request){
        return categoryService.createNewCategory(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping(
        path = "/delete",
        name = "delete category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> delete(@RequestParam String categoryName){
        return categoryService.deleteCategory(categoryName);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(
        path = "/update",
        name = "update category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> update(@Valid @RequestBody CategoryRequest request){
        return categoryService.updateCategory(request);
    }

    @GetMapping(
        path = "/get",
        name = "Get all Categories",
        produces = "application/json"
    )
    public ResponseEntity<?> get(){
        return categoryService.getAllCategory();
    }

    @PostMapping(
        path = "/select",
        name = "select category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> select(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody SelectionRequest request){
        return categoryService.selectCategory(principal.userId(), request.getId());
    }
}
