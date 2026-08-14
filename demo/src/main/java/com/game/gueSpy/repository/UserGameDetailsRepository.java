package com.game.gueSpy.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.game.gueSpy.entity.UserGameDetail;
import com.game.gueSpy.enums.GameType;

@Repository
public interface UserGameDetailsRepository extends JpaRepository<UserGameDetail, Long>{
     @Query("SELECT u FROM UserGameDetail u WHERE u.userId = :userId")
    Optional<UserGameDetail> findByUserId(@Param("userId") Long userId);

     @Query("SELECT u.gameType FROM UserGameDetail u WHERE u.userId = :userId")
    Optional<GameType> findGameTypeByUserId(@Param("userId") Long userId);
}
