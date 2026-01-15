package com.game.gueSpy.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.CategoryRequest;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.service.CategoryService;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/category")
public class CategoryController {
    @Autowired
    private CategoryService categoryService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(
        path = "/create",
        name = "create",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> create(@RequestBody CategoryRequest request){
        try {
            return categoryService.createNewCategory(request);
        } catch (Exception e) {
            log.error("Category creation failed", e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR.getStatus(), response);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping(
        path = "/delete",
        name = "delete",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> delete(@RequestBody CategoryRequest request){
        try {
            return categoryService.deleteCategory(request);
        } catch (Exception e) {
            log.error("Category deletion failed", e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR.getStatus(), response);
        }
    }
}
