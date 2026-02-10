package com.game.gueSpy.repository;

import java.util.List;
import java.util.Optional;

import org.hibernate.annotations.Parent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.game.gueSpy.entity.Group;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long>{
    @Query("SELECT g FROM Group g WHERE LOWER(g.groupName) = LOWER(:groupName) and g.userId = :userId")
    Optional<Group> findByGroupNameIgnoreCaseForTheUserId(@Param("groupName") String groupName, @Param("userId") Long userId);

    @Query("SELECT g FROM Group g WHERE g.userId = :userId")
    List<Group> findAllGroupForUser(@Param("userId") Long userId);
}
