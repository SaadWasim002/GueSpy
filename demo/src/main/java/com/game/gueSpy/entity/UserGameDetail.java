package com.game.gueSpy.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.game.gueSpy.converter.GameDataConverter;
import com.game.gueSpy.converter.UsedWordsConverter;
import com.game.gueSpy.enums.GameStatus;
import com.game.gueSpy.model.GameData;
import com.game.gueSpy.model.UsedWords;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_game_details")
@EntityListeners(AuditingEntityListener.class)
public class UserGameDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Version
    private Long version;

    @Enumerated(EnumType.STRING)
    private GameStatus gameStatus;

    @Convert(converter = GameDataConverter.class)
    @Column(columnDefinition = "TEXT")
    private GameData gameData;

    @Convert(converter = UsedWordsConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<UsedWords> usedWords;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

}