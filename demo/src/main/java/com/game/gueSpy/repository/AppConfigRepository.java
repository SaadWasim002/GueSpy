package com.game.gueSpy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.game.gueSpy.entity.AppConfig;

@Repository
public interface AppConfigRepository extends JpaRepository<AppConfig, Long> {

    @Query("SELECT c FROM AppConfig c WHERE c.active = true")
    List<AppConfig> findActiveConfigs();

    Optional<AppConfig> findByKey(String key);
}
