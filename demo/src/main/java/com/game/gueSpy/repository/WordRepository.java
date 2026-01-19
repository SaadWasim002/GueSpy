package com.game.gueSpy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.game.gueSpy.entity.Word;

@Repository
public interface WordRepository extends JpaRepository<Word, Long>{
    @Query("SELECT w FROM Word w WHERE w.categoryId = :categoryId")
    List<Word> findWordByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT w FROM Word w WHERE LOWER(w.wordName) = LOWER(:wordName) and w.categoryId = :categoryId")
    Optional<Word> findByWordNameIgnoreCase(@Param("wordName") String wordName, @Param("categoryId") Long categoryId);

    @Modifying
    @Query("DELETE FROM Word w WHERE w.categoryId = :categoryId")
    void deleteWordByCategoryId(@Param("categoryId") Long categoryId);
}
