package com.game.gueSpy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.game.gueSpy.entity.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long>{
    @Query("SELECT c FROM Category c WHERE LOWER(c.categoryName) = LOWER(:categoryName)")
    Optional<Category> findByCategoryNameIgnoreCase(@Param("categoryName") String categoryName);

    @Query("SELECT c FROM Category c WHERE (:isAdmin = true OR (c.isEnabled = true AND c.adminOnly = false))")
    List<Category> findAllActiveCategoryForUser(@Param("isAdmin") Boolean isAdmin);
}
