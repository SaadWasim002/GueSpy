package com.game.gueSpy.service;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.game.gueSpy.dto.request.CategoryRequest;
import com.game.gueSpy.dto.response.CategoryResponse;
import com.game.gueSpy.entity.Category;
import com.game.gueSpy.entity.UserGameDetail;
import com.game.gueSpy.enums.GameStatus;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.model.GameData;
import com.game.gueSpy.repository.CategoryRepository;
import com.game.gueSpy.repository.UserGameDetailsRepository;
import com.game.gueSpy.repository.WordRepository;
import com.game.gueSpy.utility.GenericUtility;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;

    private final WordRepository wordRepository;

    private final UserGameDetailsRepository userGameDetailsRepository;

    public ResponseEntity<?> createNewCategory(CategoryRequest request){
        log.info("User has started category creation flow with this request body : {}", request);

        if(request.getCategoryName() != null && !request.getCategoryName().isEmpty()){
            if(categoryRepository.findByCategoryNameIgnoreCase(request.getCategoryName()).isPresent()){
                return GenericUtility.buildResponse(ResponseEnum.CATEGORY_ALREADY_EXISTS);
            }

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            assert authentication != null;
            String username = authentication.getName();
            Boolean adminOnly = (request.getAdminOnly() != null) ? request.getAdminOnly() : false;
            Category category = Category.builder()
                    .categoryName(request.getCategoryName())
                    .isEnabled(true)
                    .totalWords(0)
                    .adminOnly(adminOnly)
                    .createdBy(username)
                    .build();

            categoryRepository.save(category);
            log.info("Category created Successfully");
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_CREATE_SUCCESS);
        }
        log.info("request body : {}", request);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
    }

    @Transactional
    public ResponseEntity<?> deleteCategory(Long categoryId){
        log.info("User has started delete category flow with this category id : {}", categoryId);

        if(categoryId == null){
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }

        if(categoryRepository.findById(categoryId).isEmpty()){
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_NOT_EXISTS);
        }

        categoryRepository.deleteById(categoryId);
        wordRepository.deleteWordByCategoryId(categoryId);

        log.info("Category deleted Successfully");
        return GenericUtility.buildResponse(ResponseEnum.CATEGORY_DELETED);
    }

    public ResponseEntity<?> updateCategory(CategoryRequest request){
        log.info("User has started update category flow with this request body : {}", request);

        if(request.getCategoryId() == null){
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }

        var categoryOptional = categoryRepository.findById(request.getCategoryId());

        if(categoryOptional.isEmpty()){
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_NOT_EXISTS);
        }

        Category category = categoryOptional.get();

        if(request.getUpdateName() != null && !request.getUpdateName().isEmpty()){
            var existingCategory = categoryRepository.findByCategoryNameIgnoreCase(request.getUpdateName());

            if(existingCategory.isPresent() && !existingCategory.get().getId().equals(category.getId())){
                return GenericUtility.buildResponse(ResponseEnum.CATEGORY_ALREADY_EXISTS);
            }

            category.setCategoryName(request.getUpdateName());
        }

        if(request.getIsEnabled() != null){
            category.setIsEnabled(request.getIsEnabled());
        }

        if(request.getAdminOnly() != null){
            category.setAdminOnly(request.getAdminOnly());
        }

        categoryRepository.save(category);

        log.info("Category updated Successfully");
        return GenericUtility.buildResponse(ResponseEnum.CATEGORY_UPDATED);
    }

    public ResponseEntity<?> getAllCategory(Boolean isAdmin){
        log.info("User has started get all category flow");
        List<Category> categories = categoryRepository.findAllActiveCategoryForUser(isAdmin);
        
        if(categories.isEmpty()){
            return GenericUtility.buildResponse(ResponseEnum.NO_CATEGORY_FOUND);
        }
        log.info("Categories retrieved successfully");
        
        CategoryResponse categoryData = CategoryResponse.builder().categories(categories).build();
        return GenericUtility.buildResponse(ResponseEnum.CATEGORY_RETRIEVED, categoryData);
    }
    
    @Transactional
    public ResponseEntity<?> selectCategory(Long userId, Long categoryId){
        log.info("User has started select category flow");
        if(categoryId == null){
            return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
        }

        if(categoryRepository.findById(categoryId).isEmpty()){
            return GenericUtility.buildResponse(ResponseEnum.CATEGORY_NOT_EXISTS);
        }

        var userGameDetailsOptional = userGameDetailsRepository.findByUserId(userId);
        
        if(userGameDetailsOptional.isPresent()){
            UserGameDetail userGameDetail = userGameDetailsOptional.get();
            GameStatus gameStatus = userGameDetail.getGameStatus();
            if(gameStatus == GameStatus.NOT_STARTED || gameStatus == GameStatus.CATEGORY_SELECTION){
                updateUserGameDetails(userGameDetail, categoryId);
                return GenericUtility.buildResponse(ResponseEnum.CATEGORY_SELECTED);// category selected
            }
            return GenericUtility.buildResponse(ResponseEnum.INVALID_GAME_STATUS);// Game status not valid to update
        }
        return GenericUtility.buildResponse(ResponseEnum.USER_GAME_DETAILS_NOT_EXISTS);// User game details doesnt exist for the user

    }

    private void updateUserGameDetails(UserGameDetail userGameDetail, Long categoryId){
        GameData gameData = userGameDetail.getGameData();
        gameData.setSelectedCategoryId(categoryId);
        userGameDetail.setGameData(gameData);
        userGameDetail.setGameStatus(GameStatus.GROUP_SELECTION);
    }
}   
