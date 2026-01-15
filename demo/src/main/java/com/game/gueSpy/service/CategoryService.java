package com.game.gueSpy.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.CategoryRequest;
import com.game.gueSpy.entity.Category;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.repository.CategoryRepository;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CategoryService {
    @Autowired
    private CategoryRepository categoryRepository;

    public ResponseEntity<?> createNewCategory(CategoryRequest request){
        log.info("User has started category creation flow with this request body : {}", request);

        if(request.getCategoryName() != null && !request.getCategoryName().isEmpty()){
            if(categoryRepository.findByCategoryNameIgnoreCase(request.getCategoryName()).isPresent()){
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CATEGORY_ALREADY_EXISTS);
                return GenericUtility.buildResponse(ResponseEnum.CATEGORY_ALREADY_EXISTS.getStatus(), response);
            }
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            Category category = Category.builder()
                    .categoryName(request.getCategoryName())
                    .isEnabled(true)
                    .totalWords(0)
                    .createdBy(username)
                    .build();
            categoryRepository.save(category);
            log.info("Category created Successfully");
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CATEGORY_CREATE_SUCCESS);
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_CREATE_SUCCESS.getStatus(), response);
        }
        log.info("request body : {}", request);
        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING.getStatus(), response);
    }

    public ResponseEntity<?> deleteCategory(CategoryRequest request){
        log.info("User has started delete category flow with this request body : {}", request);

        if(request.getCategoryName() != null && !request.getCategoryName().isEmpty()){
            var categoryOptional = categoryRepository.findByCategoryNameIgnoreCase(request.getCategoryName());

            if(categoryOptional.isEmpty()){
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CATEGORY_NOT_EXISTS);
                return GenericUtility.buildResponse(ResponseEnum.CATEGORY_NOT_EXISTS.getStatus(), response);
            }

            Category category = categoryOptional.get();
            categoryRepository.deleteById(category.getId());

            log.info("Category deleted Successfully");
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CATEGORY_DELETED);
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_DELETED.getStatus(), response);
        }
        log.info("request body : {}", request);
        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING.getStatus(), response);
    }
}   
