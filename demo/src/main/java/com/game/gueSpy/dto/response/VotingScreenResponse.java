package com.game.gueSpy.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class VotingScreenResponse{
    private String displayTextHeader;
    private String displayText;
    private String currentPlayerName;
    private List<VotingPlayer> votingList;
    private Boolean isLast;
}
