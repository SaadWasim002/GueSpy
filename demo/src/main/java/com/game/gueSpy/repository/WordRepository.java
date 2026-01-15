package com.game.gueSpy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.game.gueSpy.entity.Word;

@Repository
public interface WordRepository extends JpaRepository<Word, Long>{
}
