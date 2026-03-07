package com.game.gueSpy.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.CategoryRequest;
import com.game.gueSpy.dto.request.SelectionRequest;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.security.JwtUtil;
import com.game.gueSpy.service.CategoryService;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/category")
public class CategoryController {
    @Autowired
    private CategoryService categoryService;

    @Autowired
    private JwtUtil jwtUtil;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(
        path = "/create",
        name = "create category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> create(@RequestBody CategoryRequest request){
        try {
            return categoryService.createNewCategory(request);
        } catch (Exception e) {
            log.error("Category creation failed", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping(
        path = "/delete",
        name = "delete category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> delete(@RequestParam String categoryName){
        try {
            return categoryService.deleteCategory(categoryName);
        } catch (Exception e) {
            log.error("Category deletion failed", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(
        path = "/update",
        name = "update category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> update(@RequestBody CategoryRequest request){
        try {
            return categoryService.updateCategory(request);
        } catch (Exception e) {
            log.error("Category update failed", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping(
        path = "/get",
        name = "Get all Categories",
        produces = "application/json"
    )
    public ResponseEntity<?> get(){
        try {
            return categoryService.getAllCategory();
        } catch (Exception e) {
            log.error("Failed to retrieve categories", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }

     @PostMapping(
        path = "/select",
        name = "select category",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> select(@RequestHeader(value = "Authorization", required = true) String token, @RequestBody SelectionRequest request){
        try {
            Long userId = jwtUtil.extractUserId(token.substring(7));
            return categoryService.selectCategory(userId, request.getId());
        } catch (Exception e) {
            log.error("Category creation failed", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }
}
